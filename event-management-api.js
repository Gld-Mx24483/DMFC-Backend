//event-management-api.js
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const router = express.Router();
const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Cloudinary configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Event Management Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const eventsCollection = db.collection("events");

router.put('/save-event', upload.single('image'), async (req, res) => {
  const { title, dateTime, location, description, brief, time } = req.body;
  let imageUrl = null;

  if (req.file) {
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload_stream({
        resource_type: 'auto',
        public_id: `event_${Date.now()}`,
      }, async (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          res.status(500).json({ message: 'Error uploading image', error: error.message });
          return;
        }

        imageUrl = result.secure_url;

        const event = {
          title,
          dateTime,
          time,
          location,
          description,
          brief,
          imageUrl
        };

        try {
          const result = await eventsCollection.insertOne(event);
          console.log('Event saved successfully:', result);
          res.status(200).json({ message: 'Event saved successfully!', id: result.insertedId, imageUrl });
        } catch (error) {
          console.error('Error saving event:', error);
          res.status(500).json({ message: 'Error saving event', error: error.message });
        }
      }).end(req.file.buffer);
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ message: 'Error processing image', error: error.message });
    }
  } else {
    // If no image was uploaded, save the event without an image URL
    const event = {
      title,
      dateTime,
      time,
      location,
      description,
      brief,
      imageUrl
    };

    try {
      const result = await eventsCollection.insertOne(event);
      console.log('Event saved successfully:', result);
      res.status(200).json({ message: 'Event saved successfully!', id: result.insertedId });
    } catch (error) {
      console.error('Error saving event:', error);
      res.status(500).json({ message: 'Error saving event', error: error.message });
    }
  }
});

router.post('/update-event', upload.single('image'), async (req, res) => {
  const { id, title, dateTime, time, location, description, brief } = req.body;
  let imageUrl = null;

  if (req.file) {
    try {
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload_stream({
        resource_type: 'auto',
        public_id: `event_${Date.now()}`,
      }, async (error, result) => {
        if (error) {
          console.error('Error uploading to Cloudinary:', error);
          res.status(500).json({ message: 'Error uploading image', error: error.message });
          return;
        }

        imageUrl = result.secure_url;

        const updateData = {
          title,
          dateTime,
          time,
          location,
          description,
          brief,
          imageUrl
        };

        try {
          const result = await eventsCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
          );

          if (result.matchedCount === 0) {
            res.status(404).json({ message: 'Event not found' });
            return;
          }

          console.log(`Event with ID ${id} updated successfully`);
          res.status(200).json({ message: 'Event updated successfully!', imageUrl });
        } catch (error) {
          console.error('Error updating event:', error);
          res.status(500).json({ message: 'Error updating event', error: error.message });
        }
      }).end(req.file.buffer);
    } catch (error) {
      console.error('Error processing image:', error);
      res.status(500).json({ message: 'Error processing image', error: error.message });
    }
  } else {
    // If no new image was uploaded, update the event without changing the image URL
    const updateData = {
      title,
      dateTime,
      time,
      location,
      description,
      brief
    };

    try {
      const result = await eventsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        res.status(404).json({ message: 'Event not found' });
        return;
      }

      console.log(`Event with ID ${id} updated successfully`);
      res.status(200).json({ message: 'Event updated successfully!' });
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: 'Error updating event', error: error.message });
    }
  }
});

router.delete('/delete-event/:id', async (req, res) => {
  const eventId = req.params.id;

  try {
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(eventId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Event not found' });
      return;
    }

    console.log(`Event with ID ${eventId} deleted successfully`);
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
});

router.get('/get-events', async (req, res) => {
  try {
    const events = await eventsCollection.find({}).toArray();
    const eventsWithFullUrls = events.map(item => ({
      ...item,
      id: item._id,
      imageUrl: item.imageUrl,
    }));

    console.log('Events fetched successfully:', eventsWithFullUrls);
    res.status(200).json(eventsWithFullUrls);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
});

module.exports = router;