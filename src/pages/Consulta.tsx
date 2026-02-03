import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Calendar, X } from 'lucide-react';
import { format, parseISO, isWithinInterval, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { CategoryBadge, ShiftBadge } from '@/components/Badges';
import { Categoria, MotivoAusencia, MOTIVOS_AUSENCIA, FiltroConsulta, Ausencia, Funcionario, ExcecaoDia } from '@/types';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';

export default function Consulta() {
  const { funcionarios, ausencias } = useData();
  const [filtros, setFiltros] = useState<FiltroConsulta>({
    nome: '',
    categoria: 'TODOS',
    motivo: 'TODOS',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedAusencia, setExpandedAusencia] = useState<string | null>(null);

  // Filter and compute results
  const resultados = useMemo(() => {
    let filteredAusencias = [...ausencias];

    // Filter by funcionario name
    if (filtros.nome) {
      const nomeFilter = filtros.nome.toLowerCase();
      const matchingFuncIds = funcionarios
        .filter(f => f.nome.toLowerCase().includes(nomeFilter))
        .map(f => f.id);
      filteredAusencias = filteredAusencias.filter(a => matchingFuncIds.includes(a.funcionarioId));
    }

    // Filter by categoria
    if (filtros.categoria && filtros.categoria !== 'TODOS') {
      const catFuncIds = funcionarios
        .filter(f => f.categoria === filtros.categoria)
        .map(f => f.id);
      filteredAusencias = filteredAusencias.filter(a => catFuncIds.includes(a.funcionarioId));
    }

    // Filter by motivo
    if (filtros.motivo && filtros.motivo !== 'TODOS') {
      filteredAusencias = filteredAusencias.filter(a => a.motivo === filtros.motivo);
    }

    // Filter by date range
    if (filtros.dataInicio || filtros.dataFim) {
      filteredAusencias = filteredAusencias.filter(a => {
        const ausStart = parseISO(a.dataInicio);
        const ausEnd = parseISO(a.dataFim);
        
        if (filtros.dataInicio && filtros.dataFim) {
          const filterStart = parseISO(filtros.dataInicio);
          const filterEnd = parseISO(filtros.dataFim);
          // Check if ranges overlap
          return ausStart <= filterEnd && ausEnd >= filterStart;
        } else if (filtros.dataInicio) {
          const filterStart = parseISO(filtros.dataInicio);
          return ausEnd >= filterStart;
        } else if (filtros.dataFim) {
          const filterEnd = parseISO(filtros.dataFim);
          return ausStart <= filterEnd;
        }
        return true;
      });
    }

    // Map to include funcionario data
    return filteredAusencias.map(ausencia => ({
      ausencia,
      funcionario: funcionarios.find(f => f.id === ausencia.funcionarioId)!,
    })).filter(r => r.funcionario).sort((a, b) => {
      // Sort by start date (newest first)
      return parseISO(b.ausencia.dataInicio).getTime() - parseISO(a.ausencia.dataInicio).getTime();
    });
  }, [ausencias, funcionarios, filtros]);

  const clearFilters = () => {
    setFiltros({
      nome: '',
      categoria: 'TODOS',
      motivo: 'TODOS',
    });
  };

  const hasActiveFilters = filtros.nome || 
    (filtros.categoria && filtros.categoria !== 'TODOS') || 
    (filtros.motivo && filtros.motivo !== 'TODOS') ||
    filtros.dataInicio || 
    filtros.dataFim;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Consulta</h1>
        <p className="text-muted-foreground">
          Pesquise e filtre ausências
        </p>
      </header>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={filtros.nome || ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, nome: e.target.value }))}
                className="pl-10"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t border-border"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Categoria */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={filtros.categoria || 'TODOS'}
                    onValueChange={(value) => setFiltros(prev => ({ 
                      ...prev, 
                      categoria: value as Categoria | 'TODOS'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todas</SelectItem>
                      <SelectItem value="GRADUADO">Graduado</SelectItem>
                      <SelectItem value="SOLDADO">Soldado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Motivo */}
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Select
                    value={filtros.motivo || 'TODOS'}
                    onValueChange={(value) => setFiltros(prev => ({ 
                      ...prev, 
                      motivo: value as MotivoAusencia | 'TODOS'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {MOTIVOS_AUSENCIA.map((motivo) => (
                        <SelectItem key={motivo} value={motivo}>
                          {motivo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Início */}
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={filtros.dataInicio || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                  />
                </div>

                {/* Data Fim */}
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={filtros.dataFim || ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
        </p>

        {resultados.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhuma ausência encontrada com os filtros aplicados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {resultados.map(({ ausencia, funcionario }) => (
              <AusenciaResultCard
                key={ausencia.id}
                ausencia={ausencia}
                funcionario={funcionario}
                isExpanded={expandedAusencia === ausencia.id}
                onToggle={() => setExpandedAusencia(
                  expandedAusencia === ausencia.id ? null : ausencia.id
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AusenciaResultCardProps {
  ausencia: Ausencia;
  funcionario: Funcionario;
  isExpanded: boolean;
  onToggle: () => void;
}

function AusenciaResultCard({ ausencia, funcionario, isExpanded, onToggle }: AusenciaResultCardProps) {
  const startDate = parseISO(ausencia.dataInicio);
  const endDate = parseISO(ausencia.dataFim);
  const isSingleDay = isSameDay(startDate, endDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <Card className="overflow-hidden">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-foreground">
                  {funcionario.nome}
                </span>
                <CategoryBadge categoria={funcionario.categoria} />
                <ShiftBadge turno={ausencia.turnoPadrao} />
                <span className="text-sm text-muted-foreground ml-auto">
                  {ausencia.motivo}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isSingleDay 
                  ? format(startDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                  : `${format(startDate, "d 'de' MMM", { locale: ptBR })} a ${format(endDate, "d 'de' MMM 'de' yyyy", { locale: ptBR })}`
                }
                {ausencia.excecoesPorDia.length > 0 && (
                  <span className="ml-2 text-xs text-info">
                    ({ausencia.excecoesPorDia.length} exceç{ausencia.excecoesPorDia.length > 1 ? 'ões' : 'ão'})
                  </span>
                )}
              </p>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4 px-4 border-t border-border">
              <div className="space-y-4 mt-4">
                {/* Observation */}
                {ausencia.observacao && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observação</p>
                    <p className="text-sm text-foreground">{ausencia.observacao}</p>
                  </div>
                )}

                {/* Exceptions */}
                {ausencia.excecoesPorDia.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Exceções por Dia</p>
                    <div className="flex flex-wrap gap-2">
                      {ausencia.excecoesPorDia.map((exc) => (
                        <div 
                          key={exc.data}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
                        >
                          <span>{format(parseISO(exc.data), "dd/MM", { locale: ptBR })}</span>
                          <ShiftBadge turno={exc.turno} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </motion.div>
  );
}
