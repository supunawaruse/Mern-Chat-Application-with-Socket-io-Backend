const express  = require('express')

const router = express.Router()
const MessageController = require('../controllers/MessageController')
const checkAuth  = require('../shared/AuthMiddleware')

router.post('/',checkAuth, MessageController.sendMessage);
router.delete('/:messageId',checkAuth, MessageController.deleteMessage);
router.get('/:chatId',checkAuth, MessageController.getAllMessages);


module.exports = router;