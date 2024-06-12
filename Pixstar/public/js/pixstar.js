//import the helper functions 
import { postToDatabase, setProfPhoto, getUserProfilePhoto, attachPhoto, signupValidation, loginValidation } from "./helper.js"

// getting the html elements 
const followingExplore = document.getElementById("followingExplore");
const followingPage = document.getElementById("followingPage");
const explorePage = document.getElementById("explorePage");
const followingPageBtn = document.getElementById("followingPageBtn")
const likedPageBtn = document.getElementById("likedPageBtn")
const explorePageBtn = document.getElementById("explorePageBtn")
const likedPage = document.getElementById("likedPage");
const home = document.getElementById("home");
const create = document.getElementById("create");
const viewPost = document.getElementById("viewPost");
const accountTab = document.getElementById("accountTab");
const viewFollowing = document.getElementById("viewFollowing");
const viewFollowers = document.getElementById("viewFollowers");
const accountFollowersBtn = document.getElementById("accountFollowersBtn");
const accountFollowingBtn = document.getElementById("accountFollowingBtn");
const accountPostsContainer = document.getElementById("accountPostsContainer")
const notifcationTab= document.getElementById("notificationTab")
const signupBox = document.getElementById("signupbox");
const loginBox = document.getElementById("loginbox");
const homeBtn = document.getElementById("homeBtn");
const createBtn = document.getElementById("createBtn");
const signLoginNav = document.getElementById("signLoginNav");
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const signLoginBtn = document.getElementById("signLoginBtn");
const loginSignBtn = document.getElementById("loginSignBtn");
const postCloseBtn = document.getElementById("postCloseBtn");
const accCloseBtns = document.querySelectorAll(".accCloseBtn");
const accBtns = document.querySelector(".accBtns")
const accountBtn = document.getElementById("accountBtn")
const notifBtn = document.getElementById("notifBtn")
const searchInput = document.getElementById('search');
const dropBtn = document.querySelector(".dropbtn")
const logoutBtn = document.getElementById("logoutBtn")
const attachProfilePhotoBtn = document.getElementById("attachProfilePhoto");
const attachNewProfilePhotoBtn = document.getElementById("attachNewProfilePhoto");
const profilePhotoInput = document.getElementById("profilePhotoInput");
const attachPostImg = document.getElementById("attachPostImg");
const postPhotoInput = document.getElementById("PostPhotoInput");
const likeBtn = document.querySelector(".likeBtn .heart-icon");
const likesAmt = document.querySelector(".likeBtn .likesAmt");
const commentInputField = document.querySelector('#userCommentOption input');
const editProfilePhotoInput = document.getElementById("editProfilePhotoInput");
const editProfileSection = document.getElementById("editProfile");
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfBtn = document.getElementById("editProfBtn");
const searchBar = document.getElementById('search');
const searchResults = document.getElementById('searchResults');


// boolean values 
// to keep track if the user is logged in or not 
let loggedIn = false

// to track whether a element is an account element, used for redirecting the user after closing a element
let accountView = false 

// to track whether the element is a search result, used for redirecting the user after closing a element
let searchView = false

// to check if the the window is for profile editing, used for redirecting the user after closing a post
let profileEdit = false

// these variables are used for the storage if image data, and profPhoto used in signup, newProfPhoto used for editing profile, postPhoto for creation of post
let profPhoto = {chosen: false, data:" "}
let newProfPhoto = {chosen: false, data:""}
let postPhoto = {chosen: false, data:" ", file:" "}

// these variables keep track of the currentUser and the post the user is viewing, retrieved from session
let currentUser = " "
let postId = " "

// for the like button that is displayed on the posts
likeBtn.addEventListener("click", async () => {
    try {
        // fetch request to check if the user has liked the post
        const response = await fetch(`http://localhost:8080/M00914286/posts/checkIfUserLikedPost/${currentUser}/${postId}`);
        
        // if error in fetch request show in console
        if (!response.ok) {
            console.error('Error checking if user liked post:', response.status);
            return;
        }

        // if no error, get the result (likedByUser, which can be true or false)
        const data = await response.json();
        const likedByUser = data.likedByUser;

        // toggle the "liked" class based on the result, so if post is not liked by the user and they jsut clicked on the button,
        // add the liked class so the button become pink
        if (!likedByUser) {

            // if the user hasn't liked the post before, add the "liked" class
            likeBtn.classList.add("liked");

            // send notification to the user who made post that the current user liked their post
            handlePostNotification(true, postId)

        } else {
            // if the user has liked the post before, remove the "liked" class that was added before
            likeBtn.classList.remove("liked");

            // delete the notification that was sent to the user about the current user liking their post
            handlePostNotification(false, postId)

        }

        // determine the adjustment based on the current state of the like button, 1 -> if liked, -1 -> if user unliked
        let adjustment = likedByUser ? -1 : 1;

        // update the likes in the database, and retrieve the updated likes amount 
        const updatedLikes = await adjustLikes(currentUser, adjustment);

        if (updatedLikes !== null) {
            // if updatedLikes not null, then set it to the likesAmt that is shown next to the heart on the post
            likesAmt.innerHTML = updatedLikes;
        }
    } catch (error) {
        // in case of an error show in console
        console.error('Error:', error);
    }
});

// function to handle the notifications for likes on posts 
async function handlePostNotification(liked, postId) {
    try {
        // fetch request to get post details
        const postDetailsResponse = await fetch(`http://localhost:8080/M00914286/posts/getPostbyID/${postId}`);

        // if error in fetching the post details, show in console 
        if (!postDetailsResponse.ok) {
            console.error('Error fetching post details:', postDetailsResponse.status);
            return;
        }

        // no error, assign the details to the variable postDetails
        const postDetails = await postDetailsResponse.json();

        // if the liked parameter is true, send a notification
        if (liked) {

            // get the current user's profile photo, provided in base64 format.
            const userProfilePhoto = await getUserProfilePhoto(currentUser);

            // make a request to postToDatabase function to create a notification
            await postToDatabase(
                { user: currentUser, notifiedUser: postDetails.user, notificationText: `has liked your post "${postDetails.title}"!` },
                userProfilePhoto,
                "notifications",
                "createNotification",
                "updateNotificationProfilePhoto"
            );

          // if liked parameter is "false", delete the notification that was sent prior  
        } else {

            // request to delete the notification, provide the user, notified user and the notification text.
            const deleteNotificationResponse = await fetch('http://localhost:8080/M00914286/notifications/deleteNotification', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: currentUser,
                    notifiedUser: postDetails.user,
                    notificationText: `has liked your post "${postDetails.title}"!`
                })
            });
            
            // if any error in deletion, show in console
            if (!deleteNotificationResponse.ok) {
                console.error('Error deleting notification:', deleteNotificationResponse.status);
                return;
            }
            
        }
        // show any error that may occur in try block in the console
    } catch (error) {
        console.error('Error:', error);
    }
}

