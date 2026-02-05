import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Funcionario, Ausencia, User } from '@/types';

interface EfetivoDBSchema extends DBSchema {
  funcionarios: {
    key: string;
    value: Funcionario;
    indexes: { 
      'by-categoria': string; 
      'by-nome': string; 
      'by-graduacao': string;
      'by-ordem': number;
    };
  };
  ausencias: {
    key: string;
    value: Ausencia;
    indexes: { 'by-funcionario': string; 'by-data': string };
  };
  users: {
    key: string;
    value: User;
    indexes: { 'by-email': string };
  };
}

const DB_NAME = 'efetivo-db';
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<EfetivoDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<EfetivoDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<EfetivoDBSchema>(DB_NAME, DB_VERSION, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      // Funcionarios store
      if (!db.objectStoreNames.contains('funcionarios')) {
        const funcionarioStore = db.createObjectStore('funcionarios', { keyPath: 'id' });
        funcionarioStore.createIndex('by-categoria', 'categoria');
        funcionarioStore.createIndex('by-nome', 'nome');
        funcionarioStore.createIndex('by-graduacao', 'graduacao');
        funcionarioStore.createIndex('by-ordem', 'ordemAntiguidade');
      }

      // Ausencias store
      if (!db.objectStoreNames.contains('ausencias')) {
        const ausenciaStore = db.createObjectStore('ausencias', { keyPath: 'id' });
        ausenciaStore.createIndex('by-funcionario', 'funcionarioId');
        ausenciaStore.createIndex('by-data', 'dataInicio');
      }

      // Users store
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-email', 'email');
      }

      // Migration from v2 to v3: Clear old data and insert real personnel
      if (oldVersion < 3 && oldVersion > 0) {
        console.log('Migrating to v3: Replacing demo data with real personnel');
        
        // Clear old funcionarios and ausencias
        const funcionariosStore = transaction.objectStore('funcionarios');
        const ausenciasStore = transaction.objectStore('ausencias');
        
        await funcionariosStore.clear();
        await ausenciasStore.clear();
        
        // Insert will happen after upgrade completes
      }
    },
  });

  // Always check if we need to initialize data (v3 migration or first install)
  const funcionarioCount = await dbInstance.count('funcionarios');
  if (funcionarioCount === 0) {
    await initializeDemoData(dbInstance);
  }

  return dbInstance;
}

