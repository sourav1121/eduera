import admin from "firebase-admin";
import serviceAccount from "../../.firebase/service-account.json" assert {type: "json"};

const firebase = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default {
  auth: firebase.auth(),
};
