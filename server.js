const multer = require("multer");
const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcrypt");
const File = require("./modals/File.js");
const express = require("express");
const req = require("express/lib/request");
const port = process.env.PORT || 5000;
const app = express();
const upload = multer({ dest: "uploads" });
app.use(express.urlencoded({ extended:true }));

mongoose.connect(process.env.DB_URL);

app.set("view engine", "ejs");


// alternate method and very basic 
// app.get('/', (req, res) =>{
//     res.sendFile(__dirname + '/views/index.html');
// });

// api end point 
app.get("/", (req, res) => {
    res.render("index")
});

app.post("/upload", upload.single("file"), async (req, res) => {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname,
    }
    // here password is name which we have  given as name att to input tag 
    if (req.body.password != null && req.body.password !== ""){
        fileData.password =  await bcrypt.hash(req.body.password, 10);
    }

    const file = await File.create(fileData)
    // console.log(file);
    // res.send(file.originalName)
    res.render("index",{fileLink: `${req.headers.origin}/file/${file.id}`})
});

app.route("/file/:id").get(handleDownload).post(handleDownload)

//  alternate method
// app.get("/file/:id", handleDownload)
// app.post("/file/:id", handleDownload)


async function handleDownload(req, res) {
    const file = await File.findById(req.params.id)
    if(file.password != null){
        if(req.body.password == null){
            res.render("password")
            return
        }
        if(!(await bcrypt.compare(req.body.password, file.password))) {
            res.render("password", { error: true })
            return
        }
    }

    file.downloadCount++
    await file.save()
    console.log(file.downloadCount)
    res.download(file.path, file.originalName)
}



app.listen(port, (err)=>{
    if(err){
        console.log(err)
    } else (
        console.log('we are live...')
    )
});