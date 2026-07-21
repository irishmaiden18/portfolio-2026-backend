// create the API endpoint to handle contact form submissions
app.post("/api/contact", (req, res) => {
  // create a name, email and message variable holding the content from the req.body
  const { name, company, email, phone, response, subjects, message } = req.body

  // 1. FIXED: Log incoming request to Render logs so you can see it arrive!
  console.log("Received contact form submission from:", name);

  // server-side data validation
  if (!name || !response || !message) {
    console.warn("Validation failed: Missing required fields.");
    return res.status(400).json({ error: "Name, Response preference, and Message fields are required." })
  }

  // convert subjects array to a clean string list or set it to a fallback message if they checked nothing
  const selectedSubjectsList = subjects && subjects.length > 0 ? subjects.join(", ") : "No discussion topic selected"

  // define the format and routing layout of the incoming notification email
  const mailOptions = {
    from: process.env.EMAIL_USER, // sent FROM the app's designated sender email
    to: process.env.RECEIVER_EMAIL, // sent TO my personal inbox 
    replyTo: email && email.trim() !== "" ? email : undefined,
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
  }

  // command the transporter to dispatch the email bundle
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      // 2. FIXED: Log the exact structural mailer error to Render dashboard console
      console.error("Nodemailer transporter error details:", error)
      return res.status(500).json({ error: "Failed to send email setup configuration." })
    }
    
    console.log("Email dispatched successfully:", info.messageId);
    return res.status(200).json({ success: "Message sent successfully!" })
  })
})
