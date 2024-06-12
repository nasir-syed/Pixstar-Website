// import the app from the server.js file since thats where the server starts
import { app }  from '../server.js';

// chai imports
import chai from 'chai';
let should = chai.should();
let assert = chai.assert;
let expect = chai.expect;

//set up Chai for testing web service
import chaiHttp from 'chai-http';
chai.use(chaiHttp);

//wrapper for all web service tests
describe('Web Service', () => {

    // test of GET request sent to /getAllUsernames
    describe('/GET getAllUsernames', () => {
        it('should GET all usernames', (done) => {
            chai.request(app)
                .get('/M00914286/users/getAllUsernames')
                .end((err, response) => {

                    // check that there are no errors
                    expect(err).to.equal(null);

                    // check the status code
                    response.should.have.status(200);

                    // convert returned JSON to JS object
                    let usernames = JSON.parse(response.text);

                    // check that an array of usernames is returned
                    usernames.should.be.a('array');

                    // end test
                    done();
                });
        });
    });

    // test of POST request sent to /login, used to get username and password for verifying login details 
    describe('/POST checkUser', () => {
        it('should return user information if the user exists', (done) => {
            const requestBody = {
                username: 'nasir',
                password: "m00914286"
            };
    
            chai.request(app)
                .post('/M00914286/users/login')
                .send(requestBody)
                .end((err, response) => {

                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JS object
                    let responseData = JSON.parse(response.text);
    
                    // check responseData contains username and password properties
                    responseData.should.have.property('username');
    
                    // end test
                    done();
                });
        });
    });

    // test of GET request sent to /search, used to search for users in the users collection and return their names and profile photos
    describe('/GET searchUsers', () => {
        it('should return users matching the search pattern', (done) => {
            chai.request(app)
                .get('/M00914286/users/search/nasir') 
                .end((err, response) => {

                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JS object
                    let usersData = JSON.parse(response.text);
    
                    // check that usersData is an array
                    usersData.should.be.an('array');
    
                    // check that each user object has username and profilePhoto properties
                    usersData.forEach(user => {
                        user.should.have.property('username');
                        user.should.have.property('profilePhoto');
                    });
    
                    // end test
                    done();
                });
        });
    });
    

    // test for GET request sent to /getPosts, used to ge the provided user's posts and their details
    describe('/GET getUserPosts', () => {
        it('should GET all posts for a user', (done) => {
            chai.request(app)
                .get('/M00914286/posts/getPosts/nasir') 
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JS object
                    let userPosts = JSON.parse(response.text);
    
                    // check that an array of posts is returned
                    userPosts.should.be.a('array');
    
                    // check each post in the array
                    userPosts.forEach(post => {

                        // check that each post has a title and description
                        post.should.have.property('title');
                        post.should.have.property('description');
                    });
    
                    // end test
                    done();
                });
        });    

    });

    // test for GET request that searches posts by their title, and returns them in an array
    describe('/GET searchPostsByTitle', () => {
        it('should return matching posts by title', (done) => {
            
    
            chai.request(app)
                .get(`/M00914286/posts/search/myfirstpost`)
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JS object
                    let matchingPosts = JSON.parse(response.text);
    
                    // check that matchingPosts is an array
                    matchingPosts.should.be.a('array');
    
                    // if there are any matching posts, check that each post has a title containing the search term
                    if (matchingPosts.length > 0) {
                        matchingPosts.forEach(post => {
                            post.title.toLowerCase().should.include("myfirstpost");
                        });
                    }
    
                    // end test
                    done();
                });
        });
    });

    // test for GET request that gets the provided users followers count
    describe('/GET getFollowersCount', () => {
        it('should GET the count of followers for a user', (done) => {
            chai.request(app)
                .get('/M00914286/followers/count/nasir') 
                .end((err, response) => {

                    // check that there are no errors
                    expect(err).to.equal(null);

                    // check the status code
                    response.should.have.status(200);

                    // convert returned JSON to J object
                    let followersCount = JSON.parse(response.text);

                    // check that the response contains followersCount
                    followersCount.should.have.property('followersCount');

                    // end test
                    done();
                });
        });
    });

    // a test for POST request that checks if a user is a follower of another
    describe('/POST checkIfFollower', () => {
        it('should return whether the given user is a follower or not', (done) => {
            const requestBody = {
                user: 'nasir', 
                follower: 'middlesexdubai' 
            };
    
            chai.request(app)
                .post('/M00914286/followers/checkIfFollower')
                .send(requestBody)
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JS object
                    let responseData = JSON.parse(response.text);
    
                    // check that responseData contains isFollower property
                    responseData.should.have.property('isFollower');
    
                    // end test
                    done();
                });
        });
    });


    // test for GET request that gets a users following
    describe('/GET getUsersFollowing', () => {
        it('should GET users that the specified user is following', (done) => {
            chai.request(app)
                .get('/M00914286/following/users/nasir') 
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JavaScript object
                    let followingUsers = JSON.parse(response.text);
    
                    // check that followingUsers is an object with a followingUsers property
                    followingUsers.should.be.an('object');
                    followingUsers.should.have.property('followingUsers');
    
                    // check that followingUsers.followingUsers is an array
                    followingUsers.followingUsers.should.be.an('array');
    
                    // end test
                    done();
                });
        });
    });


    // test for POST for checking if a user is following another 
    describe('/POST checkIfFollowing', () => {
        it('should return whether the given user is following the specified user', (done) => {
            const requestBody = {
                user: 'nasir', 
                followedUser: 'arthurmorg' 
            };
    
            chai.request(app)
                .post('/M00914286/following/checkIfFollowing')
                .send(requestBody)
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JavaScript object
                    let responseData = JSON.parse(response.text);
    
                    // check that responseData contains isFollowing property
                    responseData.should.have.property('isFollowing');
    
                    // end test
                    done();
                });
        });
    });
    

    // test for GET request that gets a provided user's notifications
    describe('/GET getNotifications', () => {
        it('should GET notifications for the specified user', (done) => {
            chai.request(app)
                .get('/M00914286/notifications/nasir') 
                .end((err, response) => {
                    // check that there are no errors
                    expect(err).to.equal(null);
    
                    // check the status code
                    response.should.have.status(200);
    
                    // convert returned JSON to JavaScript object
                    let notifications = JSON.parse(response.text);
    
                    // check that notifications is an array
                    notifications.should.be.an('array');
    
                    // check each notification object has user and notifiedUser properties
                    notifications.forEach(notification => {
                        notification.should.have.property('user');
                        notification.should.have.property('notifiedUser');
                    });
    
                    // end test
                    done();
                });
        });
    });    
    
});