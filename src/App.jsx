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

    // Simple routing for the admin dashboard
    if (window.location.pathname === '/admin') {
        return <AdminDashboard />;
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar onOpenOrder={() => setOrderOpen(true)} />
            <Hero onOpenOrder={() => setOrderOpen(true)} />
            <Products onOpenOrder={() => setOrderOpen(true)} />
            <DeliveryMap />
            <About />
            <Footer />
            <OrderForm isOpen={orderOpen} onClose={() => setOrderOpen(false)} />
            <PaymentStatusModal />
        </div>
    );
}

export default App;
