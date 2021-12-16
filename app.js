// Require modules
const express = require("express");
const ejs = require("ejs");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');
const sha512 = require('js-sha512');
const bcrypt = require('bcrypt');

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

// Create collection scheme
const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// Encrypted user password
const secret = process.env.ENCRYPT_KEY;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

const saltRounds = 10;

// Create collection module
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
    bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save((err) => {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets");
            }
        });
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
                bcrypt.compare(password, foundUser.password, (err, result) => {
                    if ( result === true) {
                        res.render("secrets");
                    }
                });
            }
        }
    });
});