const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

require('dotenv').config();

const app = express();
app.use(cors({origin: 'http://localhost:3000'}));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.SECRET_KEY || "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/webhooks";

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// Schemas
const UserSchema = new mongoose.Schema({
  username: String,
  password: String
});

const WebhookSubscriptionSchema = new mongoose.Schema({
  url: String,
  source: String,
  secret: String,
  username:String
});

const WebhookEventSchema = new mongoose.Schema({
  eventType: String,
  payload: Object,
  timestamp: Date,
  deliveryStatus: String,
});

// Models
const User = mongoose.model("User", UserSchema);
const WebhookSubscription = mongoose.model("WebhookSubscription", WebhookSubscriptionSchema);
const WebhookEvent = mongoose.model("WebhookEvent", WebhookEventSchema);

// Middleware for JWT Authentication
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).send({message: "Access denied. No token provided."});
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).send({message: "Invalid token."});
  }
};

app.post("/validate-token", (req, res) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ valid: false });
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    res.json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false });
  }
});


app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.send({message:"User registered."} );
});


app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(400).send({message:"Invalid username or password."});
  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
  res.send({ token });
});

app.post("/subscribe", authenticate, async (req, res) => {
  const { url, source, username } = req.body;
  if (!url || !source) return res.status(400).send({message: "URL and source are required."});
  const secret = uuidv4();
  const subscription = new WebhookSubscription({ url, source, secret, username });
  await subscription.save();
  res.send({ message: "Webhook subscribed.", subscription });
});

app.get("/subscriptions", authenticate, async (req, res) => {
  const { username } = req.query;
  if (!username) {
    return res.status(400).json({ message: "Login again. Localstorage is tampered." });
  }
  const subscriptions = await WebhookSubscription.find({username});
  res.send({subscriptions : subscriptions});
});


app.post("/webhook", async (req, res) => {
  const { source, eventType, payload } = req.body;
  const subscriptions = await WebhookSubscription.find({ source });
  if (!subscriptions.length) return res.status(404).send({message: "No subscriptions found for this source."});
  
  const events = subscriptions.map(subscription => ({
    eventType,
    payload,
    timestamp: new Date(),
    deliveryStatus: "Pending",
  }));

  const savedEvents = await WebhookEvent.insertMany(events);
  res.send({savedEvents: savedEvents});
});

app.post("/retry", authenticate, async (req, res) => {
  const failedEvents = await WebhookEvent.find({ deliveryStatus: "Failed" });
  const results = await Promise.all(
    failedEvents.map(async event => {
      const success = true; // Simulate success/failure
      event.deliveryStatus = success ? "Delivered" : "Failed";
      return event.save();
    })
  );
  res.send(results);
});

app.delete("/unsubscribe/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try{
    const result = await WebhookSubscription.findByIdAndDelete(id);
    if (!result) return res.status(404).send({message:"Subscription not found."});
    res.send({message:"Subscription cancelled."});
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).send({ message: "Internal server error." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});