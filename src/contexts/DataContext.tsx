import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Funcionario, Ausencia, AusenciaDia, EfetivoDisponivel, Turno, ValidationResult } from '@/types';
import { supabase } from '@/lib/supabase';
import { format, isWithinInterval, parseISO, addDays, isSameDay, differenceInDays } from 'date-fns';

interface DataContextType {
  funcionarios: Funcionario[];
  ausencias: Ausencia[];
  isLoading: boolean;
  error: string | null;
  // Funcionarios
  addFuncionario: (funcionario: Omit<Funcionario, 'id'>) => Promise<void>;
  updateFuncionario: (funcionario: Funcionario) => Promise<void>;
  deleteFuncionario: (id: string) => Promise<void>;
  getFuncionario: (id: string) => Funcionario | undefined;
  // Ausencias
  addAusencia: (ausencia: Omit<Ausencia, 'id'>) => Promise<void>;
  updateAusencia: (ausencia: Ausencia) => Promise<void>;
  deleteAusencia: (id: string) => Promise<void>;
  validateAusencia: (ausencia: Omit<Ausencia, 'id'>, excludeId?: string) => ValidationResult;
  // Computed data
  getAusenciasForDate: (date: Date) => AusenciaDia[];
  getAusenciasForDateRange: (startDate: Date, endDate: Date) => Map<string, AusenciaDia[]>;
  getEfetivoDisponivel: (date: Date, turno?: Turno) => EfetivoDisponivel;
  // Refresh data
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Load funcionarios
      const { data: funcsData, error: funcsError } = await supabase
        .from('funcionarios')
        .select('*')
        .order('ordem_antiguidade');

      if (funcsError) throw funcsError;

      // Load ausencias
      const { data: ausData, error: ausError } = await supabase
        .from('ausencias')
        .select('*')
        .order('data_inicio', { ascending: false });

      if (ausError) throw ausError;

      // Convert database format to app format
      const funcs: Funcionario[] = funcsData?.map(f => ({
        id: f.id,
        nome: f.nome,
        graduacao: f.graduacao,
        categoria: f.categoria as 'GRADUADO' | 'CABO_SOLDADO',
        ordemAntiguidade: f.ordem_antiguidade,
        ativo: f.ativo,
      })) || [];

      const aus: Ausencia[] = ausData?.map(a => ({
        id: a.id,
        funcionarioId: a.funcionario_id,
        motivo: a.motivo as any,
        dataInicio: a.data_inicio,
        dataFim: a.data_fim,
        turnoPadrao: a.turno_padrao as Turno,
        excecoesPorDia: (a.excecoes_por_dia as any) || [],
        observacao: a.observacao || undefined,
      })) || [];

