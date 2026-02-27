import express from 'express';
const FormRouter = express.Router();
import { formData, getSubmissionById, getSubmissions } from '../controllers/Form.controller.js';
import isAuth from '../middlewares/isAuth.js';

FormRouter.post('/submit', formData);
FormRouter.get('/getform', isAuth, getSubmissions);
// getbyid
FormRouter.get('/getform/:id', isAuth, getSubmissionById);

export default FormRouter;