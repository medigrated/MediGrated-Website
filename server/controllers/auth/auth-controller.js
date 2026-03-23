// server/controllers/auth/auth-controller.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/User');

// in-memory user store used when database is unavailable
const inMemoryUsers = [];


//register
const registerUser = async (req, res) => {
    const { name, email, password, role,
        phone, gender, dateOfBirth, location, bio,
        age, bloodType, allergies, medicalHistory, emergencyContact,
        specialization, licenseNumber, experience, clinic,
        department } = req.body;

    try {
        const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
        if (dbReady) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exists with this email'
                });
            }

            const hashPassword = await bcrypt.hash(password, 12);

            // Build user data based on role
            const userData = {
                name, email, password: hashPassword, role,
                phone: phone || null,
                gender: gender || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                location: location || null,
                bio: bio || null,
            };

            if (role === 'patient') {
                userData.age = age ? parseInt(age) : null;
                userData.bloodType = bloodType || null;
                userData.allergies = allergies || null;
                userData.medicalHistory = medicalHistory || null;
                userData.emergencyContact = emergencyContact || null;
            } else if (role === 'doctor') {
                userData.specialization = specialization || null;
                userData.licenseNumber = licenseNumber || null;
                userData.experience = experience ? parseInt(experience) : null;
                userData.clinic = clinic || null;
            } else if (role === 'admin') {
                userData.department = department || null;
            }

            const newUser = new User(userData);
            await newUser.save();

            const userResponse = newUser.toObject();
            delete userResponse.password;

            const token = jwt.sign(
                { id: newUser._id, role: newUser.role, email: newUser.email },
                'CLIENT_SECRET_KEY', { expiresIn: '60m' }
            );
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 60 * 60 * 1000, path: '/' }).json({
                success: true,
                message: 'User registered and logged in successfully',
                user: { id: userResponse._id, ...userResponse, _id: undefined, __v: undefined }
            });
            return;
        } else {
            if (inMemoryUsers.find(u => u.email === email)) {
                return res.status(400).json({ success: false, message: 'User already exists with this email' });
            }
            const hashPassword = await bcrypt.hash(password, 12);
            const newUser = { id: `mem_${Date.now()}`, name, email, password: hashPassword, role, phone, gender, dateOfBirth, location, bio, age, bloodType, allergies, medicalHistory, emergencyContact, specialization, licenseNumber, experience, clinic, department };
            inMemoryUsers.push(newUser);
            const token = jwt.sign({ id: newUser.id, role: newUser.role, email: newUser.email }, 'CLIENT_SECRET_KEY', { expiresIn: '60m' });
            const { password: _, ...userWithoutPassword } = newUser;
            res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 60 * 60 * 1000, path: '/' }).json({
                success: true,
                message: 'User registered (in-memory) and logged in successfully',
                user: userWithoutPassword
            });
            return;
        }
        //for directly logging in after registration
        //to just register without logging in, comment out the token generation and cookie setting code above and use the code below instead
        // res.status(201).json({
        //     success: true,
        //     message: 'User registered successfully',
        //     user: {
        //         id: newUser._id,
        //         name: newUser.name,
        //         email: newUser.email,
        //         role: newUser.role
        //     }
        // });
    } 
    //what this does is, it hashes the user's password using bcrypt with a salt round of 12 for security, before saving the user to the database.
    catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}

