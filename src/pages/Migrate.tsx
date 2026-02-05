import { useState } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface BackupData {
  funcionarios: any[];
  ausencias: any[];
}

export default function Migrate() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ funcionarios: 0, ausencias: 0 });
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setMessage('');
    }
  };

  const handleMigrate = async () => {
    if (!file) return;

    setStatus('uploading');
    setMessage('Lendo arquivo...');

    try {
      const text = await file.text();
      const data: BackupData = JSON.parse(text);

      setMessage(`Encontrados ${data.funcionarios.length} funcionários e ${data.ausencias.length} ausências`);

      // Mapa de IDs antigos para novos
      const idMap = new Map<string, string>();

      // Migrar funcionários e criar mapa de IDs
      setMessage('Migrando funcionários...');
      for (let i = 0; i < data.funcionarios.length; i++) {
        const func = data.funcionarios[i];
        const { data: inserted, error } = await supabase.from('funcionarios')
          .insert({
            nome: func.nome,
            graduacao: func.graduacao,
            categoria: func.categoria,
            ordem_antiguidade: func.ordemAntiguidade,
            ativo: func.ativo,
          })
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir funcionário:', func.nome, error);
          throw new Error(`Falha ao inserir funcionário ${func.nome}: ${error.message}`);
        }

        if (inserted) {
          // Mapear ID antigo para novo UUID
          idMap.set(func.id, inserted.id);
        }
        
        setProgress(prev => ({ ...prev, funcionarios: i + 1 }));
      }

      // Migrar ausências usando os novos IDs
      setMessage('Migrando ausências...');
      for (let i = 0; i < data.ausencias.length; i++) {
        const aus = data.ausencias[i];
        const newFuncId = idMap.get(aus.funcionarioId);

        if (!newFuncId) {
          console.error('ID de funcionário não encontrado:', aus.funcionarioId);
          continue;
        }

        const { error } = await supabase.from('ausencias').insert({
          funcionario_id: newFuncId,
          motivo: aus.motivo,
          data_inicio: aus.dataInicio,
          data_fim: aus.dataFim,
          turno_padrao: aus.turnoPadrao,
          excecoes_por_dia: aus.excecoesPorDia || [],
          observacao: aus.observacao || null,
        });

        if (error) {
          console.error('Erro ao inserir ausência:', error);
          throw new Error(`Falha ao inserir ausência: ${error.message}`);
        }

        setProgress(prev => ({ ...prev, ausencias: i + 1 }));
      }

      setStatus('success');
      setMessage(`✅ Migração concluída! ${data.funcionarios.length} funcionários e ${data.ausencias.length} ausências importados.`);

      setTimeout(() => {
        navigate('/admin');
      }, 3000);

    } catch (error) {
      console.error('Erro na migração:', error);
      setStatus('error');
      setMessage(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Migração de Dados</CardTitle>
          <CardDescription>
            Importe os dados do IndexedDB local para o Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={status === 'uploading'}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {file ? file.name : 'Clique para selecionar o arquivo JSON'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Arquivo: dados-indexeddb-backup.json
                </p>
              </div>
            </label>
          </div>

          {/* Status */}
          {message && (
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              status === 'error' ? 'bg-destructive/10 text-destructive' :
              status === 'success' ? 'bg-green-500/10 text-green-700' :
              'bg-blue-500/10 text-blue-700'
            }`}>
              {status === 'uploading' && <Loader2 className="h-5 w-5 animate-spin mt-0.5" />}
              {status === 'success' && <CheckCircle className="h-5 w-5 mt-0.5" />}
              {status === 'error' && <AlertCircle className="h-5 w-5 mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">{message}</p>
                {status === 'uploading' && (
                  <div className="text-xs mt-2 space-y-1">
                    <p>Funcionários: {progress.funcionarios} migrados</p>
                    <p>Ausências: {progress.ausencias} migradas</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleMigrate}
              disabled={!file || status === 'uploading'}
              className="flex-1"
            >
              {status === 'uploading' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Migrando...
                </>
              ) : (
                'Migrar para Supabase'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              disabled={status === 'uploading'}
            >
              Cancelar
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
            <p className="font-medium">Instruções:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Selecione o arquivo JSON baixado</li>
              <li>Clique em "Migrar para Supabase"</li>
              <li>Aguarde a conclusão da migração</li>
              <li>Você será redirecionado para o Admin automaticamente</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
