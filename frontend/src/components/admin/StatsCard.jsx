// StatsCard.jsx - MODERN REDESIGN
import React from 'react';
import { Users, Store, Package, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const StatsCard = ({ title, value, change, color, loading, icon: Icon, subtitle }) => {
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

  // Determine trend color and icon
  const getTrendInfo = () => {
    if (change === undefined || change === 0) return null;
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return {
      color,
      Icon,
      value: `${Math.abs(change)}%`
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-[#660B05] truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#3E0703] mt-1 sm:mt-2">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-300 border-t-[#8C1007] rounded-full animate-spin"></div>
            ) : (
              value
            )}
          </p>
          
          {/* Subtitle and Trend */}
          <div className="flex items-center justify-between mt-2">
            {subtitle && (
              <p className="text-xs text-[#8C1007]">{subtitle}</p>
            )}
            
            {trendInfo && (
              <div className={`flex items-center space-x-1 text-xs ${trendInfo.color}`}>
                <trendInfo.Icon size={12} />
                <span>{trendInfo.value}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Icon Container */}
        <div className={`p-2 sm:p-3 rounded-lg ${color} ml-3 flex-shrink-0 shadow-sm`}>
          <DynamicIcon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

// Enhanced StatsCard with gradient background option
export const GradientStatsCard = ({ title, value, change, gradient, loading, icon: Icon, subtitle }) => {
  const getIcon = () => {
    if (Icon) return Icon;
    
    if (title.includes('User')) return Users;
    if (title.includes('Restaurant')) return Store;
    if (title.includes('Order')) return Package;
    if (title.includes('Revenue')) return DollarSign;
    return Users;
  };

  const DynamicIcon = getIcon();

  const getTrendInfo = () => {
    if (change === undefined || change === 0) return null;
    
    const isPositive = change > 0;
    const color = isPositive ? 'text-green-200' : 'text-red-200';
    const Icon = isPositive ? TrendingUp : TrendingDown;
    
    return {
      color,
      Icon,
      value: `${Math.abs(change)}%`
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <div className={`${gradient} text-white rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium opacity-90 truncate">{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 sm:mt-2">
            {loading ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              value
            )}
          </p>
          
          {/* Subtitle and Trend */}
          <div className="flex items-center justify-between mt-2">
            {subtitle && (
              <p className="text-xs opacity-90">{subtitle}</p>
            )}
            
            {trendInfo && (
              <div className={`flex items-center space-x-1 text-xs ${trendInfo.color}`}>
                <trendInfo.Icon size={12} />
                <span>{trendInfo.value}</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Icon Container */}
        <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-lg ml-3 flex-shrink-0 backdrop-blur-sm">
          <DynamicIcon size={18} className="sm:w-5 sm:h-5 text-white" />
        </div>
      </div>
    </div>
  );
};

// Mini Stats Card for compact layouts
export const MiniStatsCard = ({ title, value, color, loading, icon: Icon }) => {
  const getIcon = () => {
    if (Icon) return Icon;
    return Users;
  };

  const DynamicIcon = getIcon();

  return (
    <div className="bg-white rounded-lg border border-[#FFF0C4] p-3 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-[#660B05] truncate">{title}</p>
          <p className="text-lg font-bold text-[#3E0703] mt-1">
            {loading ? (
              <div className="w-4 h-4 border-2 border-[#FFF0C4] border-t-[#8C1007] rounded-full animate-spin"></div>
            ) : (
              value
            )}
          </p>
        </div>
        <div className={`p-2 rounded-lg ${color} ml-2 flex-shrink-0`}>
          <DynamicIcon size={14} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;