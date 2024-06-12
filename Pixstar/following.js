// this file contains all the webservices related to the "following" collection

// necessary imports
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";

// instantiate router using express
const router = express.Router();

// function to get the following count of a user from the "following" collection
async function getFollowingCount(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'following';

    try {
        // get user from req parameters
        const { user } = req.params;

        // connect to MongoDB and get the collection
        const followingCollection = await connectToMongoDB(databaseName, collectionName);

        // find the user in the following collection
        const userFollowing = await followingCollection.findOne({ username: user });

        // if the user exists and has a following, return the number of followers
        if (userFollowing) {
            const followingCount = userFollowing.following ? userFollowing.following.length : 0;
            res.status(200).json({ followingCount });

            // if the user doesn't exist, return 0
        } else {
            
            res.status(200).json({ followingCount: 0 });
        }

        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting following count' });
    }
}

// function to get the users that are following the provided user
async function getUsersFollowing(req, res) {
    const databaseName = 'pixstarCW2'; // Database name
    const collectionName = 'following'; // Collection name

    try {
        // get user from req params
        const { user } = req.params;

        // connect to MongoDB and get the collection
        const followingCollection = await connectToMongoDB(databaseName, collectionName);

        // find the user in the following collection
        const userFollowing = await followingCollection.findOne({ username: user });

        // if user exists and has following, return the following array
        if (userFollowing && userFollowing.following && userFollowing.following.length > 0) {
            const followingUsers = userFollowing.following;
            res.status(200).json({ followingUsers });


        // if user doesn't exist or following array is null or empty, return an empty array
        } else {
            res.status(200).json({ followingUsers: [] });
        }

        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting users following' });
    }
}


// function to follow a user
async function followUser(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'following';

    try {
        // get user and followedUser from request body
        const { user, followedUser } = req.body;

        // connect to MongoDB and get the collection
        const followingCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the following collection
        const existingUser = await followingCollection.findOne({ username: user });

        // if the user exists, update their follwowing array
        if (existingUser) {
            // if the array doesn't exist, make one
            if (!existingUser.following) {
                existingUser.following = [];
            }
            // add the followedUser to the "following" array
            existingUser.following.push(followedUser);

            // update the document in the collection
            await followingCollection.updateOne(
                { username: user },
                { $set: { following: existingUser.following } }
            );

            // convey success 
            res.status(200).json({ success: true, message: `User ${user} is now following ${followedUser}` });
        } else {
            // user doesn't exist, create a new document for the user
            await followingCollection.insertOne({
                username: user,
                following: [followedUser]
            });

            // convey success 
            res.status(200).json({ success: true, message: `New user ${user} created and following ${followedUser}` });
        }
        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error following user' });
    }
}

// function to check if a user is following another user
async function checkIfFollowing(req, res) {

    const databaseName = 'pixstarCW2'; 
    const collectionName = 'following'; 

    try {
        // get user and followedUser from request body
        const { user, followedUser } = req.body;

        // connect to MongoDB and get the collection
        const followingCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the following collection
        const existingUser = await followingCollection.findOne({ username: user });

        // if user exists, check if followedUser is in the "following" array
        if (existingUser) {
            const isFollowing = existingUser.following && existingUser.following.includes(followedUser);

            // return true if followedUser is in the "following" array, else return false
            res.status(200).json({ isFollowing });

            //else user doesn't exist, return false
        } else {
            
            res.status(200).json({ isFollowing: false });
        }
        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error checking following' });
    }
}

// function to remove a user from the following of another 
async function removeFromFollowing(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'following'; 

    try {
        // get user and followedUser from request body
        const { user, followedUser } = req.body;

        // connect to MongoDB and get the collection
        const followingCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the following collection
        const existingUser = await followingCollection.findOne({ username: user });

        // if user exists, check if followedUser is in the "following" array
        if (existingUser) {
            // if the array exists and the followedUser exists in the following array
            if (existingUser.following && existingUser.following.includes(followedUser)) {

                // remove followedUser from the "following" array
                existingUser.following = existingUser.following.filter(u => u !== followedUser);

                // update the document in the collection
                await followingCollection.updateOne(
                    { username: user },
                    { $set: { following: existingUser.following } }
                );

                // convey success 
                res.status(200).json({ success: true, message: `Removed ${followedUser} from following list of ${user}` });

                // convey error if followedUser is not found in the following list 
            } else {
                res.status(404).json({ success: false, message: `${followedUser} is not in the following list of ${user}` });
            }
            // convey error if user doesn't exist
        } else {
            res.status(404).json({ success: false, message: `User ${user} not found` });
        }
        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error removing user from following' });
    }
}

// routes for the webservices
router.get('/count/:user', getFollowingCount);
router.get('/users/:user', getUsersFollowing);
router.post('/followUser', followUser);
router.post('/checkIfFollowing', checkIfFollowing);
router.post('/removeFromFollowing', removeFromFollowing);

// export router for the use in server.js
export default router;
