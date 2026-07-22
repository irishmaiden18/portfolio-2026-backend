// import express, resend, cors and dotenv
const express = require("express")
const { Resend } = require("resend") // CHANGED: Swapped nodemailer for resend
const cors = require("cors")
const dotenv = require("dotenv")

// loads everything from our .env file
dotenv.config()

// set up express app
const app = express()

// enable cors so the React app running on Render can talk to this server
// app.use(cors({ 
//   origin: "https://portfolio-2026-front-end.onrender.com", 
//   methods: ["GET", "POST"] 
// }))

app.use(cors({ 
  origin: "https://www.webdesignbylaura.com/", 
  methods: ["GET", "POST"] 
}))

// parse incoming JSON data
app.use(express.json())

// CHANGED: Configure Resend using your dashboard API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Security Middleware: Only allow requests routing through Cloudflare
app.use((req, res, next) => {
  // Cloudflare always injects 'cf-connecting-ip' for proxied web traffic
  const isFromCloudflare = req.headers['cf-connecting-ip'];

  if (!isFromCloudflare) {
    console.warn(`⚠️ Blocked a direct non-Cloudflare request from IP: ${req.ip}`);
    return res.status(403).json({ 
      error: "Access Denied. Direct connection to the origin server is forbidden." 
    });
  }

  next(); // Pass through safely if the header exists
});

// Add a simple root route to act as a health check for Render
app.get("/", (req, res) => {
  res.status(200).send("Server is awake and healthy!")
})

// create the API endpoint to handle contact form submissions
app.post("/api/contact", async (req, res) => { // ADDED: "async" keyword here
  // create a name, email and message variable holding the content from the req.body
  const { name, company, email, phone, response, subjects, message } = req.body

  console.log(`Received contact form submission from: ${name}`)

  // server-side data validation
  if (!name || !response || !message) {
    return res.status(400).json({ error: "Name, Response preference, and Message fields are required." })
  }

  // convert subjects array to a clean string list or set it to a fallback message if they checked nothing
  const selectedSubjectsList = subjects && subjects.length > 0 ? subjects.join(", ") : "No discussion topic selected"

  // CHANGED: Use a try/catch block to handle the asynchronous Resend web request
  try {
    // command Resend to dispatch the email bundle via standard web ports
    const data = await resend.emails.send({
      from: "Portfolio Form <onboarding@resend.dev>", // Keep this exact default address for the free tier
      to: process.env.RECEIVER_EMAIL,                // Your personal email where you want to get alerts
      replyTo: email && email.trim() !== "" ? email : undefined, // Allows you to click reply in your inbox
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <h3>New Message Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Company:</strong> ${company && company.trim() !== "" ? company : "No company provided"}</p>
        <p><strong>Email:</strong> ${email && email.trim() !== "" ? email : "No email provided"}</p>
        <p><strong>Phone Number:</strong> ${phone && phone.trim() !== "" ? phone : "No phone number provided"}</p>
        <hr />
        <p><strong>Would they like a response:</strong> ${response}</p>
        <p><strong>What would they like to talk about:</strong> ${selectedSubjectsList}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `,
    })

    console.log("Email sent successfully via Resend:", data.id)
    return res.status(200).json({ success: "Message sent successfully!" })

  } catch (error) {
    console.error("Resend error details:", error)
    return res.status(500).json({ error: "Failed to send email via API endpoint." })
  }
})

// assign the port
const PORT = process.env.PORT || 5000

// start listening and send a message to the console
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
