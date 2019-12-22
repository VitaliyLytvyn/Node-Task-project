const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, cancelEmail } = require('../emails/acount')

// sign-up
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (err) {
        res.status(400).send(err)
    }
})

// log-in
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        //res.send({ user: user.getPublicProfile(), token })
        res.send({ user, token })
    } catch (err) {
        res.status(400).send(err)
    }
})

// log-out
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => { token.token !== req.token })
        await req.user.save()
        res.send()
    } catch (err) {
        console.log(err)
        res.status(500).send()
    }
})

// log-out All - logout all sessions(all tokens like from different devices)
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (err) {
        console.log(err)
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowed = ["age", "name", "email", "password"]
    const isvalid = updates.every((update) => allowed.includes(update))
    if (!isvalid) {
        res.status(400).send({ 'error': 'Invalid updates!' })
    }
    try {
        const user = req.user //await User.findById(req.params.id)
        updates.forEach(update => user[update] = req.body[update])
        await user.save()
        //findByIdAndUpdate not fire save hook on mongoose middleware!!! so use above approach!
        //https://mongoosejs.com/docs/middleware.html#types-of-middleware
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

        res.send(user)
    } catch (err) {
        res.status(400).send()
    }
})

router.delete('/users/me', auth, async (req, res) => {
    try {
        // const user = await User.findByIdAndDelete(req.user._id)
        // if (!user) {
        //     return res.status(404).send()
        // }
        await req.user.remove()
        cancelEmail(req.user.email, req.user.name)
        res.send(req.user)

    } catch (err) {
        res.status(500).send(err)
    }
})

// Uploading file
const upload = multer({
    //dest: 'avatars',
    limits: {
        fileSize: 1 * 1024 * 1000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('File should be of image type'))
        }
        cb(undefined, true)
        // cb(new Error('File should be PDF'))
        // cb(undefined, true)
        // cb(undefined, false)
    }
})
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    const buffer = await sharp(req.file.buffer)
        .resize({ width: 250, height: 250 }) // resize pic
        .png()// to png format
        .toBuffer()
    req.user.avatar = buffer
    //req.user.avatar = req.file.buffer// binary data accesable only if 'upload' has no 'dest'
    await req.user.save()
    res.send()
}, (err, req, res, next) => { //this customize ERROR responce
    res.status(400).send({
        error: err.message
    })
})

// Deleting user's avatar
router.delete('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    req.user.avatar = undefined//req.file.buffer// binary data accesable only if 'upload' has no 'dest'
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user | !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png').send(user.avatar)
    } catch (err) {
        res.status(404).send()
    }
})

module.exports = router