      setFuncionarios(funcs);
      setAusencias(aus);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Get the effective shift for a specific date considering exceptions
  const getTurnoForDate = (ausencia: Ausencia, date: Date): Turno => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const exception = ausencia.excecoesPorDia.find(e => e.data === dateStr);
    return exception ? exception.turno : ausencia.turnoPadrao;
  };

  // Check if an absence applies to a specific date
  const isAusenciaActiveOnDate = (ausencia: Ausencia, date: Date): boolean => {
    const start = parseISO(ausencia.dataInicio);
    const end = parseISO(ausencia.dataFim);
    return isWithinInterval(date, { start, end }) || isSameDay(date, start) || isSameDay(date, end);
  };

  // Get all absences for a specific date with computed turno
  const getAusenciasForDate = useCallback((date: Date): AusenciaDia[] => {
    const result: AusenciaDia[] = [];
    const dateStr = format(date, 'yyyy-MM-dd');

    for (const ausencia of ausencias) {
      if (isAusenciaActiveOnDate(ausencia, date)) {
        const funcionario = funcionarios.find(f => f.id === ausencia.funcionarioId);
        if (funcionario && funcionario.ativo) {
          result.push({
            funcionario,
            ausencia,
            turno: getTurnoForDate(ausencia, date),
            data: dateStr,
          });
        }
      }
    }

    // Sort by rank hierarchy (seniority), then by individual seniority order
    const graduacoes: Record<string, number> = {
      '2S': 1,
      '3S': 2,
      'S1': 3,
      'S2': 4,
      'S3': 5,
    };

    result.sort((a, b) => {
      const rankA = graduacoes[a.funcionario.graduacao] || 999;
      const rankB = graduacoes[b.funcionario.graduacao] || 999;
      if (rankA !== rankB) return rankA - rankB;
      return a.funcionario.ordemAntiguidade - b.funcionario.ordemAntiguidade;
    });

    return result;
  }, [ausencias, funcionarios]);

  // Get absences for a date range
  const getAusenciasForDateRange = useCallback(
    (startDate: Date, endDate: Date): Map<string, AusenciaDia[]> => {
      const result = new Map<string, AusenciaDia[]>();
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        result.set(dateStr, getAusenciasForDate(currentDate));
        currentDate = addDays(currentDate, 1);
      }

      return result;
    },
    [getAusenciasForDate]
  );

  // Calculate available personnel for a specific date/turno
  const getEfetivoDisponivel = useCallback(
    (date: Date, turno?: Turno): EfetivoDisponivel => {
      const ausenciasDia = getAusenciasForDate(date);

      let graduadosTotal = 0;
      let cabosSoldadosTotal = 0;
      let graduadosFora = 0;
      let cabosSoldadosFora = 0;

      funcionarios.forEach((func) => {
        if (!func.ativo) return;

        if (func.categoria === 'GRADUADO') {
          graduadosTotal++;
        } else {
          cabosSoldadosTotal++;
        }
      });

      ausenciasDia.forEach((item) => {
        if (turno && item.turno !== 'INTEGRAL' && item.turno !== turno) {
          return;
        }

        if (item.funcionario.categoria === 'GRADUADO') {
          graduadosFora++;
        } else {
          cabosSoldadosFora++;
        }
      });

      return {
        graduados: {
          total: graduadosTotal,
          fora: graduadosFora,
          disponivel: graduadosTotal - graduadosFora,
        },
        cabosSoldados: {
          total: cabosSoldadosTotal,
          fora: cabosSoldadosFora,
          disponivel: cabosSoldadosTotal - cabosSoldadosFora,
        },
      };
    },
    [funcionarios, getAusenciasForDate]
  );

  // Validate absence for conflicts
  const validateAusencia = (
    ausencia: Omit<Ausencia, 'id'>,
    excludeId?: string
  ): ValidationResult => {
    const warnings: string[] = [];
    const start = parseISO(ausencia.dataInicio);
    const end = parseISO(ausencia.dataFim);

    // Check date order
    if (end < start) {
      return { error: 'A data final não pode ser anterior à data inicial', warnings: [] };
    }

    const funcionario = funcionarios.find(f => f.id === ausencia.funcionarioId);
    if (!funcionario) {
      return { error: 'Funcionário não encontrado', warnings: [] };
    }

    // Check for conflicts with existing absences for the same person
    for (const existingAusencia of ausencias) {
      if (excludeId && existingAusencia.id === excludeId) continue;
      if (existingAusencia.funcionarioId !== ausencia.funcionarioId) continue;

      const existingStart = parseISO(existingAusencia.dataInicio);
      const existingEnd = parseISO(existingAusencia.dataFim);

      // Check if date ranges overlap
      if (start <= existingEnd && end >= existingStart) {
        // Check if there's a turno conflict
        let currentDate = new Date(Math.max(start.getTime(), existingStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), existingEnd.getTime()));

        while (currentDate <= overlapEnd) {
          const newTurno = getTurnoForDate(ausencia as Ausencia, currentDate);
          const existingTurno = getTurnoForDate(existingAusencia, currentDate);

          const hasConflict =
            newTurno === 'INTEGRAL' ||
            existingTurno === 'INTEGRAL' ||
            newTurno === existingTurno;

          if (hasConflict) {
            return {
              error: `Conflito de ausência para ${funcionario.graduacao} ${funcionario.nome} em ${format(currentDate, 'dd/MM/yyyy')}`,
              warnings: []
            };
          }

          currentDate = addDays(currentDate, 1);
        }
      }
    }

    // Check for excessive absences by category (WARNING ONLY)
    const LIMITE_GRADUADOS = 3;
    const LIMITE_CABOS_SOLDADOS = 2;
    
    const limite = funcionario.categoria === 'GRADUADO' ? LIMITE_GRADUADOS : LIMITE_CABOS_SOLDADOS;
    const datesWithExcess: string[] = [];
    const conflictingAbsences: Array<{ funcionarioNome: string; funcionarioGraduacao: string; motivo: any; dataInicio: string; dataFim: string }> = [];

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      
      // Get absences for this date and category (excluding current if editing)
      const absentOnDate = ausencias.filter(a => {
        if (excludeId && a.id === excludeId) return false;
        
        const func = funcionarios.find(f => f.id === a.funcionarioId);
        if (!func || func.categoria !== funcionario.categoria) return false;
        
        const aStart = parseISO(a.dataInicio);
        const aEnd = parseISO(a.dataFim);
        
        return currentDate >= aStart && currentDate <= aEnd;
      });

      // If adding this person would exceed the limit, track it
      if (absentOnDate.length >= limite) {
        datesWithExcess.push(format(currentDate, 'dd/MM/yyyy'));
        
        // Collect details of conflicting absences (avoid duplicates)
        absentOnDate.forEach(a => {
          const func = funcionarios.find(f => f.id === a.funcionarioId);
          if (func && !conflictingAbsences.some(ca => ca.funcionarioNome === func.nome && ca.dataInicio === a.dataInicio)) {
            conflictingAbsences.push({
              funcionarioNome: func.nome,
              funcionarioGraduacao: func.graduacao,
              motivo: a.motivo,
              dataInicio: a.dataInicio,
              dataFim: a.dataFim,
            });
          }
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    if (datesWithExcess.length > 0) {
      const categoria = funcionario.categoria === 'GRADUADO' ? 'graduados' : 'cabos/soldados';
      const limiteText = `${limite} ${categoria}`;
      
      if (datesWithExcess.length === 1) {
        warnings.push(
          `⚠️ ATENÇÃO: No dia ${datesWithExcess[0]}, já haverá ${limite} ou mais ${categoria} ausentes. ` +
          `Cadastrar esta ausência excederá o limite recomendado de ${limiteText}.`
        );
      } else if (datesWithExcess.length <= 5) {
        warnings.push(
          `⚠️ ATENÇÃO: Nos dias ${datesWithExcess.join(', ')}, já haverá ${limite} ou mais ${categoria} ausentes. ` +
          `Cadastrar esta ausência excederá o limite recomendado de ${limiteText}.`
        );
      } else {
        warnings.push(
          `⚠️ ATENÇÃO: Em ${datesWithExcess.length} dias do período (${datesWithExcess[0]} a ${datesWithExcess[datesWithExcess.length - 1]}), ` +
          `já haverá ${limite} ou mais ${categoria} ausentes. ` +
          `Cadastrar esta ausência excederá o limite recomendado de ${limiteText}.`
        );
      }
    }

    return { error: null, warnings, conflictingAbsences: conflictingAbsences.length > 0 ? conflictingAbsences : undefined };
  };

  // CRUD operations
  const addFuncionario = async (funcionario: Omit<Funcionario, 'id'>) => {
    const { error } = await supabase.from('funcionarios').insert({
      nome: funcionario.nome,
      graduacao: funcionario.graduacao,
      categoria: funcionario.categoria,
      ordem_antiguidade: funcionario.ordemAntiguidade,
      ativo: funcionario.ativo,
    });

    if (error) throw error;
    await refreshData();
  };

  const updateFuncionario = async (funcionario: Funcionario) => {
    const { error } = await supabase
      .from('funcionarios')
      .update({
        nome: funcionario.nome,
        graduacao: funcionario.graduacao,
        categoria: funcionario.categoria,
        ordem_antiguidade: funcionario.ordemAntiguidade,
        ativo: funcionario.ativo,
      })
      .eq('id', funcionario.id);

    if (error) throw error;
    await refreshData();
  };

  const deleteFuncionario = async (id: string) => {
    const { error } = await supabase.from('funcionarios').delete().eq('id', id);
    if (error) throw error;
    await refreshData();
  };

  const getFuncionario = (id: string) => {
    return funcionarios.find(f => f.id === id);
  };

  const addAusencia = async (ausencia: Omit<Ausencia, 'id'>) => {
    const { error} = await supabase.from('ausencias').insert({
      funcionario_id: ausencia.funcionarioId,
      motivo: ausencia.motivo,
      data_inicio: ausencia.dataInicio,
      data_fim: ausencia.dataFim,
      turno_padrao: ausencia.turnoPadrao,
      excecoes_por_dia: ausencia.excecoesPorDia,
      observacao: ausencia.observacao,
    });

    if (error) throw error;
    await refreshData();
  };

  const updateAusencia = async (ausencia: Ausencia) => {
    const { error } = await supabase
      .from('ausencias')
      .update({
        funcionario_id: ausencia.funcionarioId,
        motivo: ausencia.motivo,
        data_inicio: ausencia.dataInicio,
        data_fim: ausencia.dataFim,
        turno_padrao: ausencia.turnoPadrao,
        excecoes_por_dia: ausencia.excecoesPorDia,
        observacao: ausencia.observacao,
      })
      .eq('id', ausencia.id);

    if (error) throw error;
    await refreshData();
  };

  const deleteAusencia = async (id: string) => {
    const { error } = await supabase.from('ausencias').delete().eq('id', id);
    if (error) throw error;
    await refreshData();
  };

  return (
    <DataContext.Provider
      value={{
        funcionarios,
        ausencias,
        isLoading,
        error,
        addFuncionario,
        updateFuncionario,
        deleteFuncionario,
        getFuncionario,
        addAusencia,
        updateAusencia,
        deleteAusencia,
        validateAusencia,
        getAusenciasForDate,
        getAusenciasForDateRange,
        getEfetivoDisponivel,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
