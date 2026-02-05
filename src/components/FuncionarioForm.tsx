import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { Funcionario, Graduacao, GRADUACAO_HIERARCHY, getCategoriaByGraduacao } from '@/types';

interface FuncionarioFormProps {
  funcionario?: Funcionario | null;
  onClose: () => void;
}

export function FuncionarioForm({ funcionario, onClose }: FuncionarioFormProps) {
  const { addFuncionario, updateFuncionario, funcionarios } = useData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: funcionario?.nome || '',
    graduacao: funcionario?.graduacao || '2S' as Graduacao,
    ativo: funcionario?.ativo ?? true,
  });
  const [error, setError] = useState('');

  const isEditing = !!funcionario;

  // Auto-calculate next ordem antiguidade
  const getNextOrdemAntiguidade = (): number => {
    if (funcionarios.length === 0) return 1;
    const maxOrdem = Math.max(...funcionarios.map(f => f.ordemAntiguidade));
    return maxOrdem + 1;
  };

  // Sort existing personnel by seniority for dropdown
  const getAvailablePersonnel = () => {
    return [...funcionarios]
      .filter(f => !isEditing || f.id !== funcionario?.id) // Exclude current if editing
      .sort((a, b) => {
        // Sort by graduacao first
        const ordemA = GRADUACAO_HIERARCHY[a.graduacao].ordem;
        const ordemB = GRADUACAO_HIERARCHY[b.graduacao].ordem;
        if (ordemA !== ordemB) return ordemA - ordemB;
        
        // Then by seniority order
        return a.ordemAntiguidade - b.ordemAntiguidade;
      });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    // Check for duplicates
    const duplicateExists = funcionarios.some(
      f => f.nome.toLowerCase() === formData.nome.trim().toLowerCase() && 
      (!isEditing || f.id !== funcionario?.id)
    );

    if (duplicateExists) {
      setError('Já existe um militar com este nome');
      return;
    }

    setIsSubmitting(true);
    try {
      const categoria = getCategoriaByGraduacao(formData.graduacao);
      
      if (isEditing && funcionario) {
        await updateFuncionario({
          ...funcionario,
          nome: formData.nome.trim(),
          graduacao: formData.graduacao,
          categoria,
          ativo: formData.ativo,
        });
      } else {
        await addFuncionario({
          nome: formData.nome.trim(),
          graduacao: formData.graduacao,
          categoria,
          ordemAntiguidade: getNextOrdemAntiguidade(),
          ativo: formData.ativo,
        });
      }
      onClose();
    } catch (err) {
      setError('Erro ao salvar militar');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get all graduacao options ordered by seniority
  const graduacaoOptions = Object.entries(GRADUACAO_HIERARCHY)
    .sort(([, a], [, b]) => a.ordem - b.ordem)
    .map(([key, value]) => ({
      value: key as Graduacao,
      label: value.label,
    }));

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Militar' : 'Novo Militar'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              placeholder="Ex: SILVA"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduacao">Graduação *</Label>
            <Select
              value={formData.graduacao}
              onValueChange={(value) => setFormData(prev => ({ ...prev, graduacao: value as Graduacao }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {graduacaoOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Categoria: {getCategoriaByGraduacao(formData.graduacao) === 'GRADUADO' ? 'Graduado' : 'Cabo/Soldado'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Ativo</Label>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                isEditing ? 'Salvar' : 'Adicionar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
