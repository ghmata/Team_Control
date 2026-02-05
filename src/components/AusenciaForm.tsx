import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format, parseISO, addDays, differenceInDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useData } from '@/contexts/DataContext';
import { ShiftBadge } from '@/components/Badges';
import { 
  Ausencia, 
  MotivoAusencia, 
  MOTIVOS_AUSENCIA, 
  Turno, 
  TURNOS,
  ExcecaoDia 
} from '@/types';

interface AusenciaFormProps {
  ausencia?: Ausencia | null;
  onClose: () => void;
}

export function AusenciaForm({ ausencia, onClose }: AusenciaFormProps) {
  const { funcionarios, ausencias, addAusencia, updateAusencia, validateAusencia } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  const today = format(new Date(), 'yyyy-MM-dd');
  
  const [formData, setFormData] = useState({
    funcionarioId: ausencia?.funcionarioId || '',
    motivo: ausencia?.motivo || '' as MotivoAusencia | '',
    dataInicio: ausencia?.dataInicio || today,
    dataFim: ausencia?.dataFim || today,
    turnoPadrao: ausencia?.turnoPadrao || 'INTEGRAL' as Turno,
    excecoesPorDia: ausencia?.excecoesPorDia || [] as ExcecaoDia[],
    observacao: ausencia?.observacao || '',
  });
  
  const [newExcecaoData, setNewExcecaoData] = useState('');
  const [newExcecaoTurno, setNewExcecaoTurno] = useState<Turno>('MATUTINO');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);
  const [conflictingAbsences, setConflictingAbsences] = useState<Array<{
    funcionarioNome: string;
    funcionarioGraduacao: string;
    motivo: string;
    dataInicio: string;
    dataFim: string;
  }>>([]);

  const isEditing = !!ausencia;
  const activeFuncionarios = funcionarios.filter(f => f.ativo);

  // Get available funcionarios (those without conflicting absences in the selected period)
  const availableFuncionarios = useMemo(() => {
    if (!formData.dataInicio || !formData.dataFim) {
      return activeFuncionarios;
    }

    const start = parseISO(formData.dataInicio);
    const end = parseISO(formData.dataFim);

    return activeFuncionarios.filter(func => {
      // Check if this funcionario has any conflicting absence
      const conflicts = ausencias.filter(a => {
        // Skip current absence if editing
        if (isEditing && ausencia && a.id === ausencia.id) return false;
        
        // Only check absences for this funcionario
        if (a.funcionarioId !== func.id) return false;

        const aStart = parseISO(a.dataInicio);
        const aEnd = parseISO(a.dataFim);

        // Check if date ranges overlap
        return start <= aEnd && end >= aStart;
      });

      return conflicts.length === 0;
    });
  }, [formData.dataInicio, formData.dataFim, activeFuncionarios, ausencias, isEditing, ausencia]);

  // Get available dates for exceptions
  const availableDatesForException = useMemo(() => {
    if (!formData.dataInicio || !formData.dataFim) return [];
    
    const start = parseISO(formData.dataInicio);
    const end = parseISO(formData.dataFim);
    const days = differenceInDays(end, start) + 1;
    
    const dates: string[] = [];
    for (let i = 0; i < days; i++) {
      const date = format(addDays(start, i), 'yyyy-MM-dd');
      // Exclude dates that already have exceptions
      if (!formData.excecoesPorDia.some(e => e.data === date)) {
        dates.push(date);
      }
    }
    
    return dates;
  }, [formData.dataInicio, formData.dataFim, formData.excecoesPorDia]);

  const handleAddExcecao = () => {
    if (!newExcecaoData) return;
    
    // Validate date is within range
    const date = parseISO(newExcecaoData);
    const start = parseISO(formData.dataInicio);
    const end = parseISO(formData.dataFim);
    
    if (!isWithinInterval(date, { start, end })) {
      setError('A data da exceção deve estar dentro do período da ausência');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      excecoesPorDia: [
        ...prev.excecoesPorDia,
        { data: newExcecaoData, turno: newExcecaoTurno }
      ].sort((a, b) => a.data.localeCompare(b.data))
    }));
    
    setNewExcecaoData('');
    setNewExcecaoTurno('MATUTINO');
  };

  const handleRemoveExcecao = (data: string) => {
    setFormData(prev => ({
      ...prev,
      excecoesPorDia: prev.excecoesPorDia.filter(e => e.data !== data)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.funcionarioId) {
      setError('Selecione um funcionário');
      return;
    }
    if (!formData.motivo) {
      setError('Selecione um motivo');
      return;
    }
    if (!formData.dataInicio || !formData.dataFim) {
      setError('Preencha as datas de início e fim');
      return;
    }

    // Validate date range
    if (formData.dataFim < formData.dataInicio) {
      setError('A data final não pode ser anterior à data inicial');
      return;
    }

    // Filter out any exceptions outside the new date range
    const validExcecoes = formData.excecoesPorDia.filter(exc => {
      const date = parseISO(exc.data);
      const start = parseISO(formData.dataInicio);
      const end = parseISO(formData.dataFim);
      return isWithinInterval(date, { start, end });
    });

    const ausenciaData = {
      funcionarioId: formData.funcionarioId,
      motivo: formData.motivo as MotivoAusencia,
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      turnoPadrao: formData.turnoPadrao,
      excecoesPorDia: validExcecoes,
      observacao: formData.observacao.trim() || undefined,
    };

    // Validate for conflicts and warnings
    const validation = validateAusencia(ausenciaData, ausencia?.id);
    if (validation.error) {
      setError(validation.error);
      return;
    }

    // If there are warnings and user hasn't confirmed yet, show confirmation
    if (validation.warnings.length > 0 && !showWarningConfirm) {
      setWarnings(validation.warnings);
      setConflictingAbsences(validation.conflictingAbsences || []);
      setShowWarningConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && ausencia) {
        await updateAusencia({
          ...ausenciaData,
          id: ausencia.id,
        });
      } else {
        await addAusencia(ausenciaData);
      }
      onClose();
    } catch (err) {
      setError('Erro ao salvar ausência');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ausência' : 'Nova Ausência'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {error}
            </motion.div>
          )}

          {warnings.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-lg bg-warning-bg border border-warning-border text-warning-foreground text-sm"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <p>{warning}</p>
                </div>
              ))}
              
              {/* Show details of conflicting absences */}
              {conflictingAbsences.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted border border-border">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    Militares já ausentes:
                  </p>
                  <ul className="space-y-2">
                    {conflictingAbsences.map((absence, idx) => (
                      <li key={idx} className="text-xs bg-background p-2 rounded border border-border">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {absence.funcionarioGraduacao} {absence.funcionarioNome}
                          </span>
                          <span className="text-muted-foreground">
                            {format(parseISO(absence.dataInicio), 'dd/MM/yyyy')} a {format(parseISO(absence.dataFim), 'dd/MM/yyyy')}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="text-primary font-medium">{absence.motivo}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground font-medium">
                Deseja prosseguir mesmo assim?
              </p>
            </motion.div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="advanced">
                Avançado
                {formData.excecoesPorDia.length > 0 && (
                  <span className="ml-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {formData.excecoesPorDia.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Basic Tab */}
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Datas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data Início *</Label>
                  <Input
                    id="dataInicio"
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataInicio: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataFim">Data Fim *</Label>
                  <Input
                    id="dataFim"
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData(prev => ({ ...prev, dataFim: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Funcionário */}
              <div className="space-y-2">
                <Label htmlFor="funcionario">Funcionário *</Label>
                <Select
                  value={formData.funcionarioId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, funcionarioId: value }))}
                  disabled={!formData.dataInicio || !formData.dataFim}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.dataInicio || !formData.dataFim ? "Selecione primeiro o período" : "Selecione..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFuncionarios.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum funcionário disponível no período
                      </div>
                    ) : (
                      [...availableFuncionarios]
                        .sort((a, b) => a.ordemAntiguidade - b.ordemAntiguidade)
                        .map((func) => (
                        <SelectItem key={func.id} value={func.id}>
                          {func.graduacao} {func.nome} ({func.categoria === 'GRADUADO' ? 'Graduado' : 'Cabo/Soldado'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formData.dataInicio && formData.dataFim && availableFuncionarios.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Todos os funcionários já possuem ausências neste período.
                  </p>
                )}
              </div>

              {/* Motivo */}
              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo *</Label>
                <Select
                  value={formData.motivo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, motivo: value as MotivoAusencia }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_AUSENCIA.map((motivo) => (
                      <SelectItem key={motivo} value={motivo}>
                        {motivo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Turno Padrão */}
              <div className="space-y-2">
                <Label htmlFor="turnoPadrao">Turno Padrão *</Label>
                <Select
                  value={formData.turnoPadrao}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, turnoPadrao: value as Turno }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TURNOS.map((turno) => (
                      <SelectItem key={turno.value} value={turno.value}>
                        {turno.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Aplicado a todos os dias, exceto os configurados nas exceções
                </p>
              </div>

              {/* Observação */}
              <div className="space-y-2">
                <Label htmlFor="observacao">Observação (opcional)</Label>
                <Textarea
                  id="observacao"
                  value={formData.observacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
                  placeholder="Informações adicionais..."
                  maxLength={200}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.observacao.length}/200
                </p>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Exceções por Dia</Label>
                <p className="text-xs text-muted-foreground">
                  Configure turnos específicos para datas dentro do período
                </p>
              </div>

              {/* Add Exception */}
              {availableDatesForException.length > 0 && (
                <div className="flex gap-2">
                  <Select
                    value={newExcecaoData}
                    onValueChange={setNewExcecaoData}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Selecione a data..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDatesForException.map((date) => (
                        <SelectItem key={date} value={date}>
                          {format(parseISO(date), "dd/MM/yyyy (EEEE)", { locale: ptBR })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={newExcecaoTurno}
                    onValueChange={(value) => setNewExcecaoTurno(value as Turno)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TURNOS.map((turno) => (
                        <SelectItem key={turno.value} value={turno.value}>
                          {turno.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="icon"
                    onClick={handleAddExcecao}
                    disabled={!newExcecaoData}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Exceptions List */}
              {formData.excecoesPorDia.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma exceção configurada
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O turno padrão será aplicado a todos os dias
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {formData.excecoesPorDia.map((exc) => (
                    <div
                      key={exc.data}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">
                          {format(parseISO(exc.data), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        <ShiftBadge turno={exc.turno} />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveExcecao(exc.data)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {availableDatesForException.length === 0 && formData.dataInicio && formData.dataFim && (
                <p className="text-xs text-muted-foreground">
                  {differenceInDays(parseISO(formData.dataFim), parseISO(formData.dataInicio)) + 1 === formData.excecoesPorDia.length 
                    ? 'Todos os dias do período têm exceções configuradas'
                    : 'Defina o período de datas para adicionar exceções'}
                </p>
              )}
            </TabsContent>
          </Tabs>

          {/* Warning summary before buttons */}
          {warnings.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive font-semibold text-sm mb-4">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>
                  {(() => {
                    const funcionario = funcionarios.find(f => f.id === formData.funcionarioId);
                    if (!funcionario) return "Atenção: excesso de ausências detectado";
                    
                    const categoria = funcionario.categoria === 'GRADUADO' ? 'graduados' : 'cabos/soldados';
                    const limite = funcionario.categoria === 'GRADUADO' ? 3 : 2;
                    
                    return `Nesse período já existem ao menos ${limite} ${categoria} fora`;
                  })()}
                </p>
              </div>
            </div>
          )}

          <div className={`flex justify-end gap-3 ${warnings.length > 0 ? 'pt-0' : 'pt-4 border-t'}`}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} variant={warnings.length > 0 ? 'destructive' : 'default'}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : warnings.length > 0 ? (
                'Confirmar e Prosseguir'
              ) : (
                isEditing ? 'Salvar' : 'Adicionar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
