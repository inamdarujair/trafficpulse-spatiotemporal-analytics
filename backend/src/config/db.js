const dns = require('dns');
// Ensure reliable SRV resolution on Windows environments
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Fall back to default if custom servers cannot be set
}

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not defined in .env');
    }

    const conn = await mongoose.connect(mongoUri, {
      dbName: 'mumbai_traffic',
      serverSelectionTimeoutMS: 10000
    });
    
    console.log(`[DATABASE] MongoDB Atlas Connected: ${conn.connection.host}/${conn.connection.name}`);
    
    // Check and log collection counts on startup
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`[DATABASE] Available collections (${collections.length}):`);
    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      console.log(`  - ${col.name}: ${count} documents`);
    }
  } catch (error) {
    console.error(`[DATABASE ERROR] MongoDB Atlas Connection Failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
