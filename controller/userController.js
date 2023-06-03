const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHander = require("../utils/errorhandler");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const sendEmail = require("../utils/sendEmail");
const cloudinary = require("cloudinary");
const crypto = require("crypto");
// exports.registerUser1 = catchAsyncErrors(async (req, res, next) => {
//   const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//     folder: "avatars",
//     width: 150,
//     crop: "scale",
//   });
//   const { name, password, email } = req.body;
//   const user = await User.create({
//     name, email, password,
//     avatar: {
//       public_id: myCloud.public_id,
//       url: myCloud.secure_url,
//     }

//   })
//   // if(!user){
//   //     return next(new ErrorHander("email already exist", 404));
//   // }
//   sendToken(user, 201, res);

// })



// Helper function to send the password reset email
// async function sendPasswordResetEmail(email, resetToken,user,next,res) {
//   const resetPasswordUrl = `http://localhost:5173/password/reset/${resetToken}`;

//   const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

//   try {
//     await sendEmail({
//       email,
//       subject: 'CampusMart Password Recovery',
//       message,
//     });
//     res.status(200).json({
//       success: true,
//       message: `Email sent to ${user.email} successfully`,
//     });

//     console.log(`Password reset email sent to ${email} successfully`);
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpire = undefined;

//     await user.save({ validateBeforeSave: false });

//     return next(new ErrorHander(error.message, 500));
//   }
// }
// Helper function to send the password reset email
// async function sendPasswordResetEmail(email, resetToken) {
//   const resetPasswordUrl = `http://localhost:5173/password/reset/${resetToken}`;

//   const message = `Your password reset token is:\n\n${resetPasswordUrl}\n\nIf you have not requested this email, please ignore it.`;

//   try {
//     await sendEmail({
//       email,
//       subject: 'CampusMart Password Recovery',
//       message,
//     });

//     console.log(`Password reset email sent to ${email} successfully`);
//   } catch (error) {
//     console.error('Error sending password reset email:', error);
//     throw new Error('Failed to send password reset email');
//   }
// }

// Helper function to send the verification email
// async function sendVerificationEmail(email, verificationToken) {
//   const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;

//   const message = `Please click the following link to verify your email:\n\n${verificationUrl}\n\nIf you have not requested this email, please ignore it.`;

//   try {
//     await sendEmail({
//       email,
//       subject: 'Email Verification',
//       message,
//     });

//     console.log(`Verification email sent to ${email} successfully`);
//   } catch (error) {
//     console.error('Error sending verification email:', error);
//     throw new Error('Failed to send verification email');
//   }
// }



exports.registerUser = catchAsyncErrors(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });

  const { name, email, password } = req.body;
  
  // Check if the email is already registered
  let user = await User.findOne({ email });

  if (user) {
    if (user.verified) {
      // return res.status(200).json({
      //   success: false,
      //   message: "User already registered",
      // });
      return next(new ErrorHander("User already registered", 500));
    } else {
      // Delete the existing user
      await User.deleteOne({ email });
    }
  }

  // Create a new user
  user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  
  
  
  
  const verificationToken=user.getVerificationToken();
  await user.save({ validateBeforeSave: false });
  


  const verificationUrl=`http://localhost:5173/account/verify/${verificationToken}`

  const message = `Please click the following link to verify your email:\n\n${verificationUrl}\n\nIf you have not requested this email, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `CampusMart Email Verification`,
      message,
    });
    
    res.status(200).json({
      success: true,
      user:user,
      
      message: ` Verification Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.userVerificationToken = undefined;
    user.userVerificationExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
  



  sendToken(user, 201, res);

})

//verify email
exports.verifyEmail = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const userVerificationToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  // const userVerificationToken=req.params.token

  const user = await User.findOne({
    userVerificationToken,
    userVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Verification Token is invalid or has been expired",
        400
      )
    );
  }

  

  user.verified = true;
  user.userVerificationToken = undefined;
  user.userVerificationExpire = undefined;

  await user.save();
  res.status(200).json({
    message: "Email verified successfully",
    user,
  })


  // sendToken(user, 200, res);
});

//login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHander("Please Enter Email & Password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !user.verified) {
    return next(new ErrorHander("User not exist with this email", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Password not match", 401));
  }
  

  sendToken(user, 200, res);
});

// Logout User
exports.logout = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new ErrorHander("User not found", 404));
  }

  // Get ResetPassword Token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  


  const resetPasswordUrl=`http://localhost:5173/password/reset/${resetToken}`

  const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;

  try {
    await sendEmail({
      email: user.email,
      subject: `CampusMart Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new ErrorHander(error.message, 500));
  }
});


// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  // creating token hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHander(
        "Reset Password Token is invalid or has been expired",
        400
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHander("Password does not match with confirmpassword", 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});

// Get User Detail
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if(user.verified){
    res.status(200).json({
      success: true,
      user,
    });
  }
  else{
    res.status(400).json({
      success:false,

    })
  }
});

// update User password
exports.updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHander("Old password is incorrect", 400));
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return next(new ErrorHander("password does not match", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});

// update User Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };


  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user
  });
});

// Get all users(admin)
exports.getAllUser = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
exports.getSingleUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`)
    );
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// update User Role -- Admin
exports.updateUserRole = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorHander(`User does not exist with Id: ${req.params.id}`, 400)
    );
  }

  const imageId = user.avatar.public_id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User Deleted Successfully",
  });
});