const User = require('../models/User');
require('./setup');

describe('User Model', () => {
    it('should generate a signed JWT token', async () => {
        const user = await User.create({
            name: 'Test',
            email: 'test@test.com',
            password: 'password123',
            telephone: '0812345678'
        });
        const token = user.getSignedJwtToken();
        expect(token).toBeDefined();
    });

    it('should match password correctly', async () => {
        const user = await User.create({
            name: 'Test',
            email: 'test2@test.com',
            password: 'password123',
            telephone: '0812345678'
        });
        const isMatch = await user.matchPassword('password123');
        expect(isMatch).toBe(true);
        
        const isNotMatch = await user.matchPassword('wrong');
        expect(isNotMatch).toBe(false);
    });

    it('should not re-hash password if not modified', async () => {
        const user = await User.create({
            name: 'Test',
            email: 'test3@test.com',
            password: 'password123',
            telephone: '0812345678'
        });
        user.name = 'Updated';
        await user.save();
        const isMatch = await user.matchPassword('password123');
        expect(isMatch).toBe(true);
    });
});
