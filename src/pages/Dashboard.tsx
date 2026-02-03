import { useState } from 'react';
import { addDays, startOfDay } from 'date-fns';
import { useData } from '@/contexts/DataContext';
import { AbsenceCard } from '@/components/AbsenceCard';
import { StaffCounter } from '@/components/StaffCounter';
import { Next7DaysCard } from '@/components/Next7DaysCard';
import { Turno } from '@/types';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { getAusenciasForDate, getAusenciasForDateRange, getEfetivoDisponivel, isLoading, error } = useData();
  const [selectedTurno, setSelectedTurno] = useState<Turno | undefined>(undefined);

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const in7Days = addDays(today, 7);

  // Get absences
  const ausenciasHoje = getAusenciasForDate(today);
  const ausenciasAmanha = getAusenciasForDate(tomorrow);
  
  // Get next 7 days (excluding today and tomorrow)
  const startNext7 = addDays(today, 2);
  const ausenciasProximos7 = getAusenciasForDateRange(startNext7, in7Days);

  // Get staff availability
  const efetivoHoje = getEfetivoDisponivel(today, selectedTurno);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-muted-foreground text-sm mt-2">
            Tente recarregar a página
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do efetivo e ausências
        </p>
      </header>

      {/* Staff Counter */}
      <StaffCounter 
        efetivo={efetivoHoje} 
        turno={selectedTurno}
        date={today}
        onTurnoChange={setSelectedTurno}
      />

      {/* Priority Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Fora Hoje - HIGHEST PRIORITY */}
        <AbsenceCard
          title="Fora Hoje"
          ausencias={ausenciasHoje}
          priority="urgent"
          emptyMessage="Ninguém fora hoje"
        />

        {/* Fora Amanhã - SECONDARY PRIORITY */}
        <AbsenceCard
          title="Fora Amanhã"
          ausencias={ausenciasAmanha}
          priority="warning"
          emptyMessage="Ninguém fora amanhã"
        />
      </div>

      {/* Próximos 7 Dias - LOW EMPHASIS */}
      <Next7DaysCard ausenciasByDate={ausenciasProximos7} />
    </div>
  );
}
