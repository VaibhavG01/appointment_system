// models/FormSubmission.js
import mongoose from 'mongoose';

const formSubmissionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    message: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    appointmentDate: { type: Date }, // only set when approved
    createdAt: { type: Date, default: Date.now }
});

const FormSubmission = mongoose.model('FormSubmission', formSubmissionSchema);
export default FormSubmission;