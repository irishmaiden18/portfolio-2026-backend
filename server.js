// import express, resend, cors and dotenv
const express = require("express")
const { Resend } = require("resend")
const cors = require("cors")
const dotenv = require("dotenv")

// loads everything from our .env file
dotenv.config()

// set up express app
const app = express()

// enable cors so the React app running on Render can talk to this server
app.use(cors({ 
  origin: "https://webdesignbylaura.com", 
  methods: ["GET", "POST"] 
}))

// parse incoming JSON data
app.use(express.json())

// configure Resend using Resend API key
// initializes the official software development kit for Resend using a unique API key linked to an account. this allows the backend to programatically send emails with Render which blocks traditional mail programs on free accounts
const resend = new Resend(process.env.RESEND_API_KEY)

// middleware that only allows requests routing through Cloudflare
app.use((req, res, next) => {

  // Cloudflare always injects 'cf-connecting-ip' for proxied web traffic, so all requests from there will have this string as a header with an IP address as the content
  // returns an IP address if the request comes from Cloudflare or undefined if it does not
  const isFromCloudflare = req.headers['cf-connecting-ip'];

  // if isFromCloudflare does not exist
  if (!isFromCloudflare) {

    // log a warning with the source IP
    console.warn(`⚠️ Blocked a direct non-Cloudflare request from IP: ${req.ip}`);

    // return a failure response
    return res.status(403).json({ 
      error: "Access Denied. Direct connection to the origin server is forbidden." 
    });
  }

  // if the required header does exist with a valid IP address, move on
  next();
});

// route used for automated infrastructure checks. Render uses this route to verify the application successfully started up before routing real users to it
app.get("/", (req, res) => {

  //send a success response
  res.status(200).send("Server is awake and healthy!")

})

// create the API endpoint to handle contact form submissions
app.post("/api/contact", async (req, res) => {
  
  // create a name, company, email, phone, response, subjects and message variables holding the content from the req.body
  const { name, company, email, phone, response, subjects, message } = req.body

  // if name, response or message is missing
  if (!name || !response || !message) {

    // send a failure response
    return res.status(400).json({ 
        error: "Name, Response preference, and Message fields are required." 
    })
  }

  // convert subjects array to a clean string list or set it to a fallback message if the user didn't check anything
  const selectedSubjectsList = subjects && subjects.length > 0 ? subjects.join(", ") : "No discussion topic selected"

  // try-catch block to handle the asynchronous Resend web request
  try {

    // sends email via Resend with contact form data to my secret email

    // calls the Resend software development kit's email delivery method; the await keyword pauses execution until Resend processes the email and the resulting delivery metadate is returned 
    const data = await resend.emails.send({

      // from email, required to be this by render for the free tier
      from: "Portfolio Form <onboarding@resend.dev>",
      
      // my secret email
      to: process.env.RECEIVER_EMAIL,                

      // sets reply email to the email provided by the user, unless they didn't provie one, in which it is undefined. Allows me to click reply in my inbox and reply directly to the user
      replyTo: email && email.trim() !== "" ? email : undefined, 

      // email subject line with user name
      subject: `New Contact Form Submission from ${name}`,

      // email content with contact form info. if no info is given, provides a string stating as much so it is not left blank in the email
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

    // return sa success response
    return res.status(200).json({ 
        success: "Message sent successfully!" 
    })

  // if the try block doesn't work
  } catch (error) {
    
    // log the error details
    console.error("Resend error details:", error)

    // return a failure resposnse
    return res.status(500).json({ 
        error: "Failed to send email via API endpoint." 
    })
  }
})

// assign the port
const PORT = process.env.PORT || 5000

// start listening and send a message to the console
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
