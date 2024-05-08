var express = require('express');
var router = express.Router();

const User = require('../model/users');

router.get('/', async (req, res, next) => {
    const users = await User.find({});
    res.status(200).json({
        status: 'success',
        data: users
    });
});
  
router.get('/:id', async (req, res, next) => {
    const users = await User.findById(req.params.id);
    if (users !== null) {
        res.status(200).json({
            status: 'success',
            data: users
        });
    } else {
        res.status(400).json({
            status: 'failed',
            message: '無此使用者'
        });
    }
});

router.post('/', async (req, res, next) => {
    try {
        const newUser = await User.create(req.body);
        res.status(200).json({
            status: 'success',
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            status: 'failed',
            message: error.message
        });
    }
});

module.exports = router;