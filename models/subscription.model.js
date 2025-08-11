const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: {
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true },
        },
    },
});

// Prevent storing the same subscription endpoint multiple times
SubscriptionSchema.index({ 'subscription.endpoint': 1 }, { unique: true });

module.exports = mongoose.model('Subscription', SubscriptionSchema);