// function to handle notifications sent regarding the following and unfollowing of a user
async function handleFollowNotification(following, followedUser) {
    try {
        // if following parameter is true execute the below code
        if (following) {
            
            // get the current user's profile photo, provided in base64 format
            const userProfilePhoto = await getUserProfilePhoto(currentUser);

            // make a request to postToDatabase function to create a notification
            await postToDatabase(
                { user: currentUser, notifiedUser: followedUser, notificationText: `has followed you!` },
                userProfilePhoto,
                "notifications",
                "createNotification",
                "updateNotificationProfilePhoto"
            );
        } else {
            // Make a request to delete the notification that was sent regarding the user following them.
            const deleteNotificationResponse = await fetch('http://localhost:8080/M00914286/notifications/deleteNotification', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user: currentUser,
                    notifiedUser: followedUser,
                    notificationText: `has followed you!`
                })
            });
            
            // if error in deletion, show in console 
            if (!deleteNotificationResponse.ok) {
                console.error('Error deleting notification:', deleteNotificationResponse.status);
                return;
            }
        }
      // if any other error, show in console as well  
    } catch (error) {
        console.error('Error:', error);
    }
}



// Function to hide all divs by adding the "hide" class
function hideAll() {

    followingExplore.classList.add("hide");
    editProfileSection.classList.add("hide")
    home.classList.add("hide");
    create.classList.add("hide");
    viewPost.classList.add("hide");
    accountTab.classList.add("hide");
    viewFollowers.classList.add("hide")
    viewFollowing.classList.add("hide")
    signupBox.classList.add("hide");
    loginBox.classList.add("hide");
    searchResults.classList.add("hide")
    searchBar.classList.add("hide")
    homeBtn.classList.add("hide")
    notifcationTab.classList.add("hide")

    // if the user is not logged in, hide the profile and notification icons/buttons, the dropdown and the home page
    // and show only the sign up and log in buttons 
    if(!loggedIn){
        
        accBtns.classList.add('hide')
        dropBtn.classList.add('hide')
        createBtn.classList.add('hide')

        if(signLoginNav.classList.contains('hide')){
            signLoginNav.classList.remove('hide')
        }
    } 
    // if the user is logged in, show the notification button, account button and dropdown button that has the log out option
    // also show home page, create page, and the search bar
    else{
        accBtns.classList.remove('hide')
        dropBtn.classList.remove('hide')
        createBtn.classList.remove('hide')
        signLoginNav.classList.add('hide')
        searchBar.classList.remove("hide")
        homeBtn.classList.remove("hide")
    }
}

// this function checks if there is a session active, which can only be when the user is logged in.
// this is so if the user logs in and refreshed, if a session is active they wont be logged out.
async function checkSession() {
    try {

        // fetch request to check session status 
        const response = await fetch('http://localhost:8080/M00914286/checkSession', {
            method: 'GET'
        });

        // if no errors assign the result to data, and assing the username stored in the session to currentUser, return session status
        if (response.ok) {
            const data = await response.json();
            currentUser = data.username;
            return data.sessionActive; // Update loggedIn based on sessionActive value
            
          // show any errors in checking the session in the console  
        } else {
            console.error('Error checking session:', response.status);

        }
        // show any other errors in the console    
    } catch (error) {
        console.error('Error:', error);
    }
}

// main function, ran when the page is loaded 
async function main() {

    // check whether the user is logged in (session will be active and return true if so)
    loggedIn = await checkSession();

    // if logged in, set the accountBtn photo in the top right to the profile photo of the logged in user
    if(loggedIn){
        setProfPhoto(currentUser, "accountBtn")
    }

    // call hideAll function to display only those HTML elements required 
    hideAll();
}

// call the main function
main();

// Show the home div when the homeBtn is clicked
homeBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    home.classList.remove("hide"); // Remove the "hide" class from home div
    followingExplore.classList.remove("hide") // Remove the "hide" class from followingExplore div that contains the following and explore buttons
    followingPage.classList.remove("hide") // Remove the "hide" class from followingPage div
});


// the close button that appears when the user expands the post by clicking on it 
postCloseBtn.addEventListener("click", function() {
    
    //postId has the current post's Id that the user is viewing, when exiting the post this variable is reset
    postId= " "

    
    // if account post, then on close stay in accountTab
    if (accountView) {
        hideAll(); // Hide all divs
        accountTab.classList.remove("hide");
        accountView = false
      // if it is a searchView, which are the elements shown as a search result  
    } else if (searchView){
        hideAll() //hide all divs
        searchResults.classList.remove("hide") // show search results page
        searchView = false
    }
    // if it is not an account post or search post, return back to the home tab when the user exists the post
    else {
        hideAll(); // Hide all divs
        home.classList.remove("hide"); // Remove the "hide" class from home div
        followingExplore.classList.remove("hide");
        followingPage.style.display = "flex";
    }

    // Make a fetch request to remove the current post's postId from session
    fetch('/M00914286/removePostId')
        .then(response => {
            if (!response.ok) {
                console.error('Failed to remove postId from session');
            }
        })
        .catch(error => {
            console.error('Error while removing postId from session:', error);
        });

});

// the close button for the account tabs 
accCloseBtns.forEach(button => {
    button.addEventListener("click", function() {
        // if it is not a profile account tabs, return back to the home tab when the user exits the account tab
        if (!profileEdit && !accountView)  {
            hideAll(); // Hide all divs
            home.classList.remove("hide"); // Remove the "hide" class from home div
            followingExplore.classList.remove("hide");
            followingPage.style.display = "flex";
        }
        // else return to the account tab
        else {
            hideAll(); // Hide all divs
            if(profileEdit){
                location.reload()
            }
            accountTab.classList.remove("hide");
            profileEdit = false
            accountView= false
        }
    });
});

// Show the create div when the createBtn is clicked
createBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    create.classList.remove("hide"); // Remove the "hide" class from create div
});

// show the account tab when the accountBtn is clicked
accountBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    setProfilePage() // setup the html elements in the profile page 
    accountTab.classList.remove("hide"); // Remove the "hide" class from create div
});

accountFollowingBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    setupViewFollowing() // setup the the view following div to show who the user is following
    viewFollowing.classList.remove("hide"); // Remove the "hide" class from create div
    accountView = true // set to true so user stays in account tab after closing the section
});

accountFollowersBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    setupViewFollowers()// setup the the view following div to show the followers of the user
    viewFollowers.classList.remove("hide"); // Remove the "hide" class from create div
    accountView = true // set to true so user stays in account tab after closing the section
});

// show the notifcation tab when the notifBtn is clicked
notifBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    notifcationTab.classList.remove("hide"); // Remove the "hide" class from create div
    setupNotificationTab() //setup the html elements in the notification tab
});

// Show the sign up box div when the signNav button is clicked
signNav.addEventListener("click", function() {
    hideAll(); // Hide all divs
    signupBox.classList.remove("hide"); // Remove the "hide" class from signupBox div
});

// Show the log in box div when the loginNav button is clicked
loginNav.addEventListener("click", function() {
    hideAll(); // Hide all divs
    loginBox.classList.remove("hide"); // Remove the "hide" class from loginBox div
});

editProfileBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    editProfileSection.classList.remove("hide"); // Remove the "hide" class from loginBox div
    profileEdit = true // set to true, so when user closes their redirected to the account page
});

