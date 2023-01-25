const Chat = require("../models/Chat");
const User = require("../models/User");
const { generalErrorResponse, generalErrorPayloadResponse, generalPayloadResponse, generalResponse } = require('../shared/ResponseService');

const accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return generalErrorResponse(res, "User Id is not included")
    }

    try {
        var isChat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.userData._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        }).populate("users", "-password").populate("latestMessage");

        isChat = await User.populate(isChat, {
            path: "latestMessage.sender",
            select: "username profileImg email",
        });

        if (isChat.length > 0) {
            return generalPayloadResponse(res, isChat[0], 'Access Exists Chat Successfully!');
        } else {
            var chatData = {
                chatName: "sender",
                isGroupChat: false,
                users: [req.userData._id, userId],
            };

            const createdChat = await Chat.create(chatData);
            const FullChat = await Chat.findOne({ _id: createdChat._id }).populate("users", "-password");
            return generalPayloadResponse(res, FullChat, 'Chats Fetched Successfully!');
        }

    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while creating group');
    }
};

const fetchChats = async (req, res) => {
    try {
       Chat.find({ users: { $elemMatch: { $eq: req.userData._id } } })
       .populate("users", "-password")
       .populate("groupAdmin", "-password")
       .populate("latestMessage")
       .sort({ updatedAt: -1 })
       .then(async (results) => {
         results = await User.populate(results, {
           path: "latestMessage.sender",
           select: "username profileImg email",
         });
         return generalPayloadResponse(res, results, 'Chats Fetched Successfully!');
       });
     
    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while fetching chat');
    }
};

const fetchChatById = async (req, res) => {
    const chatId = req.params.chatId
    try {
       Chat.findById(chatId)
       .populate("users", "-password")
       .populate("groupAdmin", "-password")
       .populate("latestMessage")
       .sort({ updatedAt: -1 })
       .then(async (results) => {
         results = await User.populate(results, {
           path: "latestMessage.sender",
           select: "username profileImg email",
         });
         return generalPayloadResponse(res, results, 'Chat Fetched Successfully!');
       });
     
    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while fetching chat');
    }
};


const createGroupChat = async (req, res) => {

    if (!req.body.users || !req.body.chatName) {
        return generalErrorResponse(res, "Please Fill all the feilds")
    }

    var users = JSON.parse(req.body.users);
    if (users.length < 2) {
        return generalErrorResponse(res, "More than 2 users are required to form a group chat")
    }
    users.push(req.userData);

    try {
        const groupChat = await Chat.create({
            chatName: req.body.chatName,
            users: users,
            isGroupChat: true,
            groupAdmin: req.userData,
        });

        if (!groupChat) {
            return generalErrorResponse(res, 'Error while creaing group');
        }

        const fullGroupChat = await Chat.findOne({ _id: groupChat._id }).populate("users", "-password").populate("groupAdmin", "-password");
        return generalPayloadResponse(res, fullGroupChat, 'Group Created Successfully!');

    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while creating group');
    }
};

const renameGroup = async (req, res) => {
    const { chatId, chatName } = req.body;

    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId,
            {
                chatName: chatName,
            },
            {
                new: true,
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!updatedChat) {
            return generalErrorResponse(res, 'Chat Not Found');
        }
        return generalPayloadResponse(res, updatedChat, 'ChatName Updated Successfully!');

    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while renaming group name');
    }
};

const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const removed = await Chat.findByIdAndUpdate(chatId,
            {
                $pull: { users: userId },
            },
            {
                new: true,
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!removed) {
            return generalErrorResponse(res, 'Chat Not Found');
        }
        return generalPayloadResponse(res, removed, 'User Removed Successfully!');

    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while Removing user from a group');
    }
};

const addToGroup = async (req, res) => {
    const { chatId, users } = req.body;

    let usersIds =[]
    usersIds = users.map((user)=> {
       return user._id
    })

    try {
        const added = await Chat.findByIdAndUpdate(chatId,
            {
                $push: { users: usersIds },
            },
            {
                new: true,
            }
        ).populate("users", "-password").populate("groupAdmin", "-password");

        if (!added) {
            return generalErrorResponse(res, 'Chat Not Found');
        }
        return generalPayloadResponse(res, added, 'User Added Successfully!');

    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while adding user to a group');
    }
};


const changeLatestMessage = async (req, res) => {
    const { chatId, latestMessage} = req.body;

    try {
        const updatedChat = await Chat.findByIdAndUpdate(chatId,
            {
                latestMessage: latestMessage,
            },
            {
                new: true,
            }
        ).populate("latestMessage")

        if (!updatedChat) {
            return generalErrorResponse(res, 'Chat Not Found');
        }
        return generalPayloadResponse(res, updatedChat, 'Latest Message Updated Successfully!');


    } catch (err) {
        return generalErrorPayloadResponse(res, err, 'Error while upading latest message');
    }
};

module.exports = {
    accessChat,
    fetchChats,
    fetchChatById,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    changeLatestMessage
};