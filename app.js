// Require modules
const express = require("express");
const ejs = require("ejs");
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-find-or-create");
const FacebookStrategy = require("passport-facebook").Strategy;

// Start up an instance of app
const app = express();

// Setup EJS
app.set("view engine", "ejs");

// Add middleware
app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));

app.use(session({
    secret: "This is my little secret",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

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
    password: String,
    googleId: String,
    facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Create collection module
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    (accessToken, refreshToken, profile, cb) => {
        console.log({accessToken, refreshToken, profile});
        User.findOrCreate({ googleId: profile.id }, (err, user) => {
            return cb(err, user);
        });
    }
));

passport.use(new FacebookStrategy(
    {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "https://localhost:3000/auth/facebook/secrets"
    },
    (accessToken, refreshToken, profile, cb) => {
        console.log({accessToken, refreshToken, profile});
        User.findOrCreate({ facebookId: profile.id }, (err, user) => {
            return cb(err, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/facebook",
    passport.authenticate("facebook", { scope: ["public_profile"] })
);

app.get("/auth/google/secrets", 
    passport.authenticate("google", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    }
);

app.get("/auth/facebook/secrets", 
    passport.authenticate("facebook", { failureRedirect: "/login" }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect("/secrets");
    }
);

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.post("/register", (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });
});