//login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
        let checkUser;
        if (dbReady) {
            checkUser = await User.findOne({ email });
        } else {
            checkUser = inMemoryUsers.find(u => u.email === email);
        }
        if (!checkUser) {
            return res.status(400).json({
                success: false,
                message: 'User does not exist with this email! Please register first.'
            });
        }

        const checkPassword = await bcrypt.compare(password, checkUser.password);
        if (!checkPassword) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect password'
            });
        }
        //generate JWT token
        const token = jwt.sign(
            { id: checkUser._id || checkUser.id, role: checkUser.role, email: checkUser.email },
            'CLIENT_SECRET_KEY', {expiresIn : '60m'}
        );

        // Build full user response
        let userResponse;
        if (checkUser.toObject) {
            userResponse = checkUser.toObject();
            delete userResponse.password;
            userResponse.id = userResponse._id;
            delete userResponse._id;
            delete userResponse.__v;
        } else {
            const { password: _, ...rest } = checkUser;
            userResponse = rest;
        }

        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'strict', maxAge: 60 * 60 * 1000, path: '/' }).json({
            success: true,
            message: 'User logged in successfully',
            user: userResponse
        });
        //what this does is, it creates a JWT token with the user's id, role, and email as payload, and signs it with a secret key. The token is set to expire in 60 minutes.
        //Then, it sends the token as an HTTP-only cookie in the response, along with a success message and some user details (excluding the password).
        //The httpOnly: true option ensures that the cookie cannot be accessed via client-side JavaScript, enhancing security.
        //The secure: false option means the cookie will be sent over both HTTP and HTTPS. In a production environment, this should be set to true to ensure cookies are only sent over HTTPS.
        //httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 60 * 60 * 1000
        //what this does is, it sets the cookie to be secure only in production environments, helps prevent CSRF attacks by restricting cross-site requests, and sets the cookie to expire in 1 hour.

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
}


//logout
const logoutUser = (req, res) => {
    res.clearCookie('token').json({
        success: true,
        message: 'User logged out successfully'
    });
};
//what this does is, it clears the 'token' cookie from the user's browser, effectively logging them out of the application. It then sends a JSON response indicating that the logout was successful.

//auth middleware
const authMiddleware = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No token provided, authorization denied'
        });
    }
    //what this does is, it checks if the 'token' cookie is present in the incoming request. If not, it responds with a 401 Unauthorized status and an error message indicating that no token was provided.
    try {
        const decoded = jwt.verify(token, 'CLIENT_SECRET_KEY');
        req.user = decoded;
        next();
        //what this does is, it verifies the JWT token using the secret key. If the token is valid, it decodes the token to extract the user information (like id, role, email) and attaches it to the req.user object for use in subsequent middleware or route handlers. Then, it calls next() to pass control to the next middleware function.
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
};


//update profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const updateData = req.body;

        // Remove sensitive fields that shouldn't be updated through this endpoint
        delete updateData.password;
        delete updateData.email; // Email changes might need special handling
        delete updateData.role; // Role changes should be admin only

        const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
        if (dbReady) {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true, runValidators: true }
            ).select('-password');

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedUser
            });
        } else {
            // In-memory update for development
            const userIndex = inMemoryUsers.findIndex(u => u.id === userId);
            if (userIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            inMemoryUsers[userIndex] = { ...inMemoryUsers[userIndex], ...updateData };
            const { password, ...userWithoutPassword } = inMemoryUsers[userIndex];

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: userWithoutPassword
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

//change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
        let user;
        if (dbReady) {
            user = await User.findById(userId);
        } else {
            user = inMemoryUsers.find(u => u.id === userId);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const hashPassword = await bcrypt.hash(newPassword, 12);

        if (dbReady) {
            await User.findByIdAndUpdate(userId, { password: hashPassword });
        } else {
            inMemoryUsers.find(u => u.id === userId).password = hashPassword;
        }

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Relative path to be served locally via express.static
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        const dbReady = mongoose.connection && mongoose.connection.readyState === 1;
        if (dbReady) {
            const updatedUser = await User.findByIdAndUpdate(
                req.user.id,
                { $set: { avatar: avatarUrl } },
                { new: true, runValidators: true }
            ).select('-password');

            res.status(200).json({
                success: true,
                message: 'Avatar uploaded successfully',
                user: updatedUser
            });
        } else {
            const userIndex = inMemoryUsers.findIndex(u => u.id === req.user.id);
            if (userIndex === -1) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            inMemoryUsers[userIndex].avatar = avatarUrl;
            const { password, ...userWithoutPassword } = inMemoryUsers[userIndex];
            res.status(200).json({
                success: true,
                message: 'Avatar uploaded successfully',
                user: userWithoutPassword
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    authMiddleware,
    updateProfile,
    changePassword,
    uploadAvatar
};