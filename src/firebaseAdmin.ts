import admin from 'firebase-admin';
import { config } from 'dotenv';
config({
  path: './.env'
});

admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: `${process.env.clientEmail}`,
    privateKey: `${process.env.privateKey.replace(/\\n/g, '\n')}`,
    projectId: `${process.env.projectId}`
  })
});

export default admin;