// Show the signupBox div when the signLoginBtn button is clicked, redirects them from sign up to login
signLoginBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    loginBox.classList.remove("hide"); // Remove the "hide" class from signupBox div
});

// Show the loginBox div when the loginSignBtn button is clicked, redirects them from log in to sign up
loginSignBtn.addEventListener("click", function() {
    hideAll(); // Hide all divs
    signupBox.classList.remove("hide"); // Remove the "hide" class from loginBox div
});

// shows the following tab/page when the user clicks on the following button, hides the explore tab 
followingPageBtn.addEventListener("click", function() {
    followingPage.style.display = 'flex'; // show the following page, hide the other ones in the home page 
    explorePage.style.display = 'none';
    likedPage.style.display = 'none'
    setupFollowingPage() // setup the html elements in the following page
});

// shows the explore tab/page when the user clicks on the explore button, hides the rest
explorePageBtn.addEventListener("click", function() {
    explorePage.style.display = 'flex'; // show the explore page, hide the other ones in the home page 
    followingPage.style.display = 'none';
    likedPage.style.display = 'none'
    setupExplorePage()  // setup the html elements in the explore page

});

// shows the liked tab/page when the user clicks on the liked button, hides the rest
likedPageBtn.addEventListener("click", function() {
    likedPage.style.display = 'flex'// show the liked page, hide the other ones in the home page 
    explorePage.style.display = 'none';
    followingPage.style.display = 'none';
    setupLikedPage()  // setup the html elements in the liked page

});



// the input field in the comment section that allows the user to comment 
commentInputField.addEventListener('keypress', async function(event) {

    // check if the Enter key is pressed (key code 13)
    if (event.key === 'Enter') {
        const commentText = commentInputField.value.trim(); // Remove leading and trailing whitespace and get the value in the field

        // check if the comment text is empty, replace placeholder text and return
        if (commentText === '') {
            commentInputField.placeholder = 'Comment is empty...';
            return;
        }

        // xlear the input field
        commentInputField.value = '';
        commentInputField.placeholder = 'Add a comment...'; // Reset the placeholder

        // prepare the data to be sent in the request body
        const commentData = {
            commentedPostId: postId, 
            user: currentUser, 
            text: commentText
        };

        try {
            // Fetch request to get the user's profile photo in base64 format
            const profilePhotoData = await getUserProfilePhoto(currentUser)

            // send the data to make the comment
            postToDatabase(commentData, profilePhotoData, "comments", "makeComment", "updateCommentPhoto")
            
        } catch (error) {
            // show any errors in making the comment in the console
            console.error('Error in making comment:', error);
        }
    }
});

// the search results page, to handle the follow and unfollowing of users 
searchResults.addEventListener('click', async function(event) {

    // check if the clicked element is a follow button
    if (event.target.classList.contains('followResultBtn')) {
        const followButton = event.target;
        const followedUser = followButton.id; // get the followed user, who's username is stored in the button's id

        try {

            // Make a request to check if the user is already following the followedUser
            const response = await fetch(`/M00914286/following/checkIfFollowing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user: currentUser, followedUser })
            });

            // if no errors,
            if (response.ok) {
                const { isFollowing } = await response.json();

                // toggle between follow and following
                // if the user was following at the time of clicking the button
                if (isFollowing) {

                    // User is already following, so unfollow
                    const unfollowResponse = await fetch(`/M00914286/following/removeFromFollowing`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ user: currentUser, followedUser })

                    });

                    // if no errors in unfollowing, 
                    if (unfollowResponse.ok) {
                        followButton.textContent = 'Follow'; //set the text back to follow 

                        // now when user unfollows another user, the user's following is updated and the unfollowed users followers is updated

                        // Check if the currentUser exists in the recently unfollowed users followers list
                        const checkResponse = await fetch(`/M00914286/followers/checkIfFollower`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: followedUser, follower: currentUser })
                        });

                        // if no errors in checking,
                        if (checkResponse.ok) {

                            // isFollower is set to the result of the request, which is a boolean value
                            const { isFollower } = await checkResponse.json();

                            // If currentUser is a follower of followedUser, remove currentUser from followedUser's followers list
                            if (isFollower) {
                                const removeFromFollowedResponse = await fetch(`/M00914286/followers/removeFollower`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ user: followedUser, follower: currentUser })
                                });

                                // show any errors in the console
                                if (!removeFromFollowedResponse.ok) {
                                    console.error('Error removing follower from followed user:', removeFromFollowedResponse.status);
                                }

                                // remove the previously sent following notification
                                handleFollowNotification(false, followedUser)
                            }
                            // show any errors in the console
                        } else {
                            console.error('Error checking if currentUser is a follower of followedUser:', checkResponse.status);
                        }
                        // show any errors in the console
                    } else {
                        console.error('Error unfollowing user:', unfollowResponse.status);
                    }

                } else {
                    // at the time of clicking the follow button current user is not following, so follow
                    const followResponse = await fetch(`/M00914286/following/followUser`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ user: currentUser, followedUser })
                    });
                    // if no errors, 
                    if (followResponse.ok) {

                        // update button text to show the user is now following them
                        followButton.textContent = 'Following';

                        // now update the recently followed users followers list 

                        // check if the followed user exists in the currentUser's followers list
                        const checkResponse = await fetch(`/M00914286/followers/checkIfFollower`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: followedUser, follower: currentUser })
                        });

                        // if no errors,
                        if (checkResponse.ok) {

                            // store the boolean value from the response in the variable "isFollower"
                            const { isFollower } = await checkResponse.json();

                            // If currentUser is not already a follower of followedUser, add currentUser to followedUser's followers list
                            if (!isFollower) {
                                const addFollowerResponse = await fetch(`/M00914286/followers/addFollower`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ user: followedUser, follower: currentUser })
                                });

                                // show any errors in the console
                                if (!addFollowerResponse.ok) {
                                    console.error('Error adding follower to followed user:', addFollowerResponse.status);
                                }

                                // send a notification to the user that the currentUser just followed
                                handleFollowNotification(true, followedUser)

                            }
                                                           
                        }
                    // show any errors in the console
                    } else {
                        console.error('Error following user:', followResponse.status);
                    }
                }
              // show any errors in the console  
            } else {
                console.error('Error checking if following:', response.status);
            }
           // show any errors in the console 
        } catch (error) {
            console.error('Error following/unfollowing user:', error);
        }
    }
});

// Add an event listener to the search input field
searchInput.addEventListener('keypress', handleSearch);

// event listener in each of these pages, to handle the clicks on the posts
accountPostsContainer.addEventListener('click', handlePostButtonClick);
searchResults.addEventListener('click', handlePostButtonClick);
followingPage.addEventListener('click', handlePostButtonClick);
explorePage.addEventListener('click', handlePostButtonClick);
likedPage.addEventListener('click', handlePostButtonClick);

// the "attachPhoto" function is used to handle attaching photos and showing a preview to the user before submitting the forms
// used in signup, edit profile, and making a post
attachPhoto(profilePhotoInput, attachProfilePhotoBtn, attachProfilePhotoBtn.querySelector("img"), profPhoto);
attachPhoto(editProfilePhotoInput, attachNewProfilePhotoBtn, attachNewProfilePhotoBtn.querySelector("img"), newProfPhoto);
attachPhoto(postPhotoInput, attachPostImg, createPostplaceholderImg, postPhoto, true);


// function to handle clicks on posts that are buttons on the pages
function handlePostButtonClick(event) {

    // the post button has the .post class to apply necessary css, the below is used to get the button on the page
    let targetButton = event.target.closest('.post');

    // Check if the click event occurred in the accountPosts container
    if (event.currentTarget.id == "accountPostsContainer") {
        accountView = true;
        // account posts have their own class, and below is used to get the account post
        targetButton = event.target.closest('.accPost');
    }
    // Check if the click event occurred in the searchResults container
    if (event.currentTarget.id == "searchResults") {
        searchView = true;
    }

    // below is executed after the click on the posts (displayed as a button)
    if (targetButton) {
         
        // Get the postId from the clicked button's id attribute
        postId = targetButton.id;
        // Display the viewPost div
        hideAll();
        const viewPost = document.getElementById('viewPost');

        // setup the like button and number of likes for the post 
        forLikeBtn()

        // setup the post modal that pops up and expands the post
        postModalSetup(postId);

        //display the posts comments
        displayPostComments(postId)

        // remove the hide class from the post modal "viewPost"
        viewPost.classList.remove('hide'); 
    }
}

// the below function is executed when the user clicks on the following button on the account tab
// the function sets up the viewFollowing div
async function setupViewFollowing() {
    // Clear the viewFollowing div of all the divs that contain the .following class
    const followingElements = viewFollowing.querySelectorAll('.following');
    followingElements.forEach(element => element.remove());

    try {
        // Make a fetch request to getUsersFollowers to get the list of users the current user is following
        const response = await fetch(`http://localhost:8080/M00914286/following/users/${currentUser}`);
        const data = await response.json();

        // Check if the array of following users is not null or empty
        if (data.followingUsers && data.followingUsers.length > 0) {
            // Iterate through each followed user and create HTML elements for them to be displayed
            data.followingUsers.forEach(async user => {
                // Get the user's profile photo in base64 format
                const profilePhoto = await getUserProfilePhoto(user);

                // Create the elements for the followed user
                const followingDiv = document.createElement('div');
                followingDiv.classList.add('following');

                const followingPhotoDiv = document.createElement('div');
                followingPhotoDiv.classList.add('followingPhoto');
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + profilePhoto; // Set profile photo as src
                followingPhotoDiv.appendChild(img);

                const followingUserDiv = document.createElement('div');
                followingUserDiv.classList.add('followingUser');
                followingUserDiv.textContent = '@' + user;

                // Create a button to remove the followed user
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('removeFollowing');
                removeButton.id = user; // Set the button's id to the followed user's username
                removeButton.addEventListener('click', async () => {
                    // Handle button click event to remove the followed user
                    try {
                        // Make a fetch request to remove the user
                        const unfollowResponse = await fetch(`/M00914286/following/removeFromFollowing`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: currentUser, followedUser: user })
    
                        });

                        const removeFromFollowingResponse = await fetch(`/M00914286/followers/removeFollower`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: user, follower: currentUser })
                        });

                        if (unfollowResponse.ok && removeFromFollowingResponse.ok) {
                            // If the request is successful, remove the user's entry from the UI
                            followingDiv.remove();
                        } else {
                            console.error(`Failed to remove ${user}`);
                        }
                    } catch (error) {
                        console.error('Error removing followed user:', error);
                    }
                });

                followingDiv.appendChild(followingPhotoDiv);
                followingDiv.appendChild(followingUserDiv);
                followingDiv.appendChild(removeButton); // Add the removeButton to the followingDiv

                viewFollowing.appendChild(followingDiv);
            });
        } 
    } catch (error) {
        // Show any errors in the console  
        console.error('Error setting up view following:', error);
    }
}


