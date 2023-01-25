const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    references: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    token: String,
    expires: Date,
    created: {
        type: Date,
        default: Date.now
    },
    revoked: Date,
});

schema.virtual('isExpired').get(function() {
    return Date.now() >= this.expires;
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function(doc, ret) {
        delete ret._id;
        delete ret.id;
    }
});

module.exports = mongoose.model('RefreshToken', schema);