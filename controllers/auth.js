const User = require('../models/User');

//@desc    Register user
//@route   POST /api/users/register
//@access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, telephone, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      telephone,
      password,
      role,
    });

    sentTokenResponse(user, 201, res);
  } catch (err) {
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

//@desc    Login user
//@route   POST /api/users/login
//@access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, msg: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res
        .status(401)
        .json({ success: false, msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, msg: 'Invalid credentials' });
    }

    // Create token & send
    sentTokenResponse(user, 200, res);
  } catch (err) {
      res.status(401).json({ success: false, msg: 'Cannot convert email or password to string' });
  }
};

//@desc    Logout user (clear token cookie if used)
//@route   GET /api/users/logout
//@access  Public
exports.logout = async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
};

//@desc    Get current logged in user
//@route   POST /api/v1/auth/me
//access   Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (err) {
      res.status(400).json({ success: false });
  }
}

//@desc    Update current logged in user
//@route   PUT /api/users/update
//@access  Private
exports.update = async (req, res) => {
  try {
    const allowedFields = ['name', 'telephone', 'email'];

    const updateData = {};
    Object.keys(req.body).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (err) {
    res.status(400).json({ success: false });
    console.log(err.stack);
  }
};

//Get token from model, create cookie and send response
const sentTokenResponse = (user, statusCode, res) => {
  //Create token
  const token = user.getSignedJwtToken();

  const options = {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
      httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
      options.secure = true;
  }
  res.status(statusCode).cookie('token', token, options).json({
      success: true,
      token
  })
}
