const express = require('express');
const router = new express.Router();
const Tasks = require('../models/tasks');
const auth = require('../middleware/auth');

//Create tasks to the db
router.post('/tasks', auth, async (req, res) => {
  const task = await new Tasks({ ...req.body, owner: req.user._id });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(e);
  }
});

//Read the list of tasks from db
//GET /tasks?completed=true
//GET /tasks?limit=1&skip=1
//GET /tasks?sortBy=createdby_desc
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }
  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sortBy: { completed: -1 },
        },
      })
      .execPopulate();
    res.send(req.user.tasks);
  } catch (e) {
    res.status(500).send();
  }
});

//Read single task from db by its id
router.get('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).send();
  }
  try {
    const task = await Tasks.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (e) {
    res.status(500).send();
  }
});

//Update the task data from db

router.patch('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;
  if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).send();
  }

  const requestedUpdates = Object.keys(req.body);
  const allowedUpdates = ['description', 'completed'];
  const isAllowedUpdate = requestedUpdates.every((update) =>
    allowedUpdates.includes(update)
  );
  if (!isAllowedUpdate) {
    return res.status(400).send('error: Invalid Updates!');
  }

  try {
    const task = await Tasks.findOne({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    requestedUpdates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.status(201).send(task);
  } catch (e) {
    res.status(400).send(e);
    res.status(500).send();
  }
});

//Delete the task from the db
router.delete('/tasks/:id', auth, async (req, res) => {
  const _id = req.params.id;

  if (!_id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(404).send();
  }
  try {
    const task = await Tasks.findOneAndDelete({ _id, owner: req.user._id });
    if (!task) {
      return res.status(404).send();
    }
    res.status(201).send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
