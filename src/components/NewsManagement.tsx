import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Newspaper, 
  Edit, 
  Plus, 
  Trash2, 
  Eye, 
  Calendar, 
  Heart, 
  BarChart3, 
  Info,
  TrendingUp,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { NewsDetailDialog } from './NewsDetailDialog';
import { NewsStatisticsDialog } from './NewsStatisticsDialog';

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featured_image: string;
  published: boolean;
  published_at: string;
  author_id: string;
  created_at: string;
}

export const NewsManagement = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [newsStats, setNewsStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    featured_image: '',
    published: false
  });

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error: any) {
      console.error('Error fetching news:', error);
      toast.error('Gagal memuat data berita');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ensure user profile exists first
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id, 
          full_name: user.user_metadata?.full_name || user.email 
        }, { onConflict: 'user_id' });
      
      if (profileError) {
        console.error('Error ensuring profile exists:', profileError);
        toast.error('Error creating user profile');
        return;
      }

      const slug = formData.slug || generateSlug(formData.title);
      
      const articleData = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        slug,
        featured_image: formData.featured_image,
        published: formData.published,
        published_at: formData.published ? new Date().toISOString() : null,
        author_id: user.id
      };

      if (editingArticle) {
        const { error } = await supabase
          .from('news')
          .update(articleData)
          .eq('id', editingArticle.id);
        
        if (error) throw error;
        toast.success('Berita berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('news')
          .insert([articleData]);
        
        if (error) throw error;
        toast.success('Berita berhasil ditambahkan');
      }

      setIsDialogOpen(false);
      setEditingArticle(null);
      resetForm();
      fetchArticles();
    } catch (error: any) {
      console.error('Error saving article:', error);
      toast.error('Gagal menyimpan berita');
    }
  };

  const handleEdit = (article: NewsArticle) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      excerpt: article.excerpt || '',
      slug: article.slug,
      featured_image: article.featured_image || '',
      published: article.published
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus berita ini?')) return;
    
    try {
      const { error } = await supabase
        .from('news')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Berita berhasil dihapus');
      fetchArticles();
    } catch (error: any) {
      console.error('Error deleting article:', error);
      toast.error('Gagal menghapus berita');
    }
  };

  const togglePublished = async (id: string, currentStatus: boolean) => {
    try {
      const updateData = {
        published: !currentStatus,
        published_at: !currentStatus ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('news')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Berita ${!currentStatus ? 'dipublikasi' : 'dijadikan draft'}`);
      fetchArticles();
    } catch (error: any) {
      console.error('Error updating publish status:', error);
      toast.error('Gagal mengubah status publikasi');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      featured_image: '',
      published: false
    });
  };

  const handleTitleChange = (title: string) => {
    setFormData({ 
      ...formData, 
      title,
      slug: editingArticle ? formData.slug : generateSlug(title)
    });
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote'],
      ['link'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'blockquote',
    'link'
  ];

  const fetchNewsStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_news_statistics');

      if (error) throw error;
      
      setNewsStats(data || []);
    } catch (error: any) {
      console.error('Error fetching news stats:', error);
    }
  };

  useEffect(() => {
    fetchArticles();
    fetchNewsStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h2 className="text-xl md:text-3xl font-bold">Kelola Berita</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setEditingArticle(null); }}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingArticle ? 'Edit Berita' : 'Tambah Berita'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Judul Berita</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Judul berita"
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug URL</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="url-berita"
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Ringkasan</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Ringkasan singkat berita"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="featured_image">URL Gambar Utama</Label>
                <Input
                  id="featured_image"
                  type="url"
                  value={formData.featured_image}
                  onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label htmlFor="content">Konten Berita</Label>
                <div className="border rounded-md">
                  <ReactQuill
                    value={formData.content}
                    onChange={(value) => setFormData({ ...formData, content: value })}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Tulis konten berita di sini... Gunakan toolbar untuk formatting teks seperti bold, paragraf baru, dll."
                    style={{ minHeight: '200px' }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
                <Label htmlFor="published">Publikasi berita</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingArticle ? 'Perbarui' : 'Simpan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="articles" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="articles">Kelola Artikel</TabsTrigger>
          <TabsTrigger value="statistics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistik
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="articles" className="space-y-4">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Left side - Image and content */}
                  <div className="flex items-center gap-4 flex-1">
                    {/* Featured Image */}
                    {article.featured_image && (
                      <div className="flex-shrink-0">
                        <img 
                          src={article.featured_image} 
                          alt={article.title}
                          className="w-16 h-16 object-cover rounded-lg border"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold truncate">{article.title}</h3>
                        {article.published ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            📢 Live
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                            📝 Draft
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(article.created_at), 'dd MMM yyyy', { locale: id })}
                      </div>
                    </div>
                  </div>

                  {/* Right side - Actions */}
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedArticle(article);
                        setIsDetailDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Lihat Detail"
                    >
                      <Info className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedArticle(article);
                        setIsStatsDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                      title="Lihat Statistik"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(article)}
                      className="h-8 w-8 p-0"
                      title="Edit Artikel"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublished(article.id, article.published)}
                      className={`h-8 w-8 p-0 ${article.published ? 'text-yellow-600' : 'text-green-600'}`}
                      title={article.published ? 'Jadikan Draft' : 'Publikasikan'}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(article.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      title="Hapus Artikel"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {articles.length === 0 && (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada berita</h3>
              <p className="text-muted-foreground mb-4">
                Mulai dengan menambahkan berita pertama
              </p>
            </div>
          )}

          {/* Detail Dialog */}
          <NewsDetailDialog
            article={selectedArticle}
            isOpen={isDetailDialogOpen}
            onOpenChange={setIsDetailDialogOpen}
          />

          {/* Statistics Dialog */}
          <NewsStatisticsDialog
            article={selectedArticle}
            isOpen={isStatsDialogOpen}
            onOpenChange={setIsStatsDialogOpen}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Artikel
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{articles.length}</div>
                <p className="text-xs text-muted-foreground">
                  {articles.filter(n => n.published).length} diterbitkan
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newsStats.reduce((sum, stat) => sum + Number(stat.total_views || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seluruh artikel
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Likes
                </CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {newsStats.reduce((sum, stat) => sum + Number(stat.total_likes || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seluruh artikel
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Statistik per Artikel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsStats.length > 0 ? (
                  newsStats.map((stat, index) => (
                    <Card key={stat.news_id || index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-2">{stat.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {stat.total_views} views
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {stat.total_likes} likes
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(stat.created_at), 'dd MMM yyyy', { locale: id })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {stat.category || 'Berita'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const article = articles.find(a => a.id === stat.news_id);
                                if (article) {
                                  setSelectedArticle(article);
                                  setIsStatsDialogOpen(true);
                                }
                              }}
                              className="h-7 px-2"
                            >
                              <BarChart3 className="h-3 w-3 mr-1" />
                              Detail
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum ada statistik</h3>
                    <p className="text-muted-foreground">
                      Statistik akan muncul setelah artikel mulai mendapat interaksi
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};