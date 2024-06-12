// this file contains the webservices related to the "posts" collection

// necessary imports
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";
import { ObjectId } from 'mongodb'; 

// instantiate router using express
const router = express.Router();


// this function gets the user's posts from the "posts" collection
async function getUserPosts(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // get username from request params
        const username = req.params.username;

        // validate the input
        if (!username) {
            res.status(400).send('Invalid input');
            return;
        }

        // find all posts made by the user, store them in an array
        const userPosts = await postsCollection.find({ user: username }).toArray();

        // if the user's posts are found, send them in the response
        if (userPosts.length > 0) {
            res.status(200).json(userPosts);
        } else {
            // if no posts are found for the user, send an error message
            res.status(404).json({ message: 'No posts found for the user' });
        }
        // convey and errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting user posts' });
    }
}

// function to get the users posts details by the posts ID
async function getPostDetailsbyID(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // get the postId from the params
        const postId = req.params.postId;

        // validate the input
        if (!postId) {
            res.status(400).send('Invalid input');
            return;
        }

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // find the post in the "posts" collection by its Id
        const post = await postsCollection.findOne({ _id: postObjectId });


        // if found, add the postId to the session and send its details
        if (post) {
            req.session.postId = postId;

            // If post is found, send its details in the response
            res.status(200).json(post);

            // if not found, send error 
        } else {
            
            res.status(404).json({ error: 'Post not found' });
        }
        // convey and errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting post details' });
    }
}

// function to check whether the user liked the posts be checking the likedBy array of the post, used for the like button
async function checkIfUserLikedPost(req, res) {
    const databaseName = 'pixstarCW2'; // Database name
    const collectionName = 'posts'; // Collection name

    try {
        // get the username and postId from request parameters
        const { username, postId } = req.params;

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // find the post by postId
        const post = await postsCollection.findOne({ _id: postObjectId });

        // if the post doesn't exist, send an error 
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        // check if likedBy array exists and if the username is in it, is a boolean value
        const likedByUser = post.likedBy && post.likedBy.includes(username);

        // get the current likes of the post
        let currentLikes = post.likes 

        // send the likedByUser value and current likes of the post
        res.status(200).json({ likedByUser, currentLikes });
    } catch (error) {
        // Send error response
        console.error('Error checking if user liked post:', error);
        res.status(500).json({ error: 'Error checking if user liked post' });
    }
}

// function to get the user's liked post, used to populate the "liked" page in the home tab

async function getUserLikedPosts(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get username from request parameters
        const { username } = req.params;

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // find posts where the likedBy array contains the given username, store them in an array 
        const likedPosts = await postsCollection.find({ likedBy: username }).toArray();

        // get postIds from the likedPosts array
        const postIds = likedPosts.map(post => post._id);

        // return the array of postIds where the user is found in the likedBy array
        res.status(200).json({ likedPosts: postIds });

        // convey and errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error checking user liked posts' });
    }
}

// function to get the posts likes, used for the like functionality
async function getPostLikes(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get postId from request parameters
        const { postId } = req.params;

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // find the post by postId
        const post = await postsCollection.findOne({ _id: postObjectId });

        // post doesn't exist
        if (!post) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        // else return the likes count of the post
        res.status(200).json({ likes: post.likes });

        // convey and errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting post likes' });
    }
}


// function to search posts by their title, used for the search functionality
async function searchPostsByTitle(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get title from request parameters
        const { title } = req.params;

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // maek a regex pattern to search for posts containing the given title parameter, i' flag for case-insensitive search/
        const searchPattern = new RegExp(title, 'i'); 

        // find posts whose title match or contain the search pattern
        const matchingPosts = await postsCollection.find({ title: { $regex: searchPattern } }).toArray();

        // return the matching posts in an array in JSON format
        res.status(200).json(matchingPosts);

        // convey an errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error searching posts by title' });
    }
}

