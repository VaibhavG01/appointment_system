import FormSubmission from "../model/Form.model.js";
import { sendEmail } from "../utility/Mail.js";


export const formData = async (req, res) => {
    try {
        const { name, email, location, message } = req.body;
        console.log('Received form data:', { name, email, location, message });

        // Validations
        if (!name || !email || !location || !message) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // 1. Save to database first (so we get an _id)
        const newSubmission = new FormSubmission({
            name,
            email,
            location,
            message,
            status: 'pending'
        });
        await newSubmission.save();
        const submissionId = newSubmission._id;
        console.log(submissionId)

        // 2. Send acknowledgment email to user
        const userSubject = 'VG Tech Studio | Appointment Request Received';

        const userHtml = `
            <div style="font-family: 'Segoe UI', sans-serif; background:#f4f6f9; padding:40px 20px;">
            <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
                
                <div style="background:#232055; padding:20px; text-align:center;">
                <h2 style="color:#ffffff; margin:0;">VG Tech Studio</h2>
                <p style="color:#cbd3ff; margin:5px 0 0;">Digital Solutions & Development</p>
                </div>

                <div style="padding:30px;">
                <h3 style="color:#232055;">Hello ${name},</h3>
                <p style="font-size:15px; color:#555;">
                    Thank you for reaching out to <strong>VG Tech Studio</strong>.
                    We have successfully received your appointment request.
                </p>

                <div style="background:#f1f3ff; padding:15px; border-left:4px solid #4088c7; margin:20px 0;">
                    <p><strong>Your Message:</strong></p>
                    <p style="margin:0;">${message}</p>
                </div>

                <p style="font-size:15px; color:#555;">
                    Our team will review your request and get back to you within <strong>24 hours</strong>.
                </p>

                <p style="font-size:14px; color:#777;">
                    If this is urgent, please contact us directly.
                </p>

                <hr style="border:none; border-top:1px solid #eee; margin:25px 0;">

                <p style="font-size:14px; color:#888;">
                    Regards,<br>
                    <strong>VG Tech Studio Team</strong><br>
                    Building Digital Presence That Converts 🚀
                </p>
                </div>
            </div>
            </div>
            `;

        const userText = `
            Hello ${name},

            Thank you for contacting VG Tech Studio.
            We have received your appointment request.

            Your Message:
            ${message}

            Our team will respond within 24 hours.

            Regards,
            VG Tech Studio
            `;

        await sendEmail(email, userSubject, userText, userHtml);

        // 3. Send notification email to admin (now using submissionId)
        const adminSubject = 'New Appointment | VG Tech Studio';

        const adminHtml = `
                <div style="font-family: 'Segoe UI', sans-serif; background:#f8f9fc; padding:30px;">
                <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; padding:25px; box-shadow:0 5px 20px rgba(0,0,0,0.05);">
                    
                    <h2 style="color:#232055; margin-bottom:20px;">New Appointment Request</h2>

                    <table style="width:100%; font-size:14px; border-collapse:collapse;">
                    <tr>
                        <td style="padding:8px 0;"><strong>Name:</strong></td>
                        <td>${name}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;"><strong>Email:</strong></td>
                        <td>${email}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;"><strong>Location:</strong></td>
                        <td>${location}</td>
                    </tr>
                    <tr>
                        <td style="padding:8px 0;"><strong>Message:</strong></td>
                        <td>${message}</td>
                    </tr>
                    </table>

                    <div style="text-align:center; margin-top:25px;">
                    <a href="${process.env.ADMIN_PANEL_URL}/submissions/${submissionId}" 
                        style="background:#4088c7; color:#fff; padding:12px 25px; text-decoration:none; border-radius:6px; font-weight:600;">
                        View in Admin Panel
                    </a>
                    </div>

                </div>
                </div>
        `;

        const adminText = `
            New Appointment Request - VG Tech Studio

            Name: ${name}
            Email: ${email}
            Location: ${location}
            Message: ${message}

            View: ${process.env.ADMIN_PANEL_URL}/submissions/${submissionId}
        `;

        await sendEmail(process.env.ADMIN_EMAIL, adminSubject, adminText, adminHtml);

        // 4. Respond to client
        res.status(200).json({
            message: 'Form submitted successfully. We will contact you within 24 hours.',
            data: { name, email, location, message }
        });

    } catch (error) {
        console.error('Error processing form data:', error);
        res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
};

export const getSubmissions = async (req, res) => {
    try {
        const submissions = await FormSubmission.find().sort({ createdAt: -1 });
        console.log('Fetched submissions:', submissions);
        res.status(200).json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ message: 'An error occurred while fetching submissions.' });
    }
};

export const getSubmissionById = async (req, res) => {
    try {
        const { id } = req.params;
        const submission = await FormSubmission.findById(id);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.status(200).json(submission);
    } catch (error) {
        console.error('Error fetching submission by ID:', error);
        res.status(500).json({ message: 'An error occurred while fetching the submission.' });
    }
};