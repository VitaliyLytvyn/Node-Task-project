const mongoose = require('mongoose')

const taskSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true,
            trim: true
        },
        compleeted: {
            type: Boolean,
            default: false
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)

taskSchema.pre('save', async function (next) {
    const task = this

    if (task.isModified('password')) {
        task.password = await bcrypt.hash(task.password, 8)
    }
    if (task.isModified('description')) {
        task.description = (task.description + "-NEW-")
    }
    console.log('just before saving: ', task)
    next()
})

const Task = mongoose.model('Task', taskSchema)
module.exports = Task