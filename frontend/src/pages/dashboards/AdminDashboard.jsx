import React, { useState, useEffect } from 'react';
import { 
    Users, Store, BarChart3, 
    Package, Settings, LogOut, Menu, X,
    TrendingUp, DollarSign, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Admin Sidebar Component
const AdminSidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, onLogout }) => {
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
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center space-x-3 px-3 py-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
};

// Stats Cards Component
const StatsCard = ({ title, value, icon: Icon, change, color, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                    {loading ? (
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                    ) : (
                        value
                    )}
                </p>
                {change !== undefined && !loading && (
                    <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {change !== 0 ? `${Math.abs(change)}%` : 'No change'} from last month
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
    const { logout, user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalRestaurants: 0,
        totalOrders: 0,
        totalRevenue: 0
    });
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const API_URL = 'https://food-ordering-app-production-35eb.up.railway.app/api';

    // Fetch real data from APIs
    const fetchData = async () => {
        try {
            setRefreshing(true);
            
            // Fetch users data
            const usersResponse = await fetch(`${API_URL}/auth/users`);
            const usersData = await usersResponse.json();
            
            // Fetch restaurants data
            const restaurantsResponse = await fetch(`${API_URL}/restaurants`);
            const restaurantsData = await restaurantsResponse.json();
            
            // Fetch orders data
            const ordersResponse = await fetch(`${API_URL}/orders`);
            const ordersData = await ordersResponse.json();

            console.log('📊 Real Data:', {
                users: usersData,
                restaurants: restaurantsData,
                orders: ordersData
            });

            // Calculate total revenue from orders
            const totalRevenue = Array.isArray(ordersData) 
                ? ordersData.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
                : 0;

            setStats({
                totalUsers: Array.isArray(usersData?.users) ? usersData.users.length : 
                           Array.isArray(usersData) ? usersData.length : 0,
                totalRestaurants: Array.isArray(restaurantsData?.restaurants) ? restaurantsData.restaurants.length :
                                Array.isArray(restaurantsData) ? restaurantsData.length : 0,
                totalOrders: Array.isArray(ordersData?.orders) ? ordersData.orders.length :
                            Array.isArray(ordersData) ? ordersData.length : 0,
                totalRevenue: totalRevenue
            });

            // Set users for user management tab
            if (Array.isArray(usersData?.users)) {
                setUsers(usersData.users);
            } else if (Array.isArray(usersData)) {
                setUsers(usersData);
            }

        } catch (error) {
            console.error('❌ Error fetching data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleLogout = () => {
        logout();
    };

    const handleRefresh = () => {
        fetchData();
    };

    const handleApproveUser = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/auth/users/${userId}/approve`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.ok) {
                fetchData(); // Refresh data
                alert('User approved successfully!');
            }
        } catch (error) {
            console.error('Error approving user:', error);
        }
    };

    // Render different components based on active tab
    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="space-y-6">
                        {/* Header with Refresh Button */}
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
                            </button>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatsCard
                                title="Total Users"
                                value={stats.totalUsers.toLocaleString()}
                                icon={Users}
                                change={12}
                                color="bg-blue-500"
                                loading={loading}
                            />
                            <StatsCard
                                title="Total Restaurants"
                                value={stats.totalRestaurants.toLocaleString()}
                                icon={Store}
                                change={8}
                                color="bg-green-500"
                                loading={loading}
                            />
                            <StatsCard
                                title="Total Orders"
                                value={stats.totalOrders.toLocaleString()}
                                icon={Package}
                                change={15}
                                color="bg-purple-500"
                                loading={loading}
                            />
                            <StatsCard
                                title="Total Revenue"
                                value={`₱${stats.totalRevenue.toLocaleString()}`}
                                icon={DollarSign}
                                change={23}
                                color="bg-orange-500"
                                loading={loading}
                            />
                        </div>

                        {/* Recent Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h3>
                                <div className="space-y-3">
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                            <p className="text-gray-500 text-sm mt-2">Loading users...</p>
                                        </div>
                                    ) : users.slice(0, 5).map((user) => (
                                        <div key={user._id || user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900">{user.name}</p>
                                                <p className="text-sm text-gray-500">{user.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                                                user.role === 'rider' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {user.role}
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
                                        <span className="text-gray-600">Total Data</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                            {stats.totalUsers + stats.totalRestaurants + stats.totalOrders} Records
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
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                            <button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                                <span>Refresh</span>
                            </button>
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                <p className="text-gray-500 mt-2">Loading users...</p>
                            </div>
                        ) : (
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
                                        {users.map((user) => (
                                            <tr key={user._id || user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-xs text-gray-500">{user.phone}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">{user.email}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                        user.role === 'restaurant' ? 'bg-orange-100 text-orange-800' :
                                                        user.role === 'rider' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        user.isApproved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {user.isApproved ? 'Approved' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {!user.isApproved && user.role !== 'customer' && (
                                                        <button 
                                                            onClick={() => handleApproveUser(user._id || user.id)}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium mr-3"
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );

            case 'restaurants':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Management</h2>
                        <p className="text-gray-600">Restaurant management content will be here...</p>
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800">
                                <strong>Total Restaurants in Database:</strong> {stats.totalRestaurants}
                            </p>
                        </div>
                    </div>
                );

            case 'orders':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h2>
                        <p className="text-gray-600">Order management content will be here...</p>
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800">
                                <strong>Total Orders in Database:</strong> {stats.totalOrders}
                            </p>
                            <p className="text-blue-800">
                                <strong>Total Revenue:</strong> ₱{stats.totalRevenue.toLocaleString()}
                            </p>
                        </div>
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
                onLogout={handleLogout}
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
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                <p className="text-xs text-gray-500">Administrator</p>
                            </div>
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
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