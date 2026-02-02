import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { SearchBar } from '@/components/SearchBar';
import { ProblemCard } from '@/components/ProblemCard';
import { useSearchProblems } from '@/hooks/useProblems';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const { data: results, isLoading } = useSearchProblems(query);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    setSearchParams({ q: newQuery });
  };

  // Build URL for new topic with pre-filled data
  const getNewTopicUrl = () => {
    const params = new URLSearchParams();
    params.set('titulo', query);
    return `/comunidade/novo-topico?${params.toString()}`;
  };

  return (
    <Layout>
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Buscar soluções</h1>
        <SearchBar autoFocus onSearch={handleSearch} className="mb-8" />

        {query && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {isLoading ? (
                'Buscando...'
              ) : results && results.length > 0 ? (
                `${results.length} resultado${results.length > 1 ? 's' : ''} para "${query}"`
              ) : (
                `Nenhum resultado para "${query}"`
              )}
            </p>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-4">
                {results.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} showCategory />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {/* No results - recommend community */}
                <div className="max-w-md mx-auto bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6">
                  <div className="w-14 h-14 mx-auto mb-4 bg-purple-500 rounded-full flex items-center justify-center">
                    <Users className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Não encontramos uma solução pronta
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Pergunte na nossa comunidade! Outros usuários podem te ajudar a resolver:
                  </p>
                  <p className="text-foreground font-medium mb-6 px-4 py-2 bg-background/50 rounded-lg border border-border">
                    "{query}"
                  </p>
                  <Link to={getNewTopicUrl()}>
                    <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Perguntar na Comunidade
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-4">
                    A pergunta já vai preenchida para você 😉
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {!query && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Digite o problema que você quer resolver
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
