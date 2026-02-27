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
        const userSubject = 'We received your appointment request';
        const userHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">Thank you for contacting us, ${name}!</h2>
                <p style="font-size: 16px; color: #34495e;">We have received your appointment request and will review it shortly.</p>
                <p style="font-size: 16px; color: #34495e;">Our team will contact you soon to schedule your appointment at a convenient time.</p>
                <p style="font-size: 16px; color: #34495e;">You will receive a confirmation email once your appointment is fixed.</p>
                <p style="font-size: 16px; color: #34495e;"><strong>Your message:</strong><br>${message}</p>
                <p style="font-size: 16px; color: #34495e;">If you have any urgent questions, please call us at +123456789.</p>
                <hr style="border: 1px solid #ecf0f1;">
                <p style="font-size: 14px; color: #7f8c8d;">Best regards,<br>Your Company Name</p>
            </div>
        `;
        const userText = `Thank you for contacting us, ${name}!\n\nWe have received your message and will get back to you within 24 hours.\n\nYour message: ${message}\n\nIf you have any urgent questions, please call us at +123456789.\n\nBest regards,\nYour Company Name`;

        await sendEmail(email, userSubject, userText, userHtml);

        // 3. Send notification email to admin (now using submissionId)
        const adminSubject = 'New Appointment Request Received';
        const adminHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h3>New appointment request</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><a href="${process.env.ADMIN_PANEL_URL}/submissions/${submissionId}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none;">View in Admin Panel</a></p>
            </div>
        `;
        const adminText = `New appointment request from ${name} (${email}). Location: ${location}. Message: ${message}`;

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