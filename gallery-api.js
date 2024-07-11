//gallery-api.js
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
    console.log("Gallery Management Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const galleryCollection = db.collection("gallery");

router.post('/upload-media', upload.single('media'), async (req, res) => {
  const { title, date } = req.body;
  let mediaUrl = null;

  if (req.file) {
    try {
      // Upload media to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'gallery' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      mediaUrl = result.secure_url;

      const mediaItem = {
        title,
        mediaUrl,
        mediaType: result.resource_type, // 'image' or 'video'
        uploadDate: date
      };

      const insertResult = await galleryCollection.insertOne(mediaItem);
      console.log('Media uploaded successfully:', insertResult);
      res.status(200).json({ message: 'Media uploaded successfully!', id: insertResult.insertedId, mediaUrl });
    } catch (error) {
      console.error('Error uploading media:', error);
      res.status(500).json({ message: 'Error uploading media', error: error.message });
    }
  } else {
    res.status(400).json({ message: 'No media file uploaded' });
  }
});

router.get('/get-media', async (req, res) => {
  try {
    const media = await galleryCollection.find({}).toArray();
    console.log('Media fetched successfully:', media);
    res.status(200).json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ message: 'Error fetching media', error: error.message });
  }
});

router.delete('/delete-media/:id', async (req, res) => {
  const mediaId = req.params.id;

  try {
    const result = await galleryCollection.deleteOne({ _id: new ObjectId(mediaId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Media not found' });
      return;
    }

    console.log(`Media with ID ${mediaId} deleted successfully`);
    res.status(200).json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({ message: 'Error deleting media', error: error.message });
  }
});

module.exports = router;