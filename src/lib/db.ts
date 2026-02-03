import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Funcionario, Ausencia, User } from '@/types';

interface EfetivoDBSchema extends DBSchema {
  funcionarios: {
    key: string;
    value: Funcionario;
    indexes: { 'by-categoria': string; 'by-nome': string };
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
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<EfetivoDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<EfetivoDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<EfetivoDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Funcionarios store
      if (!db.objectStoreNames.contains('funcionarios')) {
        const funcionarioStore = db.createObjectStore('funcionarios', { keyPath: 'id' });
        funcionarioStore.createIndex('by-categoria', 'categoria');
        funcionarioStore.createIndex('by-nome', 'nome');
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
    },
  });

  // Initialize with demo data if empty
  const funcionarioCount = await dbInstance.count('funcionarios');
  if (funcionarioCount === 0) {
    await initializeDemoData(dbInstance);
  }

  return dbInstance;
}

async function initializeDemoData(db: IDBPDatabase<EfetivoDBSchema>) {
  // Demo users
  const users: User[] = [
    { id: '1', nome: 'Administrador', email: 'admin@sistema.com', role: 'ENCARREGADO' },
    { id: '2', nome: 'Visualizador', email: 'user@sistema.com', role: 'FUNCIONARIO' },
  ];

  // Demo employees
  const funcionarios: Funcionario[] = [
    { id: 'f1', nome: 'Sgt Silva', categoria: 'GRADUADO', ativo: true },
    { id: 'f2', nome: 'Cb Santos', categoria: 'GRADUADO', ativo: true },
    { id: 'f3', nome: 'Sd Oliveira', categoria: 'SOLDADO', ativo: true },
    { id: 'f4', nome: 'Sd Pereira', categoria: 'SOLDADO', ativo: true },
    { id: 'f5', nome: 'Sd Costa', categoria: 'SOLDADO', ativo: true },
    { id: 'f6', nome: 'Cb Almeida', categoria: 'GRADUADO', ativo: true },
    { id: 'f7', nome: 'Sd Rodrigues', categoria: 'SOLDADO', ativo: true },
    { id: 'f8', nome: 'Sd Ferreira', categoria: 'SOLDADO', ativo: true },
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
      funcionarioId: 'f1',
      motivo: 'Férias',
      dataInicio: formatDate(today),
      dataFim: formatDate(in5Days),
      turnoPadrao: 'INTEGRAL',
      excecoesPorDia: [],
      observacao: 'Férias programadas',
    },
    {
      id: 'a2',
      funcionarioId: 'f3',
      motivo: 'Dispensa Médica',
      dataInicio: formatDate(today),
      dataFim: formatDate(today),
      turnoPadrao: 'MATUTINO',
      excecoesPorDia: [],
    },
    {
      id: 'a3',
      funcionarioId: 'f4',
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
      funcionarioId: 'f6',
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
