import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    clientEmail: `${process.env.clientEmail}`,
    privateKey: `${process.env.privateKey.replace(/\\n/g, '\n')}`,
    projectId: `${process.env.projectId}`
  })
});

export default admin;
