import mongoose,{Schema} from "mongoose";   
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// When you fetch large amounts of data using Mongoose aggregation, 
// you don't want to load everything at once—it slows down your app.
// This package helps you fetch data page by page with a simple method.

const videoSchema=new Schema({
    videoFile:{
        type:String, //Cloudinary URL
        required:true
    },
    thumbnail:{
        type:String, //cloudinary URL
        required:true
    },
    title:{
        type:String, 
        required:true
    }, 
    desciption:{
        type:String, 
        required:true
    },
    duration:{
        type:Number, //cloudinary URL
        required:true
    },
    views:{
        type:Number,
        default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})


videoSchema.plugin(mongooseAggregatePaginate)
export const Video=mongoose.model("Video",videoSchema)