// This file contains all the webservices related to the "users" collection

// import express and the connectToMongoDB function 
import express from 'express';
import { connectToMongoDB } from "./dbconnection.js";
import crypto from 'crypto'; 

// create a router instance using Express. 
const router = express.Router();


// Function to generate a hash using SHA-256
function generateHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}

// Function to encrypt data using AES
function encrypt(text, key) {
    const iv = key.substring(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

// Function to decrypt data using AES
function decrypt(encryptedText, key) {
    const iv = key.substring(0, 16); 
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}


// this function handles a part of the sign up process, which is creating a document with the text data that is provided
async function signupPost(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // get signup data from request body
        const { username, password, email, firstName, lastName, description } = req.body;

        // Encrypt the password before storing
        const hashedPassword = generateHash(password); // Use hashed password as key for encryption
        let encryptedPassword = encrypt(password, hashedPassword);
        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // insert signup data into the users collection
        const result = await usersCollection.insertOne({
            username,
            password: encryptedPassword,
            email,
            firstName,
            lastName,
            description,
        });

        // the postId is a variable in which the username is stored in this case, and is used to update the document with the user's profile photo 
        const postId = username

        // Send success response with posiId
        res.status(200).json({ success: true, message: 'User signed up successfully', postId });

         // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error during signup' });
    }
}

// used for login, gets the username in its body and returns the username along with the stored password associated with the username
async function checkUser(req, res) {
    const databaseName = 'pixstarCW2'; // database name
    const collectionName = 'users'; // collection name

    // connect to MongoDB and get the collection
    const usersCollection = await connectToMongoDB(databaseName, collectionName);

    // get username and password from request body
    const { username, password } = req.body;

    // validate the input, if no username provided then return error
    if (!username || !password) {
        res.status(400).json({ error: 'Invalid input' });
        return;
    }

    // after validation, find the user in the database's collection
    try {
        const result = await usersCollection.findOne({ username: username });

        if (result) {
            const hashedPassword = generateHash(password);
            let decryptedPassword;
            try {
                decryptedPassword = decrypt(result.password, hashedPassword);
            } catch (error) {
                // if decryption fails, send a 401 response
                res.status(401).json({ error: 'Incorrect password' });
                return;
            }         
            // Check if passwords match
            if (decryptedPassword === password) {
                req.session.username = username;
                res.status(200).json({ username: username});
            } else {
                res.status(401).json({ error: 'Incorrect password' });
            }
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error getting user' });
    }
}




// this function takes the username in its parameter and gets their details from the "users" collection 
async function getUserDetails(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 
    try {

        // extract username from request parameters
        const { username } = req.params;

        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // find the user by username
        const user = await usersCollection.findOne({ username });

        // If user is found, send their details in the response
        if (user) {
            res.status(200).json(user);

            // If user is not found, send an 404 error response
        } else {
            res.status(404).json({ error: 'User not found' });
        }
         // send errors using json 
    } catch (error) {
        // Handle unexpected errors
        res.status(500).json({ error: 'Error getting user details' });
    }
}

// function to search users in the users collection, used for search results, all users with the username as part of theirs are returned
// for example, if someone searches percy, the returned array will include percy and percyjackson, provided they both exist
async function searchUsers(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // get username from request parameters
        const { username } = req.params;

        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // make a regex pattern to search for usernames containing the given username, 'i' for case-insensitive search
        const searchPattern = new RegExp(username, 'i');  

        // find users whose usernames match the search pattern and store them in an array
        const matchingUsers = await usersCollection.find({ username: { $regex: searchPattern } }).toArray();

        // get usernames and profile photos from matching users
        const usersData = matchingUsers.map(user => ({
            username: user.username,
            profilePhoto: user.profilePhoto
        }));

        // return the usernames and profile photos as a JSON response
        res.status(200).json(usersData);
        // send any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error searching users' });
    }
}

// function to check if the username provided is already taken or not 
async function checkExistingUser(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    const usersCollection = await connectToMongoDB(databaseName, collectionName);

    const username = req.params.username;
  
    // validation
    if (!username) {
      res.status(400).send('Invalid input');
      return;
    }
  
    try {

      // find the document in the "users" collection
      const result = await usersCollection.findOne({ username: username });
  
      if (result) {
            // username already exists
            res.status(409).json('Username already exists');
      } else {
        // username does not exist
        res.status(200).json('OK');
      }

    // convey any errors in JSON format
    } catch (err) {
      res.status(500).json('Error checking existing user');
    }
}

async function checkExistingEmail(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    // connect to MongoDB and get the collection
    const usersCollection = await connectToMongoDB(databaseName, collectionName);

    const email = req.params.email;
  
    // validate input, return if invalid
    if (!email) {
        res.status(400).send('Invalid input');
        return;
    }
  
    try {
        // find the document in the "users" collection
        const result = await usersCollection.findOne({ email: email });
  
        if (result) {
            // email already exists
            res.status(409).json('Email already in use');
        } else {
            // email does not exist
            res.status(200).json('OK');
        }
         // convey any errors in JSON format
    } catch (err) {
        res.status(500).json('Error checking existing email');
    }
}

// function to get all the usernames in the "users" collection
async function getAllUsernames(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // find all users in the "users" collection
        const allUsers = await usersCollection.find({}).toArray();

        // get only usernames from the users
        const usernames = allUsers.map(user => user.username);

        // return the usernames as an array
        res.status(200).json(usernames);

         // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error getting all usernames' });
    }
}


