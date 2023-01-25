const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");
const { generalErrorResponse, generalErrorPayloadResponse, generalPayloadResponse, generalResponse } = require('../shared/ResponseService');

const sendMessage = async (req, res) => {
   const {content,chatId} = req.body
   
   if(!content || !chatId){
       return generalErrorResponse(res,'Invalid Data')
   }

   var newMewssage = {
       sender:req.userData._id,
       content:content,
       chat:chatId
   }

   try {
       var message = await Message.create(newMewssage)
       message = await message.populate("sender","username profileImg")
       message = await message.populate("chat")
       message = await User.populate(message,{
           path:"chat.users",
           select:"username profileImg email"
       })

       await Chat.findByIdAndUpdate(chatId,{
           latestMessage:message
       })

       return generalPayloadResponse(res, message,'Message Sent')
   } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while Sending Message');
   }
}

const getAllMessages = async (req, res) => {

   try {
    var messages =  await Message.find({chat:req.params.chatId}).populate("sender","username profileImg email").populate("chat")
    messages = await User.populate(messages,{
        path:"chat.users",
        select:"username profileImg email"
    })
    return generalPayloadResponse(res, messages,'All Messages Fetched')
   } catch (err) {
    return generalErrorPayloadResponse(res, err, 'Error while Fetching All Messages');
   }
}

const deleteMessage = async (req, res) => {
    const messageId = req.params.messageId
    try {
     const messages = await Message.findByIdAndDelete(messageId)
     return generalPayloadResponse(res, messages,'Message Delete Successfully')
    } catch (err) {
     return generalErrorPayloadResponse(res, err, 'Error while Deleting a Message');
    }
 }

module.exports = {sendMessage, getAllMessages,deleteMessage}