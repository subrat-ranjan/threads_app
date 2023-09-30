"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDB } from "../mongoose"
import Thread from "../models/threadmodel";
import { FilterQuery, SortOrder } from "mongoose";

interface Params{
    userId:string,
    username:string,
    name:string,
    bio:string,
    image:string,
    path:string
}

export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path,
}:Params): Promise<void>{
    
    try {
        connectToDB();
        await User.findOneAndUpdate(
           { id: userId},
            {
                username:username.toLowerCase(),
                name,
                bio,
                image,
                onboarded:true,
            },
            { upsert:true} 
        );
        if(path === '/profile/edit'){
            revalidatePath(path);//a nextjs function
        }
    } catch (error:any) {
        throw new Error (`Failed to create/update user: ${error.message}`)
    }
}

export async function fetchUser(userId:string){
    try {
        connectToDB();

        return await User.findOne({ id: userId})
            // .populate({
            // path:'communities',
            // model:Community
        // })
    } catch (error:any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

export async function fetchUserPosts(userId:string) {
    try {
        connectToDB();

        //Find all threads authored by user with the given userId
        //TODO: Populate community
        const threads = await User.findOne({id:userId})
        .populate({
            path:"threads",
            model:Thread,
            populate:{
                path:'children',
                model:Thread,
                populate:{
                    path:'author',
                    model:User,
                    select:"name image id"
                }
            }
        })
        return threads;
    } catch (error:any) {
        throw new error(`Failed to fetch user posts:${error.message}`)
    }
}

export async function fetchUsers({
    userId,
    searchString="",
    pageNumber =1,
    pageSize=20,
    sortBy="desc"
}:{
    userId:string,
    searchString?:string,
    pageNumber?:number,
    pageSize?:number,
    sortBy?:SortOrder,
}) {
    try {
        connectToDB();
        const skipAmount= (pageNumber -1) *pageSize;
        const regex = new RegExp(searchString, "i");
        const query:FilterQuery<typeof User> = { id:{$ne:userId}}
        if(searchString.trim() !== ''){
            query.$or=[
                {username:{$regex:regex}},
                {name:{$regex:regex}}
            ]
        }
        //sorting
        const sortOptions = {createdAt:sortBy};
        const userquery = User.find(query)
        .sort(sortOptions).skip(skipAmount)
        .limit(pageSize)
         
        const totalUserCount = await User.countDocuments(query)
        const users = await userquery.exec();
        const isnext= totalUserCount > skipAmount + users.length
        return {users, isnext}
    } catch (error:any) {
        throw new Error(`Failed to fetch users: ${error.message}`)
    }
}

export async function getActivity(userId:string) {
   try {
    connectToDB();
    //find all threads created by the user
    const userThreads = await Thread.find({author:userId})
    //Collect all the child thred ids (replies) from the children field
    const childThreadIds = userThreads.reduce((acc,userThread)=>{
        return acc.concat(userThread.children)
    },[])
    const replies =  await Thread.find({
        _id:{$in:childThreadIds},
        author:{$ne:userId}//exclude the threads created by the same user ie searching for this.
    }).populate({
        path:'author',
        model:User,
        select: 'name image _id'
    })
    return replies;
   } catch (error:any) {
    throw new Error(`Failed to Fetch Activity: ${error.message}`)
   } 
}  
    
