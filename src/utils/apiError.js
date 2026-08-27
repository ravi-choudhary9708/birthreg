class apiError extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        errors=[],
        stack=""
    ){
        super(message),
        this.message=message,
        this.statusCode=statusCode,
        this.data=null,
        this.errors=errors,
        this.success=false

        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
    toJSON(){
        return{
            statusCode:this.statusCode,
            message:this.message,
            errors:this.errors,
            success:this.success,
            
        }
    }
}

export {apiError}