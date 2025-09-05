import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv'
import connectDB from './utils/db.js';
import userRoute from './routes/user.route.js'
import postRoute from './routes/post.route.js'
import messageRoute from './routes/message.route.js'
import notificationRoutes from './routes/notification.route.js'
import { app,server } from './socket io/socket.js';
import groupRouter from './routes/group.route.js'
import path from "path"

dotenv.config({});

const port = process.env.PORT || 3000
const corsOptions  = {
    origin:'http://localhost:5173',
    credentials:true
}

const __dirname = path.resolve()


app.use(express.json())  //parse the incoming json request and puts the parse data in req.body
app.use(express.urlencoded({extended:true}))  //parse the incomming urlencoded(form) data and puts data in req.body
app.use(cookieParser())        //parse the cookies attached to the client req and makes them accessible using req.cookies
app.use(cors(corsOptions))

app.use('/api/v1/user',userRoute)
app.use('/api/v1/post',postRoute)
app.use('/api/v1/message',messageRoute)
app.use('/api/v1/notification',notificationRoutes)
app.use('/api/v1/group',groupRouter)


app.use(express.static(path.join(__dirname,"/Frontend/dist")))
app.get("*",(req,res)=>{
    res.sendFile(path.resolve(__dirname,"Frontend","dist","index.html"))
})


server.listen(port,()=>{
    connectDB()
    console.log(`Server running at http://localhost:${port}`)    
})