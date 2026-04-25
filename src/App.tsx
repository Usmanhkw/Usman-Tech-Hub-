/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Smartphone, 
  Search, 
  ShoppingCart, 
  User as UserIcon, 
  Settings, 
  LogOut, 
  CheckCircle, 
  Clock,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Zap,
  Facebook,
  Youtube,
  Music
} from 'lucide-react';
import { Product, User, CartItem } from './types';
import { INITIAL_PRODUCTS, ADMIN_CREDENTIALS, CATEGORIES } from './constants';
import { auth, loginWithGoogle, logout, onAuthStateChanged } from './lib/firebase';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Sync Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        // If it's the admin email, set as admin
        if (user.email === ADMIN_CREDENTIALS.email) {
          setCurrentUser({ name: user.displayName || "Admin", email: user.email, role: 'admin' });
        } else {
          setCurrentUser({ name: user.displayName || "Customer", email: user.email || "", role: 'customer' });
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Derived state
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const isAdmin = currentUser?.role === 'admin';

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const isVisible = isAdmin || p.approved;
    return matchesCategory && matchesSearch && isVisible;
  });

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Legacy fallback for local admin login if needed, or just prompt Google login
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      setCurrentUser({ name: "Admin", email, role: 'admin' });
      setShowLogin(false);
    } else {
      // Prompt user to use Google Login for better security
      alert("Please use the 'Connect with Google' option for a secure shopping experience.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      setShowLogin(false);
      setShowSignup(false);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  const handleToggleApproval = (id: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, approved: !p.approved } : p));
  };

  const handleSaveProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const price = Number(formData.get('price'));
    const desc = formData.get('desc') as string;
    const image = formData.get('image') as string;

    if (editingProduct && editingProduct.id !== -1) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...p, title, price, desc, image } : p));
    } else {
      const newProduct: Product = {
        id: Math.max(...products.map(p => p.id)) + 1,
        title,
        price,
        desc,
        image,
        approved: true,
        category: selectedCategory === "All" ? CATEGORIES[0] : selectedCategory
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    setEditingProduct(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct({ ...editingProduct, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckout = () => {
    if (!currentUser) {
      setShowLogin(true);
      return;
    }

    const message = `Hello! I would like to order the following from Usman Tech Hub:\n\n` + 
      cart.map(item => `- ${item.title} x ${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}`).join('\n') + 
      `\n\nTotal: Rs. ${cartTotal.toLocaleString()}\n\nCustomer: ${currentUser.name} (${currentUser.email})`;
    
    const whatsappUrl = `https://wa.me/923206882843?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a] font-sans selection:bg-blue-100">
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            const shop = document.getElementById('shop');
            if (shop) {
              window.scrollTo({
                top: shop.offsetTop - 120,
                behavior: 'smooth'
              });
            }
          }}
          className="w-14 h-14 bg-[#001D4C] text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-900/20 hover:bg-[#0052FF] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="View Catalog"
        >
          <Smartphone size={24} />
        </motion.button>

        <motion.a
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          href="https://wa.me/923206882843"
          target="_blank"
          rel="noreferrer"
          className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl shadow-green-900/20 hover:bg-[#20ba5a] transition-colors"
          title="WhatsApp Chat"
        >
          <Zap size={24} className="fill-current" />
        </motion.a>
      </div>

      {/* Admin Bar */}
      {isAdmin && (
        <div className="bg-[#0052FF] text-white px-4 py-2 flex justify-between items-center text-xs font-bold sticky top-0 z-[110] shadow-lg">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            <span className="tracking-widest uppercase">Admin Terminal Active</span>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white text-[#0052FF] px-4 py-1 rounded-full text-[10px] uppercase font-black hover:bg-neutral-100 transition-all active:scale-95"
          >
            Terminal Exit
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`bg-white border-b border-gray-100 sticky ${isAdmin ? 'top-10' : 'top-0'} z-50 transition-all duration-300 h-24 flex items-center shadow-sm`}>
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#001D4C] shadow-xl transition-all duration-500 group-hover:scale-105 overflow-hidden border border-gray-50 p-2">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Motion Lines */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-60">
                      <div className="w-3 h-[2px] bg-[#0052FF] rounded-full"></div>
                      <div className="w-4 h-[2px] bg-[#0052FF] rounded-full"></div>
                      <div className="w-3 h-[2px] bg-[#0052FF] rounded-full"></div>
                    </div>
                    {/* Simplified Cart + UT Initial */}
                    <div className="relative ml-2">
                       <ShoppingCart size={32} className="text-[#001D4C]" strokeWidth={2.5} />
                       <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-black text-[#0052FF] italic mt-1 ml-1 select-none">UT</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl font-black tracking-tight flex items-baseline leading-none">
                  <span className="text-[#001D4C]">Usman</span>
                  <span className="text-[#0052FF] ml-1.5 focus:outline-none">tech Hub</span>
                </h1>
                <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
                  <div className="h-[1px] w-6 bg-[#0052FF] opacity-30"></div>
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-[#001D4C]/40 whitespace-nowrap">Smart Accessories</span>
                  <div className="h-[1px] w-6 bg-[#0052FF] opacity-30"></div>
                </div>
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
            <a href="#shop" className="hover:text-[#0052FF] transition-colors">Store</a>
            <a href="#contact" className="hover:text-[#0052FF] transition-colors">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center px-4 py-2 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500">
              Hotline: 0300-REPAIR
            </div>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 text-gray-400 hover:text-[#0052FF] transition-all rounded-xl hover:bg-blue-50 group"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-5 h-5 bg-[#0052FF] text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              )}
            </button>

            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 p-1.5 pl-4 pr-1.5 bg-gray-50 border border-gray-100 rounded-full hover:bg-gray-100 transition-all group"
              >
                <span className="text-[11px] font-black text-[#001D4C] uppercase tracking-tighter">{currentUser.name.split(' ')[0]}</span>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                  <LogOut size={14} />
                </div>
              </button>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="w-10 h-10 bg-gray-50 text-gray-400 hover:text-[#0052FF] border border-gray-100 transition-all rounded-full flex items-center justify-center"
              >
                <UserIcon size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-50 pt-20 pb-24 overflow-hidden text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-12">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#cbd5e1] text-[#1e293b] rounded-full text-[10px] font-black uppercase tracking-widest mb-10 shadow-sm opacity-80"
            >
              Elite Tech Standards
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-6xl lg:text-8xl font-black tracking-tighter text-[#001D4C] mb-8 leading-[0.9] uppercase"
            >
              Premium <br />
              <span className="text-[#0052FF]">Accessories</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-gray-400 font-medium max-w-xl mx-auto mb-10 leading-relaxed"
            >
              We have high quality products from AMB, Anker, Audionic, HH, Apple, Infinite, Samsung, Vivo and other Chinese mobile accessories.
            </motion.p>
            <div className="flex justify-center mb-20">
              <button 
                onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-12 py-4 bg-[#001D4C] text-white rounded-xl font-black text-sm uppercase tracking-[0.2em] hover:bg-[#0052FF] transition-all active:scale-95 shadow-[0_0_40px_rgba(0,82,255,0.3)] hover:shadow-[0_0_50px_rgba(0,82,255,0.5)]"
              >
                View Catalog
              </button>
            </div>
          </div>
          <div className="w-full max-w-4xl relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[#0052FF]/5 rounded-full blur-[100px]"></div>
             <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
              className="relative z-10"
             >
                <img 
                  src="https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=800&h=800" 
                  alt="Premium Gear" 
                  className="w-full h-auto rounded-[60px] shadow-2xl mx-auto"
                />
             </motion.div>
          </div>
        </div>
      </section>

      {/* Main Shop Area */}
      <main id="shop" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative scroll-mt-40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div>
              <h2 className="text-4xl font-black text-[#001D4C] tracking-tighter uppercase mb-4 italic">The Collection</h2>
              <div className="h-1.5 w-16 bg-[#0052FF] rounded-full"></div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setEditingProduct({ id: -1, title: '', desc: '', price: 0, image: '', approved: true, category: CATEGORIES[0] })}
                className="px-6 py-3 bg-[#0052FF] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 hover:scale-105 transition-all"
              >
                + Add New Product
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-none px-2">
            {["All", ...CATEGORIES].map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${selectedCategory === cat ? 'bg-[#0052FF] text-white border-transparent' : 'bg-[#e2e8f0] text-gray-500 border-transparent hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (idx % 4) * 0.1 }}
                className={`group bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-2xl hover:shadow-blue-100/40 transition-all duration-500 flex flex-col ${!p.approved ? 'opacity-60 grayscale bg-gray-50' : ''}`}
              >
                <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-2xl mb-6">
                  <img 
                    src={p.image} 
                    alt={p.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-3 left-3">
                     <span className="px-2 py-1 bg-[#e2e8f0] text-[9px] font-black text-[#0052FF] rounded-md uppercase tracking-widest border border-gray-200">
                        {p.category.split(' ')[0]}
                      </span>
                  </div>
                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <button 
                        onClick={() => setEditingProduct(p)}
                        className="w-8 h-8 bg-white text-gray-400 rounded-full shadow-sm border border-gray-100 flex items-center justify-center hover:text-[#0052FF] transition-colors"
                      >
                        <Settings size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleApproval(p.id)}
                        className={`w-8 h-8 rounded-full shadow-sm border border-gray-100 flex items-center justify-center transition-all ${p.approved ? 'bg-green-50 text-green-600' : 'bg-[#001D4C] text-white'}`}
                      >
                        {p.approved ? <CheckCircle size={14} /> : <Clock size={14} />}
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  <h3 className="font-extrabold text-[#001D4C] text-lg mb-2 leading-tight uppercase group-hover:text-[#0052FF] transition-colors tracking-tight">{p.title}</h3>
                  <p className="text-xs text-gray-400 font-medium line-clamp-2 mb-6 leading-relaxed uppercase tracking-tighter">{p.desc}</p>
                  
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-xl font-black text-[#0052FF] tracking-tighter">Rs. {p.price.toLocaleString()}</span>
                    <button 
                      onClick={() => addToCart(p)}
                      disabled={!p.approved && !isAdmin}
                      className={`w-10 h-10 rounded-full transition-all active:scale-90 flex items-center justify-center shadow-lg ${p.approved || isAdmin ? 'bg-[#001D4C] text-white hover:bg-[#0052FF] shadow-blue-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-gray-200">
            <h3 className="text-2xl font-black text-gray-300 uppercase tracking-widest mb-2 italic">Null Response</h3>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-tighter">No products matching the current sequence</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-16 mb-20">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#001D4C] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-50">
                <Smartphone size={20} />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-[#001D4C] uppercase italic">
                Usman <span className="text-[#0052FF]">Sarwar</span>
              </h1>
            </div>
            <p className="text-gray-400 text-sm font-medium leading-loose mb-10 max-w-sm">
              Smart accessories for smart people. We have been selling original and high-quality products for you for the past five years. Buy something and try it out or visit the store.
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8">Terminal Map</h4>
            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
              <li><a href="#" className="text-gray-500 hover:text-[#0052FF] transition-colors">Inventory Stock</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#0052FF] transition-colors">Corporate Bulk</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#0052FF] transition-colors">Service Tracking</a></li>
              <li><a href="#" className="text-gray-500 hover:text-[#0052FF] transition-colors">User Agreement</a></li>
            </ul>
          </div>

          <div id="contact">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 mb-8">Transmission</h4>
            <ul className="space-y-6 text-xs font-bold uppercase tracking-widest">
              <li className="flex items-center gap-4 text-gray-500 group">
                <a href="tel:03206882843" className="flex items-center gap-4 hover:text-[#0052FF] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-[#0052FF] shadow-sm group-hover:scale-110 transition-transform"><Phone size={14} /></div>
                  0320-6882843
                </a>
              </li>
              <li className="flex items-center gap-4 text-gray-500 group">
                <a href="https://wa.me/qr/KZXIWY24NWE6H1" target="_blank" rel="noreferrer" className="flex items-center gap-4 hover:text-[#25D366] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center text-[#25D366] shadow-sm group-hover:scale-110 transition-transform"><Zap size={14} /></div>
                  WhatsApp Chat
                </a>
              </li>
              <li className="flex items-center gap-4 text-gray-500 group">
                <a href="https://share.google/8srZkCCAJ91lyEbC3" target="_blank" rel="noreferrer" className="flex items-center gap-4 hover:text-[#0052FF] transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-[#0052FF] shadow-sm group-hover:scale-110 transition-transform"><MapPin size={14} /></div>
                  Pattoki, Punjab, Pakistan
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Media Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-0 flex flex-col md:flex-row items-center justify-between gap-8 py-8 border-y border-gray-50">
          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">Connect with Usman Sarwar</span>
             <div className="h-px w-12 bg-gray-100"></div>
          </div>
          <div className="flex gap-4">
            <a href="https://www.facebook.com/share/1GjnRFGkzc/" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#1877F2] hover:text-white transition-all shadow-sm hover:-translate-y-1">
              <Facebook size={20} />
            </a>
            <a href="https://youtube.com/@hkwpro?si=W7dBXc1n0mWtSLn2&sub_confirmation=1" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#FF0000] hover:text-white transition-all shadow-sm hover:-translate-y-1">
              <Youtube size={20} />
            </a>
            <a href="https://www.tiktok.com/@usmanpti8171?_t=zs-8uso1vhfl8b&_r=1" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all shadow-sm hover:-translate-y-1">
              <Music size={20} />
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-10 border-t border-gray-50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
          <span>Copyright © 2026 Usman Tech Hub Inc. All rights reserved.</span>
          <div className="flex gap-10">
            <span>Usman Sarwar • Pattoki</span>
            <span>Security Encrypted</span>
            <span>Est. 2018</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-[150]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[160] flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-600 rounded-xl text-white">
                    <ShoppingCart size={20} />
                   </div>
                   <h2 className="text-xl font-black italic tracking-tighter uppercase">Your Hub Cart</h2>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-neutral-200 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {cart.length > 0 ? cart.map(item => (
                  <div key={item.id} className="flex gap-4 group">
                    <div className="w-16 h-16 bg-neutral-100 rounded-xl overflow-hidden flex-shrink-0">
                      <img src={item.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold leading-tight mb-1">{item.title}</h4>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase mb-2">Each: Rs. {item.price.toLocaleString()}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-neutral-100 px-3 py-1 rounded-lg">
                           <span className="text-xs font-black">Qty: {item.quantity}</span>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs font-bold text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingCart size={48} className="mb-4" />
                    <p className="text-sm font-bold">Your cart is currently empty.</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-neutral-50 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-neutral-400 text-sm font-bold uppercase tracking-widest">Subtotal</span>
                  <span className="text-2xl font-black">Rs. {cartTotal.toLocaleString()}</span>
                </div>
                <button 
                   onClick={handleCheckout}
                   disabled={cart.length === 0}
                   className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-neutral-200"
                >
                  Proceed to Payment
                </button>
              </div>
            </motion.div>
          </>
        )}

        {(showLogin || showSignup) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowLogin(false); setShowSignup(false); }}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 -translate-y-1/2 translate-x-1/2 rounded-full"></div>
              
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200 rotate-6">
                  <Smartphone size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase italic">{showLogin ? 'Welcome Back' : 'Create Account'}</h3>
                <p className="text-neutral-400 text-sm font-medium mb-8">Access your personal hub experience</p>
                
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-white border-2 border-neutral-100 text-neutral-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-neutral-50 transition-all active:scale-95 shadow-sm mb-6"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
                  Connect with Google
                </button>

                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-neutral-100"></div>
                  <span className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">Or secure entry</span>
                  <div className="h-px flex-1 bg-neutral-100"></div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {showSignup && (
                  <div className="relative">
                    <input 
                      required
                      type="text" 
                      placeholder="Full Name" 
                      className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                    />
                  </div>
                )}
                <div className="relative">
                  <input 
                    name="email"
                    required
                    type="email" 
                    placeholder="Email Address" 
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                  />
                </div>
                <div className="relative">
                  <input 
                    name="password"
                    required
                    type="password" 
                    placeholder="Security Passkey" 
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-neutral-300"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-100"
                >
                  {showLogin ? 'Authenticate' : 'Join the Hub'}
                </button>
              </form>

              <div className="mt-8 text-center bg-neutral-50 -mx-8 -mb-8 p-6 border-t border-neutral-100">
                <button 
                  onClick={() => { setShowLogin(!showLogin); setShowSignup(!showSignup); }}
                  className="text-xs font-black text-neutral-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                >
                  {showLogin ? "Don't have an account? Sign Up" : "Already registered? Login"}
                </button>
                <p className="mt-4 text-[10px] text-neutral-300 font-bold uppercase">Admin: admin@usmantechhub.com / admin123</p>
              </div>
            </motion.div>
          </div>
        )}

        {editingProduct && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingProduct(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">{editingProduct.id === -1 ? 'New Entry' : 'Edit Entity'}</h3>
                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Modification Sequence</p>
                 </div>
                 <button onClick={() => setEditingProduct(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">Visual Asset (Storage)</label>
                  <div className="flex gap-4 items-center">
                    <label className="flex-1 cursor-pointer">
                      <div className="w-full h-24 border-2 border-dashed border-neutral-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 transition-all bg-neutral-50 overflow-hidden relative">
                        {editingProduct.image ? (
                          <img src={editingProduct.image} className="w-full h-full object-cover opacity-50 absolute" alt="" />
                        ) : null}
                        <div className="relative z-10 flex flex-col items-center">
                          <Smartphone size={20} className="text-neutral-400" />
                          <span className="text-[9px] font-black uppercase tracking-tighter text-neutral-500">Upload from Device</span>
                        </div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </div>
                    </label>
                    <input 
                      type="hidden"
                      name="image"
                      value={editingProduct.image}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">Display Name</label>
                  <input 
                    name="title"
                    defaultValue={editingProduct.title}
                    required
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">Image Source URL</label>
                  <input 
                    name="image"
                    defaultValue={editingProduct.image}
                    required
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">Pricing (PKR)</label>
                  <input 
                    name="price"
                    type="number"
                    defaultValue={editingProduct.price}
                    required
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 ml-4">Description Text</label>
                  <textarea 
                    name="desc"
                    rows={3}
                    defaultValue={editingProduct.desc}
                    required
                    className="w-full px-5 py-4 bg-neutral-100 rounded-2xl border-transparent focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold h-32 resize-none"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full py-4 bg-neutral-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95 mt-4"
                >
                  {editingProduct.id === -1 ? 'Create Product' : 'Commit Changes'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