// the below function gets the user that is provided in the parameter's profile photo from the users collection
async function getUserProfilePhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        const username = req.params.username;

        // validate input
        if (!username) {
            res.status(400).send('Invalid input');
            return;
        }

        // find the user document in the "users" collection
        const user = await usersCollection.findOne({ username: username });

        if (user) {
            // if user exists, send the profile photo in the response
            res.status(200).json({ profilePhoto: user.profilePhoto });
        } else {
            // If user doesn't exist, send an error 
            res.status(404).json({ error: 'User not found' });
        }
         // convey any errors in JSON format
    } catch (error) {
        // Handle unexpected errors
        res.status(500).json({ error: 'Error getting user profile photo' });
    }
}


// this function is executed right after the signupPost function, it takes the postId (the username in this case) in its params
//  and updates the document of the user with their profile photo in base64 format
async function updateProfilePhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // extract user (postId) and photo data from request body
        const { user } = req.params;
        const { photoData } = req.body;

        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists
        const existingUser = await usersCollection.findOne({ username: user });

        // if they doesn't exist, send error
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // update the user profile photo if they do exist
        await usersCollection.updateOne(
            { username: user },
            { $set: { profilePhoto: photoData } }
        );
        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating user profile photo' });
    }
}

// this function is to update the user's description (provided in JSON) after they edit their profile, it returns the username as postId
// which is then used by the updateUserProfilePhoto function to update the users profile photo
async function updateUserDescription(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // get username and new description from request body
        const { username, description } = req.body;

        // validate the input
        if (!username || !description) {
            res.status(400).json({ error: 'Invalid input' });
            return;
        }

        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists
        const existingUser = await usersCollection.findOne({ username });

        // if not, send error in JSON format
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // update the user's description, if the user exists
        await usersCollection.updateOne(
            { username },
            { $set: { description } }
        );

        // return the username as "postId"
        res.status(200).json({ postId: username, success: true, message: 'Description updated successfully' });

        // convey error in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating user description' });
    }
}

// function to update the user's profile photo after they change it in the edit profile section,
// gets the username (provided by updateUserDescripiton) from it parameters and the new profile photo data in its body (as formData)
async function updateUserProfilePhoto(req, res) {
    const databaseName = 'pixstarCW2'; 
    const collectionName = 'users'; 

    try {
        // get username and photo data from request parameters and body
        const { username } = req.params;
        const { photoData } = req.body;

        // validate the input
        if (!username || !photoData) {
            res.status(400).json({ error: 'Invalid input' });
            return;
        }

        // connect to MongoDB and get the collection
        const usersCollection = await connectToMongoDB(databaseName, collectionName);

        // check if the user exists
        const existingUser = await usersCollection.findOne({ username });

        // if not, then convey error in JSON format
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // update the user's profile photo, if they do exist
        await usersCollection.updateOne(
            { username },
            { $set: { profilePhoto: photoData } }
        );

         // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error updating user profile photo' });
    }
}


// routes for all the webservices
router.get('/checkEmail/:email', checkExistingEmail);
router.get('/check/:username', checkExistingUser);
router.get('/getAllUsernames', getAllUsernames);
router.get('/profilePhoto/:username', getUserProfilePhoto);
router.get('/getUserDetails/:username', getUserDetails);
router.get('/search/:username', searchUsers);
router.post('/login', checkUser);
router.post('/signupPost', signupPost);
router.post('/updateProfilePhoto/:user', updateProfilePhoto);
router.post('/updateDescription', updateUserDescription);
router.post('/updateProfilePhoto/:username', updateUserProfilePhoto);

// export the router for use in the server.js file 
export default router;