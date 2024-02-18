import admin from "firebase-admin";

const firebase = admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

export default {
  auth: firebase.auth(),
};
