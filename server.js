// import express, nodemailer, cors and dotenv
const express = require("express")
const nodemailer = require("nodemailer")
const cors = require("cors")
const dotenv = require("dotenv")

// loads evertyhing from our .env file
dotenv.config()

// set up express app
const app = express()

// enable cors so the React app running on port 5173 can talk to this server
app.use(cors())

// parse incoming JSON data
app.use(express.json())

// configure Nodemailer with my email provider credentials
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    }
})

// create the API endpoint to handle contact form submissions
app.post("/api/contact", (req,res) => {

    // create a name, email and message variable holding the content from the req.body
    const {name, company, email, phone, response, subjects, message} = req.body

    // server-side data validation
    if (!name || !response || !message) {

        // if the data fails validation, send an error message to the user
        return res.status(400).json({
            error: "Name, Would you like a response and Message fields are required."
        })
    }

    // convert subjects array to a clean string list or set it to a fallback message if they checked nothing
    const selectedSubjectsList = subjects && subjects.length > 0 ? subjects.join(", ") : "No discussion topic selected"

    // define the format and routing layout of the incoming notification email
    const mailOptions = {
        from: process.env.EMAIL_USER, // sent FROM the app's designated sender email
        to: process.env.RECEIVER_EMAIL, // sent TO my personal inbox

        // if user gives an email, make me able to reply to it, if not, do nothing
        replyTo: email && email.trim() !== "" ? email : undefined,

        subject: `New Contact Form Submission from ${name}`,
        html: `
            <h3> New Message Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Company:</strong> ${company && company.trim() !== "" ? company : "No company provided"}</p>
            <p><strong>Email:</strong> ${email && email.trim() !== "" ? email : "No email provided"}</p>
            <p><strong>Phone Number:</strong> ${phone && phone.trim() !== "" ? phone : "No phone number provided"}</>

            <hr />

            <p><strong>Would they like a response:</strong> ${response}</p>
            <p><Strong>What would they like to talk about:</strong> ${selectedSubjectsList}</p>

            <hr />
            
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `,
    }

    // command the transporter to dispatch the email bundle
    transporter.sendMail(mailOptions, (error, info) => {
        
        // if there is an error
        if (error) {

            // log the error to the console and send a failed message to the user
            console.error("Email error:", error)
            return res.status(500).json({
                error: "Failed to send email."
            })
        }

        // if there is NO error, send a success message to the user
        return res.status(200).json({
            success: "Message sent successfully!"
        })
    })
})

// assign the port
const PORT = process.env.PORT || 5000

// start listening and send a message to the console so we know the server is listening successfully
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))