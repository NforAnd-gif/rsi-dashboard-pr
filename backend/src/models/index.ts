import User from './User';
import Stall from './Stall';
import MenuItem from './MenuItem';
import Review from './Review';
import Like from './Like';
import Flag from './Flag';
import AuditLog from './AuditLog';

// USERS → STALLS
User.hasMany(Stall, {
    foreignKey: 'owner_id',
    as: 'stalls'
});

Stall.belongsTo(User, {
    foreignKey: 'owner_id',
    as: 'owner'
});

// STALLS → MENU_ITEMS
Stall.hasMany(MenuItem, {
    foreignKey: 'stall_id',
    as: 'menuItems'
});

MenuItem.belongsTo(Stall, {
    foreignKey: 'stall_id',
    as: 'stall'
});

// STALLS → REVIEWS
Stall.hasMany(Review, {
    foreignKey: 'stall_id',
    as: 'reviews'
});

Review.belongsTo(Stall, {
    foreignKey: 'stall_id',
    as: 'stall'
});

// USERS → REVIEWS
User.hasMany(Review, {
    foreignKey: 'user_id',
    as: 'reviews'
});

Review.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// REVIEWS → LIKES
Review.hasMany(Like, {
    foreignKey: 'review_id',
    as: 'likes'
});

Like.belongsTo(Review, {
    foreignKey: 'review_id',
    as: 'review'
});

// USERS → LIKES
User.hasMany(Like, {
    foreignKey: 'user_id',
    as: 'likes'
});

Like.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// REVIEWS → FLAGS
Review.hasMany(Flag, {
    foreignKey: 'review_id',
    as: 'flags'
});

Flag.belongsTo(Review, {
    foreignKey: 'review_id',
    as: 'review'
});

// USERS → FLAGS
User.hasMany(Flag, {
    foreignKey: 'reported_by',
    as: 'flags'
});

Flag.belongsTo(User, {
    foreignKey: 'reported_by',
    as: 'reporter'
});

// USERS → AUDIT_LOGS
User.hasMany(AuditLog, {
    foreignKey: 'user_id',
    as: 'auditLogs'
});

AuditLog.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

export {
    User,
    Stall,
    MenuItem,
    Review,
    Like,
    Flag,
    AuditLog
};