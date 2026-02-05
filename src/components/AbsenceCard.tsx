import { motion } from 'framer-motion';
import { AlertTriangle, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AusenciaDia } from '@/types';
import { ShiftBadge, CategoryBadge, MotivoBadge } from './Badges';
import { cn } from '@/lib/utils';

interface AbsenceCardProps {
  title: string;
  subtitle?: string;
  ausencias: AusenciaDia[];
  priority: 'urgent' | 'warning' | 'info';
  emptyMessage: string;
  icon?: React.ReactNode;
}

export function AbsenceCard({
  title,
  subtitle,
  ausencias,
  priority,
  emptyMessage,
  icon,
}: AbsenceCardProps) {
  const priorityStyles = {
    urgent: 'card-urgent',
    warning: 'card-warning',
    info: 'card-info',
  };

  const headerStyles = {
    urgent: 'text-urgent-foreground',
    warning: 'text-warning-foreground',
    info: 'text-info-foreground',
  };

  const iconMap = {
    urgent: <AlertTriangle className="h-5 w-5 text-urgent" />,
    warning: <Sun className="h-5 w-5 text-warning" />,
    info: <Moon className="h-5 w-5 text-info" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn('overflow-hidden', priorityStyles[priority])}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            {icon || iconMap[priority]}
            <div className="flex-1">
              <CardTitle className={cn('text-lg font-semibold', headerStyles[priority])}>
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <span className={cn(
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
              priority === 'urgent' && 'bg-urgent/20 text-urgent',
              priority === 'warning' && 'bg-warning/20 text-warning-foreground',
              priority === 'info' && 'bg-info/20 text-info-foreground'
            )}>
              {ausencias.length}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {ausencias.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
          ) : (
            <ul className="space-y-2">
              {ausencias.map((item, index) => (
                <motion.li
                  key={`${item.ausencia.id}-${item.data}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-background/60"
                >
                  <span className="font-medium text-foreground">
                    {item.funcionario.graduacao} {item.funcionario.nome}
                  </span>
                  <MotivoBadge motivo={item.ausencia.motivo} />
                  <ShiftBadge turno={item.turno} />
                </motion.li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
