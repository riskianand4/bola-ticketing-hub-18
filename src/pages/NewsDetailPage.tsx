import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Share2, Heart, Copy, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewsDetailPage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [likes, setLikes] = useState(0);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select(`
          *,
          profiles:author_id(full_name)
        `)
        .eq('id', id)
        .eq('published', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching article:', error);
        toast.error('Gagal memuat artikel');
        return;
      }

      if (!data) {
        toast.error('Artikel tidak ditemukan');
        return;
      }

      setArticle(data);
      setLikes(100); // Default likes count since news table doesn't have likes column
    } catch (error) {
      console.error('Error fetching article:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = (platform: string) => {
    const currentUrl = window.location.href;
    const title = article?.title || '';
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + currentUrl)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(currentUrl);
        toast.success("Link disalin! Paste di Instagram Story atau Bio");
        break;
      case 'copy':
        navigator.clipboard.writeText(currentUrl);
        toast.success("Link berhasil disalin!");
        break;
    }
    setShowSharePopup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/news">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Berita
              </Button>
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="aspect-video w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link to="/news">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Berita
              </Button>
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Artikel Tidak Ditemukan</h1>
            <p className="text-muted-foreground mb-6">
              Artikel yang Anda cari tidak tersedia atau telah dihapus.
            </p>
            <Link to="/news">
              <Button>Kembali ke Halaman Berita</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/news">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Berita
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{article.category || 'Berita'}</Badge>
              <span className="text-sm text-muted-foreground">
                {new Date(article.published_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {article.profiles?.full_name || 'Admin'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {Math.ceil((article.content?.length || 0) / 200)} min baca
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={`gap-2 ${isLiked ? 'text-red-600 border-red-600 bg-red-50 hover:bg-red-100' : ''}`} 
                  onClick={handleLike}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-600' : ''}`} />
                  {likes}
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2" 
                    onClick={() => setShowSharePopup(!showSharePopup)}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  {showSharePopup && (
                    <div className="absolute top-full right-0 mt-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px] z-50 bg-background">
                      <div className="space-y-2">
                        <button 
                          onClick={() => handleShare('whatsapp')} 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          WhatsApp
                        </button>
                        <button 
                          onClick={() => handleShare('instagram')} 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                        >
                          <div className="h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm"></div>
                          Instagram
                        </button>
                        <button 
                          onClick={() => handleShare('copy')} 
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                        >
                          <Copy className="h-4 w-4 text-muted-foreground" />
                          Salin Tautan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
              <img 
                src={article.featured_image} 
                alt={article.title} 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <div className="bg-muted/50 rounded-lg p-6 mb-8">
              <p className="text-lg italic text-muted-foreground leading-relaxed">
                {article.excerpt}
              </p>
            </div>
          )}

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-primary prose-ul:text-foreground prose-ol:text-foreground prose-blockquote:text-foreground prose-a:text-primary" 
                dangerouslySetInnerHTML={{
                  __html: article.content || '<p>Konten artikel tidak tersedia.</p>'
                }} 
              />
            </CardContent>
          </Card>

          {/* Author Info */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {article.profiles?.full_name || 'Admin'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Penulis artikel
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}