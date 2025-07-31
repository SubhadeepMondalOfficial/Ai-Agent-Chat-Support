import { inngest } from "../client";
import User from "../../models/user";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer";

export const onUserSignup = inngest.createFunction(
  { id: "on-user-signup", retries: 2 },
  { event: "user/signup" },

  async ({ event, step }) => {
    try {
      const { email } = event.data;
      const user = await step.run("get-user-email", async () => {
        const userObject = await User.findOne({ email });
        if (!userObject)
          throw new NonRetriableError("User email not exist in DB");
        return userObject;
      });

      await step.run("send-welcome-email", async () => {
        const subject = `Welcome to the app`;
        const message = `Hi,
        \n\n
        Thanks for Signing up! We are Happy to found you in your platform.
        `;

        await sendMail(user.email, subject, message);
      });

      return { success: true };
      
    } catch (error) {
      console.error(
        "❌ Error running step on signup ErrorMsg=> ",
        error.message
      );
      return { success: false };
    }
  }
);
