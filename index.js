import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';
import pg from 'pg';
import bcrypt, { hash } from 'bcrypt';
import env from 'dotenv';
import { sendVerificationEmail } from "./verifier.js";

// Configs
env.config();

// Constants
const app = express();
const port = 3000;
const db = new pg.Client( {
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}); db.connect();
const saltRounds = 10;

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Globals
var booksList = await searchBooks("computer science");

// GET Routes
app.get("/kotob/home", (req, res)=> {
    res.render("home.ejs", {books: booksList});
})

app.get("/kotob/register", (req, res) => {
    res.render("register.ejs");
})

app.get("/kotob/sign-in", (req, res)=> {
    res.render("sign-in.ejs");
})

// POST Routes
app.post("/search", async (req, res)=> {
    var userSearch = req.body.search;
    var results = await searchBooks(userSearch);
    booksList = results;
    res.redirect("/kotob/home");
})

app.post("/add-book", async (req, res) => {
    var bookId = req.body.bookId;
    var userid = req.body.userid;

    // Add this to userbook combo

})

app.post("/register", async (req, res)=> {
    var userName = req.body.username;
    var userEmail = req.body.email;
    var userPassword = req.body.password;

    if (userPassword.length < 5) {
        res.render("register.ejs", {passError: "Password cannot be less than 5 characters..."});
    }

    // Check if email is already registered
    if (await emailExists(userEmail)) {
        // Exists, so show error
        res.render("register.ejs", {emailError: "Email already exists, try signing in instead"});
    }
    else {
        // User is new, send a verification email to check their email is valid and they own it.
        var code = sendVerificationEmail(userEmail);
        bcrypt.hash(userPassword, saltRounds, async (err, hash)=> {
            res.render("verification.ejs", {code: code, email: userEmail, username: userName, password: hash});
        })
    }
})

app.post("/sign-in", async (req, res)=> {
    var password = req.body.password;
    var email = req.body.email;

    if (await emailExists(email)) {
        // Check if the passwords match
        var storedPassword = await getPassword(email);
        bcrypt.compare(password, storedPassword, async (err, result) => {
            if (result) {
                // Passwords match
                var user = await getUser(email);
                
                res.render("home.ejs", {loggedIn: true, userid: user.id, username: user.username, books: booksList});
            }
            else {
                // Passwords don't match
                res.render("sign-in.ejs", {passError: "Incorrect password..."});
            }
        })
    }
    else {
        // render sign in page with email error
        res.render("sign-in.ejs", {emailError: "There is no user with this email."});
    }
})

app.post("/verify-email", async (req, res)=> {
    var userCode = req.body.verificationCode;
    var code = req.body.code;
    var userName = req.body.username;
    var userEmail = req.body.email;
    var hashedPass = req.body.password;

    if (userCode == code) {
        // They entered the right code so register them.
        var userName = req.body.username;
        var userEmail = req.body.email;


        await db.query(
            "INSERT INTO users(username, email, password) VALUES($1, $2, $3);",
            [userName, userEmail, hashedPass]
        )

        res.redirect("/kotob/home");
    }
    else {
        // Wrong code so let them know
        res.render("verification.ejs", {code: code, email: userEmail, username: userName, password: hashedPass, error: "Wrong code... Try again."});
    }
})

app.listen(port, ()=> {
    console.log("Listening to port " + port + ".");
})

// Api
async function searchBooks(query) {
    try {
        var response = await axios(
        {
            method: "GET",
            url: "https://www.googleapis.com/books/v1/volumes",
            params: {
                q: query,
                printType: "books",
                orderBy: "relevance"
            }
        })
    } catch(error) {

        if (error.response) {
            console.log("server error")
        }

        else if (error.request) {
            console.log("no response")
        } 
        
        else {
            console.log("api error")
        }
    }
    return response.data;
};

// Database functions

// returns whether or not an email exists within the users table
async function emailExists(emailAddress) {
    var emailExists = true;

    var result = await db.query(
        "SELECT * FROM users WHERE users.email = $1",
        [emailAddress]
    )

    if (result.rows.length == 0) emailExists = false;

    return emailExists;
}

// returns password of user of given email
async function getPassword(emailAddress) {
    var result = await db.query(
        "SELECT password FROM users WHERE users.email = $1",
        [emailAddress]
    );
    return result.rows[0].password;
}

async function getUser(emailAddress){
    var result = await db.query(
        "SELECT * FROM users WHERE users.email = $1", [emailAddress]
    );

    return result.rows[0];
}
