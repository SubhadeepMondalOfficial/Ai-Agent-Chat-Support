import { inngest } from "../client";
import Ticket from "../../models/ticket";
import { NonRetriableError } from "inngest";
import { analyzeTicket } from "../../utils/ai";
import User from "../../models/user";
import { sendMail } from "../../utils/mailer";


export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },

  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;
      
      //* fetch ticket from DB
      const ticketFromDB = await Ticket.findById(ticketId);
      const ticket = await step.run("fetch-ticket", async () => {
        if (!ticketFromDB) {
          throw new NonRetriableError("Ticket not found in DB");
        }

        return ticketFromDB;
      });

      //* Update ticket status in DB
      await step.run("update-ticket-status", async() => {
        await Ticket.findByIdAndUpdate(ticket._id, {status: "TODO"})
      })

      //its time to call ai agent
      const aiResponse = await analyzeTicket(ticket)

      const relatedSkills = await step.run("ai-processing", async () => {
        let skills = [];
        if(aiResponse){
            await Ticket.findByIdAndUpdate(ticket._id, {
                //checking ai is only giving required value or not
                priority: !['low', 'medium', 'high'].includes(aiResponse.priority) ? "medium" : aiResponse.priority,
                helpfulNotes: ticket.helpfulNotes,
                relatedSkills: ticket.relatedSkills,
                status: "In_Progress"
            })
            skills = aiResponse.relatedSkills
        }
        return skills // returning skills to the next pipeline because with matching of skills assign a tiket to a human moderator
      })

      //* Assign ticket to a human moderator
      const moderator = await step.run("assign-moderator", async() => {
        const user = await User.findOne({
          role: "moderator",
          skills: {
            $elemMatch: {
              $regex: relatedSkills.join("|"),
              $options: "i"
            }
          }
        })

        //if no relevent moderator found then finally assign ticket to any admin
        if(!user){
          user = await User.findOne({role: "admin"})
        }
        if(ticketFromDB){
          await Ticket.findByIdAndUpdate(ticketFromDB._id, {
            assignedTo: user?._id || null
          })
        }
        return user
      })

      await step.run("send-email-notification", async() => {
        if(moderator){
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket assigned to you.
            Please response fast!
            Ticket Id- ${ticketFromDB._id}
            Ticket Title- ${ticketFromDB.title}`
          )
        }
      })

      return {success: true}

    } catch (error) {
      console.error("❌ Error in running the step", error.message)
      return {success: false}
    }
  }
);
