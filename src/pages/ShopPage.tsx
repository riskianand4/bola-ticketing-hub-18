import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, ShoppingCart, Star, Heart, Package } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { EmptyStateCard } from "@/components/EmptyStateCard";

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('shop-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'merchandise' },
        () => fetchProducts()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'merchandise_categories' },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('merchandise_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
      } else {
        const allCategories = [
          { id: "all", name: "Semua Produk" },
          ...(data || [])
        ];
        setCategories(allCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('merchandise')
        .select(`
          *,
          merchandise_categories(name)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const addToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url || "/placeholder.svg"
      });
      toast.success("Produk ditambahkan ke keranjang!", {
        description: "Lihat keranjang belanja Anda"
      });
    }
  };

  const toggleWishlist = (productId: string) => {
    toast.success("Ditambahkan ke wishlist", {
      description: "Produk disimpan untuk nanti"
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "newest":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  return (
    <div className="min-h-screen bg-background pt-14 sm:pt-16 md:pt-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4 px-2">
            Persiraja Official Store
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg px-4">
            Koleksi merchandise resmi Persiraja Banda Aceh
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 sm:h-10 text-base sm:text-sm"
            />
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Terbaru</SelectItem>
                <SelectItem value="price-low">Harga: Rendah ke Tinggi</SelectItem>
                <SelectItem value="price-high">Harga: Tinggi ke Rendah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Pills - Horizontal scroll on mobile */}
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9 flex-shrink-0"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {sortedProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {/* Product Image */}
                <div className="relative overflow-hidden bg-muted aspect-square">
                  <img 
                    src={product.image_url || "/placeholder.svg"} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Badges */}
                  {new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
                    <Badge className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-primary text-xs px-1.5 sm:px-2">
                      Baru
                    </Badge>
                  )}
                  
                  {product.stock_quantity === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Badge variant="destructive" className="text-xs">
                        Stok Habis
                      </Badge>
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 h-7 w-7 sm:h-8 sm:w-8 p-0 bg-white/90 hover:bg-white shadow-sm"
                    onClick={() => toggleWishlist(product.id)}
                  >
                    <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>

                {/* Product Info */}
                <div className="p-2.5 sm:p-3 lg:p-4 space-y-2">
                  {/* Product Name */}
                  <h3 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[2.8rem]">
                    {product.name}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2  sm:block">
                    {product.description}
                  </p>

                  <div className=" sm:flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                      {product.merchandise_categories?.name || 'Produk'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary text-sm sm:text-base">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Stok: {product.stock_quantity} item
                  </div>

                  <Button 
                    className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium" 
                    size="sm"
                    disabled={product.stock_quantity === 0}
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="sm:hidden">
                      {product.stock_quantity > 0 ? "Beli" : "Habis"}
                    </span>
                    <span className="hidden sm:inline">
                      {product.stock_quantity > 0 ? "Tambah ke Keranjang" : "Stok Habis"}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {sortedProducts.length === 0 && (
          <div className="col-span-full">
            <EmptyStateCard
              icon={Package}
              title={searchQuery || selectedCategory !== "all" ? "Tidak ada produk ditemukan" : "Belum ada produk tersedia"}
              description={
                searchQuery || selectedCategory !== "all" 
                  ? "Coba ubah filter pencarian atau kata kunci Anda" 
                  : "Admin sedang menyiapkan produk-produk menarik untuk Anda. Silakan cek lagi nanti!"
              }
              actionLabel={searchQuery || selectedCategory !== "all" ? "Reset Filter" : undefined}
              onAction={
                searchQuery || selectedCategory !== "all" 
                  ? () => {
                      setSearchQuery(""); 
                      setSelectedCategory("all");
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}