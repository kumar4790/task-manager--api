const express = require('express');
const router = new express.Router();
const Tasks = require('../models/tasks');
const auth = require('../middleware/auth');

//Create tasks to the db
router.post('/tasks', auth, async (req, res) => {
  console.log(req.body.assigned);
  const request = req.body.assigned
    ? req.body
    : { ...req.body, assigned: req.user._id };
  const task = await new Tasks({
    ...request,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    res.status(400).send(error);
  }
});

//Read the list of tasks from db
//GET /tasks?completed=true
//GET /tasks?search=shdsdh
//GET /tasks?limit=1&skip=1
//GET /tasks?sortBy=createdAt_desc
//GET /tasks?count
router.get('/tasks', auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === 'true';
  }

  // if (req.query.search) {
  //   match.search = req.query.completed === 'true';
  // }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split('_');
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
  }

  try {
    await req.user
      .populate({
        path: 'tasks',
        match,
        options: {
          limit: parseInt(req.query.limit),
          skip: parseInt(req.query.skip),
          sort,
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
    res.send(task);
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