// the below function is executed when the user clicks on the followers button on the account tab
// the function sets up the viewFollowers div
async function setupViewFollowers() {

    // clear the viewFollowers div of any previous elements
    const followersElements = viewFollowers.querySelectorAll('.followers');
    followersElements.forEach(element => element.remove());

    try {
        // make a fetch request to getUsersFollowers to get the list of followers 
        const response = await fetch(`http://localhost:8080/M00914286/followers/allFollowers/${currentUser}`);
        const data = await response.json();

        // check if the array of following users is not null or empty
        if (data.followers && data.followers.length > 0) {

            // Iterate through each follower, and create HTML elements for them to be displayed
            data.followers.forEach(async user => {

                // Get the follower's profile photo in base64 format
                const profilePhoto = await getUserProfilePhoto(user);

                // Create HTML elements for the follower 
                const followersDiv = document.createElement('div');
                followersDiv.classList.add('followers');

                const followersPhotoDiv = document.createElement('div');
                followersPhotoDiv.classList.add('followersPhoto');
                const img = document.createElement('img');
                img.src = 'data:image/png;base64,' + profilePhoto; // Set profile photo as src
                followersPhotoDiv.appendChild(img);

                const followerUserDiv = document.createElement('div');
                followerUserDiv.classList.add('followerUser');
                followerUserDiv.textContent = '@' + user;

                // Create a button to remove the followed user
                const removeButton = document.createElement('button');
                removeButton.textContent = 'Remove';
                removeButton.classList.add('removeFollowing');
                removeButton.id = user; // Set the button's id to the followed user's username
                removeButton.addEventListener('click', async () => {
                    // Handle button click event to remove the followed user
                    try {
                        // Make a fetch request to remove the user
                        const unfollowResponse = await fetch(`/M00914286/following/removeFromFollowing`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: user, followedUser: currentUser })
    
                        });

                        const removeFromFollowingResponse = await fetch(`/M00914286/followers/removeFollower`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ user: currentUser, follower: user })
                        });

                        if (unfollowResponse.ok && removeFromFollowingResponse.ok) {
                            // If the request is successful, remove the user's entry from the UI
                            followersDiv.remove();
                        } else {
                            console.error(`Failed to remove ${user}`);
                        }
                    } catch (error) {
                        console.error('Error removing followed user:', error);
                    }
                });

                followersDiv.appendChild(followersPhotoDiv);
                followersDiv.appendChild(followerUserDiv);
                followersDiv.appendChild(removeButton); // Add the removeButton to the followersDiv

                viewFollowers.appendChild(followersDiv);
            });
        } 
    } catch (error) {
        // Show any errors in the console  
        console.error('Error setting up view followers:', error);
    }
}
        

