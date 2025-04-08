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
    host: "localhost",
    database: "Kotob",
    password: "002468",
    port: 5432
}); db.connect();
const saltRounds = 10;

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Globals
var booksList = await searchBooks("computer science");

app.get("/kotob/home", (req, res)=> {
    res.render("home.ejs", {books: booksList});
})

app.get("/kotob/register", (req, res) => {
    res.render("register.ejs");
})

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

    // First send a verification code to the email
    emailExists(userEmail);

    bcrypt.hash(userPassword, saltRounds, async (err, hash)=> {
        // Add user to db
        await db.query(
            "INSERT INTO users(username, email, password) VALUES($1, $2, $3);",
            [userName, userEmail, hash]
        )
    })

    res.redirect("/kotob/home");

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