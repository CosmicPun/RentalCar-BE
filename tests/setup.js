const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

dotenv.config({ path: './config/config.env' });

process.env.JWT_SECRET = process.env.JWT_SECRET;
process.env.JWT_EXPIRE = process.env.JWT_EXPIRE;
process.env.JWT_COOKIE_EXPIRE = process.env.JWT_COOKIE_EXPIRE;
process.env.NODE_ENV = 'test';

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany();
    }
});