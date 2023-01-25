const express  = require('express')

const router = express.Router()
const ChatController = require('../controllers/ChatController')
const checkAuth  = require('../shared/AuthMiddleware')

router.post('/',checkAuth, ChatController.accessChat);
router.get('/',checkAuth, ChatController.fetchChats);
router.get('/:chatId',checkAuth, ChatController.fetchChatById);
router.post('/group',checkAuth, ChatController.createGroupChat);
router.put('/rename',checkAuth,ChatController.renameGroup)
router.put('/remove-from-group',checkAuth,ChatController.removeFromGroup)
router.put('/add-to-group',checkAuth, ChatController.addToGroup)
router.put('/change-latest-message',checkAuth, ChatController.changeLatestMessage)


module.exports = router;