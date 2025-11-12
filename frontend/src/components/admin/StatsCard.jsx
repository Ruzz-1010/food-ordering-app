import React from 'react';
import { Users, Store, Package, DollarSign } from 'lucide-react';

const StatsCard = ({ title, value, change, color, loading, icon: Icon }) => {
  // Auto-select icon based on title
  const getIcon = () => {
    if (Icon) return Icon;
    
    if (title.includes('User')) return Users;
    if (title.includes('Restaurant')) return Store;
    if (title.includes('Order')) return Package;
    if (title.includes('Revenue')) return DollarSign;
    return Users;
  };

  const DynamicIcon = getIcon();

  return (
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
          <DynamicIcon size={24} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;