import FormSubmission from "../model/Form.model.js";
import { sendEmail } from "../utility/Mail.js";


export const approve = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate } = req.body; // expecting ISO date string

        if (!appointmentDate) {
            return res.status(400).json({ message: 'Appointment date is required' });
        }

        const submission = await FormSubmission.findById(id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = 'approved';
        submission.appointmentDate = new Date(appointmentDate);
        await submission.save();

        // Send confirmation email to user
        const userSubject = 'Your appointment has been confirmed';
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #27ae60;">Appointment Confirmed</h2>
                <p>Dear ${submission.name},</p>
                <p>Your appointment has been confirmed for <strong>${new Date(appointmentDate).toLocaleString()}</strong>.</p>
                <p>If you need to reschedule, please contact us.</p>
                <p>Thank you for choosing us.</p>
            </div>
        `;
        const userText = `Your appointment has been confirmed for ${new Date(appointmentDate).toLocaleString()}.`;

        await sendEmail(submission.email, userSubject, userText, userHtml);

        res.json({ message: 'Appointment approved and user notified' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const reject = async (req, res) => {
    try {
        const { id } = req.params;

        const submission = await FormSubmission.findById(id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }

        submission.status = 'rejected';
        await submission.save();

        // Optionally send rejection email to user
        const userSubject = 'Update on your appointment request';
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #e74c3c;">Appointment Request Update</h2>
                <p>Dear ${submission.name},</p>
                <p>We regret to inform you that we cannot accommodate your appointment request at this time.</p>
                <p>Please contact us for further assistance.</p>
            </div>
        `;
        const userText = `We regret to inform you that we cannot accommodate your appointment request at this time.`;

        await sendEmail(submission.email, userSubject, userText, userHtml);

        res.json({ message: 'Appointment rejected' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}