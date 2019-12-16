const express = require('express')
const router = new express.Router()
const Task = require('../models/task')
const auth = require('../middleware/auth')

router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        res.status(400).send(err)
    }

})
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowed = ["compleeted", "description", "password"]
    const isvalid = updates.every((update) => allowed.includes(update))
    if (!isvalid) {
        res.status(400).send({ 'error': 'Invalid updates!' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
        if (!task) {
            return res.status(404).send()
        }
        updates.forEach(update => task[update] = req.body[update])
        await task.save()

        res.send(task)
    } catch (err) {
        res.status(400).send(err)
    }
})

// GET /tasks?complited=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    const sort = {}
    if (req.query.compleeted) {
        match.compleeted = req.query.compleeted === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    try {
        //const tasks = await Task.find({ owner: req.user._id })
        //res.status(201).send(tasks)
        await req.user.populate({
            path: "myTasks",
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort  //-1=desc
            }
        }).execPopulate()
        res.status(201).send(req.user.myTasks)
    } catch (err) {
        res.status(400).send(err)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        //const task = await Task.findById(id)
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.status(201).send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

module.exports = router