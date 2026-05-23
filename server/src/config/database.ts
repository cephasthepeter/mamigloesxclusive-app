import mongoose from 'mongoose';

/**
 * Resolve a mongodb+srv:// URI into a standard mongodb:// URI by
 * replacing the SRV hostname `cluster0.<hash>.mongodb.net` with
 * its concrete replica-set seed list:
 *   cluster0-shard-00-00.<hash>.mongodb.net:27017,
 *   cluster0-shard-00-01.<hash>.mongodb.net:27017,
 *   cluster0-shard-00-02.<hash>.mongodb.net:27017
 */
function resolveSrvUri(srvUri: string): string {
  const m = srvUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/]+)\/(.+)$/);
  if (!m) return srvUri;

  const [, credentials, hostWithDot, dbName] = m;
  // hostWithDot is something like: cluster0.1uqlqkd.mongodb.net
  // Strip the trailing .mongodb.net → cluster0.1uqlqkd
  const clusterSegment = hostWithDot.replace(/\.mongodb\.net$/, '');

  return [
    'mongodb://',
    credentials,
    '@',
    clusterSegment,
    '-shard-00-00.',
    clusterSegment,
    '.mongodb.net:27017,',
    clusterSegment,
    '-shard-00-01.',
    clusterSegment,
    '.mongodb.net:27017,',
    clusterSegment,
    '-shard-00-02.',
    clusterSegment,
    '.mongodb.net:27017',
    '/',
    dbName,
    '?replicaSet=atlas-',
    clusterSegment,
    '-shard-0&ssl=true&authSource=admin',
  ].join('');
}

const connectDB = async (): Promise<void> => {
  try {
    const rawUri = process.env.MONGODB_URI!;
    const resolvedUri = resolveSrvUri(rawUri);

    const conn = await mongoose.connect(resolvedUri, {
      // Mongoose 9.x reads from MONGODB_URI / the URI passed here;
      // no extra options needed.
    });

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;