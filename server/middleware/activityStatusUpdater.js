const Activity = require('../models/Activity');

/**
 * Middleware to automatically update activity statuses based on date/time
 * Run this on server startup and periodically
 */
const updateActivityStatuses = async () => {
  try {
    const now = new Date();
    
    // Mark activities as completed if their date has passed
    const result = await Activity.updateMany(
      {
        date: { $lt: now },
        status: { $in: ['upcoming', 'ongoing'] }
      },
      {
        $set: { status: 'completed' }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Auto-completed ${result.modifiedCount} expired activities`);
    }
    
    return result.modifiedCount;
  } catch (err) {
    console.error('❌ Error updating activity statuses:', err.message);
    return 0;
  }
};

/**
 * Initialize periodic status updates
 * Runs every 5 minutes
 */
const initActivityStatusUpdater = () => {
  // Run immediately on startup
  updateActivityStatuses();
  
  // Run every 5 minutes (300000 ms)
  setInterval(updateActivityStatuses, 5 * 60 * 1000);
  
  console.log('🔄 Activity status updater initialized (runs every 5 minutes)');
};

module.exports = {
  updateActivityStatuses,
  initActivityStatusUpdater
};
