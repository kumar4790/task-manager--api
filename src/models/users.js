const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Tasks = require("../models/tasks");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is Invalid!");
        }
      },
    },
    password: {
      type: String,
      require: true,
      trim: true,
      validate(value) {
        if (value.length < 7) {
          throw new Error("Password must have more than 6 digits.");
        } else if (value.toLowerCase().includes("password")) {
          throw new Error('Password must not have "password"!');
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error(`Age can't be Negative!`);
        }
      },
    },
    tokens: [{ token: { type: String, required: true } }],
    avatar: { type: Buffer },
  },
  { timestamps: true }
);

userSchema.virtual("tasks", {
  ref: "Tasks",
  localField: "_id",
  foreignField: "owner",
});

//data for sending back to user
userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;
  return userObject;
};

//generate Token
userSchema.methods.generateWebToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET_CODE || "somethingsecret"
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

//find the user by their credentials
userSchema.statics.findUserByCredentials = async (email, password) => {
  const user = await Users.findOne({ email });
  if (!user) {
    throw new Error("Unable to Login!");
  }
  const isMatched = await bcrypt.compare(password, user.password);
  if (!isMatched) {
    throw new Error("Unable to Login!");
  }
  return user;
};

//encrypt the password before saving it into db
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

//delete User's all tasks when user deleted
userSchema.pre("remove", async function (next) {
  const user = this;
  await Tasks.deleteMany({ owner: user._id });
  next();
});

const Users = mongoose.model("Users", userSchema);

module.exports = Users;
