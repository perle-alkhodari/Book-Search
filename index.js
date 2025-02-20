import express from "express";
import bodyParser from "body-parser";
import axios from 'axios';

// Constants
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Globals
var booksList = await searchBooks("hi");

app.get("/kotob/home", (req, res)=> {
    res.render("home.ejs", {books: booksList});
})

app.post("/search", async (req, res)=> {
    var userSearch = req.body.search;
    var results = await searchBooks(userSearch);
    booksList = results;
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