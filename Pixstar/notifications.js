// this file contains webservices related to the "notification" colelction

// necessary imports
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";
import { ObjectId } from 'mongodb';

// instantiate router using express
const router = express.Router();

// function to get the notifications for the user, used to populate the notifcations tab
async function getNotifications(req, res) {
    const databaseName = 'pixstarCW2';
    const collectionName = 'notifications'; 

    try {
        // get username from request parameters
        const { username } = req.params;

        // connect to MongoDB and get the collection
        const notificationsCollection = await connectToMongoDB(databaseName, collectionName);

        // find notifications where the notifiedUser field matches the provided username
        const notifications = await notificationsCollection.find({ notifiedUser: username }).toArray();

        // return the array of notifications as a JSON response
        res.status(200).json(notifications);

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving notifications' });
    }
}

// function to make a notification, handles the text data and provides a post Id (the Id of the newly inserted document)
// for the function updateNotificationProfilePhoto to use and update the document with the user's profile photo
async function createNotification(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'notifications';

    try {
        // get notification data from request body
        const { user, notifiedUser, notificationText } = req.body;

        // connect to MongoDB and get the collection
        const notificationsCollection = await connectToMongoDB(databaseName, collectionName);

        // insert notification data into the notifications collection
        const result = await notificationsCollection.insertOne({
            user,
            notifiedUser,
            notificationText
        });

        // get the _id of the newly created notification
        const postId = result.insertedId;

        // send success response with the _id of the newly created notification
        res.status(201).json({ postId });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error creating notification' });
    }
}

// updates the notification with the user's profile photo, gets the postId from the createNotification function
async function updateNotificationProfilePhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'notifications';

    try {
        // get postId from request parameters and photoData from request body
        const { postId } = req.params;
        const { photoData } = req.body;

        // connect to MongoDB and get the collection
        const notificationsCollection = await connectToMongoDB(databaseName, collectionName);

        // convert postId string to ObjectId
        const postObjectId = new ObjectId(postId);

        // check if the notification exists
        const existingNotification = await notificationsCollection.findOne({ _id: postObjectId });
        if (!existingNotification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        // update the notification with the new userProfilePhoto
        await notificationsCollection.updateOne(
            { _id: postObjectId },
            { $set: { userProfilePhoto: photoData } } 
        )

        // convey success response
        res.status(200).json({ success: true, message: 'Notification userProfilePhoto updated successfully' });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating notification userProfilePhoto' });
    }
}

// function to update the previous profile photo of the user, with the new one they may have changed to
async function newNotificationUserProfilePhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'notifications'; 

    try {
        // get user from request parameters and photoData from request body
        const { user } = req.params;
        const { photoData } = req.body;

        // connect to MongoDB and get the collection
        const notificationsCollection = await connectToMongoDB(databaseName, collectionName);

        // update notifications with the new userProfilePhoto for the given user
        const result = await notificationsCollection.updateMany(
            { user: user },
            { $set: { userProfilePhoto: photoData } }
        );

        // convey success response
        res.status(200).json({ success: true, message: `User profile photo updated in ${result.modifiedCount} notifications successfully` });

        // convey any errors in JSON format
    } catch (error) {
        console.error(`error: ${error}`)
        res.status(500).json({ error: 'Error updating notifications userProfilePhoto' });
    }
}

// function to delete a function, if a user likes or follows then unlikes or unfollows, then the previously send notification is deleted
async function deleteNotification(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'notifications'; 

    try {
        // get user, notifiedUser, and notificationText from request body
        const { user, notifiedUser, notificationText } = req.body;

        // connect to MongoDB and get the collection
        const notificationsCollection = await connectToMongoDB(databaseName, collectionName);

        // find the notification matching the provided user, notifiedUser, and notificationText
        const existingNotification = await notificationsCollection.findOne({
            user: user,
            notifiedUser: notifiedUser,
            notificationText: notificationText
        });

        // if no matching notification found, convey error
        if (!existingNotification) {
            res.status(404).json({ error: 'Notification not found' });
            return;
        }

        // otherwise delete the notification from the collection
        await notificationsCollection.deleteOne({ _id: existingNotification._id });

        // convey success response once done 
        res.status(200).json({ success: true, message: 'Notification deleted successfully' });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error deleting notification' });
    }
}


// routes for all the webservices
router.get('/:username', getNotifications);
router.post('/createNotification', createNotification);
router.post('/updateNotificationProfilePhoto/:postId', updateNotificationProfilePhoto);
router.post('/newNotificationUserProfilePhoto/:user', newNotificationUserProfilePhoto);

router.delete('/deleteNotification', deleteNotification);

// export router for use in server.js
export default router;