// the below function is used to setup the following page
async function setupFollowingPage() {

    // reset any previous following elements in the page 
    followingPage.innerHTML = " "

    try {
        // fetch request to get the users the current user is following
        const followingResponse = await fetch(`http://localhost:8080/M00914286/following/users/${currentUser}`);
        const followingData = await followingResponse.json();

        // check if the following array is not empty
        if (followingData.followingUsers && followingData.followingUsers.length > 0) {
            // iterate through each user the current user is following
            for (const followingUser of followingData.followingUsers) {
                // fetch request to get the posts for each following user
                const userPostsResponse = await fetch(`/M00914286/posts/getPosts/${followingUser}`);
                const userPosts = await userPostsResponse.json();

                // check if userPosts is not empty
                if (userPosts && userPosts.length > 0) {
                    // iterate through each post of the user
                    for (const post of userPosts) {
                        // create a button element for each post
                        const postButton = document.createElement('button');
                        postButton.classList.add('post');
                        postButton.id = post._id; // set the buttons Id to to the post's Id

                        // create an image element for the post image
                        const postImg = document.createElement('img');
                        postImg.src = `data:image/png;base64,${post.postImg}`; // set post image source

                        // append the image element to the button
                        postButton.appendChild(postImg);

                        // append the button to the followingPage
                        followingPage.appendChild(postButton);
                    }
                }
            }
        }
        // show any errors that may occur, in the console
     } catch (error) {
        console.error('Error setting up following page:', error);
    }
}


// the below function is for setting up the explore page, which shows the posts from the other users the user doesn't follow 
async function setupExplorePage() {

    // clear previous content on the page
    explorePage.innerHTML = ""; 

    try {
        // fetch request to get the users the current user is following
        const followingResponse = await fetch(`/M00914286/following/users/${currentUser}`);
        const followingData = await followingResponse.json();

        // fetch request to get all usernames
        const allUsernamesResponse = await fetch('/M00914286/users/getAllUsernames');
        const allUsernames = await allUsernamesResponse.json();

        // filter out the users that the current user is following
        const notFollowedByCurrentUser = allUsernames.filter(username => !followingData.followingUsers.includes(username));

        // iterate through the users not followed by the current user
        for (const username of notFollowedByCurrentUser) {
            // skip over the currentUser's posts
            if (username === currentUser) continue;

            // fetch request to get the posts for each of the users
            const userPostsResponse = await fetch(`/M00914286/posts/getPosts/${username}`);
            const userPosts = await userPostsResponse.json();

            // check if userPosts is not empty
            if (userPosts && userPosts.length > 0) {
                // iterate through each post of the user
                for (const post of userPosts) {
                    // create a button element for each post
                    const postButton = document.createElement('button');
                    postButton.classList.add('post');
                    postButton.id = post._id; // Set the button's Id as the post's Id

                    // create an image element for the post image
                    const postImg = document.createElement('img');

                    // set the post's image
                    postImg.src = `data:image/png;base64,${post.postImg}`; 

                    // append the image element to the button
                    postButton.appendChild(postImg);

                    // append the button to the explorePage
                    explorePage.appendChild(postButton);
                }
            }
        }
      // display any errors that may occur, in the console.  
    } catch (error) {
        console.error('Error setting up explore page:', error);
    }
}

// the below function is used to setup the notification tab with notifications for that user
async function setupNotificationTab() {
    // clear the tab of any previous elements it may have 
    notificationTab.innerHTML = " ";

    try {
        // fetch notifications for the current user
        const response = await fetch(`/M00914286/notifications/${currentUser}`);

        // if no errors
        if (response.ok) {
            // get the notifications array from the response
            let notifications = await response.json();

            // Reverse the notifications array to iterate backwards, newer notifications appear at the top
            notifications = notifications.reverse();

            // iterate over the notifications array and create HTML elements for them to be displayed
            notifications.forEach(notification => {
                // Create notification elements
                const notificationDiv = document.createElement('div');
                notificationDiv.classList.add('notification');

                const notificationPhotoDiv = document.createElement('div');
                notificationPhotoDiv.classList.add('notificationPhoto');

                const notificationPhotoImg = document.createElement('img');

                // Convert base64 image data to an image URL
                notificationPhotoImg.src = `data:image/jpeg;base64,${notification.userProfilePhoto}`;
                notificationPhotoDiv.appendChild(notificationPhotoImg);

                // notificationInfo div holds the text and user name of the notification
                const notificationInfoDiv = document.createElement('div');
                notificationInfoDiv.classList.add('notificationInfo');
                const userParagraph = document.createElement('p');
                userParagraph.textContent = `@${notification.user}`;
                const textParagraph = document.createElement('p');
                textParagraph.textContent = notification.notificationText;

                // append the user and notification text to the notification info div
                notificationInfoDiv.appendChild(userParagraph);
                notificationInfoDiv.appendChild(textParagraph);

                // Append notification elements to notificationDiv
                notificationDiv.appendChild(notificationPhotoDiv);
                notificationDiv.appendChild(notificationInfoDiv);

                // Append notificationDiv to notificationTab container
                notificationTab.appendChild(notificationDiv);
            });
        } else {
            // display any errors in retrieving the notifications in the console
            console.error('Error retrieving notifications:', response.status);
        }
    } catch (error) {
        // display any other errors along with those that may occur in retrieving the notifications
        console.error('Error retrieving notifications:', error);
    }
}

// this function is executed when the user clicks on the "liked" button on the home page, 
// it shows all the posts the user has liked 
async function setupLikedPage() {

    // clear any previous content
    likedPage.innerHTML = ""; 

    try {
        // fetch request to get the postIds liked by the user
        const likedPostsResponse = await fetch(`/M00914286/posts/userLikedPosts/${currentUser}`);
        const likedPostsData = await likedPostsResponse.json();

        // iterate over each postId and get the post's details
        for (const postId of likedPostsData.likedPosts) {

            // fetch request to get post details by postId
            const postDetailsResponse = await fetch(`/M00914286/posts/getPostbyID/${postId}`);
            const postDetails = await postDetailsResponse.json();

            // create a button element for each post
            const postButton = document.createElement('button');
            postButton.classList.add('post');
            postButton.id = postId; // set the button Id to the postId

            // create an image element for the post image
            const postImg = document.createElement('img');
            postImg.src = `data:image/png;base64,${postDetails.postImg}`; // Set post image source

            // append the image element to the button
            postButton.appendChild(postImg);

            // append the button to the likedPage
            likedPage.appendChild(postButton);
        }
    } catch (error) {
        // show any errors in the console 
        console.error('Error setting up liked page:', error);
    }
}

