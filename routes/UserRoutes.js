const express  = require('express')

const router = express.Router()
const UserController = require('../controllers/UserController')
const checkAuth  = require('../shared/AuthMiddleware')

router.post('/register', UserController.registerUser);
router.post('/login', UserController.loginUser);
router.post('/refresh-token', UserController.refreshToken);
router.put('/change-password/:userId',UserController.changePassword)
router.put('/change-profileImg/:userId',UserController.updateUserProfileImage)
router.put('/update/:userId',UserController.updateUserDetails)
router.put('/update-status/:userId',UserController.updateUserStatus)
router.get('/',checkAuth, UserController.getAllUsers)

module.exports = router;