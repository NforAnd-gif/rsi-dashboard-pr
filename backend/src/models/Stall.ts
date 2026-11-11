import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Stall extends Model {
    declare id: number;
    declare owner_id: number;
    declare name: string;
    declare category: string | null;
    declare location: string | null;
    declare description: string | null;
    declare avg_rating: number;
    declare review_count: number;
    declare created_at: Date;
}

Stall.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        owner_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        category: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },

        location: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        avg_rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: false,
            defaultValue: 0,
        },

        review_count: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'STALLS',
        timestamps: false,
    },
);

export default Stall;