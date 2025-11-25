// routes/admin.js
GET /api/admin/dashboard/stats       // Overall statistics
GET /api/admin/users                 // All users data  
GET /api/admin/restaurants          // All restaurants
GET /api/admin/orders               // All orders
GET /api/dmin/products               //all menu



// routes/admin.js
router.get('/dashboard/stats', adminAuth, async (req, res) => {
    try {
      const userCount = await User.countDocuments();
      const restaurantCount = await Restaurant.countDocuments();
      const orderCount = await Order.countDocuments();
      const productCount = await Product.countDocuments();
      
      const revenue = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
  
      res.json({
        success: true,
        data: {
          totalUsers: userCount,
          totalRestaurants: restaurantCount,
          totalOrders: orderCount,
          totalProducts: productCount,
          totalRevenue: revenue[0]?.total || 0
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  router.get('/users', adminAuth, async (req, res) => {
    try {
      const users = await User.find().select('-password');
      res.json({ success: true, users });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Add similar routes for restaurants, orders, products