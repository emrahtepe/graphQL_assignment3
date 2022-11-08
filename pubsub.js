const { RedisPubSub } = require('graphql-redis-subscriptions');
const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const options = {
    host: process.env.REDIS_URI,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASS,
    retryStrategy: times => {
        return Math.min(times * 50, 2000);
    }
};

const pubsub = new RedisPubSub({
    publisher: new Redis(options),
    subscriber: new Redis(options)
});

module.exports = pubsub;