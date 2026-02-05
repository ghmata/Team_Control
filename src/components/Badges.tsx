import { Turno, Categoria, MotivoAusencia } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ShiftBadgeProps {
  turno: Turno;
  className?: string;
}

export function ShiftBadge({ turno, className }: ShiftBadgeProps) {
  const labels: Record<Turno, string> = {
    MATUTINO: 'Manhã',
    VESPERTINO: 'Tarde',
    INTEGRAL: 'Dia Inteiro',
  };

  const styles: Record<Turno, string> = {
    MATUTINO: 'shift-matutino',
    VESPERTINO: 'shift-vespertino',
    INTEGRAL: 'shift-integral',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', styles[turno], className)}>
      {labels[turno]}
    </Badge>
  );
}

interface CategoryBadgeProps {
  categoria: Categoria;
  className?: string;
}

export function CategoryBadge({ categoria, className }: CategoryBadgeProps) {
  const labels: Record<Categoria, string> = {
    GRADUADO: 'Graduado',
    CABO_SOLDADO: 'Cabo/Soldado',
  };

  const styles: Record<Categoria, string> = {
    GRADUADO: 'badge-graduado',
    CABO_SOLDADO: 'badge-soldado',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', styles[categoria], className)}>
      {labels[categoria]}
    </Badge>
  );
}

interface MotivoBadgeProps {
  motivo: MotivoAusencia;
  className?: string;
}

export function MotivoBadge({ motivo, className }: MotivoBadgeProps) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium bg-primary/5 text-primary border-primary/20', className)}>
      {motivo}
    </Badge>
  );
}
