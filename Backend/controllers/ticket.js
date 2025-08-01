import Ticket from "../models/ticket";
import {inngest} from "../inngest/client"

export const createTicket = async(req, res) => {
    try {
        const {title, description} = req.body;
        if(!title || !description){
            return res.status(400).json({message: "Title and Description are required!"})
        }
        const newTicket = await Ticket.create({
            title,
            description,
            createdBy: req.user._id.toString()
        })

        //Sending ticket to ai for futher processing
        await inngest.send({
            name: "ticket/created",
            data: {
                ticketId: newTicket._id.toString(),
                title,
                description,
                createdBy: req.user._id.toString()
            }
        })

        return res.status(201).json({
            message: "Ticket created and processing started",
            ticketDetails: newTicket
        })
        
    } catch (error) {
        console.error("Error whiling creating ticket", error.message);
        return res.status(500).json({errorMsg: "Unable to Create Ticket. Check console for details..."})
    }
}

export const getAllTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];

    //fetch all tickets for who having role admin or moderator
    if (user.role !== "user") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .sort({ createdBy: -1 });
    } else {
      //those who have only user role can get ticket created by himself
      tickets = await Ticket.find({ createdBy: user._id })
        .select("title description status createdAt")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({tickets})

  } catch (error) {
    console.error("Error whiling fetching all tickets", error.message);
    return res.status(500).json({errorMsg: "Unable to fetch Tickets. Check console for details..."})
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    const reqTicketId = req.params.id;
    let ticketDetails;

    //fetch any ticket details only who having moderator or admin role
    if (user.role !== "user") {
      ticketDetails = await Ticket.findById(reqTicketId).populate(
        "assignedTo",
        ["email", "_id"]
      );
    } else {
      //role=user can fetch only his created tickets
      ticketDetails = await Ticket.findOne({
        createdBy: user._id,
        _id: reqTicketId,
      }).select("title description status createdAt");
    }

    //handle in case we don't get ticket details
    if (!ticketDetails) {
      return res.status(404).json({ message: "Ticket Details not found!" });
    }

    return res.status(200).json({ ticketDetails });

  } catch (error) {
    console.error("Error whiling fetching a single ticket", error.message);
    return res.status(500).json({errorMsg: "Unable to fetch a ticket. Check console for details..."})
  }
};