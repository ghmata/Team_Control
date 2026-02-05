import { motion } from 'framer-motion';
import { Users, Shield, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EfetivoDisponivel, Turno, TURNOS } from '@/types';
import { cn } from '@/lib/utils';

interface StaffCounterProps {
  efetivo: EfetivoDisponivel;
  turno?: Turno;
  date: Date;
  onTurnoChange?: (turno: Turno | undefined) => void;
}

export function StaffCounter({ efetivo, turno, date, onTurnoChange }: StaffCounterProps) {
  const formatDate = (d: Date) => {
    return d.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="card-success">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-success" />
            <CardTitle className="text-lg font-semibold text-success-foreground">
              Efetivo Disponível
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {formatDate(date)}
            {turno && ` • ${TURNOS.find(t => t.value === turno)?.label}`}
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Turno selector */}
          {onTurnoChange && (
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => onTurnoChange(undefined)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                  !turno 
                    ? 'bg-success text-success-foreground' 
                    : 'bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                Geral
              </button>
              {TURNOS.filter(t => t.value !== 'INTEGRAL').map((t) => (
                <button
                  key={t.value}
                  onClick={() => onTurnoChange(t.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
                    turno === t.value
                      ? 'bg-success text-success-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Graduados */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-graduado-bg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-graduado/20">
                <Shield className="h-5 w-5 text-graduado" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Graduados</p>
                <p className="text-xl font-bold text-foreground">
                  <span className={cn(
                    efetivo.graduados.disponivel < efetivo.graduados.total && 'text-warning'
                  )}>
                    {efetivo.graduados.disponivel}
                  </span>
                  <span className="text-muted-foreground font-normal">
                    /{efetivo.graduados.total}
                  </span>
                </p>
              </div>
            </div>

            {/* Cabos e soldados */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-soldado-bg">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-soldado/20">
                <UserCheck className="h-5 w-5 text-soldado" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Cabos e soldados</p>
                <p className="text-xl font-bold text-foreground">
                  <span className={cn(
                    efetivo.cabosSoldados.disponivel < efetivo.cabosSoldados.total && 'text-warning'
                  )}>
                    {efetivo.cabosSoldados.disponivel}
                  </span>
                  <span className="text-muted-foreground font-normal">
                    /{efetivo.cabosSoldados.total}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
