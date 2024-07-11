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
app.use(bodyParser.json({ limit: '100000mb' }));
app.use(bodyParser.urlencoded({ limit: '100000mb', extended: true }));
app.use(express.json());

// Cloudinary configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 900000000 },
});

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Content Management Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

connectToDatabase();

const db = client.db("dmf_db");
const contentCollection = db.collection("content");

router.put('/save-content', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]), async (req, res) => {
  const { fullName, title, dateTime, body, uploadTime } = req.body;
  let imagePath = null;
  let videoUrl = null;

  try {
    if (req.files && req.files.image && req.files.image.length > 0) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'content-images' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.image[0].buffer);
      });
      imagePath = result.secure_url;
    }

    if (req.files && req.files.video && req.files.video.length > 0) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'content-videos' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.video[0].buffer);
      });
      videoUrl = result.secure_url;
    }

    const content = {
      imagePath,
      videoUrl,
      fullName,
      title,
      dateTime,
      body,
      uploadTime
    };

    const result = await contentCollection.insertOne(content);
    console.log('Content saved successfully:', result);
    res.status(200).json({ message: 'Content saved successfully!', id: result.insertedId });
  } catch (error) {
    console.error('Error saving content:', error);
    res.status(500).json({ message: 'Error saving content', error: error.message });
  }
});

router.post('/update-content', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
]), async (req, res) => {
  const { id, fullName, title, dateTime, body, uploadTime } = req.body;
  let imagePath = null;
  let videoUrl = null;

  try {
    if (req.files && req.files.image && req.files.image.length > 0) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'content-images' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.image[0].buffer);
      });
      imagePath = result.secure_url;
    }

    if (req.files && req.files.video && req.files.video.length > 0) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'video', folder: 'content-videos' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.files.video[0].buffer);
      });
      videoUrl = result.secure_url;
    }

    const updateData = {
      fullName,
      title,
      dateTime,
      body,
      uploadTime
    };

    if (imagePath) updateData.imagePath = imagePath;
    if (videoUrl) updateData.videoUrl = videoUrl;

    const result = await contentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      res.status(404).json({ message: 'Content not found' });
      return;
    }

    console.log(`Content with ID ${id} updated successfully`);
    res.status(200).json({ message: 'Content updated successfully!', imagePath, videoUrl });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(500).json({ message: 'Error updating content', error: error.message });
  }
});

router.delete('/delete-content/:id', async (req, res) => {
  const contentId = req.params.id;

  try {
    const result = await contentCollection.deleteOne({ _id: new ObjectId(contentId) });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Content not found' });
      return;
    }

    console.log(`Content with ID ${contentId} deleted successfully`);
    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({ message: 'Error deleting content', error: error.message });
  }
});

router.get('/get-content', async (req, res) => {
  try {
    const content = await contentCollection.find({}).toArray();
    const contentWithFormattedDate = content.map(item => ({
      ...item,
      id: item._id,
      dateTime: new Date(item.dateTime).toISOString().split('T')[0],
    }));

    console.log('Content fetched successfully:', contentWithFormattedDate);
    res.status(200).json(contentWithFormattedDate);
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({ message: 'Error fetching content', error: error.message });
  }
});

module.exports = router;