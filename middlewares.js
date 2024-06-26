const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const validator = require('validator');

const appConfig = require('./app_config');
const { operationalError } = require('./services/errorHandling');
const processErrorForRespond = require('./services/processErrorForRespond');
const { respondFailed } = require('./services/response');
const User = require('./model/users');

/**
 * Handles the request body for creating new post or updating existing post.
 */
function handleRequestBodyForPost(req, res, next) {
    trimObjectProperty(req.body, 'content');
    if (req.body.tags instanceof Array) {
        for (let i = 0; i < req.body.tags.length; ++i) {
            if (typeof req.body.tags[i] !== 'string') continue;
            req.body.tags[i] = req.body.tags[i].trim();
        }
    }

    next();
}

/**
 * Handles the request body for creating new user or updating existing user.
 */
function handleRequestBodyForUser(req, res, next) {
    trimObjectProperty(req.body, 'nickname');
    trimObjectProperty(req.body, 'email');
    trimObjectProperty(req.body, 'password');

    const nicknameMinLength = 2;
    if (req.body.nickname !== undefined 
            && !validator.isLength(req.body.nickname, { min: nicknameMinLength })) {
        throw operationalError(400, `暱稱至少需 ${nicknameMinLength} 個字元`);
    }

    if (req.body.email !== undefined && !validator.isEmail(req.body.email)) {
        throw operationalError(400, 'Email 格式不正確');
    }

    next();
}

/**
 * Handles the request body for creating new comment.
 */
function handleRequestBodyForComment(req, res, next) {
    trimObjectProperty(req.body, 'content');

    next();
}

async function authenticateUser(req, res, next) {
    const authHeaderValue = req.headers.authorization ?? '';
    if (authHeaderValue.startsWith('Bearer ')) {
        const token = authHeaderValue.substring(7);

        let decoded = null;
        try {
            decoded = await verifyJwtAsync(token);
        } catch {
            throw operationalError(401, '未登入');
        }

        if (decoded.id === undefined) {
            throw operationalError(401, '未登入');
        }

        const userInfo = await User.findById(decoded.id).select('-_id');
        if (userInfo === null) {
            throw operationalError(401, '未登入');
        }

        req.authenticatedUser = { id: decoded.id, info: userInfo };
        next();
    } else {
        throw operationalError(401, '未登入');
    }
}

const checkUploadImage = multer({
    limits: {
        files: 1,
        fileSize: Math.round(appConfig.maxUploadImageSizeMB * 1024 * 1024),
    },
    fileFilter (req, file, cb) {
        const allowedExts = ['.jpg', '.jpeg', '.png'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (!allowedExts.includes(ext)) {
            cb(new operationalError(400, '檔案格式錯誤，僅限上傳 jpg, jpeg, png 格式'));
        } else {
            cb(null, true); // 接受檔案
        }
    },
}).any();

function invalidRouteHandler(req, res, next) {
    throw operationalError(404, '無此路由');
}

function errorHandler(err, req, res, next) {
    const { statusCode, isOperational, userMessage } =
        processErrorForRespond(err);

    if (!isOperational) {
        // 寫 log
        console.error(`[Non-operational Error] ${err}`); // (暫時用 console.error())
    }

    const msgObj = { message: userMessage };
    if (process.env.NODE_ENV === "dev") {
        // 只有在 dev 環境才加上 `err` 的資訊
        msgObj.errorName = err.name;
        msgObj.error = err;
        msgObj.stack = err.stack;
    }
    respondFailed(res, statusCode, msgObj);
}

// utilities

function trimObjectProperty(obj, propertyName) {
    if (typeof obj[propertyName] === 'string') {
        obj[propertyName] = obj[propertyName].trim();
    }
}

function verifyJwtAsync(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
            if (err) {
                reject(err)
            } else {
                resolve(payload)
            }
        });
    });
}

//

module.exports = {
    handleRequestBodyForPost,
    handleRequestBodyForUser,
    handleRequestBodyForComment,
    authenticateUser,
    checkUploadImage,
    invalidRouteHandler,
    errorHandler,
};

