import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Funcionario, Ausencia, AusenciaDia, EfetivoDisponivel, Turno } from '@/types';
import {
  getAllFuncionarios,
  getAllAusencias,
  saveFuncionario,
  deleteFuncionario as dbDeleteFuncionario,
  saveAusencia,
  deleteAusencia as dbDeleteAusencia,
  getFuncionarioById,
} from '@/lib/db';
import { format, isWithinInterval, parseISO, addDays, isSameDay } from 'date-fns';

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
  validateAusencia: (ausencia: Omit<Ausencia, 'id'>, excludeId?: string) => string | null;
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
      const [funcs, aus] = await Promise.all([
        getAllFuncionarios(),
        getAllAusencias(),
      ]);
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

    // Sort by category (GRADUADO first) then by name
    return result.sort((a, b) => {
      if (a.funcionario.categoria !== b.funcionario.categoria) {
        return a.funcionario.categoria === 'GRADUADO' ? -1 : 1;
      }
      return a.funcionario.nome.localeCompare(b.funcionario.nome);
    });
  }, [ausencias, funcionarios]);

  // Get absences for a date range (for next 7 days view)
  const getAusenciasForDateRange = useCallback((startDate: Date, endDate: Date): Map<string, AusenciaDia[]> => {
    const result = new Map<string, AusenciaDia[]>();
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const ausenciasForDate = getAusenciasForDate(currentDate);
      if (ausenciasForDate.length > 0) {
        result.set(dateStr, ausenciasForDate);
      }
      currentDate = addDays(currentDate, 1);
    }

    return result;
  }, [getAusenciasForDate]);

  // Calculate available staff for a specific date and optional shift
  const getEfetivoDisponivel = useCallback((date: Date, turno?: Turno): EfetivoDisponivel => {
    const activeEmployees = funcionarios.filter(f => f.ativo);
    const totalGraduados = activeEmployees.filter(f => f.categoria === 'GRADUADO').length;
    const totalSoldados = activeEmployees.filter(f => f.categoria === 'SOLDADO').length;

    const ausenciasHoje = getAusenciasForDate(date);

    // Count unavailable by category
    let graduadosIndisponiveis = 0;
    let soldadosIndisponiveis = 0;

    for (const ausenciaDia of ausenciasHoje) {
      // If no specific shift is requested, count anyone with any absence
      // If a specific shift is requested, only count if the absence covers that shift
      const shouldCount = !turno || 
        ausenciaDia.turno === 'INTEGRAL' || 
        ausenciaDia.turno === turno;

      if (shouldCount) {
        if (ausenciaDia.funcionario.categoria === 'GRADUADO') {
          graduadosIndisponiveis++;
        } else {
          soldadosIndisponiveis++;
        }
      }
    }

    return {
      graduados: {
        disponivel: totalGraduados - graduadosIndisponiveis,
        total: totalGraduados,
      },
      soldados: {
        disponivel: totalSoldados - soldadosIndisponiveis,
        total: totalSoldados,
      },
    };
  }, [funcionarios, getAusenciasForDate]);

  // Validate absence for conflicts
  const validateAusencia = (ausencia: Omit<Ausencia, 'id'>, excludeId?: string): string | null => {
    const start = parseISO(ausencia.dataInicio);
    const end = parseISO(ausencia.dataFim);

    // Check date order
    if (end < start) {
      return 'A data final não pode ser anterior à data inicial';
    }

    // Check for overlapping absences
    for (const existing of ausencias) {
      if (excludeId && existing.id === excludeId) continue;
      if (existing.funcionarioId !== ausencia.funcionarioId) continue;

      const existingStart = parseISO(existing.dataInicio);
      const existingEnd = parseISO(existing.dataFim);

      // Check if date ranges overlap
      if (start <= existingEnd && end >= existingStart) {
        // Check shift conflicts for overlapping days
        let currentDate = new Date(Math.max(start.getTime(), existingStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), existingEnd.getTime()));

        while (currentDate <= overlapEnd) {
          const newTurno = ausencia.excecoesPorDia.find(
            e => e.data === format(currentDate, 'yyyy-MM-dd')
          )?.turno || ausencia.turnoPadrao;
          
          const existingTurno = getTurnoForDate(existing, currentDate);

          // Check for conflict
          const hasConflict = 
            newTurno === 'INTEGRAL' || 
            existingTurno === 'INTEGRAL' || 
            newTurno === existingTurno;

          if (hasConflict) {
            const funcionario = funcionarios.find(f => f.id === ausencia.funcionarioId);
            return `Conflito de ausência para ${funcionario?.nome || 'funcionário'} em ${format(currentDate, 'dd/MM/yyyy')}`;
          }

          currentDate = addDays(currentDate, 1);
        }
      }
    }

    return null;
  };

  // CRUD operations
  const addFuncionario = async (funcionario: Omit<Funcionario, 'id'>) => {
    const newFuncionario: Funcionario = {
      ...funcionario,
      id: `f${Date.now()}`,
    };
    await saveFuncionario(newFuncionario);
    setFuncionarios(prev => [...prev, newFuncionario]);
  };

  const updateFuncionario = async (funcionario: Funcionario) => {
    await saveFuncionario(funcionario);
    setFuncionarios(prev => prev.map(f => f.id === funcionario.id ? funcionario : f));
  };

  const deleteFuncionarioFn = async (id: string) => {
    await dbDeleteFuncionario(id);
    setFuncionarios(prev => prev.filter(f => f.id !== id));
    // Also delete related absences
    const relatedAusencias = ausencias.filter(a => a.funcionarioId === id);
    for (const ausencia of relatedAusencias) {
      await dbDeleteAusencia(ausencia.id);
    }
    setAusencias(prev => prev.filter(a => a.funcionarioId !== id));
  };

  const getFuncionario = (id: string): Funcionario | undefined => {
    return funcionarios.find(f => f.id === id);
  };

  const addAusencia = async (ausencia: Omit<Ausencia, 'id'>) => {
    const newAusencia: Ausencia = {
      ...ausencia,
      id: `a${Date.now()}`,
    };
    await saveAusencia(newAusencia);
    setAusencias(prev => [...prev, newAusencia]);
  };

  const updateAusencia = async (ausencia: Ausencia) => {
    await saveAusencia(ausencia);
    setAusencias(prev => prev.map(a => a.id === ausencia.id ? ausencia : a));
  };

  const deleteAusenciaFn = async (id: string) => {
    await dbDeleteAusencia(id);
    setAusencias(prev => prev.filter(a => a.id !== id));
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
        deleteFuncionario: deleteFuncionarioFn,
        getFuncionario,
        addAusencia,
        updateAusencia,
        deleteAusencia: deleteAusenciaFn,
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
