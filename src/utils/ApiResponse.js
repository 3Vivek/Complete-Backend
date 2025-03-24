//for API response no class is present in Node bcz reponse handle done in Express
// though we can make class and standardized format

class ApiResponse{
    constructor(statusCode,data,message="success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}

export {ApiResponse}