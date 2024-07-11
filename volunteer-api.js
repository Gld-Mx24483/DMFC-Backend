//volunteer-api.js
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
    console.log("Volunteer Management Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const volunteersCollection = db.collection("volunteers");

// Handle form submission
router.put('/submit-volunteer-form', async (req, res) => {
  const { fullName, address, phoneNumber, email, volunteerFor } = req.body;

  const volunteer = {
    fullName,
    address,
    phoneNumber,
    email,
    volunteerFor,
    submissionDate: new Date() 
  };

  try {
    const result = await volunteersCollection.insertOne(volunteer);
    console.log('Volunteer form submitted successfully:', result);
    res.status(200).json({ message: 'Form submitted successfully', id: result.insertedId });
  } catch (error) {
    console.error('Error submitting volunteer form:', error);
    res.status(500).json({ message: 'Error submitting form', error: error.message });
  }
});

router.get('/get-volunteers', async (req, res) => {
  try {
    const volunteers = await volunteersCollection.find({}).toArray();
    const volunteersWithIds = volunteers.map(volunteer => ({
      ...volunteer,
      id: volunteer._id
    }));

    console.log('Volunteers fetched successfully:', volunteersWithIds);
    res.status(200).json(volunteersWithIds);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ message: 'Error fetching volunteers', error: error.message });
  }
});

// New route to delete a volunteer
router.delete('/delete-volunteer/:id', async (req, res) => {
  const volunteerId = req.params.id;

  try {
    const result = await volunteersCollection.deleteOne({ _id: new ObjectId(volunteerId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Volunteer not found' });
      return;
    }

    console.log(`Volunteer with ID ${volunteerId} deleted successfully`);
    res.status(200).json({ message: 'Volunteer deleted successfully' });
  } catch (error) {
    console.error('Error deleting volunteer:', error);
    res.status(500).json({ message: 'Error deleting volunteer', error: error.message });
  }
});

module.exports = router;