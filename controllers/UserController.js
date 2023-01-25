const jwt = require('jsonwebtoken');
const { generalErrorResponse, generalErrorPayloadResponse, generalPayloadResponse, generalResponse } = require('../shared/ResponseService');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const bcrypt = require('bcrypt')

const registerUser = async (req, res) => {
    //const passwordValidation = /^(?=.*?[A-Z])(?=.*?[#?!@$%^&*-]).{8,}$/;
    const { username, email, password, confirmPassword } = req.body;

    try {
        if (!username || !email || !password || !confirmPassword) {
            return generalErrorResponse(res, 'Fields cannot be empty');
        }

        const user = await User.findOne({ email });
        if (user) {
            return generalErrorResponse(res, 'User Alreary Exists with this Email');
        }


        if (password === confirmPassword) {
            const newUser = await User.create({
                username,
                email,
                password,
            })

            if (newUser) {

                // Generate token
                const accessToken = jwt.sign({ ...newUser._doc }, process.env.JWT_KEY, { expiresIn: process.env.JWT_KEY_EXP });
                // Generate refresh token
                const refreshToken = jwt.sign({ id: newUser._id }, process.env.JWT_KEY_REFRESH, { expiresIn: process.env.JWT_KEY_REFRESH_EXP });

                let refreshTokenDoc = new RefreshToken({
                    references: newUser._id,
                    token: refreshToken,
                    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Expires in 1 year
                    revoked: new Date()
                });

                await refreshTokenDoc.save();

                newUser._doc.accessToken = accessToken;
                newUser._doc.refreshToken = refreshToken;
                return generalPayloadResponse(res, newUser, `User Created Successfully`);
            } else {
                return generalErrorResponse(res, 'Invalid Data');
            }

        } else {
            return generalErrorResponse(res, 'Password Does not match');
        }

    } catch (err) {
        return generalErrorPayloadResponse(res, err);
    }

}

const loginUser = async (req, res) => {

    if (!req.body.email) {
        return generalErrorResponse(res, 'Invalid request');
    }

    try {
        const user = await User.findOne({ email: req.body.email })
        if (!user) {
            return generalErrorResponse(res, 'Account not found for this email. Please try again');
        }

        if (!await user.matchPassword(req.body.password)) {
            return generalErrorResponse(res, 'Invalid password found. Please try again!');
        }

        // Remove password from return doc
        delete user._doc.password;

        // Generate token
        const accessToken = jwt.sign({ ...user._doc }, process.env.JWT_KEY, { expiresIn: process.env.JWT_KEY_EXP });
        let refreshToken;
        let refreshTokenDoc = await RefreshToken.findOne({ references: user._id });
        if (refreshTokenDoc && !refreshTokenDoc.isExpired) {
            refreshToken = refreshTokenDoc._doc.token;
        } else {
            // Generate refresh token
            refreshToken = jwt.sign({ id: user._id }, process.env.JWT_KEY_REFRESH, { expiresIn: process.env.JWT_KEY_REFRESH_EXP });

            await RefreshToken.findOneAndDelete({ references: user._id });

            refreshTokenDoc = new RefreshToken({
                references: user._id,
                token: refreshToken,
                expires: new Date(Date.now() + parseInt(process.env.JWT_KEY_REFRESH_EXP.trim().replace(' days', '')) * 24 * 60 * 60 * 1000), // Expires in 1 year
                revoked: new Date()
            });

            await refreshTokenDoc.save();
        }

        user._doc.accessToken = accessToken;
        user._doc.refreshToken = refreshToken;
        return generalPayloadResponse(res, user, 'Login successful');

    } catch (error) {
        return generalErrorPayloadResponse(res, err);
    }
}