async function initializeDemoData(db: IDBPDatabase<EfetivoDBSchema>) {
  // Demo users - 2S ANGÉLICA é encarregada
  const users: User[] = [
    { id: '1', nome: '2S ANGÉLICA', email: 'angelica@sistema.com', role: 'ENCARREGADO' },
    { id: '2', nome: 'Visualizador', email: 'user@sistema.com', role: 'FUNCIONARIO' },
  ];

  // Real military personnel with ranks and seniority order
  const funcionarios: Funcionario[] = [
    { id: 'f1', nome: 'ANGÉLICA', graduacao: '2S', categoria: 'GRADUADO', ordemAntiguidade: 1, ativo: true },
    { id: 'f2', nome: 'JÉSSICA LOZASSO', graduacao: '2S', categoria: 'GRADUADO', ordemAntiguidade: 2, ativo: true },
    { id: 'f3', nome: 'STILIS', graduacao: '3S', categoria: 'GRADUADO', ordemAntiguidade: 3, ativo: true },
    { id: 'f4', nome: 'HIPÓLITO', graduacao: '3S', categoria: 'GRADUADO', ordemAntiguidade: 4, ativo: true },
    { id: 'f5', nome: 'NICOLY', graduacao: '3S', categoria: 'GRADUADO', ordemAntiguidade: 5, ativo: true },
    { id: 'f6', nome: 'BARRETO', graduacao: '3S', categoria: 'GRADUADO', ordemAntiguidade: 6, ativo: true },
    { id: 'f7', nome: 'ROCHA', graduacao: 'S1', categoria: 'CABO_SOLDADO', ordemAntiguidade: 7, ativo: true },
    { id: 'f8', nome: 'BASSE', graduacao: 'S1', categoria: 'CABO_SOLDADO', ordemAntiguidade: 8, ativo: true },
    { id: 'f9', nome: 'GOMES', graduacao: 'S1', categoria: 'CABO_SOLDADO', ordemAntiguidade: 9, ativo: true },
    { id: 'f10', nome: 'LOURES', graduacao: 'S2', categoria: 'CABO_SOLDADO', ordemAntiguidade: 10, ativo: true },
    { id: 'f11', nome: 'EDUARDO SILVA', graduacao: 'S2', categoria: 'CABO_SOLDADO', ordemAntiguidade: 11, ativo: true },
  ];

  // Demo absences (relative to today)
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const in3Days = new Date(today);
  in3Days.setDate(in3Days.getDate() + 3);
  
  const in5Days = new Date(today);
  in5Days.setDate(in5Days.getDate() + 5);

  const ausencias: Ausencia[] = [
    {
      id: 'a1',
      funcionarioId: 'f1', // ANGÉLICA
      motivo: 'Férias',
      dataInicio: formatDate(today),
      dataFim: formatDate(in5Days),
      turnoPadrao: 'INTEGRAL',
      excecoesPorDia: [],
      observacao: 'Férias programadas',
    },
    {
      id: 'a2',
      funcionarioId: 'f7', // ROCHA
      motivo: 'Dispensa Médica',
      dataInicio: formatDate(today),
      dataFim: formatDate(today),
      turnoPadrao: 'MATUTINO',
      excecoesPorDia: [],
    },
    {
      id: 'a3',
      funcionarioId: 'f10', // LOURES
      motivo: 'Missão',
      dataInicio: formatDate(tomorrow),
      dataFim: formatDate(in3Days),
      turnoPadrao: 'INTEGRAL',
      excecoesPorDia: [
        { data: formatDate(in3Days), turno: 'MATUTINO' }
      ],
    },
    {
      id: 'a4',
      funcionarioId: 'f3', // STILIS
      motivo: 'Comissão',
      dataInicio: formatDate(tomorrow),
      dataFim: formatDate(tomorrow),
      turnoPadrao: 'VESPERTINO',
      excecoesPorDia: [],
    },
  ];

  // Insert demo data
  const tx = db.transaction(['users', 'funcionarios', 'ausencias'], 'readwrite');
  
  for (const user of users) {
    await tx.objectStore('users').put(user);
  }
  
  for (const funcionario of funcionarios) {
    await tx.objectStore('funcionarios').put(funcionario);
  }
  
  for (const ausencia of ausencias) {
    await tx.objectStore('ausencias').put(ausencia);
  }
  
  await tx.done;
}

// Funcionarios CRUD
export async function getAllFuncionarios(): Promise<Funcionario[]> {
  const db = await getDB();
  return db.getAll('funcionarios');
}

export async function getFuncionarioById(id: string): Promise<Funcionario | undefined> {
  const db = await getDB();
  return db.get('funcionarios', id);
}

export async function saveFuncionario(funcionario: Funcionario): Promise<void> {
  const db = await getDB();
  await db.put('funcionarios', funcionario);
}

export async function deleteFuncionario(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('funcionarios', id);
}

// Ausencias CRUD
export async function getAllAusencias(): Promise<Ausencia[]> {
  const db = await getDB();
  return db.getAll('ausencias');
}

export async function getAusenciaById(id: string): Promise<Ausencia | undefined> {
  const db = await getDB();
  return db.get('ausencias', id);
}

export async function saveAusencia(ausencia: Ausencia): Promise<void> {
  const db = await getDB();
  await db.put('ausencias', ausencia);
}

export async function deleteAusencia(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('ausencias', id);
}

// Users
export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDB();
  const index = db.transaction('users').store.index('by-email');
  return index.get(email);
}

export async function getAllUsers(): Promise<User[]> {
  const db = await getDB();
  return db.getAll('users');
}

export async function saveUser(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

// Export/Import for backup
export async function exportData(): Promise<string> {
  const db = await getDB();
  const data = {
    funcionarios: await db.getAll('funcionarios'),
    ausencias: await db.getAll('ausencias'),
    users: await db.getAll('users'),
    exportDate: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  const db = await getDB();
  
  const tx = db.transaction(['funcionarios', 'ausencias', 'users'], 'readwrite');
  
  // Clear existing data
  await tx.objectStore('funcionarios').clear();
  await tx.objectStore('ausencias').clear();
  await tx.objectStore('users').clear();
  
  // Import new data
  for (const funcionario of data.funcionarios || []) {
    await tx.objectStore('funcionarios').put(funcionario);
  }
  
  for (const ausencia of data.ausencias || []) {
    await tx.objectStore('ausencias').put(ausencia);
  }
  
  for (const user of data.users || []) {
    await tx.objectStore('users').put(user);
  }
  
  await tx.done;
}
