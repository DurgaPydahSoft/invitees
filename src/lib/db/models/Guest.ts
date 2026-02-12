import mongoose, { Schema, Document } from 'mongoose';

export interface IGuest extends Document {
    name: string;
    phoneNumber?: string;
    remarks?: string;
    area?: string;
    invitedStatus: 'NOT INVITED' | 'INVITED';
    attendanceStatus: 'NOT ATTENDED' | 'ATTENDED';
    checkInTime?: Date;
    uniqueId: string;
    createdAt: Date;
    updatedAt: Date;
}

const GuestSchema: Schema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        phoneNumber: { type: String, trim: true },
        remarks: { type: String, trim: true },
        area: { type: String, trim: true },
        invitedStatus: {
            type: String,
            enum: ['NOT INVITED', 'INVITED'],
            default: 'NOT INVITED',
        },
        attendanceStatus: {
            type: String,
            enum: ['NOT ATTENDED', 'ATTENDED'],
            default: 'NOT ATTENDED',
        },
        checkInTime: { type: Date },
        uniqueId: { type: String, required: true, unique: true },
    },
    { timestamps: true }
);

// Modern Mongoose pre-save hook (Sync version, no 'next' callback)
GuestSchema.pre('save', function () {
    if (this.isModified('name')) {
        const name = this.get('name') as string;
        if (name) {
            this.set('name', name
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' '));
        }
    }
});

// Force refresh model if hook changed
if (mongoose.models.Guest) {
    delete mongoose.models.Guest;
}

export default mongoose.model<IGuest>('Guest', GuestSchema);
