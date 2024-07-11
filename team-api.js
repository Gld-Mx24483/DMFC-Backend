//team-api.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

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
    console.log("Team Management Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const teamCollection = db.collection("team");

router.put('/submit-team-form', async (req, res) => {
  const { fullName, address, phoneNumber, email, role } = req.body;

  const teamMember = {
    fullName,
    address,
    phoneNumber,
    email,
    role,
    status: 'pending',
    createdAt: new Date()
  };

  try {
    const result = await teamCollection.insertOne(teamMember);
    console.log('Team member form submitted successfully:', result);
    res.status(200).json({ message: 'Form submitted successfully', insertedId: result.insertedId });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
});

router.post('/accept-request/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await teamCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { status: "accepted" } }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    console.log(`User with ID ${userId} accepted successfully`);
    res.status(200).json({ message: 'Request accepted successfully' });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ message: 'Error accepting request', error: error.message });
  }
});

router.get('/get-team-members', async (req, res) => {
  const status = req.query.status;
  const email = req.query.email;
  let query = {};

  if (status === 'pending') {
    query.status = "pending";
  } else if (status === 'accepted') {
    query.status = "accepted";
  }

  if (email) {
    query.email = email;
  }

  try {
    const teamMembers = await teamCollection.find(query).toArray();
    const formattedTeamMembers = teamMembers.map(member => ({
      id: member._id,
      fullName: member.fullName,
      email: member.email,
      address: member.address,
      phoneNumber: member.phoneNumber,
      role: member.role,
      createdAt: member.createdAt
    }));

    console.log('Team members fetched successfully:', formattedTeamMembers);
    res.status(200).json(formattedTeamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Error fetching team members', error: error.message });
  }
});

router.delete('/delete-team-member/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await teamCollection.deleteOne({ _id: new ObjectId(userId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Team member not found' });
      return;
    }

    console.log(`Team member with ID ${userId} deleted successfully`);
    res.status(200).json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Error deleting team member:', error);
    res.status(500).json({ message: 'Error deleting team member', error: error.message });
  }
});

router.delete('/reject-request/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await teamCollection.deleteOne({ _id: new ObjectId(userId), status: "pending" });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Pending request not found' });
      return;
    }

    console.log(`Request with ID ${userId} rejected successfully`);
    res.status(200).json({ message: 'Request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
});

module.exports = router;