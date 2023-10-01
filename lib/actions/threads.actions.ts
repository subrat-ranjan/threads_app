"use server"

import { revalidatePath } from "next/cache";
import Thread from "../models/threadmodel";
import User from "../models/user.model";
import { connectToDB } from "../mongoose";
import Community from "../models/community.model";

interface Params{
    text:string,
    author:string,
    communityId:string | null,
    path:string,
}

export async function createThread({
    text,author,communityId,path
}:Params) {
    try {  
        connectToDB();
//to find the community
        const communityIdObject = await Community.findOne({id:communityId},{_id:1});

        const createdThread = await Thread.create({
            text,author, community:communityIdObject,
        });
    
        //update usermodel
    
        await User.findByIdAndUpdate(author, {
            $push:{threads: createdThread._id}
        })
if(communityIdObject){
    //update the community model
    await Community.findByIdAndUpdate(communityIdObject,{
        $push:{threads:createdThread._id}
    })
}

      revalidatePath(path)
        
    } catch (error:any) {
        throw new Error(`Error creating thread:${error.message}`)
    }
   
}








export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDB();
  
    // Calculate the number of posts to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;
  
    // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
    const postsQuery = Thread.find({ parentid: { $in: [null, undefined] } })
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(pageSize)
      .populate({
        path: "author",
        model: User,
      })
      .populate({
        path: "community",
        model: Community,
      })
      .populate({
        path: "children", // Populate the children field
        populate: {
          path: "author", // Populate the author field within children
          model: User,
          select: "_id name parentid image", // Select only _id and username fields of the author
        },
      });
  
    // Count the total number of top-level posts (threads) i.e., threads that are not comments.
    const totalPostsCount = await Thread.countDocuments({
      parentid: { $in: [null, undefined] },
    }); // Get the total count of posts
  
    const posts = await postsQuery.exec();
  
    const isNext = totalPostsCount > skipAmount + posts.length;
  
    return { posts, isNext };
  }


 











// export async function fetchPosts(pageNummber = 1, pageSize = 20){

  
//         connectToDB();

//         //calculate the number of posts to skip:
//         const skipAmount = (pageNummber-1)*pageSize;
//         //fetch the posts that heve no parents(top-level threads...)
//         const postQuery = Thread.find({parentid:{$in:[null, undefined]}}).sort({createdAt:'desc'}).skip(skipAmount).limit(pageSize).populate({path:'author', model:User}).populate({
//             path:'children',
//             populate:{
//                 path:'author',
//                 model:User,
//                 select:"_id name parentid image"
//             }
//         });
//         const totalPostsCount = await Thread.countDocuments({parentid:{$in:[null,undefined]},});
//         const posts = await postQuery.exec()
//         const isNext = totalPostsCount> skipAmount+posts.length;
//         return {posts, isNext}
    
// }








export async function fetchThreadById(id: string) {
    connectToDB();
  
    try {
      const thread = await Thread.findById(id)
        .populate({
          path: "author",
          model: User,
          select: "_id id name image",
        }) // Populate the author field with _id and username
        .populate({
          path: "community",
          model: Community,
          select: "_id id name image",
        }) // Populate the community field with _id and name
        .populate({
          path: "children", // Populate the children field
          populate: [
            {
              path: "author", // Populate the author field within children
              model: User,
              select: "_id id name parentid image", // Select only _id and username fields of the author
            },
            {
              path: "children", // Populate the children field within children
              model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
              populate: {
                path: "author", // Populate the author field within nested children
                model: User,
                select: "_id id name parentid image", // Select only _id and username fields of the author
              },
            },
          ],
        })
        .exec();
  
      return thread;
    } catch (err) {
      console.error("Error while fetching thread:", err);
      throw new Error("Unable to fetch thread");
    }
  }











// export async function fetchThreadById(id:string){
//     connectToDB();
//     try {

//         //TODO: Populate Community
//         const thread = await Thread.findById(id)
//         .populate({
//             path:'author',
//             model:User,
//             select:"_id id name image"
//         })
//         .populate({
//             path:'children',
//             populate:[
//                 {
//                 path:'author',
//                 model:User,
//                 select:"_id id name parentid image"    
//             },
//             {
//                 path:'children',
//                 model:Thread,     
//                 populate:{
//                     path:'author', 
//                     model:User,
//                     select:"_id id name parentid image"
//                 }
//             }
//          ]
//         }).exec();
//         return thread;
//     } catch (error:any) {
//         throw new Error(`Error fetching thread:${error.message}`)
//     }
// }

export async function addCommentToThread(
    threadId:string,
    commentText:string,
    userId:string,
    path:string,
) {
    connectToDB();
    try {
        //adding a comment
        //First we have to find Original thread by its ID
        const originalThread = await Thread.findById(threadId);
        if(!originalThread){
            throw new Error("Thread not found")
        }
        //create a new thread with the comment text
        const commentThread = new Thread({
            text:commentText,
            author:userId,
            parentid:threadId
        })

        //save the new thread
        const saveCommentThread = await commentThread.save();
        //update the original thread to include the new comment
        originalThread.children.push(saveCommentThread._id);
        //save the original thread
        await originalThread.save()
        revalidatePath(path)// so that it shows instantly

    } catch (error:any) {
        throw new Error(`Error adding comment to thread: ${error.message}`)
    }
}







//fetchAllChildThreads

async function fetchAllChildThreads(threadId: string): Promise<any[]> {
  const childThreads = await Thread.find({ parentid: threadId });

  const descendantThreads = [];
  for (const childThread of childThreads) {
    const descendants = await fetchAllChildThreads(childThread._id);
    descendantThreads.push(childThread, ...descendants);
  }

  return descendantThreads;
}

//delete thread 
export async function deleteThread(id: string, path: string): Promise<void> {
  try {
    connectToDB();

    // Find the thread to be deleted (the main thread)
    const mainThread = await Thread.findById(id).populate("author community");

    if (!mainThread) {
      throw new Error("Thread not found");
    }

    // Fetch all child threads and their descendants recursively
    const descendantThreads = await fetchAllChildThreads(id);

    // Get all descendant thread IDs including the main thread ID and child thread IDs
    const descendantThreadIds = [
      id,
      ...descendantThreads.map((thread) => thread._id),
    ];

    // Extract the authorIds and communityIds to update User and Community models respectively
    const uniqueAuthorIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.author?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    const uniqueCommunityIds = new Set(
      [
        ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
        mainThread.community?._id?.toString(),
      ].filter((id) => id !== undefined)
    );

    // Recursively delete child threads and their descendants
    await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

    // Update User model
    await User.updateMany(
      { _id: { $in: Array.from(uniqueAuthorIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    // Update Community model
    await Community.updateMany(
      { _id: { $in: Array.from(uniqueCommunityIds) } },
      { $pull: { threads: { $in: descendantThreadIds } } }
    );

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to delete thread: ${error.message}`);
  }
}

