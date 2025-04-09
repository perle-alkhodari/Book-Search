import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';
import pg from 'pg';
import bcrypt from 'bcrypt';
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

// POST Routes
app.post("/search", async (req, res)=> {
    var userSearch = req.body.search;
    var results = await searchBooks(userSearch);
    booksList = results;
    res.redirect("/kotob/home");
})

app.post("/register", async (req, res)=> {
    var userName = req.body.username;
    var userEmail = req.body.email;
    var userPassword = req.body.password;

    // Check if email is already registered
    if (await emailExists(userEmail)) {
        // Exists, so show error
        res.render("register.ejs", {emailExists: "Email already exists, try signing in instead"});
    }
    else {
        // User is new, send a verification email to check their email is valid and they own it.
        var code = sendVerificationEmail(userEmail);
        var hashedPass;
        bcrypt.hash(userPassword, saltRounds, async (err, hash)=> {
            hashedPass = hash;
        })
        res.render("verification.ejs", {code: code, email: userEmail, username: userName, password: hashedPass});
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
        var hash = req.body.password;

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