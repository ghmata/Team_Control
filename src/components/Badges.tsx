import { Turno, Categoria } from '@/types';
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
    SOLDADO: 'Soldado',
  };

  const styles: Record<Categoria, string> = {
    GRADUADO: 'badge-graduado',
    SOLDADO: 'badge-soldado',
  };

  return (
    <Badge variant="outline" className={cn('text-xs font-medium', styles[categoria], className)}>
      {labels[categoria]}
    </Badge>
  );
}
