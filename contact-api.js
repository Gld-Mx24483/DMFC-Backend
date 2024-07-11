//contact-api.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');

const router = express.Router();
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Contact API Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const contactsCollection = db.collection("contacts");
const adminMessagesCollection = db.collection("admin_messages");
const broadcastMessagesCollection = db.collection("broadcast_messages");

router.post('/submit-contact-form', async (req, res) => {
  const { name, email, phone, message } = req.body;

  try {
    const result = await contactsCollection.insertOne({
      name,
      email,
      phone,
      message,
      created_at: new Date()
    });
    console.log('Contact form submitted successfully:', result);
    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Error submitting form' });
  }
});

router.post('/save-admin-response', async (req, res) => {
  const { userMessageId, userEmail, adminResponse } = req.body;

  try {
    const result = await adminMessagesCollection.insertOne({
      user_message_id: userMessageId,
      user_email: userEmail,
      admin_message: adminResponse,
      created_at: new Date()
    });
    console.log('Admin response saved successfully:', result);
    res.status(200).json({ message: 'Admin response saved successfully' });
  } catch (error) {
    console.error('Error saving admin response:', error);
    res.status(500).json({ error: 'Error saving admin response' });
  }
});

router.post('/submit-admin-broadcast', async (req, res) => {
  const { message } = req.body;

  try {
    const result = await broadcastMessagesCollection.insertOne({
      message,
      created_at: new Date()
    });
    console.log('Broadcast message submitted successfully:', result);
    res.status(200).json({ message: 'Broadcast message submitted successfully' });
  } catch (error) {
    console.error('Error submitting broadcast message:', error);
    res.status(500).json({ error: 'Error submitting broadcast message' });
  }
});

router.get('/get-contact-messages', async (req, res) => {
  try {
    const messages = await contactsCollection.find({}).toArray();
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ error: 'Error fetching contact messages' });
  }
});

router.get('/get-admin-reply', async (req, res) => {
  const userEmail = req.query.email;

  try {
    const reply = await adminMessagesCollection.findOne(
      { user_email: userEmail },
      { sort: { created_at: -1 } }
    );

    if (reply) {
      res.status(200).json({ adminReply: reply.admin_message });
    } else {
      res.status(200).json({ adminReply: 'No reply found for the given email' });
    }
  } catch (error) {
    console.error('Error fetching admin reply:', error);
    res.status(500).json({ error: 'Error fetching admin reply' });
  }
});

router.get('/get-user-messages-with-admin-responses', async (req, res) => {
  try {
    const messages = await contactsCollection.aggregate([
      {
        $lookup: {
          from: "admin_messages",
          localField: "_id",
          foreignField: "user_message_id",
          as: "admin_response"
        }
      },
      {
        $project: {
          id: "$_id",
          name: 1,
          email: 1,
          message: 1,
          created_at: 1,
          admin_message: { $arrayElemAt: ["$admin_response.admin_message", 0] }
        }
      },
      { $sort: { created_at: -1 } }
    ]).toArray();

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching user messages with admin responses:', error);
    res.status(500).json({ error: 'Error fetching user messages' });
  }
});

router.get('/get-admin-broadcast-messages', async (req, res) => {
  try {
    const messages = await broadcastMessagesCollection.find({})
      .sort({ created_at: -1 })
      .toArray();
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error fetching broadcast messages:', error);
    res.status(500).json({ error: 'Error fetching broadcast messages' });
  }
});

module.exports = router;