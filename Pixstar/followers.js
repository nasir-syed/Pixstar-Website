// this file contains all the webservices related to the "followers" collection

// necessary imports
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";

// instantiate router using express
const router = express.Router();


// function to get the followers count of a user
async function getFollowersCount(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'followers'; 

    try {
        // get user from request parameters
        const { user } = req.params;

        // connect to MongoDB and get the collection
        const followersCollection = await connectToMongoDB(databaseName, collectionName);

        // cind the user in the followers collection
        const userFollowers = await followersCollection.findOne({ username: user });

        // if the user exists, check if the followers array is not null and return its count
        if (userFollowers) {
            const followersCount = userFollowers.followers ? userFollowers.followers.length : 0;
            res.status(200).json({ followersCount });

            // else user doesn't exist, return 0
        } else {
            res.status(200).json({ followersCount: 0 });
        }

        // convey any errors in JSON format
    } catch (error) {
        console.error('Error getting followers count:', error);
        res.status(500).json({ error: 'Error getting followers count' });
    }
}

// function to get a user's followers 
async function getUserFollowers(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'followers';

    try {
        // get user from request parameters
        const { user } = req.params;

        // connect to MongoDB and get the collection
        const followersCollection = await connectToMongoDB(databaseName, collectionName);

        // find the user in the followers collection
        const userFollowers = await followersCollection.findOne({ username: user });

         // If user exists, return the followers array is its not null otherwise an empty array
        if (userFollowers) {
            const followers = userFollowers.followers || [];
            res.status(200).json({ followers });


            // if user doesn't exist, return an empty array
        } else {
            res.status(200).json({ followers: [] });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error getting user followers' });
    }
}


// function to add a follower
async function addFollower(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'followers';

    try {
        // get user and follower from req body
        const { user, follower } = req.body;

        // connect to MongoDB and get the collection
        const followersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the followers collection
        const existingUser = await followersCollection.findOne({ username: user });

        // if the user exists, update their followers array, if it doesnt exist then make a followers array
        if (existingUser) {
            if (!existingUser.followers) {
                existingUser.followers = [];
            }
            // add the follower to the followers array
            existingUser.followers.push(follower);

            // update the document in the collection
            await followersCollection.updateOne(
                { username: user },
                { $set: { followers: existingUser.followers } }
            );

            // convey success 
            res.status(200).json({ success: true, message: `User ${user} now has follower ${follower}` });


            // else user doesn't exist so create a new document for the user
        } else {
            await followersCollection.insertOne({
                username: user,
                followers: [follower]
            });

            // convey success response
            res.status(200).json({ success: true, message: `New user ${user} created with follower ${follower}` });
        }

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error adding follower' });
    }
}

// function to remove a follower 
async function removeFollower(req, res) {
    const databaseName = 'pixstarCW2';
    const collectionName = 'followers';

    try {
        // get user and follower from request body
        const { user, follower } = req.body;

        // connect to MongoDB and get the collection
        const followersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the followers collection
        const existingUser = await followersCollection.findOne({ username: user });

        // if user exists check if follower is in the followers array
        if (existingUser) {

            // remove follower from the followers array if the user is in it and it exists
            if (existingUser.followers && existingUser.followers.includes(follower)) {
                existingUser.followers = existingUser.followers.filter(f => f !== follower);

                // update the document in the collection
                await followersCollection.updateOne(
                    { username: user },
                    { $set: { followers: existingUser.followers } }
                );

                // convey success response
                res.status(200).json({ success: true, message: `Removed ${follower} from followers list of ${user}` });

                // else follower not found in the followers list, convey error
            } else {
                res.status(404).json({ success: false, message: `${follower} is not in the followers list of ${user}` });
            }
            // else user doesnt exist, convey error
        } else {
            res.status(404).json({ success: false, message: `User ${user} not found` });
        }

        // convey errors in JSON format
    } catch (error) {

        res.status(500).json({ error: 'Error removing follower' });
    }
}


// function to check if a user is a follower
async function checkIfFollower(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'followers'; 

    try {
        // get user and follower from request body
        const { user, follower } = req.body;

        // connect to MongoDB and get the collection
        const followersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists in the followers collection
        const existingUser = await followersCollection.findOne({ username: user });

        // if user exists check if follower is in the followers array
        if (existingUser) {
            const isFollower = existingUser.followers && existingUser.followers.includes(follower);

            // return true if follower is in the "followers" array, else return false
            res.status(200).json({ isFollower });


         // else user doesn't exist, return false
        } else {
            res.status(200).json({ isFollower: false });
        }

        // convey errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error checking if follower exists' });
    }
}

// routes for the webservices
router.get('/count/:user', getFollowersCount);
router.get('/allFollowers/:user', getUserFollowers);
router.post('/addFollower', addFollower);
router.post('/removeFollower', removeFollower);
router.post('/checkIfFollower', checkIfFollower);

// export the router for use in server.js
export default router;