// this function is executed whenever the user searches using the search bar
// users are searched using @username, if the user jsut types a word and searches, it will go through all the posts titles
// and return those posts that contain that word in their title
async function handleSearch(event) {

    // user has to press enter key to initiate the search
    if (event.key === 'Enter') {

        // get the value from the search bar, trim to remove leading/trailing whitespace
        const searchValue = searchBar.value.trim(); 
        searchBar.value = ""; // Reset the search bar



        // check if search value is empty
        if (searchValue === '') {
            // notify user by modifying the placeholder text and exit the function 
            searchBar.placeholder = 'Please enter a search term';
            return; 
        }

        // check if the first character is '@' for user search
        if (searchValue.charAt(0) == '@') {

            // clear previous search results
            searchResults.innerHTML = '';
            
            try {
                // get the username after the @
                const username = searchValue.slice(1); 

                // fetch request to search for users
                const response = await fetch(`/M00914286/users/search/${username}`);
                
                // if no errors,
                if (response.ok) {

                    // store the response in the "data" variable 
                    const data = await response.json();

                    // if the data is an array, keep it as it is and if not make it an array, assign it to usersData
                    const usersData = Array.isArray(data) ? data : [data]; 

                    // Loop through each matching user
                    usersData.forEach(user => {
                        // Check if the user is not the current user
                        if (user.username !== currentUser) {

                            // Create new HTML elements for each user, which include the profile photo, name, and follow button
                            const resultDiv = document.createElement('div');
                            resultDiv.classList.add('result');

                            const resultPhotoDiv = document.createElement('div');
                            resultPhotoDiv.classList.add('resultPhoto');

                            const profileImg = document.createElement('img');
                            profileImg.setAttribute('src', `data:image/jpeg;base64,${user.profilePhoto}`);

                            const usernamePara = document.createElement('p');
                            usernamePara.textContent = user.username;

                            const followBtn = document.createElement('button');
                            followBtn.classList.add('followResultBtn');
                            
                            // fetch request to check if the current user is following this user
                            (async () => {
                                const checkFollowingResponse = await fetch(`/M00914286/following/checkIfFollowing`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ user: currentUser, followedUser: user.username })
                                });

                                // if no errors,
                                if (checkFollowingResponse.ok) {

                                    // store the boolean value returned from the request in isFollowing
                                    const { isFollowing } = await checkFollowingResponse.json();

                                    // Set button text and style based on follow status (Following if true, follow if false)
                                    followBtn.textContent = isFollowing ? 'Following' : 'Follow';
                                    if (isFollowing) {
                                        followBtn.classList.add('dark');
                                    }
                                    // show any errors in the console
                                } else {
                                    console.error('Error checking if following:', checkFollowingResponse.status);
                                }
                            })();

                            // set the follow button's Id as the user's username for future reference 
                            followBtn.setAttribute('id', user.username); 

                            // append the elements the result div 
                            resultPhotoDiv.appendChild(profileImg);
                            resultDiv.appendChild(resultPhotoDiv);
                            resultDiv.appendChild(usernamePara);
                            resultDiv.appendChild(followBtn);

                            // append the new result to the search results container
                            searchResults.appendChild(resultDiv);
                            searchResults.classList.remove("hide");
                        }
                    });
                    // show any errors that may occur, in the console.
                } else {
                    console.error('Error retrieving user data:', response.status);
                }
                // show any errors that may occur, in the console.
            } catch (error) {
                console.error('Error searching users:', error);
            }

            // if it is not a search that begins with "@", then its considered a post search

        } else { 

            // clear existing search results
            searchResults.innerHTML = '';

            try {
                // fetch request to search for posts
                const response = await fetch(`/M00914286/posts/search/${searchValue}`);
                
                // if no errors,
                if (response.ok) {

                    // store the posts that include the searchValue in their title, it could be the whole title or part of it,
                    const posts = await response.json();

                    // loop through each the matching posts
                    posts.forEach(post => {

                        // display posts that do not belong to the current user 
                        if (post.userId !== currentUser) {

                            // create new HTML elements for each post
                            const postBtn = document.createElement('button');
                            postBtn.classList.add('post');
                            postBtn.setAttribute('id', post._id); // set the id of the button as the postId

                            // set the posts image 
                            const postImg = document.createElement('img');
                            postImg.setAttribute('src', `data:image/jpeg;base64,${post.postImg}`); 

                            // add the image to the button 
                            postBtn.appendChild(postImg);

                            // append the new post button to the search results container
                            searchResults.appendChild(postBtn);
                            searchResults.classList.remove("hide");
                        }
                    });
                    // show any errors that may occur, in the console.
                } else {
                    console.error('Error retrieving post data:', response.status);
                }
                // show any errors that may occur, in the console.
            } catch (error) {
                console.error('Error searching posts:', error);
            }
        }
    }
}

// this function is executed when the post is expanded, determines the amount of likes to show and the like button's state 
async function forLikeBtn(){

    // fetch request to check if the current user liked the post
    const response = await fetch(`http://localhost:8080/M00914286/posts/checkIfUserLikedPost/${currentUser}/${postId}`);
        
        // if any errors, show in the console and exit function 
        if (!response.ok) {
            console.error('Error checking if user liked post:', response.status);
            return;
        }


        // if no errors, store the response in the data variable 
        const data = await response.json();
        // store true or false according to if the user has liked the post or not 
        const likedByUser = data.likedByUser;
        // store the current likes for the post 
        const currentLikes = data.currentLikes

        // show the current likes next to the like button 
        likesAmt.innerHTML = currentLikes

        // Toggle the "liked" class based on the result
        if (!likedByUser) {
            // If the user hasn't liked the post before, do not include the "liked" class
            likeBtn.classList.remove("liked");
        } else {
            // If the user has liked the post before, add the "liked" class to show the same 
            likeBtn.classList.add("liked");

        }       
}

// this function is executed everytime a post button is clicked, and it expands the post
async function postModalSetup(postId){

    // get necessary HTML elements of the viewPost div 
    const postImage = document.getElementById('placeholderImg');
    const postUserID = document.getElementById('postUserID');
    const viewPostTitle = document.getElementById('viewPostTitle');
    const viewPostDesc = document.getElementById('viewPostDesc');


    try {
        // make a fetch request to get the post details by ID
        const response = await fetch(`http://localhost:8080/M00914286/posts/getPostbyID/${postId}`, {
            method: 'GET'
        });

        
        // if no errors,
        if (response.ok) {
            // store the JSON response data in the postData variable 
            const postData = await response.json();

            // Set the post details to the variables
            postImage.src = `data:image/jpeg;base64,${postData.postImg}`; //show the post image in the right format
            postUserID.textContent = `@${postData.user}`;
            viewPostTitle.textContent = postData.title;
            viewPostDesc.textContent = postData.description;
            setProfPhoto(currentUser, "commentProfilePhoto")

        } else if (response.status === 404) {
            // If post is not found, show an appropriate error message
            console.error('Post not found:', response.statusText);
        } else {
            // show any other error responses in getting the post in the console
            console.error('Error fetching post details:', response.statusText);
        }
    } catch (error) {

        // show any error that occurs in the try block
        console.error('Error:', error);
    }

}

