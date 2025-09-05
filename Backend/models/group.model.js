import mongoose from 'mongoose'

const groupSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
        minlength: 3,
        maxlength: 50
    },
    icon:{
        type:String,
        default:'https://cdn-icons-png.flaticon.com/256/17159/17159730.png'
    },
    description:{
        type:String,
        default: ''
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    members:[{
        memberId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        role:{
            type:String,
            enum:['admin','member'],
            default:'member'
        },
        joinedAt:{
            type:Date,
            default:Date.now
        }
    }],
    
    chat:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'GroupMessage'
    }],
    groupPermissions:{
        // members can
        edit_grp_setting:{            //can change name,icon description
            type:String,
            enum:['on','off'],
            default:'off'
        },  
        send_msg:{                  //can send message   
            type:String,
            enum:['on','off'],
            default:'on'
        },
        add_members:{              //can add other members
            type:String,
            enum:['on','off'],
            default:'on'
        }
    },
    notifications:[{
        type:{
            type:String,
            enum:['create_grp','add','remove','leave','icon','name','description','edit_grp','send_msg','add_members','make_admin','dismiss_admin'],
        },
        author:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        user:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        status: [{
            userId:{
                type:mongoose.Schema.Types.ObjectId,
                ref:'User'
            },
            status:{
                type:String,
                enum: ['unseen','seen'],
                default: 'unseen',
            },
        }],
        createdAt:{
            type:Date,
            default:Date.now
        }
    }],
    onlineMembers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    }]
},{timestamps:true})


export const Group = mongoose.model('Group',groupSchema)




// if member left the group u can directly add them