const refreshToken = async (req, res) => {
    // if no token is presented
    if (!req.body.refreshToken) {
        return generalErrorResponse(res, 'No refresh token is presented!');
    }

    try {
        // get refreshToken from redis if available
        const refreshTokenDoc = await RefreshToken.findOne({ token: req.body.refreshToken });

        if (refreshTokenDoc) {
            const decoded = jwt.verify(req.body.refreshToken, process.env.JWT_KEY_REFRESH);
            let doc = await User.findOne({ _id: decoded.id });
            delete doc._doc.password;

            const accessToken = jwt.sign({ ...doc._doc }, process.env.JWT_KEY, { expiresIn: process.env.JWT_KEY_EXP });

            generalPayloadResponse(res, { accessToken: accessToken }, 'Access token refreshed successfully');
        } else {
            generalErrorPayloadResponse(res, { code: 'token_not_found' }, 'Could not find the refresh token provided!, Please Login as usual.');
        }
    } catch (err) {
        return generalErrorPayloadResponse(res, err);
    }
};

const changePassword = async (req, res) => {
    const userId = req.params.userId;
    const { currentPassword, newPassword, confirmPassword } = req.body;
 
    try {
        const user = await User.findOne({ _id: userId })
        
        if (!user) {
            return generalErrorResponse(res, 'Account not found for this Id. Please try again');
        }
    
        if (!await user.matchPassword(currentPassword)) {
            return generalErrorResponse(res, 'You have entered wrong current password. Please try again!');
        }else{
            if(newPassword === confirmPassword){
                const salt = await bcrypt.genSalt(10)
                const updatedPassword = await bcrypt.hash(newPassword,salt)
                const response = await User.findByIdAndUpdate(userId, {password:updatedPassword})
                return generalPayloadResponse(res,response, 'Password Changed');
            }else{
                return generalErrorResponse(res, 'Password does not match. Please try again!');
            }
        }

    } catch (err) {
        return generalErrorPayloadResponse(res, err);
    }
}

const updateUserDetails = async (req, res) => {
    const userId = req.params.userId;
    const { username, desc, location, contactNo } = req.body;
    const update = { username, desc, location, contactNo }

    try {
        const userDoc = await User.findByIdAndUpdate(userId, update)
        if (!userDoc) {
            return generalErrorResponse(res, 'No User With this userId!');
        }
        generalResponse(res, 'User Updated successfully');
    } catch (error) {
        return generalErrorPayloadResponse(res, err);
    }
}

const updateUserProfileImage = async (req, res) => {
    const userId = req.params.userId;
    const {profileImg} = req.body;
    const update = {profileImg}

    try {
        const userDoc = await User.findByIdAndUpdate(userId, update)
        if (!userDoc) {
            return generalErrorResponse(res, 'No User With this userId!');
        }
        generalResponse(res, 'User Profile Image Updated successfully');
    } catch (error) {
        return generalErrorPayloadResponse(res, err);
    }
}

const updateUserStatus = async (req, res) => {
    const userId = req.params.userId;
    const { activeStatus } = req.body;

    try {

        const userDoc = await User.findByIdAndUpdate(userId, { activeStatus: activeStatus })
        if (!userDoc) {
            return generalErrorResponse(res, 'No User With this userId!');
        }

        generalResponse(res, 'User Updated successfully');
    } catch (error) {
        return generalErrorPayloadResponse(res, err);
    }
}

const getAllUsers = async (req, res) => {
    const userId = req.userData._id
    try {
        const keyword = req.query.search ? {
            $or: [
                { username: { $regex: req.query.search, $options: "i" } },
                { email: { $regex: req.query.search, $options: "i" } },
            ],
        } : {}
        const users = await User.find({ ...keyword }).find({ _id: { $ne: userId } })
        generalPayloadResponse(res, users, 'Users fetched successfully');
    } catch (error) {
        return generalErrorPayloadResponse(res, err);
    }
}

module.exports = { registerUser, loginUser, refreshToken, updateUserDetails, getAllUsers, updateUserStatus,changePassword,updateUserProfileImage }