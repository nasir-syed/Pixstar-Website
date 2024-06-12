  // this file has all the routers and starts the server

// import necessary modules
import express from 'express'; 
import bodyParser from 'body-parser'; 
import expressSession from 'express-session'; // for session management
import fileUpload from 'express-fileupload'; // for handling file uploads
import crypto from 'crypto'; // crypto module for generating random secrets
import notificationsRouter from './notifications.js'; // router for notifications
import commentsRouter from './comments.js'; // router for comments
import followersRouter from './followers.js'; // router for followers
import followingRouter from './following.js'; // router for following
import postsRouter from './posts.js'; // router for posts
import usersRouter from './users.js'; // router for users

// create express app and configure it with body-parser
export const app = express();
app.use(bodyParser.json());

// define the port number
const port = 8080;

// for handling file uploads
app.use(fileUpload());

// generate a random secret for the session
const randSecret = crypto.randomBytes(32).toString('hex');

// Configure express to use express-session
app.use(
    expressSession({
        secret: randSecret,
        cookie: { maxAge: 12 * 3600000 }, // cookie settings (maxAge is 12 hours)
        resave: false, // do not save session if unmodified
        saveUninitialized: false, // do not create session until something is stored
    })
);

// set up express to serve static files from the directory called 'public'
app.use(express.static('public'));

// function for checking session status
async function checkSession(req, res) {
    try {
        // check if there is an active session, if so, send response with the session status and stored username
        if (req.session.username) {
            res.status(200).json({ sessionActive: true, username: req.session.username });


            // if no session is found, send a response with session status as false
        } else {
            res.status(200).json({ sessionActive: false });
        }
        // convey any errors
    } catch (error) {
        res.status(500).json({ error: 'Error checking session' });
    }
}

// function for session logout
async function sessionLogout(req, res) {
    try {

        // check if there is an active session that has username stored in it, and destroy it 
        if (req.session.username) {

            // destroy session
            req.session.destroy(err => {
                if (err) {
                    // convey any errors during session destruction
                    res.status(500).json({ error: 'Error during logout' });
                } else {

                    // clear the session cookie
                    res.clearCookie("connect.sid");
                    // successful logout
                    res.status(200).json({ login: false });
                }
            });

         // otherwise no active session is found, convey error
        } else {
            // No active session found, send appropriate response
            res.status(400).json({ error: "No active session found" });
        }

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error during logout' });
    }
}

// function for file upload to "upload" folder
async function uploadFile(req, res) {
    try {

        // check if a file has been submitted, if not send error
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ upload: false, error: 'Files missing' });
        }

        // otherwise retrieve the uploaded file
        let myFile = req.files.myFile;

        // xheck if it's an image file, if not, send an error
        if (!myFile.mimetype.startsWith('image')) {
            return res.status(400).json({ upload: false, error: 'Only image files are allowed' });
        }

        // move the file to the 'uploads' folder
        await myFile.mv('./uploads/' + myFile.name);

        // send confirmation of successful upload
        res.json({ filename: myFile.name, upload: true });

        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error uploading file' });
    }
}

// function for retrieving post ID from session
async function getPostIdFromSession(req, res) {


    try {
        // check if postId is stored in the session, return the postId if it does,
        if (req.session.postId) {

            res.status(200).json({ postId: req.session.postId });


            // else no postId stored in the session, send error response
        } else {
            res.status(400).json({ error: 'No postId stored in session' });
        }

        // convey any errors in JSON format
    } catch (error) {
       res.status(500).json({ error: 'Error getting postId from session' });
    }
}

// function for removing post ID from session
function removePostIdFromSession(req, res) {
    try {

        // check if postId is stored in the session, remove it if it is.
        if (req.session.postId) {
            delete req.session.postId;
            res.status(200).json({ success: true, message: 'postId removed from session' });

            // otherwise no postId is stored in the session
        } else {
            res.status(400).json({ error: 'No postId stored in session' });
        }
        // convey any errors in JSON format
    } catch (error) {
        res.status(500).json({ error: 'Error removing postId from session' });
    }
}


// routes and corresponding functions
app.get('/M00914286/logout', sessionLogout); 
app.get('/M00914286/checkSession', checkSession); 
app.get('/M00914286/getPostId', getPostIdFromSession); 
app.get('/M00914286/removePostId', removePostIdFromSession); 

app.post('/M00914286/upload/:title', uploadFile); // 

// routers for the webservices in the respective files (e.g notifications router for notification webservices)
app.use('/M00914286/notifications', notificationsRouter); // Notifications router
app.use('/M00914286/comments', commentsRouter); // Comments router
app.use('/M00914286/followers', followersRouter); // Followers router
app.use('/M00914286/following', followingRouter); // Following router
app.use('/M00914286/posts', postsRouter); // Posts router
app.use('/M00914286/users', usersRouter); // Users router

// Start the server
try {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
} catch (error) {
    // convey initialization errors
    console.error('Error initializing server:', error);
}
