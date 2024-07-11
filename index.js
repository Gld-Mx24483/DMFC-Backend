// // index.js
// const express = require('express');
// const bodyParser = require('body-parser');
// const cors = require('cors');
// const path = require('path');
// const galleryAPI = require('./gallery-api');
// const teamAPI = require('./team-api');
// const volunteerAPI = require('./volunteer-api');
// const contactAPI = require('./contact-api');
// const contentManagementAPI = require('./content-management-api');
// const eventManagementAPI = require('./event-management-api');
// const app = express();
// // const { MongoClient } = require('mongodb');

// app.use(cors());
// app.use(bodyParser.json({ limit: '100000mb' }));
// app.use(bodyParser.urlencoded({  limit: '100000mb', extended: true }));
// app.use(express.json());


// app.use('/', teamAPI);
// app.use('/', galleryAPI);
// app.use('/', contactAPI);
// app.use('/', contentManagementAPI);
// app.use('/', volunteerAPI);
// app.use('/', eventManagementAPI);
// app.use("/", (req,res) => {
//   res.send("Server deployed and running on vercel.");
// })

// // app.use(cors({
// //   origin: 'https://dmfc.vercel.app'
// // }));

// app.use(cors({
//   origin: 'http://localhost:9000'
// }));

// const port = process.env.PORT || 9000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

// index.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const galleryAPI = require('./gallery-api');
const teamAPI = require('./team-api');
const volunteerAPI = require('./volunteer-api');
const contactAPI = require('./contact-api');
const contentManagementAPI = require('./content-management-api');
const eventManagementAPI = require('./event-management-api');

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '100000mb' }));
app.use(bodyParser.urlencoded({  limit: '100000mb', extended: true }));
app.use(express.json());

app.use('/', teamAPI);
app.use('/', galleryAPI);
app.use('/', contactAPI);
app.use('/', contentManagementAPI);
app.use('/', volunteerAPI);
app.use('/', eventManagementAPI);

app.use("/", (req,res) => {
  res.send("Server deployed and running on vercel.");
});

app.use(cors({
  origin: 'http://localhost:9000'
}));

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  // Print statement to check if environment variables are loaded
  const envVars = ['MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const loadedVars = envVars.filter(varName => process.env[varName]);
  
  if (loadedVars.length === envVars.length) {
    console.log("Environment variables loaded successfully:");
    loadedVars.forEach(varName => {
      console.log(`- ${varName}: ${process.env[varName].substring(0, 5)}...`);
    });
  } else {
    console.log("Error: Some environment variables are not loaded properly");
    console.log("Loaded variables:");
    loadedVars.forEach(varName => {
      console.log(`- ${varName}: ${process.env[varName].substring(0, 5)}...`);
    });
    console.log("Missing variables:");
    envVars.filter(varName => !process.env[varName]).forEach(varName => {
      console.log(`- ${varName}`);
    });
  }
});