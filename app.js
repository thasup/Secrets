// Require modules
const express = require("express");
const ejs = require("ejs");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");

// Start up an instance of app
const app = express();

// Setup EJS
app.set("view engine", "ejs");

// Add middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

// Defines the port number
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Connect with MongoDB database
const password = process.env.MONGODB_PASS;
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect(`mongodb+srv://admin-first:${password}@cluster0.hi5zx.mongodb.net/secretUserDB`);
};

// Create collection scheme and module
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: req.body.password,
    });

    newUser.save((err) => {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets");
        }
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});