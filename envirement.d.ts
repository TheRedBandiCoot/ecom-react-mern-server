declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT: string;
      MONGO_URI: string;
      STRIPE_KEY: string;
      clientEmail: string;
      privateKey: string;
      projectId: string;
    }
  }
}
export {};