// function to adjust the post likes, executed when the like button is clicked
async function adjustLikes(username, adjustment) {
    try {

        // fetch request to update the likes 
        const response = await fetch(`http://localhost:8080/M00914286/posts/updatePostLikes/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, adjustment}) 
        });

      // if no errors,  
      if (response.ok) {

        // store the JSON response in the data variable
        const data = await response.json();

        // return the updated likes to be shown next to the like button 
        return data.updatedLikes; 
        
        
      } else {
        // show errors in updating the posts likes from the fetch request in the console, and return null
        console.error('Error adjusting likes:', response.status);
        return null; // Return null in case of error
      }
    } catch (error) {
        // show any other errors, including the above, in the console  
      console.error('Error:', error);
      return null; // Return null in case of error
    }
}



// sign up function executed when the user clicks on the "sign up" button within the sign up box
async function signup(e) {

    //prevent default form behaviour
    e.preventDefault()

    // Get the values from all the fields in the signup page 
    let signUpUsername = document.getElementById('signupUserField').value.trim();
    let signUpPassword = document.getElementById('signupPassField').value.trim();
    let signUpEmail = document.getElementById("signupEmailField").value.trim();
    let signUpConfirmPass = document.getElementById('signupConfirmPassField').value.trim();
    let signUpFirstName = document.getElementById('firstNameField').value.trim();
    let signUpLastName = document.getElementById('lastNameField').value.trim();
    let description = document.getElementById('descriptionField').value.trim();
    let signupError = document.getElementById('signupError');

    // Reset any previous error messages
    signupError.style.color = "red"
    signupError.textContent = '';

    // Validate the signup fields
    if (!signupValidation(signUpUsername, signUpPassword, signUpEmail, signUpConfirmPass, signUpFirstName, signUpLastName, profPhoto.chosen, description, signupError)) {
        e.preventDefault()
        return;
    }

    // Fetch request to check if the email and username already exist
    try {
        const emailResponse = await fetch(`/M00914286/users/checkEmail/${signUpEmail}`);

        // Handle email availability
        if (emailResponse.ok) {
            const usernameResponse = await fetch(`/M00914286/users/check/${signUpUsername}`);

            // Handle username availability
            if (usernameResponse.ok) {
                // Both email and username are available, proceed with signup
                signupError.style.color = "green"
                signupError.textContent = "Signed Up Successfully"
                await postToDatabase({ 
                    username: signUpUsername,
                    password: signUpPassword,
                    email: signUpEmail,
                    firstName: signUpFirstName,
                    lastName: signUpLastName,
                    description:description 
                }, profPhoto.data, 'users', 'signupPost', 'updateProfilePhoto', submitSignupForm);

                profPhoto.chosen = false; // Reset chosen status for profile photo
            } else if (usernameResponse.status === 409) {
                signupError.innerText += "Username already exists.\n";
                e.preventDefault()
                return;
            } else {
                signupError.innerText += "Error checking username availability.\n";
                e.preventDefault()
                return;
            }
        } else if (emailResponse.status === 409) {
            signupError.innerText += "Email already in use.\n";
            e.preventDefault()
            return;
        } else {
            signupError.innerText += "Error checking email availability.\n";
            e.preventDefault()
            return;
        }
    } catch (error) {
        signupError.innerText += `Error: ${error}`;
    }
}

// function to submit the sign up form
function submitSignupForm() {
    // Get the signup form element
    const signupForm = document.getElementById('signupForm');

    // Submit the form
    signupForm.submit();

   
}

// add the signup function to the button 
signupBtn.addEventListener("click", signup);

// function to submit the post form
function submitPostForm() {
    // Get the post form element
    const postForm = document.getElementById('postForm');
    // Submit the form
    postForm.submit();
}



// login function executed when the user clicks on the login button within the login box 
async function login(e) {
    // Prevent default form behaviour
    e.preventDefault();

    // getting the elements from the login box
    let user = document.getElementById("loginUserField").value;
    let pass = document.getElementById("loginPassField").value;
    let loginError = document.getElementById("loginError");

    // reset any previous error messages
    loginError.innerText = "";

    // validate the fields
    if (!loginValidation(user, pass, loginError)) {
        return;
    }

    try {
        // fetch request to get the user's details
        const response = await fetch('http://localhost:8080/M00914286/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: user,
                password: pass
            })
        });

        if (response.ok) {
            // Store the JSON response in the data variable 
            const data = await response.json();

                // Set loggedIn to true, set the user profile photo on the account button, and set currentUser
                loggedIn = true;
                setProfPhoto(user, "accountBtn");
                currentUser = user;
                submitLoginForm();
                hideAll();
            }
          else if (response.status === 401) {
            loginError.innerText = 'Incorrect password';
        } else if (response.status === 404) {
            loginError.innerText = 'User not found';
        } else{
            loginError.innerText = `Error: ${response.status}`;
        }
    } catch (error) {
        loginError.innerText = `Error: ${error.text}`;
    }
}


// function to submit the login form
function submitLoginForm() {
    // Get the login form element
    const loginForm = document.getElementById('loginForm');
    // Submit the form
    loginForm.submit();
}

// add the login function to the login button 
loginBtn.addEventListener("click", login)


// this function is executed when the user clicks on the account button, it displays the users posts 
async function displayUserPosts(username) {
    try {
        // Make a fetch request to get the user's posts
        const response = await fetch(`http://localhost:8080/M00914286/posts/getPosts/${username}`);
        const userPosts = await response.json();

        // get the container in which the posts are shown
        const postsContainer = document.getElementById('accountPostsContainer');

        // clear the container before displaying new posts
        postsContainer.innerHTML = '';

        // iterate over each post and create HTML elements
        userPosts.forEach(post => {

            // create a new button element for each post
            const postButton = document.createElement('button');

            // assign class "accPpost" to the button
            postButton.classList.add('accPost');
        
            // set the button Id to the post _id
            postButton.id = post._id;
        
            // create an image element to display the post image
            const postImage = document.createElement('img');
            postImage.src = `data:image/jpeg;base64,${post.postImg}`;
            postButton.appendChild(postImage);
        
            // append the post button to the posts container
            accountPostsContainer.appendChild(postButton);
        });
        // show any errors, in the console.
    } catch (error) {
        console.error('Error fetching user posts:', error);
    }
}

// to display the comments for the post that is provided as an argument to the function
async function displayPostComments(postId) {
    try {
        // select the container where the comments will be displayed
        const commentsContainer = document.getElementById('userComments');

        // clear the container before displaying new comments
        commentsContainer.innerHTML = '';

        // make a fetch request to get the comments for the post
        const response = await fetch(`http://localhost:8080/M00914286/comments/getComments/${postId}`);
        const postComments = await response.json();

        // check if the post has no comments
        if (!postComments || postComments.comments === false) {
            // if no comments are found for the post then return
            return;
        }

        // iterate over each of the comments backwards so newer comments appear at the top
        for (let i = postComments.length - 1; i >= 0; i--) {
            const comment = postComments[i];

            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment');

            // for the comment photo
            const commentPhotoDiv = document.createElement('div');
            commentPhotoDiv.classList.add('commentPhoto');

            // img element for the comment photo
            const commentPhotoImg = document.createElement('img');
            commentPhotoImg.src = `data:image/jpeg;base64,${comment.userPhoto}`;
            commentPhotoDiv.appendChild(commentPhotoImg);

            // for the comment text
            const commentTextDiv = document.createElement('div');
            commentTextDiv.classList.add('commentText');

            // for the comment text
            const commentTextP = document.createElement('p');
            commentTextP.textContent = `@${comment.user}: ${comment.text}`;

            // append the elements
            commentTextDiv.appendChild(commentTextP);

            // append the comment photo div and comment text div to the comment div
            commentDiv.appendChild(commentPhotoDiv);
            commentDiv.appendChild(commentTextDiv);

            // append the comment div to the comments container
            commentsContainer.appendChild(commentDiv);
        }

        // show any errors, in the console 
    } catch (error) {
        console.error('Error fetching post comments:', error);
    }
}


// function to setup the profile page shown when the user clicks on the account button 
async function setProfilePage() {
    try {

        // make a fetch request to get user details
        const response = await fetch(`/M00914286/users/getUserDetails/${currentUser}`);
        const userData = await response.json();

        // get the HTML elements 
        let accountUsername = document.getElementById("accountUsername");
        let accountUserId = document.getElementById("accountUserID");
        let accountDescription = document.getElementById("accountDescription");
        let accountFollowersBtn = document.getElementById("accountFollowersBtn");
        let accountFollowingBtn = document.getElementById("accountFollowingBtn");

        // set profile photo of the user
        setProfPhoto(currentUser, "accountProfilePhoto");

        // set username and user ID
        accountUsername.textContent = userData.username;
        accountUserId.textContent = `@${userData.username}`;

        // set user description
        accountDescription.textContent = userData.description;

        // make fetch requests to get followers count and following count
        const followersResponse = await fetch(`/M00914286/followers/count/${currentUser}`);
        const followersData = await followersResponse.json();

        const followingResponse = await fetch(`/M00914286/following/count/${currentUser}`);
        const followingData = await followingResponse.json();

        // update buttons with followers and following counts
        accountFollowersBtn.textContent = `${followersData.followersCount} followers`;
        accountFollowingBtn.textContent = `${followingData.followingCount} following`;

        // display the user's posts 
        displayUserPosts(currentUser)

        // show any errors that may occur, in the console
    } catch (error) {
       
        console.error('Error setting profile page:', error);
    }
}



// this function is called when the user is making a post 
async function createPost(e) {

    // prevent default form behaviour 
    e.preventDefault();

    // get the values from the HTML elements, also get the creationError element to show any errors that may occur
    let postTitle = document.getElementById('postTitle').value.trim();
    let postDesc = document.getElementById('postDesc').value.trim();
    let creationError = document.getElementById('creationError');


    // clear any previous error messages
    creationError.textContent = '';

     // check if the fields are empty
     if (postTitle === '' || postDesc === '') {
        creationError.textContent = "Title and/or description cannot be empty.";
        e.preventDefault();
        return; // return to exit function 
    }

    // validate the length of the title and description
    if (postTitle.length > 15) {
        creationError.textContent = "Title must not exceed 15 characters.";
        e.preventDefault();
        return; // return to exit function 
    }

    if (postDesc.length > 75) {
        creationError.textContent = "Description must not exceed 75 characters.";
        e.preventDefault();
        return; // return to exit function 
    }
    
    // If post photo is not chosen
    if (!postPhoto.chosen){
        creationError.textContent = "Choose a post image.(JPEG, JPG, PNG and so., size should be < 1MB)"
        e.preventDefault();
        return; // Added return to exit function
    }

    try {
       // Call the postToDatabase function to submit the post data
        await postToDatabase(
            {
                user: currentUser,
                title: postTitle,
                description: postDesc,
                likes: 0
            },
            postPhoto.data,
            'posts',
            'makePost',
            'updatePostImage',
            submitPostForm 
        );

        // the below is upload the image provided in the creation of the post in the "uploads" folder in the project

        //  FormData object to hold image data and title
         const formData = new FormData();
         formData.append('myFile', postPhoto.file); 
 
         // fetch request to upload the image
         const uploadResponse = await fetch(`/M00914286/upload/${postTitle}`, {
             method: 'POST',
             body: formData
         });
 
         // Check if the upload was successful, show in console 
         if (!uploadResponse.ok) {
            creationError.innerText = `Image upload failed: ${uploadResponse.status}`;

         } else {
         }

        //Reset postPhoto object after successful post
        postPhoto.chosen = false;
        postPhoto.data = " "
        postPhoto.file = " "

      // show any error in the post creation form   
    } catch (error) {
        // Handle error if postToDatabase fails
        creationError.textContent = `Error: ${error}`;
    }
}
// Add the createPost function to the form's submit event listener
document.getElementById('postForm').addEventListener('submit', createPost);


// upon clicking the logout button, the below function is executed
async function userLogout(e) {

    // fetch request made to logout the user, removes the session 
    try {
        const response = await fetch(`http://localhost:8080/M00914286/logout`, {
            method: 'GET'
        });

        // Check if the response is successful, will receive login: false
        if (response.ok) {

            const data = await response.json();
            if (data.login === false) {
                loggedIn = false;
                hideAll();

                // show any errors in making the fetch request in the console 
            } else {
                console.error('Unexpected response:', data);
            }
            // show any errors in the console regarding the fetch request  
        } else {
            console.error('Logout failed:', response.status);
        }
        // show any other errors 
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// add the function to logout button, executed when the user clicks on it 
logoutBtn.addEventListener("click", userLogout)

// function to submit the edit profile form
function submitEditProfileForm() {
    // Get the edit profile form element
    const editProfileForm = document.getElementById('editProfileForm');
    // Submit the form
    editProfileForm.submit();
}

// add the function to the edit profile button on the account tab
editProfBtn.addEventListener('click', editProfile);

// the edit profile function is executed when the user edits their profile description adn profile photo and clicks on the "done" button
async function editProfile(e) {

    e.preventDefault()

    // get the value of the description textarea
    const profDesc = document.getElementById('profDesc').value;

    // get the error element
    const editError = document.getElementById('editError');
    editError.style.color = "red"
    editError.textContent = "";

    // check if the description is empty, if so, don't submit form and display error
    if (profDesc.trim().length === 0) {
        editError.textContent = "Description must not be empty.";
        return;
    }

    // check if description length exceeds 40 characters, if so, don't submit form and display error
    if (profDesc.length > 40) {
        editError.textContent = "Description must not exceed 40 characters.";
        return;
    }

    // Check if newProfPhoto.data is empty, which means the user didn't select a photo
    if (!newProfPhoto.chosen) {
        editError.textContent = "Choose a profile photo. (JPEG, JPG, PNG and so., size should be < 1MB)";
        return;
    }

    try {

        editError.style.color = "green"
        editError.textContent = "Changes Saved."

        // make a fetch request to update profile photo in notifications in which this user appears
        const formDataNotification = new FormData();
        formDataNotification.append('photoData', newProfPhoto.data);
        await fetch(`http://localhost:8080/M00914286/notifications/newNotificationUserProfilePhoto/${currentUser}`, {
            method: 'POST',
            body: formDataNotification
        });

        // make a fetch request to update profile photo in comments in which this user appears
        const formDataComments = new FormData();
        formDataComments.append('profilePhoto', newProfPhoto.data);
        await fetch(`http://localhost:8080/M00914286/comments/updateUserProfilePhotoInComments/${currentUser}`, {
            method: 'POST',
            body: formDataComments
        });

        // Call the postToDatabase function to submit the edited profile data
        await postToDatabase(
            {
                username: currentUser,
                description: profDesc
            },
            newProfPhoto.data,
            'users',
            'updateDescription',
            'updateProfilePhoto'
        );

        // submit the edit profile form
        submitEditProfileForm();


        // show any errors that occur in the form
    } catch (error) {
        editError.textContent = `Error: ${error}`;
    }
}




