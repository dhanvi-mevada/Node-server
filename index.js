const express = require('express');
const users = require("./MOCK_DATA.json");
const fs = require("fs");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

//connection of database
mongoose
.connect("mongodb://127.0.0.1:27017/my-database")
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("Mongo Error",err));

//Schema
const userSchema = new mongoose.Schema({
   firstName: {
    type: String,
    required: true,
   },
   lastName: {
    type: String,
    required: false,
   },
   email: {
    type: String,
    required: true,
    unique : true,
   },
   jobTitle : {
    type: String,
   },
   gender: {
    type: String,
   }
});

//creating model
const User = mongoose.model('user',userSchema);

//Middleware-Plugin
app.use(express.urlencoded({extended : false}));

app.get('/users', (req,res) =>{
    const html = `
    <ul>
    ${users.map(user => `<li>${user.first_name}</li>`).join("")}
    </ul>`;
    res.send(html);
});

//REST API
app.get("/api/users",(req,res) =>{
    return res.json(users);
});

app.route("/api/users/:id")
    .get( (req,res) =>{
    const id = Number(req.params.id);
    const user = users.find ((user) => user.id === id);
    return res.json(user);
    })
    .patch((req,res) => {
        //Edit user with id
        const id = Number(req.params.id);
        const body = req.body;
        const userIndex = users.findIndex(user => user.id === id);

        if(userIndex === -1){
            return res.status(404).json({ error :"user not found"}); // Fixed: res instead of req
        }
        users[userIndex] = {...users[userIndex],...body};

        fs.writeFile("./MOCK_DATA.json",JSON.stringify(users,null,2),(err) => {
            if(err){
                return res.status(500).json({error : "failed to update user"});
            }
            return res.json({
                status : "success",
                message : "User updated Successfully",
                user : users[userIndex] // Fixed: users instead of user
            });
        });
        })
    .delete((req,res) => {
        //Delete user with id
        const id = Number(req.params.id);
        const userIndex = users.findIndex(user => user.id === id );

        if (userIndex === -1){
            return res.status(404).json({error : "User not found "});
        }
        const deletedUser = users[userIndex];
        users.splice(userIndex,1);

        fs.writeFile("./MOCK_DATA.json", JSON.stringify(users,null,2),(err) => { 
            if (err) {
                return res.status(500).json({ error : "failed to delete user"}); 
            }
            return res.json({
                status: "success",
                message : "User deleted successfully",
                deletedUser : deletedUser
            });
        }); 
    });

app.post("/api/users", async (req,res) => { 
        const body = req.body;
       if (
        !body ||
        !body.first_name ||
        !body.last_name ||
        !body.email ||
        !body.gender ||
        !body.job_title 
       ) {
    return res.status(400).json({msg:"All fields are required"}); 
}

   const result = await User.create({
    firstName: body.first_name, 
    lastName: body.last_name,   
    email: body.email,
    gender: body.gender,
    jobTitle: body.job_title, 
});
    console.log("result" , result);
    return res.status(201).json({msg :"success"});
});

app.listen (PORT,() => {
    console.log(`Server started at PORT: ${PORT} `);
});