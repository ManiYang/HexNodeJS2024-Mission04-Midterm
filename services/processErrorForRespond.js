
function processErrorForRespond(err) {
    let statusCode = 500;
    let userMessage = '系統發生問題，請稍後再試'; // userMessage 是可被使用者看到的內容

    if (err.isOperational === true)  {
        statusCode = err.statusCode;
        userMessage = err.message;
    } else {
        // errors from mongoose 
        if (err.name === "ValidationError") {
            statusCode = 400;
            userMessage = '資料欄位未填寫正確，請重新輸入';
        } 
    }

    return { statusCode, userMessage };
}

module.exports = processErrorForRespond;
