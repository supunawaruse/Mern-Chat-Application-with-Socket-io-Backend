const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        index: true,
        unique: true
    },
    desc:{
        type:String,
        default:"Hi I am using WeChat!"
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    profileImg: {
        url:{type:String,default:'https://www.kindpng.com/picc/m/78-786207_user-avatar-png-user-avatar-icon-png-transparent.png'},
        public_id:{type:String,default:''}
    },
    contactNo:{
        type:String,
        default:''
    },
    location:{
        type:String,
        default:''
    },
    activeStatus:{
        type: String,
        enum: {
            values: ['Active', 'Away', 'Do not disturb'],
            message: '{VALUE} is not a valid status'
        },
        default: 'Active',
    }
},{
    timestamps:true
})

userSchema.methods.matchPassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword,this.password)
}

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        next()
    }

    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
})

module.exports = mongoose.model('User', userSchema);