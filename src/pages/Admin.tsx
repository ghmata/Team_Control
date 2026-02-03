import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryBadge, ShiftBadge } from '@/components/Badges';
import { Funcionario, Ausencia } from '@/types';
import { FuncionarioForm } from '@/components/FuncionarioForm';
import { AusenciaForm } from '@/components/AusenciaForm';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { isEncarregado } = useAuth();
  const { funcionarios, ausencias, deleteFuncionario, deleteAusencia, isLoading } = useData();
  
  const [activeTab, setActiveTab] = useState('ausencias');
  const [showFuncionarioForm, setShowFuncionarioForm] = useState(false);
  const [showAusenciaForm, setShowAusenciaForm] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [editingAusencia, setEditingAusencia] = useState<Ausencia | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'funcionario' | 'ausencia'; id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Protect route
  if (!isEncarregado) {
    return <Navigate to="/" replace />;
  }

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setShowFuncionarioForm(true);
  };

  const handleEditAusencia = (ausencia: Ausencia) => {
    setEditingAusencia(ausencia);
    setShowAusenciaForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    setIsDeleting(true);
    try {
      if (deleteConfirm.type === 'funcionario') {
        await deleteFuncionario(deleteConfirm.id);
      } else {
        await deleteAusencia(deleteConfirm.id);
      }
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const closeFuncionarioForm = () => {
    setShowFuncionarioForm(false);
    setEditingFuncionario(null);
  };

  const closeAusenciaForm = () => {
    setShowAusenciaForm(false);
    setEditingAusencia(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">
          Gerenciar funcionários e ausências
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="ausencias" className="gap-2">
            <Calendar className="h-4 w-4" />
            Ausências
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
        </TabsList>

        {/* Ausências Tab */}
        <TabsContent value="ausencias" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {ausencias.length} ausência{ausencias.length !== 1 ? 's' : ''} cadastrada{ausencias.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={() => setShowAusenciaForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Ausência
            </Button>
          </div>

          {ausencias.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma ausência cadastrada
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ausencias.map((ausencia) => {
                const funcionario = funcionarios.find(f => f.id === ausencia.funcionarioId);
                if (!funcionario) return null;

                return (
                  <AusenciaAdminCard
                    key={ausencia.id}
                    ausencia={ausencia}
                    funcionario={funcionario}
                    onEdit={() => handleEditAusencia(ausencia)}
                    onDelete={() => setDeleteConfirm({
                      type: 'ausencia',
                      id: ausencia.id,
                      name: `ausência de ${funcionario.nome}`
                    })}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Funcionários Tab */}
        <TabsContent value="funcionarios" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {funcionarios.length} funcionário{funcionarios.length !== 1 ? 's' : ''} cadastrado{funcionarios.length !== 1 ? 's' : ''}
            </p>
            <Button onClick={() => setShowFuncionarioForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Funcionário
            </Button>
          </div>

          {funcionarios.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhum funcionário cadastrado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {funcionarios.map((funcionario) => (
                <FuncionarioAdminCard
                  key={funcionario.id}
                  funcionario={funcionario}
                  onEdit={() => handleEditFuncionario(funcionario)}
                  onDelete={() => setDeleteConfirm({
                    type: 'funcionario',
                    id: funcionario.id,
                    name: funcionario.nome
                  })}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Funcionario Form Dialog */}
      <AnimatePresence>
        {showFuncionarioForm && (
          <FuncionarioForm
            funcionario={editingFuncionario}
            onClose={closeFuncionarioForm}
          />
        )}
      </AnimatePresence>

      {/* Ausencia Form Dialog */}
      <AnimatePresence>
        {showAusenciaForm && (
          <AusenciaForm
            ausencia={editingAusencia}
            onClose={closeAusenciaForm}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Confirmar exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {deleteConfirm?.name}?
              {deleteConfirm?.type === 'funcionario' && (
                <span className="block mt-2 text-destructive">
                  Todas as ausências relacionadas também serão excluídas.
                </span>
              )}
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FuncionarioAdminCardProps {
  funcionario: Funcionario;
  onEdit: () => void;
  onDelete: () => void;
}

function FuncionarioAdminCard({ funcionario, onEdit, onDelete }: FuncionarioAdminCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={!funcionario.ativo ? 'opacity-60' : ''}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-semibold text-foreground">{funcionario.nome}</p>
                <div className="flex items-center gap-2 mt-1">
                  <CategoryBadge categoria={funcionario.categoria} />
                  {!funcionario.ativo && (
                    <span className="text-xs text-muted-foreground">(Inativo)</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface AusenciaAdminCardProps {
  ausencia: Ausencia;
  funcionario: Funcionario;
  onEdit: () => void;
  onDelete: () => void;
}

function AusenciaAdminCard({ ausencia, funcionario, onEdit, onDelete }: AusenciaAdminCardProps) {
  const startDate = parseISO(ausencia.dataInicio);
  const endDate = parseISO(ausencia.dataFim);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-semibold text-foreground truncate">
                  {funcionario.nome}
                </span>
                <CategoryBadge categoria={funcionario.categoria} />
                <ShiftBadge turno={ausencia.turnoPadrao} />
              </div>
              <p className="text-sm text-muted-foreground">
                {ausencia.motivo}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(startDate, "dd/MM/yyyy", { locale: ptBR })} a {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                {ausencia.excecoesPorDia.length > 0 && (
                  <span className="ml-2 text-xs text-info">
                    ({ausencia.excecoesPorDia.length} exceç{ausencia.excecoesPorDia.length > 1 ? 'ões' : 'ão'})
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