// function to make a post, handles the text data for the post, provides a postId for the updatePostImage function to
// update the document with the post image
async function makePost(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get post data from request body
        const { user, title, description, likes } = req.body;

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // insert post data into the posts collection
        const result = await postsCollection.insertOne({
            user,
            title,
            description,
            likes,
        });

        // get the _id of the newly made post
        const postId = result.insertedId;

        // send response with the _id of the newly made post
        res.status(201).json({ result: true, message: 'Post created successfully', postId });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error during post creation' });
    }
}

// function to update the post with the post's image, gets the post Id from the "makePost" function
async function updatePostImage(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get post _id from params and photo data from request body
        const { postId } = req.params;
        const { photoData } = req.body;

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // check if the post exists
        const existingPost = await postsCollection.findOne({ _id: postObjectId });

        // if not, send error
        if (!existingPost) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        // if it does, update the post with the new photo
        await postsCollection.updateOne(
            { _id: postObjectId },
            { $set: { postImg: photoData } } 
        );

        // convey success response
        res.status(200).json({ success: true, message: 'Post updated successfully' });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating post with image' });
    }
}

// function to update the post's likes 
async function updatePostLikes(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'posts'; 

    try {
        // get postId, username, and likes adjustment data from request parameters and body
        const { postId } = req.params;
        const { username, adjustment } = req.body;

        // validate that adjustment is a number
        if (typeof adjustment !== 'number') {
            res.status(400).json({ error: 'Adjustment must be a number' });
            return;
        }

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // connect to MongoDB and get the collection
        const postsCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the post exists
        const existingPost = await postsCollection.findOne({ _id: postObjectId });


        // if it doesn't, convey error in JSON format
        if (!existingPost) {
            res.status(404).json({ error: 'Post not found' });
            return;
        }

        // if the post likes is NaN, set it to 0 instead
        if (isNaN(existingPost.likes)) {
            existingPost.likes = 0;
        }
        
        // initialize likedBy array if it doesn't exist
        if (!existingPost.likedBy) {
            existingPost.likedBy = [];
        }
        
        // check if the username is already in the likedBy array
        const userIndex = existingPost.likedBy.indexOf(username);

        // check if the adjustment is negative and the user is not in the likedBy array,
        // send error, since a negative adjustment can only be sent if the user has liked the post to counter it
        if (adjustment < 0 && userIndex === -1) {
            res.status(400).json({ error: 'User has not liked this post' });
            return;
        }

        // if adjustment is negative, it means the user is unliking the post
        if (adjustment < 0) {
            // remove the user from the likedBy array
            existingPost.likedBy.splice(userIndex, 1);

            // if user is already in likedBy array and adjustment is positive, return error
        } else if (userIndex !== -1) {
            res.status(400).json({ error: 'User already liked this post' });
            return;
        }

        // add the username to the likedBy array and adjust the likes count
        if (adjustment > 0) {
            existingPost.likedBy.push(username);
        }

        // calculate updated likes count
        let updatedLikes = existingPost.likes + adjustment;

        // ensure that likes count doesn't go below 0
        if (updatedLikes < 0) {
            updatedLikes = 0;
        }

        // update the post with the new likes count and likedBy array
        await postsCollection.updateOne(
            { _id: postObjectId },
            { $set: { likes: updatedLikes, likedBy: existingPost.likedBy } }
        );

        // send response with the updated likes count
        res.status(200).json({ success: true, message: 'Likes adjusted successfully', updatedLikes });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error adjusting likes of post' });
    }
}

// specifying the routes for the webservices
router.get('/getPosts/:username', getUserPosts);
router.get('/getPostbyID/:postId', getPostDetailsbyID);
router.get('/checkIfUserLikedPost/:username/:postId', checkIfUserLikedPost);
router.get('/userLikedPosts/:username', getUserLikedPosts);
router.get('/getPostLikes/:postId', getPostLikes);
router.get('/search/:title', searchPostsByTitle);
router.post('/makePost', makePost);
router.post('/updatePostImage/:postId', updatePostImage);
router.post('/updatePostLikes/:postId', updatePostLikes);


// export router for use in server.js
export default router;