import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Star, ChefHat, Store, CheckCircle, ArrowRight, Bell, Compass } from 'lucide-react';
import { Client } from '@stomp/stompjs';

export default function App() {
  const [activeTab, setActiveTab] = useState('customer');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [sensorActive, setSensorActive] = useState(false);

  // 3D Parallax & Tilt interactive refs
  const cardRefs = useRef({});
  const heroRef = useRef(null);

  // Mock Menu
  const menu = [
    { id: 1, name: "Artisanal Truffle Burger", price: 14.99, rating: 4.8, reviews: 124, image: "🍔" },
    { id: 2, name: "Wood-Fired Margherita Pizza", price: 16.50, rating: 4.9, reviews: 310, image: "🍕" },
    { id: 3, name: "Handmade Craft Lemonade", price: 4.99, rating: 4.7, reviews: 85, image: "🍹" }
  ];

  // Enable mobile Accelerometer / Gyroscope Parallax
  const enableAccelerometer = async () => {
    if (typeof window.DeviceOrientationEvent !== 'undefined' && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const response = await window.DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setSensorActive(true);
        } else {
          alert("Permission denied for motion sensors.");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      setSensorActive(prev => !prev);
    }
  };

  // Handle Gyroscope & Accelerometer motion data for Mobile Parallax
  useEffect(() => {
    const handleOrientation = (event) => {
      if (!sensorActive) return;
      const tiltX = event.gamma; // Range: -90 to 90 (left/right)
      const tiltY = event.beta;  // Range: -180 to 180 (front/back)

      if (heroRef.current) {
        const x = (tiltX / 45) * 15;
        const y = (tiltY / 45) * 15;
        heroRef.current.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg)`;
      }
    };

    if (sensorActive) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [sensorActive]);

  // Handle Desktop Mouse 3D Tilt FX
  const handleMouseMove = (e, id) => {
    const card = cardRefs.current[id];
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; // x coordinate inside card
    const y = e.clientY - rect.top;  // y coordinate inside card
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -12; // Max tilt deg
    const rotateY = ((x - centerX) / centerX) * 12;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = (id) => {
    const card = cardRefs.current[id];
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
  };

  // WebSocket Connection
  useEffect(() => {
    const stompClient = new Client({
      brokerURL: 'ws://localhost:8080/ws-order',
      onConnect: () => {
        stompClient.subscribe('/topic/business-orders', (message) => {
          const newOrder = JSON.parse(message.body);
          setOrders((prev) => [newOrder, ...prev]);
          setNotifications((prev) => [`New incoming order #${newOrder.id || 'New'}!`, ...prev]);
        });
      },
    });
    stompClient.activate();
    return () => stompClient.deactivate();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const checkout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    const orderPayload = {
      items: cart,
      totalPrice: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      customerName: "Alex Doe"
    };

    try {
      const res = await fetch('http://localhost:8080/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (res.ok) {
        alert("Order placed successfully! Check the Kitchen View.");
        setCart([]);
      }
    } catch (e) {
      setOrders(prev => [{ id: Math.floor(Math.random()*1000), items: cart, status: 'PENDING', totalPrice: 20 }, ...prev]);
      setCart([]);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/40 font-sans text-slate-900 selection:bg-rose-500 selection:text-white animate-fadeIn">
      
      {/* Custom Keyframes & Utility Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .preserve-3d {
          transform-style: preserve-3d;
          transition: transform 0.1s ease-out;
        }
      `}</style>

      {/* Top Navbar */}
      <nav className="bg-white/90 border-b border-rose-100 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 cursor-pointer">
            <div className="bg-rose-600 p-2 rounded-xl text-white shadow-lg shadow-rose-200">
              <Store className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-base sm:text-xl bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
              LocalBistro & Hub
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Gyroscope Sensor Toggle Button */}
            <button 
              onClick={enableAccelerometer}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all ${sensorActive ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-200 text-slate-700'}`}
              title="Toggle Mobile Motion Parallax"
            >
              <Compass className={`w-3.5 h-3.5 ${sensorActive ? 'animate-spin' : ''}`} />
              <span>{sensorActive ? 'Motion On' : 'Enable Gyro'}</span>
            </button>

            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-full">
              <button 
                onClick={() => setActiveTab('customer')} 
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 ${activeTab === 'customer' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Customer
              </button>
              <button 
                onClick={() => setActiveTab('kitchen')} 
                className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 relative ${activeTab === 'kitchen' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Kitchen
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'customer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Store Profile & Menu */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Card Header with 3D Parallax Tilt Effect */}
              <div 
                ref={heroRef}
                onMouseMove={(e) => handleMouseMove(e, 'hero')}
                onMouseLeave={() => handleMouseLeave('hero')}
                className="bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/70 border border-rose-100 relative overflow-hidden preserve-3d cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-full blur-2xl -z-10 translate-x-10 -translate-y-10"></div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="bg-emerald-50 text-emerald-600 font-semibold px-3 py-1 rounded-full text-xs uppercase tracking-wider inline-block mb-3">
                      Open Now • Closes at 10 PM
                    </span>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">The Gourmet Spot</h1>
                    <p className="text-slate-500 mt-1">Handcrafted burgers, artisan pizzas, and refreshing drinks made locally.</p>
                  </div>
                  <div className="self-start flex items-center space-x-1 bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-100/50">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                    <span className="font-bold text-amber-900">4.8</span>
                    <span className="text-xs text-amber-700/80">(420+ ratings)</span>
                  </div>
                </div>
              </div>

              {/* Menu Listing with 3D Hover & Parallax */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-slate-800">Popular Menu Items</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {menu.map((item) => (
                    <div 
                      key={item.id} 
                      ref={(el) => (cardRefs.current[item.id] = el)}
                      onMouseMove={(e) => handleMouseMove(e, item.id)}
                      onMouseLeave={() => handleMouseLeave(item.id)}
                      className="bg-white p-5 rounded-2xl border border-rose-100 shadow-md hover:shadow-2xl transition-shadow duration-200 flex flex-col justify-between preserve-3d"
                    >
                      <div>
                        <div className="text-4xl mb-3 inline-block">{item.image}</div>
                        <h3 className="font-bold text-lg text-slate-900">{item.name}</h3>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-semibold text-slate-700">{item.rating}</span>
                          <span className="text-xs text-slate-400">({item.reviews} reviews)</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <span className="text-lg font-black text-rose-600">${item.price.toFixed(2)}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-rose-600 transition-colors shadow-sm active:scale-95"
                        >
                          + Add
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Shopping Cart Drawer */}
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/70 border border-rose-100 h-fit lg:sticky lg:top-24">
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 mb-4">
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                <h2 className="font-bold text-lg">Your Order Basket</h2>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm">Your basket is feeling light.</p>
                  <p className="text-xs mt-1">Add items from the menu to start ordering.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-50 max-h-60 overflow-y-auto">
                    {cart.map((item, idx) => (
                      <div key={idx} className="py-3 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <div className="flex justify-between font-bold text-base text-slate-900">
                      <span>Total Amount:</span>
                      <span className="text-rose-600">
                        ${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                      </span>
                    </div>
                    <button 
                      onClick={checkout}
                      className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-2xl shadow-lg shadow-rose-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2"
                    >
                      <span>Place Secure Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Kitchen Display Screen */
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-rose-100/70 border border-rose-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900 flex items-center space-x-2">
                  <ChefHat className="w-7 h-7 text-rose-600" />
                  <span>Kitchen Live Display System (KDS)</span>
                </h1>
                <p className="text-slate-500 text-sm mt-1">Orders sync instantly via WebSocket backend connection when customers submit.</p>
              </div>
              <div className="bg-rose-50 text-rose-700 font-bold px-4 py-2 rounded-2xl text-sm">
                Active Orders: {orders.length}
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm">
                <Bell className="w-12 h-12 text-slate-300 mx-auto animate-bounce mb-3" />
                <h3 className="font-bold text-lg text-slate-700">Waiting for new incoming orders...</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {orders.map((order, idx) => (
                  <div key={idx} className="bg-white rounded-3xl p-6 border-2 border-rose-100 shadow-lg shadow-rose-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-xs">
                          Order #{order.id || `LOCAL-${idx + 1}`}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                          {order.status || 'PENDING'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-2">Customer: {order.customerName || 'Local Patron'}</p>
                      <div className="space-y-2 bg-slate-50 p-3 rounded-2xl mb-4">
                        {order.items?.map((item, i) => (
                          <div key={i} className="text-sm flex justify-between">
                            <span className="text-slate-600">{item.quantity}x {item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                      <span className="font-bold text-slate-900">${order.totalPrice?.toFixed(2)}</span>
                      <button 
                        onClick={() => {
                          setOrders(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 shadow-sm"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete Order</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}