require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require('mysql')
const jwt = require("jsonwebtoken");
const app = express();
const auth = require("./middleware/auth");
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
    user:'root',
    password:'',
    server:'localhost',
    database:'fullstackr'
})

db.connect()

app.post("/login",async (req, res) => {
    try{
        var answer;
        const { username , password } = req.body;
        if(!(username && password)){
            return res.status(200).send({error:true});
        }
        
        let query = `SELECT * FROM teacher WHERE teacher_id = '${username}' AND teacher_password = '${password}'`;

        db.query(query,(err,results) => { 
            if(err) throw err
            if(results.length === 0){
               return res.status(200).send({error:true});
            }
            const {teacher_password,...user} = results[0]
            const token = jwt.sign(
                {	
                    teacher_id: user.teacher_id,
                    teacher_fname : user.teacher_fname,
                    teacher_lname : user.teacher_lname 
                },
                process.env.TOKEN_KEY,
                {
                    expiresIn: "2h",
                }
            );
            user.token = token;
            return res.status(200).json(user);
        })
    }catch (err) {
        console.log(err);
    }
});

app.get('/getTeacherSemester',auth , (req,res)=>{
    console.log(req.user)
    const query = 
    `SELECT subject.subject_id,class.subject_section,subject.subject_name, class.class_id,COUNT(studentclass.student_id) AS student_number
    FROM class
    LEFT JOIN subject ON subject.subject_id = class.subject_id
    LEFT JOIN studentclass ON studentclass.class_id =  class.class_id
    WHERE class.teacher_id = "${req.user.teacher_id}"
    GROUP BY  class.class_id`
    try{
        db.query(query,(err,results) => {
            if(err)res.status(400).send("error")
            return res.status(200).send(results) 
        })
    }catch(e){
        res.send("Error")
    }
})

app.post('/getStudents',auth , (req,res)=>{
    
    const query = `SELECT student.student_id,student.student_fname,student.student_lname,student.major_id , facultie.facultie_name
    FROM studentclass 
    INNER JOIN student ON student.student_id = studentclass.student_id 
    INNER JOIN semester ON semester.semester_id = studentclass.semester_id 
    INNER JOIN major ON major.major_id = student.major_id
    INNER JOIN facultie ON facultie.facultie_id = major.faulties_id
    WHERE (semester.semester_date_start < CURRENT_DATE() AND semester.semester_date_end > CURRENT_DATE()) AND class_id = ${req.body.class_id}`
    try{
        db.query(query,(err,results) => {
            if(err)res.status(400).send("error")
            return res.status(200).send(results) 
        })
    }catch(e){
        res.send("Error")
    }
})


app.listen(2500,()=>{
    console.log('http://localhost:2500')
})

