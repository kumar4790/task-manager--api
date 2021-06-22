const mongoose = require("mongoose");
mongoose.connect(
  process.env.MONGO_DB_URL || "mongodb://localhost/task-manager",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {
    console.log("Mongo is connected");
  }
);
