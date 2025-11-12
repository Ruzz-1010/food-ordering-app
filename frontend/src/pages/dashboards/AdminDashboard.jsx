import React, { useState, useEffect } from 'react';
import { 
    Users, Store, BarChart3, 
    Package, Settings, LogOut, Menu, X,
    TrendingUp, DollarSign
} from 'lucide-react';

// Admin Sidebar Component
const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'restaurants', label: 'Restaurants', icon: Store },
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
                w-64 bg-gray-900 text-white transform transition-transform
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                <div className="flex items-center justify-between p-4 border-b border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-white">A</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold">Admin Panel</h1>
                            <p className="text-xs text-gray-400">FoodExpress</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="lg:hidden p-1 hover:bg-gray-800 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

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
                                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                                    activeTab === item.id 
                                        ? 'bg-blue-600 text-white' 
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="absolute bottom-4 left-4 right-4">
                    <button className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

// Stats Cards Component
const StatsCard = ({ title, value, icon: Icon, change, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                {change && (
                    <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    </div>
);

// Main Admin Dashboard Component
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRestaurants: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    // Fetch real data from APIs
    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                
                // Fetch users count
                const usersResponse = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/users');
                const usersData = await usersResponse.json();
                
                // Fetch restaurants count
                const restaurantsResponse = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/restaurants');
                const restaurantsData = await restaurantsResponse.json();
                
                // Fetch orders count
                const ordersResponse = await fetch('https://food-ordering-app-production-35eb.up.railway.app/api/orders');
                const ordersData = await ordersResponse.json();

                setStats({
                    totalUsers: Array.isArray(usersData) ? usersData.length : 0,
                    totalRestaurants: Array.isArray(restaurantsData) ? restaurantsData.length : 0,
                    totalOrders: Array.isArray(ordersData) ? ordersData.length : 0,
                    totalRevenue: 12540 // This would come from orders calculation
                });
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Render different components based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard
                                title="Total Users"
                                value={loading ? "..." : stats.totalUsers.toLocaleString()}
                                icon={Users}
                                change={12}
                                color="bg-blue-500"
                            />
                            <StatsCard
                                title="Total Restaurants"
                                value={loading ? "..." : stats.totalRestaurants.toLocaleString()}
                                icon={Store}
                                change={8}
                                color="bg-green-500"
                            />
                            <StatsCard
                                title="Total Orders"
                                value={loading ? "..." : stats.totalOrders.toLocaleString()}
                                icon={Package}
                                change={15}
                                color="bg-purple-500"
                            />
                            <StatsCard
                                title="Total Revenue"
                                value={loading ? "..." : `₱${stats.totalRevenue.toLocaleString()}`}
                                icon={DollarSign}
                                change={23}
                                color="bg-orange-500"
                            />
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Orders */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((item) => (
                                        <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">Order #100{item}</p>
                                                <p className="text-sm text-gray-500">2 items • ₱350</p>
                                            </div>
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                Delivered
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* System Status */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">API Status</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                            Online
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Database</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                            Connected
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Server Load</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                            Normal
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'users':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">User</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Email</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Role</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-100">
                                        <td className="py-3 px-4">Juan Dela Cruz</td>
                                        <td className="py-3 px-4">juan@test.com</td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Customer</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );

            case 'restaurants':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Management</h2>
                        <p className="text-gray-600">Restaurant management content will be here...</p>
                    </div>
                );

            case 'orders':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h2>
                        <p className="text-gray-600">Order management content will be here...</p>
                    </div>
                );

            case 'analytics':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
                        <p className="text-gray-600">Analytics and reports will be here...</p>
                    </div>
                );

            case 'settings':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                        <p className="text-gray-600">System settings will be here...</p>
                    </div>
                );

            default:
                return <div>Select a tab</div>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <AdminSidebar 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 lg:ml-0">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between p-4">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div className="flex items-center space-x-4">
                            <h1 className="text-xl font-semibold text-gray-900 capitalize">
                                {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab}
                            </h1>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;