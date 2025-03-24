//To standardized API response so that dev can send response in same format without remembering all the format
//We use ApiError class 

//Make a class ApiError and inherit the Error class and Override it so that we can make custom response format

class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        statck=""
    ){
        //override with super keyword
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false
        this.errors=errors


        //to check if stackTrace available
        if(statck){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}


export {ApiError}
