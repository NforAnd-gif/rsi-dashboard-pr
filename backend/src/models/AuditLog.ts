import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class AuditLog extends Model {
    declare id: number;
    declare user_id: number;
    declare action: string;
    declare target_table: string;
    declare target_id: number;
    declare metadata: string | null;
    declare created_at: Date;
}

AuditLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        action: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },

        target_table: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },

        target_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        metadata: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'AUDIT_LOGS',
        timestamps: false,
    },
);

export default AuditLog;