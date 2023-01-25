const mongoose = require('mongoose');

// Connect to database
exports.connectDB = async()=> {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI,{
            useUnifiedTopology:true,
            useNewUrlParser:true,
        })

        console.log(`mongoDB connected: ${conn.connection.host}`)
    } catch (error) {
        console.log(error.message)
        process.exit(1)
    }
}



