// this file contains all the webservices related to the "comments" collection

// necessary imports 
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";
import { ObjectId } from 'mongodb';

// instantiate the router using express
const router = express.Router();

// function to get the comments of a post 
async function getComments(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'comments'; 

    try {
        // get postId from request parameters
        const { postId } = req.params;

        // connect to MongoDB and get the collection
        const commentsCollection = await connectToMongoDB(databaseName, collectionName);

        // validate input
        if (!postId) {
            res.status(400).json({ error: 'Invalid input' });
            return;
        }

        // find all the comments for the post with the specified postId
        const postComments = await commentsCollection.find({ commentedPostId: postId }).toArray();

        // if there are comments, send them
        if (postComments.length > 0) {
            res.status(200).json(postComments);

            // else if there are none, then send a response with comments set to false
        } else {
            res.status(200).json({ comments: false });
        }
        // convey errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting comments' });
    }
}

// function to make a comment with all the text data, returns a postId for the updateCommentPhoto function to add the commenter's photo
async function makeComment(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'comments'; 

    try {
        // get comment data from request body
        const { commentedPostId, user, text } = req.body;

        // connect to MongoDB and get the collection
        const commentsCollection = await connectToMongoDB(databaseName, collectionName);

        // insert comment data into the comments collection
        const result = await commentsCollection.insertOne({
            commentedPostId,
            user,
            text
        });

        // get the _id of the newly created comment
        let postId = result.insertedId;

        // convey success response with the _id of the newly made comment
        res.status(201).json({ success: true, message: 'Comment created successfully', postId });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error during comment creation' });
    }
}

// function to update a comment with the commenter's profile photo, gets the comment id fromt the makeComment function
async function updateCommentPhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'comments'; 

    try {
        // get comment _id and photo data from request body
        const { commentId } = req.params;
        const { photoData } = req.body;

        // connect to MongoDB and get the collection
        const commentsCollection = await connectToMongoDB(databaseName, collectionName);

        // convert commentId string to ObjectId
        const commentObjectId = new ObjectId(commentId);

        // check if the comment exists, if not return error
        const existingComment = await commentsCollection.findOne({ _id: commentObjectId });
        if (!existingComment) {
            res.status(404).json({ error: 'Comment not found' });
            return;
        }

        // otherwise update the comment with the commenter's photo
        await commentsCollection.updateOne(
            { _id: commentObjectId },
            { $set: { userPhoto: photoData } } // Update the commentImg field with the base64 data directly
        )

        // convey success 
        res.status(200).json({ success: true, message: 'Comment updated successfully' });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating comment with image' });
    }
}

// function that updates all the comments made by user with the user's new profile photo
async function updateUserProfilePhotoInComments(req, res) {
    const databaseName = 'pixstarCW2'; 
    const commentsCollectionName = 'comments';

    try {
        // get user and profile photo data from request body
        const { profilePhoto } = req.body;
        const { username } = req.params;

        // connect to MongoDB and get the comments collection
        const commentsCollection = await connectToMongoDB(databaseName, commentsCollectionName);

        // update the userPhoto for the user in the comments collection
        await commentsCollection.updateMany(
            { user: username }, 
            { $set: { userPhoto: profilePhoto } }
        );

        // convey success 
        res.status(200).json({ success: true, message: 'User profile photo updated in comments successfully' });

        // convey error in JSON format
    } catch (error) {
        console.error(`error: ${error}`)
        res.status(500).json({ error: 'Error updating user profile photo in comments' });
    }
}

// routes for the webservices 
router.get('/getComments/:postId', getComments)
router.post('/makeComment', makeComment);
router.post('/updateCommentPhoto/:commentId', updateCommentPhoto);
router.post('/updateUserProfilePhotoInComments/:username', updateUserProfilePhotoInComments);

// export router for use in server.js
export default router;
