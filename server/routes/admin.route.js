// routes/admin.js
import express from 'express';
import { approve, reject } from '../controllers/Admin.controller.js';
import { getUserProfile, signIn, signOut, signUp } from '../controllers/Auth.controller.js';
import isAuth from '../middlewares/isAuth.js';

const AdminRouter = express.Router();

// signUp
AdminRouter.post('/signup', signUp);
// signIn
AdminRouter.post('/signin', signIn);
// signOut
AdminRouter.post('/signout', signOut);


AdminRouter.get('/me', isAuth, getUserProfile);

// Approve an appointment with a fixed date
AdminRouter.post('/submissions/:id/approve', isAuth, approve);

// Reject an appointment
AdminRouter.post('/submissions/:id/reject', isAuth, reject);

export default AdminRouter;