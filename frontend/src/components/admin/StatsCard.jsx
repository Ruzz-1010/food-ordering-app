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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            ) : (
              value
            )}
          </p>
          {change !== undefined && !loading && (
            <p className={`text-xs sm:text-sm mt-1 ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {change > 0 ? '↑' : change < 0 ? '↓' : '→'} {change !== 0 ? `${Math.abs(change)}%` : 'No change'} from last month
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0`}>
          <DynamicIcon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;