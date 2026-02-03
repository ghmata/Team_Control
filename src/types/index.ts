// User Roles
export type UserRole = 'FUNCIONARIO' | 'ENCARREGADO';

// Employee Categories
export type Categoria = 'GRADUADO' | 'SOLDADO';

// Shift Types
export type Turno = 'MATUTINO' | 'VESPERTINO' | 'INTEGRAL';

// Absence Reasons (Fixed ENUM)
export type MotivoAusencia =
  | 'Missão'
  | 'Comissão'
  | 'Serviço'
  | 'Férias'
  | 'Dispensa Médica'
  | 'Dispensado pela chefia'
  | 'Licença Paternidade'
  | 'Licença Maternidade'
  | 'Licença Luto'
  | 'Dispensa de serviço'
  | 'Trânsito'
  | 'Instalação'
  | 'Licença Núpcias';

export const MOTIVOS_AUSENCIA: MotivoAusencia[] = [
  'Missão',
  'Comissão',
  'Serviço',
  'Férias',
  'Dispensa Médica',
  'Dispensado pela chefia',
  'Licença Paternidade',
  'Licença Maternidade',
  'Licença Luto',
  'Dispensa de serviço',
  'Trânsito',
  'Instalação',
  'Licença Núpcias',
];

export const TURNOS: { value: Turno; label: string }[] = [
  { value: 'MATUTINO', label: 'Manhã' },
  { value: 'VESPERTINO', label: 'Tarde' },
  { value: 'INTEGRAL', label: 'Dia Inteiro' },
];

// User
export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

// Employee
export interface Funcionario {
  id: string;
  nome: string;
  categoria: Categoria;
  ativo: boolean;
}

// Day Exception (specific shift for a specific day)
export interface ExcecaoDia {
  data: string; // YYYY-MM-DD
  turno: Turno;
}

// Absence Record
export interface Ausencia {
  id: string;
  funcionarioId: string;
  motivo: MotivoAusencia;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  turnoPadrao: Turno;
  excecoesPorDia: ExcecaoDia[];
  observacao?: string;
}

// Computed absence info for a specific day
export interface AusenciaDia {
  funcionario: Funcionario;
  ausencia: Ausencia;
  turno: Turno;
  data: string;
}

// Staff availability count
export interface EfetivoDisponivel {
  graduados: {
    disponivel: number;
    total: number;
  };
  soldados: {
    disponivel: number;
    total: number;
  };
}

// Filter options for consultation
export interface FiltroConsulta {
  nome?: string;
  categoria?: Categoria | 'TODOS';
  motivo?: MotivoAusencia | 'TODOS';
  dataInicio?: string;
  dataFim?: string;
}
