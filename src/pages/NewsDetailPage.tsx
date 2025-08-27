import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User, Share2, Heart, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
export default function NewsDetailPage() {
  const {
    id
  } = useParams();
  const [isLiked, setIsLiked] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [likes, setLikes] = useState(1205);

  // Mock article data - in real app, fetch based on ID
  const article = {
    id: parseInt(id || "1"),
    title: "Timnas Indonesia Lolos ke Semifinal Piala AFF 2024",
    content: `
      <div class="space-y-6">
        <p class="text-base leading-relaxed text-justify mb-6">
          <strong class="font-bold text-red-600">JAKARTA</strong> - Timnas Indonesia berhasil mengalahkan Thailand dengan skor 2-1 dalam pertandingan dramatis yang berlangsung di Stadion Gelora Bung Karno, Kamis (14/12) malam. Kemenangan ini memastikan Garuda Muda lolos ke semifinal Piala AFF 2024. Laga berjalan sengit sejak peluit pertama dengan Thailand unggul lebih dulu melalui gol Teerasil Dangda di menit ke-23. Namun, timnas Indonesia tidak pantang menyerah dan mampu menyamakan kedudukan melalui gol <strong class="font-bold text-red-600">Witan Sulaeman</strong> di menit ke-56.
        </p>
        
        <p class="text-base leading-relaxed text-justify mb-6">
          Drama sesungguhnya terjadi di menit-menit akhir ketika pertandingan sepertinya akan berakhir imbang. <strong class="font-bold text-red-600">Egy Maulana Vikri</strong> tampil sebagai pahlawan dengan mencetak gol kemenangan di menit ke-89 setelah memanfaatkan umpan silang dari Pratama Arhan. "Ini adalah kemenangan yang sangat penting bagi kami. Para pemain telah menunjukkan fighting spirit yang luar biasa," ujar pelatih Shin Tae-yong dalam konferensi pers pasca pertandingan.
        </p>
        
        <p class="text-base leading-relaxed text-justify mb-6">
          Dengan kemenangan ini, Indonesia akan menghadapi Vietnam di semifinal yang dijadwalkan berlangsung pada 18 Desember mendatang. Pertandingan akan kembali digelar di Stadion Gelora Bung Karno dengan dukungan penuh Jakmania. Statistik pertandingan menunjukkan Indonesia unggul dalam penguasaan bola dengan 58% possession, sementara Thailand 42%. Dari segi tembakan, Indonesia melepaskan 12 tembakan dengan 5 di antaranya tepat sasaran, sementara Thailand 8 tembakan dengan 3 tepat sasaran.
        </p>
      </div>
    `,
    image: "/placeholder.svg",
    category: "Timnas",
    date: "14 Desember 2024",
    author: "Ahmad Rizki",
    readTime: "3 min",
    publishedAt: "2 jam lalu",
    tags: ["Timnas Indonesia", "Piala AFF", "Thailand", "Semifinal"],
    views: "12,543",
    likes: likes,
    comments: 89
  };
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };
  const handleShare = (platform: string) => {
    const currentUrl = window.location.href;
    const title = article.title;
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(title + ' ' + currentUrl)}`, '_blank');
        break;
      case 'instagram':
        // Instagram doesn't have direct share URL, so we'll copy to clipboard
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
  return <div className="min-h-screen bg-background">
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
              <Badge variant="secondary">{article.category}</Badge>
              <span className="text-sm text-muted-foreground">{article.publishedAt}</span>
            </div>
            
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{article.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{article.readTime}</span>
                </div>
                <span className="text-sm text-muted-foreground">{article.views} views</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className={`gap-2 ${isLiked ? 'text-red-600 border-red-600 bg-red-50 hover:bg-red-100' : ''}`} onClick={handleLike}>
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-600' : ''}`} />
                  {article.likes}
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowSharePopup(!showSharePopup)}>
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  {showSharePopup && <div className="absolute top-full right-0 mt-2 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[200px] z-50 bg-zinc-900">
                      <div className="space-y-2">
                        <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          WhatsApp
                        </button>
                        <button onClick={() => handleShare('instagram')} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <div className="h-4 w-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-sm"></div>
                          Instagram
                        </button>
                        <button onClick={() => handleShare('copy')} className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors">
                          <Copy className="h-4 w-4 text-gray-600" />
                          Salin Tautan
                        </button>
                      </div>
                    </div>}
                </div>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="aspect-video bg-muted rounded-lg mb-8 overflow-hidden">
            <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          </div>

          {/* Article Content */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-red-600 prose-ul:text-foreground prose-ol:text-foreground prose-blockquote:text-foreground prose-a:text-primary" 
                dangerouslySetInnerHTML={{
                  __html: article.content
                }} 
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <div className="mb-8">
            <h3 className="font-semibold mb-3">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>)}
            </div>
          </div>

          {/* Related Articles */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">Berita Terkait</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                    <img src="/placeholder.svg" alt="Related" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      Analisis: Strategi Shin Tae-yong di Piala AFF
                    </h4>
                    <p className="text-xs text-muted-foreground">4 jam lalu</p>
                  </div>
                </div>
                
                <div className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                    <img src="/placeholder.svg" alt="Related" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      Jadwal Semifinal Piala AFF 2024
                    </h4>
                    <p className="text-xs text-muted-foreground">6 jam lalu</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
}