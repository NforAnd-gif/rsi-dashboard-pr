import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Review extends Model {
    declare id: number;
    declare stall_id: number;
    declare user_id: number;
    declare rating: number;
    declare comment: string | null;
    declare like_count: number;
    declare created_at: Date;
    declare updated_at: Date | null;
}

Review.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        stall_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5,
                isInt: true,
            },
        },

        comment: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        like_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },

        updated_at: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        tableName: 'REVIEWS',
        timestamps: false,
    },
);

export default Review;