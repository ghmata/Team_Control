import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Smartphone, Share2, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Install() {
  const [isIOS] = useState(() => /iPad|iPhone|iPod/.test(navigator.userAgent));
  const [isAndroid] = useState(() => /Android/.test(navigator.userAgent));
  const [isStandalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches);

  if (isStandalone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            App Instalado!
          </h1>
          <p className="text-muted-foreground">
            Você já está usando o aplicativo instalado.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Smartphone className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Instalar Aplicativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isIOS ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Para instalar no iPhone/iPad:
                </p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      1
                    </span>
                    <span className="text-foreground">
                      Toque no botão <Share2 className="h-4 w-4 inline" /> Compartilhar na barra do Safari
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      2
                    </span>
                    <span className="text-foreground">
                      Role para baixo e toque em "Adicionar à Tela de Início"
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      3
                    </span>
                    <span className="text-foreground">
                      Toque em "Adicionar" no canto superior direito
                    </span>
                  </li>
                </ol>
              </div>
            ) : isAndroid ? (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Para instalar no Android:
                </p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      1
                    </span>
                    <span className="text-foreground">
                      Toque no menu (⋮) do Chrome
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      2
                    </span>
                    <span className="text-foreground">
                      Toque em "Instalar aplicativo" ou "Adicionar à tela inicial"
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      3
                    </span>
                    <span className="text-foreground">
                      Confirme a instalação
                    </span>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center">
                  Para instalar no computador:
                </p>
                <ol className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      1
                    </span>
                    <span className="text-foreground">
                      Clique no ícone de instalação na barra de endereço (⊕)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      2
                    </span>
                    <span className="text-foreground">
                      Clique em "Instalar"
                    </span>
                  </li>
                </ol>
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Após instalar, o aplicativo funcionará offline e terá acesso rápido pela tela inicial do seu dispositivo.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
