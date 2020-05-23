const app = require('../src/app');
const port = process.env.PORT;

app.listen(port, (req, res) => {
  console.log('Server is up on port' + port);
});
