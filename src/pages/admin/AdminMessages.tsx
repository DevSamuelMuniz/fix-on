import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, MailOpen, Eye, Trash2, Search, CheckCheck } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read: boolean;
}

export default function AdminMessages() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ read })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('contact_messages')
        .update({ read: true })
        .eq('read', false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast({ title: 'Todas mensagens marcadas como lidas' });
    },
  });

  const openMessage = (msg: ContactMessage) => {
    setSelected(msg);
    if (!msg.read) {
      markAsReadMutation.mutate({ id: msg.id, read: true });
    }
  };

  const filtered = messages.filter((msg) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'unread' && !msg.read) ||
      (filter === 'read' && msg.read);
    const matchesSearch =
      !search ||
      msg.name.toLowerCase().includes(search.toLowerCase()) ||
      msg.email.toLowerCase().includes(search.toLowerCase()) ||
      msg.message.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <AdminLayout title="Mensagens de Contato">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{messages.length} mensagens</span>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full">
              {unreadCount} não lidas
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou mensagem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'unread', 'read'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Todas' : f === 'unread' ? 'Não lidas' : 'Lidas'}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Mail className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhuma mensagem encontrada</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg) => (
            <div
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={`
                group cursor-pointer rounded-xl border p-4 transition-all
                hover:border-primary/40 hover:shadow-sm
                ${msg.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'}
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 shrink-0 ${msg.read ? 'text-muted-foreground' : 'text-primary'}`}>
                    {msg.read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium text-sm ${msg.read ? 'text-foreground' : 'text-foreground font-semibold'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-muted-foreground">{msg.email}</span>
                      {!msg.read && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 rounded-full h-4">
                          Nova
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {msg.message}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(msg.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                  <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              Mensagem de {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Nome</p>
                  <p className="text-sm font-medium text-foreground">{selected.name}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {selected.email}
                  </a>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Recebida</p>
                <p className="text-sm text-foreground">
                  {new Date(selected.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Mensagem</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    markAsReadMutation.mutate({
                      id: selected.id,
                      read: !selected.read,
                    });
                    setSelected({ ...selected, read: !selected.read });
                  }}
                >
                  {selected.read ? (
                    <>
                      <Mail className="h-4 w-4 mr-1.5" />
                      Marcar como não lida
                    </>
                  ) : (
                    <>
                      <MailOpen className="h-4 w-4 mr-1.5" />
                      Marcar como lida
                    </>
                  )}
                </Button>
                <a href={`mailto:${selected.email}`} target="_blank" rel="noreferrer">
                  <Button size="sm">
                    Responder por email
                  </Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
