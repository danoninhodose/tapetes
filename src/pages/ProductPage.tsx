import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Plus, Minus, Heart, Share2, Truck, Shield, RotateCcw, Zap } from 'lucide-react';
import { supabase, Product, Review, isSupabaseConfigured } from '../lib/supabase';
import { mockProducts, mockReviews } from '../lib/mockData';
import { useCart } from '../contexts/CartContext';

export const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (product) {
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorited(favorites.includes(product.id));
    }
  }, [product]);

  const handleFavorite = () => {
    if (!product) return;
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    let updated;
    if (favorites.includes(product.id)) {
      updated = favorites.filter((id: string) => id !== product.id);
      setIsFavorited(false);
    } else {
      updated = [...favorites, product.id];
      setIsFavorited(true);
    }
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleShare = () => {
    if (!product) return;
    const shareData = {
      title: product.name,
      text: product.description,
      url: window.location.href
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      window.prompt('Copie o link do produto:', window.location.href);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const fetchProduct = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Using mock product data.');
      const mockProduct = mockProducts.find(p => p.id === id);
      if (mockProduct) {
        setProduct(mockProduct);
      }
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured. Using mock reviews data.');
      const productReviews = mockReviews.filter(r => r.product_id === id);
      setReviews(productReviews);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      for (let i = 0; i < quantity; i++) {
        addToCart(product);
      }
      setQuantity(1);
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-skeleton w-32 h-32 rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="modern-card p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Produto não encontrado</h2>
          <p className="text-gray-600 mb-6">O produto que você está procurando não existe.</p>
          <button
            onClick={() => navigate('/products')}
            className="btn-primary"
          >
            Ver Todos os Produtos
          </button>
        </div>
      </div>
    );
  }

  // Simular múltiplas imagens para demonstração
  const productImages = [
    product.image_url,
    product.image_secondary_1,
    product.image_secondary_2
  ].filter(Boolean);

  return (
  <div className="min-h-screen bg-gray-50 pt-2 pb-4">
      <div className="modern-container">
        <div className="modern-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4">
            {/* Galeria de Imagens */}
            <div className="relative mx-auto my-2 w-full flex justify-center items-center" style={{ maxWidth: 400, height: 400 }}>
              {/* Seta esquerda: só aparece se não for a primeira imagem */}
              {selectedImage > 0 && (
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow"
                  onClick={() => setSelectedImage(selectedImage - 1)}
                  aria-label="Imagem anterior"
                  style={{ zIndex: 2 }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
              )}
              {/* Imagem principal centralizada, com border radius na imagem */}
              <img
                key={selectedImage}
                src={productImages[selectedImage]}
                alt={product.name}
                className="mx-auto rounded-2xl bg-white shadow transition-all duration-500 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg h-72 sm:h-80 md:h-96 object-contain"
              />
              {/* Seta direita: só aparece se não for a última imagem */}
              {selectedImage < productImages.length - 1 && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-70 rounded-full p-2 shadow"
                  onClick={() => setSelectedImage(selectedImage + 1)}
                  aria-label="Próxima imagem"
                  style={{ zIndex: 2 }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
            </div>

            {/* Detalhes do Produto */}
            <div className="space-y-8">
              {/* Cabeçalho */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 border border-green-200">Novo</span>
                  <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">Em Estoque</span>
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`star ${star <= averageRating ? 'filled' : 'empty'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {averageRating.toFixed(1)} ({reviews.length} avaliações)
                  </span>
                </div>

                <p className="modern-price-large mb-6">
                  R$ {product.price.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Descrição */}
              {/* Descrição movida para abaixo dos botões */}

              {/* Controle de Quantidade */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="filter-label mb-2">Quantidade:</label>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="quantity-btn"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="quantity-display text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                      className="quantity-btn"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{product.stock_quantity} unidades</span> disponíveis
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-4">
                <button
                  onClick={() => {
                    addToCart(product);
                    navigate('/checkout');
                  }}
                  className="btn-success w-full py-4 text-lg"
                >
                  Comprar Agora
                  <Zap className="h-5 w-5" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="btn-primary py-3"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Adicionar ao Carrinho
                  </button>
                  
                  <button className={`btn-secondary py-3 flex items-center gap-2 ${isFavorited ? 'text-red-500' : ''}`} onClick={handleFavorite}>
                    <Heart className={`h-5 w-5 ${isFavorited ? 'fill-red-500' : ''}`} />
                    {isFavorited ? 'Favoritado' : 'Favoritar'}
                  </button>
                </div>
                
                <button className="btn-outline w-full py-3">
                  <Share2 className="h-5 w-5" />
                  <span onClick={handleShare}>Compartilhar Produto</span>
                </button>
              </div>

              {/* Descrição abaixo dos botões */}
              <div className="bg-gray-50 rounded-lg p-6 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Descrição do Produto</h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Benefícios */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Truck className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800 text-sm">Frete Grátis</p>
                    <p className="text-xs text-green-600">Todo Brasil</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">Compra Segura</p>
                    <p className="text-xs text-blue-600">100% Protegida</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <RotateCcw className="h-6 w-6 text-purple-600" />
                  <div>
                    <p className="font-semibold text-purple-800 text-sm">Troca Fácil</p>
                    <p className="text-xs text-purple-600">30 dias</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Avaliações */}
          <div className="border-t border-gray-200 p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-8">
              ⭐ Avaliações dos Clientes
            </h3>
            
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Seja o primeiro a avaliar este produto!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <div key={review.id} className="modern-card-minimal p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {review.customer_name}
                      </h4>
                      <div className="rating-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`star ${star <= review.rating ? 'filled' : 'empty'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed mb-3">
                        "{review.comment}"
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};