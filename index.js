const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const router = express.Router();

// Enable CORS
app.use(cors());
app.use(express.json());

router.post("/log-user-details", (req, res) => {
  const userDetails = req.body;
  const userName = req.body.userName;

  // Prepare user data with timestamp and dateEdited
  const userData = {
    ...userDetails,
    timestamp: new Date().toISOString(),
    dateEdited: getDateEdited(),
  };

  // Get today's date
  const today = new Date();
  const formattedDate = `${today.getDate()}-${
    today.getMonth() + 1
  }-${today.getFullYear()}`;

  // Create directory if it doesn't exist
  const logFolderPath = path.join(__dirname, "log");
  if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
  }

  const fileName = `${formattedDate}-${userName}.json`;
  const filePath = path.join(logFolderPath, fileName);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // If file doesn't exist, create a new file
      fs.writeFile(filePath, JSON.stringify([userData]), (err) => {
        if (err) {
          console.error("Error creating file:", err);
          return res.status(500).send("Error creating file");
        }
        console.log("File created successfully", userData);
        res.json(userData);
      });
    } else {
      // If file exists, append data to it
      fs.readFile(filePath, "utf8", (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return res.status(500).send("Error reading file");
        }

        // Parse existing data
        let existingData = [];
        try {
          existingData = JSON.parse(data);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          return res.status(500).send("Error parsing JSON");
        }

        // Append new data
        userData.dateEdited = getDateEdited(); // Update dateEdited before appending
        existingData.push(userData);

        // Write updated data back to file
        fs.writeFile(filePath, JSON.stringify(existingData), (err) => {
          if (err) {
            console.error("Error writing to file:", err);
            return res.status(500).send("Error writing to file");
          }
          console.log("Data appended to file", userData);
          res.json(userData);
        });
      });
    }
  });
});

// Function to get dateEdited in the format dd-mm-yyyy-hh:mm:ss
function getDateEdited() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = today.getFullYear();
  const hours = String(today.getHours()).padStart(2, "0");
  const minutes = String(today.getMinutes()).padStart(2, "0");
  const seconds = String(today.getSeconds()).padStart(2, "0");
  return `${day}-${month}-${year}-T-${hours}:${minutes}:${seconds}`;
}

// Using the router
app.use("/", router);

// Making the port dynamic
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server Started at port ${PORT}`);
});
