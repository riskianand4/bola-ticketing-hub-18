import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Newspaper, Edit, Plus, Trash2, Eye, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

  useEffect(() => {
    fetchArticles();
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

      <div className="space-y-4">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                    <h3 className="text-sm md:text-lg font-semibold">{article.title}</h3>
                    {article.published ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 text-xs w-fit">
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs w-fit">
                        Draft
                      </Badge>
                    )}
                  </div>
                  
                  {article.excerpt && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">{article.excerpt}</p>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dibuat: {format(new Date(article.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    {article.published_at && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Diterbitkan: {format(new Date(article.published_at), 'dd MMM yyyy', { locale: id })}
                      </div>
                    )}
                    <div>
                      Slug: /{article.slug}
                    </div>
                  </div>

                  {article.featured_image && (
                    <div className="mt-3">
                      <img 
                        src={article.featured_image} 
                        alt={article.title}
                        className="w-32 h-20 object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(article)}
                    className="h-7 w-7 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => togglePublished(article.id, article.published)}
                    className={`h-7 w-7 p-0 ${article.published ? 'text-yellow-600' : 'text-green-600'}`}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(article.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada berita</h3>
          <p className="text-muted-foreground mb-4">
            Mulai dengan menambahkan berita pertama
          </p>
        </div>
      )}
    </div>
  );
};