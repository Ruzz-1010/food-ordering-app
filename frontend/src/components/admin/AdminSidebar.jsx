// AdminSidebar.jsx - UPDATED WITH YOUR LOGO.PNG
import React from 'react';
import { 
    Users, Store, BarChart3, 
    Package, Settings, LogOut, X,
    TrendingUp, Bike
} from 'lucide-react';

const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'restaurants', label: 'Restaurants', icon: Store },
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'riders', label: 'Riders', icon: Bike },
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
                w-64 bg-gray-900 text-white transform transition-transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                flex flex-col
            `}>
                {/* Fixed Header - Won't scroll */}
                <div className="flex-shrink-0 p-4 border-b border-gray-700 bg-gray-900">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {/* Your Logo from Public Folder */}
                            <div className="flex items-center space-x-3">
                                <img 
                                    src="/logo.png" 
                                    alt="FoodExpress Logo" 
                                    className="w-10 h-10 rounded-lg object-contain"
                                    onError={(e) => {
                                        // Fallback if logo doesn't load
                                        e.target.style.display = 'none';
                                        // Show fallback logo
                                        const fallback = document.getElementById('logo-fallback');
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback Logo - Hidden by default */}
                                <div 
                                    id="logo-fallback"
                                    className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg items-center justify-center hidden"
                                >
                                    <span className="font-bold text-white text-sm">FE</span>
                                </div>
                                
                                <div>
                                    <h1 className="text-lg font-bold text-white">FoodExpress</h1>
                                    <p className="text-xs text-gray-400">Admin Panel</p>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden p-1 hover:bg-gray-800 rounded transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Menu Area */}
                <div className="flex-1 overflow-y-auto">
                    <nav className="p-4 space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                                        activeTab === item.id 
                                            ? 'bg-blue-600 text-white shadow-lg' 
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:shadow-md'
                                    }`}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    <span className="font-medium text-left">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Fixed Footer - Won't scroll */}
                <div className="flex-shrink-0 p-4 border-t border-gray-700 bg-gray-900">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200"
                    >
                        <LogOut size={20} className="flex-shrink-0" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default AdminSidebar;