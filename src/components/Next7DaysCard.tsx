import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AusenciaDia } from '@/types';
import { ShiftBadge, CategoryBadge } from './Badges';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Next7DaysCardProps {
  ausenciasByDate: Map<string, AusenciaDia[]>;
}

export function Next7DaysCard({ ausenciasByDate }: Next7DaysCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const totalAusencias = Array.from(ausenciasByDate.values()).reduce(
    (sum, arr) => sum + arr.length, 
    0
  );

  const sortedDates = Array.from(ausenciasByDate.keys()).sort();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="bg-card border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">
                Próximos 7 Dias
              </CardTitle>
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-sm font-medium text-muted-foreground">
                {totalAusencias}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <CardContent className="pt-0">
                {sortedDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Nenhuma ausência nos próximos 7 dias
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sortedDates.map((dateStr) => {
                      const ausencias = ausenciasByDate.get(dateStr) || [];
                      const date = parseISO(dateStr);
                      
                      return (
                        <div key={dateStr} className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground capitalize">
                            {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
                          </h4>
                          <ul className="space-y-1">
                            {ausencias.map((item) => (
                              <li
                                key={`${item.ausencia.id}-${item.data}`}
                                className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-muted/50"
                              >
                                <span className="font-medium text-sm text-foreground">
                                  {item.funcionario.nome}
                                </span>
                                <CategoryBadge categoria={item.funcionario.categoria} />
                                <ShiftBadge turno={item.turno} />
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {item.ausencia.motivo}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isExpanded && totalAusencias > 0 && (
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">
              {totalAusencias} ausência{totalAusencias > 1 ? 's' : ''} programada{totalAusencias > 1 ? 's' : ''}
            </p>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}
