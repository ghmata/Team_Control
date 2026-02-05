// User Roles
export type UserRole = 'FUNCIONARIO' | 'ENCARREGADO';

// Military Ranks
export type Graduacao = 'SO' | '1S' | '2S' | '3S' | 'CB' | 'S1' | 'S2';

// Employee Categories
export type Categoria = 'GRADUADO' | 'CABO_SOLDADO';

// Rank Hierarchy and Categorization
export const GRADUACAO_HIERARCHY: Record<Graduacao, { ordem: number; categoria: Categoria; label: string }> = {
  'SO': { ordem: 1, categoria: 'GRADUADO', label: 'Suboficial' },
  '1S': { ordem: 2, categoria: 'GRADUADO', label: '1º Sargento' },
  '2S': { ordem: 3, categoria: 'GRADUADO', label: '2º Sargento' },
  '3S': { ordem: 4, categoria: 'GRADUADO', label: '3º Sargento' },
  'CB': { ordem: 5, categoria: 'CABO_SOLDADO', label: 'Cabo' },
  'S1': { ordem: 6, categoria: 'CABO_SOLDADO', label: 'Soldado de 1ª Classe' },
  'S2': { ordem: 7, categoria: 'CABO_SOLDADO', label: 'Soldado de 2ª Classe' },
};

// Helper function to get category by rank
export function getCategoriaByGraduacao(graduacao: Graduacao): Categoria {
  return GRADUACAO_HIERARCHY[graduacao].categoria;
}

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
  | 'Licença Núpcias'
  | 'Reunião';

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
  'Reunião',
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
  graduacao: Graduacao;
  categoria: Categoria;
  ordemAntiguidade: number; // Lower number = more seniority
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
    total: number;
    fora: number;
    disponivel: number;
  };
  cabosSoldados: {
    total: number;
    fora: number;
    disponivel: number;
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
// Validation Result
export interface ConflictingAbsence {
  funcionarioNome: string;
  funcionarioGraduacao: string;
  motivo: MotivoAusencia;
  dataInicio: string;
  dataFim: string;
}

export interface ValidationResult {
  error: string | null;
  warnings: string[];
  conflictingAbsences?: ConflictingAbsence[];
}
