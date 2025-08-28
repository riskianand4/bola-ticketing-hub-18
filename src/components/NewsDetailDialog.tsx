import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Eye, User, Link } from 'lucide-react';

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
  category?: string;
}

interface NewsDetailDialogProps {
  article: NewsArticle | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewsDetailDialog = ({ article, isOpen, onOpenChange }: NewsDetailDialogProps) => {
  if (!article) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{article.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and metadata */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              {article.published ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  📢 Published
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-100 text-gray-700">
                  📝 Draft
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Dibuat: {format(new Date(article.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
            </div>
            
            {article.published_at && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                Diterbitkan: {format(new Date(article.published_at), 'dd MMM yyyy HH:mm', { locale: id })}
              </div>
            )}
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link className="h-4 w-4" />
              Slug: /{article.slug}
            </div>

            {article.category && (
              <Badge variant="outline" className="text-xs">
                {article.category}
              </Badge>
            )}
          </div>

          {/* Featured image */}
          {article.featured_image && (
            <div className="space-y-2">
              <h4 className="font-medium">Gambar Utama</h4>
              <img 
                src={article.featured_image} 
                alt={article.title}
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Excerpt */}
          {article.excerpt && (
            <div className="space-y-2">
              <h4 className="font-medium">Ringkasan</h4>
              <p className="text-muted-foreground p-3 bg-muted rounded-lg">
                {article.excerpt}
              </p>
            </div>
          )}

          {/* Content preview */}
          <div className="space-y-2">
            <h4 className="font-medium">Konten</h4>
            <div 
              className="prose prose-sm max-w-none p-4 border rounded-lg bg-background"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};