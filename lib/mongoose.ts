import mongoose from 'mongoose'

let isConnected = false; //variable to check the  connection status

export const connectToDB = async ()=>{
    mongoose.set('strictQuery',true);
    if(!process.env.MONGODB_URL) return("MONGODB_URL not found");
    if(isConnected) return console.log("Already connected to MongoDb")
    try {
        await mongoose.connect(process.env.MONGODB_URL)
        isConnected=true;
        console.log("Connented to MongoDB")
    } catch (error) {
        console.log(error)
    }
}