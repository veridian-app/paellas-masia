import { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Products from './components/Products';
import DeliveryMap from './components/DeliveryMap';
import About from './components/About';
import Footer from './components/Footer';
import OrderForm from './components/OrderForm';
import PaymentStatusModal from './components/PaymentStatusModal';
import AdminDashboard from './components/AdminDashboard';

function App() {
    const [orderOpen, setOrderOpen] = useState(false);
    const [preselectedPaella, setPreselectedPaella] = useState(null);

    // Simple routing for the admin dashboard
    if (window.location.pathname === '/admin') {
        return <AdminDashboard />;
    }

    const openOrder = (paellaId = null) => {
        setPreselectedPaella(paellaId);
        setOrderOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar onOpenOrder={() => openOrder()} />
            <Hero onOpenOrder={openOrder} />
            <Products onOpenOrder={openOrder} />
            <DeliveryMap />
            <About />
            <Footer />
            <OrderForm
                isOpen={orderOpen}
                onClose={() => { setOrderOpen(false); setPreselectedPaella(null); }}
                preselectedPaellaId={preselectedPaella}
            />
            <PaymentStatusModal />
        </div>
    );
}

export default App;
