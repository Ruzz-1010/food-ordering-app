// AdminSidebar.jsx - Updated with restaurant theme
import React from 'react';
import { 
    Users, Store, BarChart3, 
    Package, Settings, LogOut, X,
    TrendingUp, Utensils, ChefHat
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'restaurants', label: 'Restaurants', icon: Store },
        { id: 'riders', label: 'Riders', icon: Bike },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed lg:static inset-y-0 left-0 z-50
                w-64 bg-gradient-to-b from-orange-700 to-orange-800 text-white transform transition-transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                flex flex-col
            `}>
                <div className="flex items-center justify-between p-4 border-b border-orange-600">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                            <Utensils size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">FoodExpress</h1>
                            <p className="text-xs text-orange-200">Admin Panel</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 hover:bg-orange-600 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-2 flex-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all ${
                                    activeTab === item.id 
                                        ? 'bg-white text-orange-700 shadow-sm' 
                                        : 'text-orange-100 hover:bg-orange-600 hover:text-white'
                                }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-orange-600">
                    <div className="flex items-center space-x-3 mb-4 p-3 bg-orange-600 rounded-lg">
                        <ChefHat size={20} className="text-orange-200" />
                        <div>
                            <p className="text-sm font-medium">FoodExpress</p>
                            <p className="text-xs text-orange-200">Delivery System</p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-orange-200 hover:bg-orange-600 hover:text-white rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;