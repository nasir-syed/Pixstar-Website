// import the functions that the tests are conducted on
import { signupValidation, loginValidation } from '../public/js/helper.js';


//set up Chai library 
let expect = chai.expect;


// test for the signupValidation function 
describe('#signupValidation', () => {

    it('should return false if any field is empty', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('', 'password', 'test@gmail.com', 'password', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(false);
        expect(errorElement.innerText).to.contain("Fill out all fields.");
    });

    it('should return false if first or last name contains special characters', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('John$%', 'password', 'test@gmail.com', 'password', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(false);
        expect(errorElement.innerText).to.contain("Username contains invalid character(s).");
    });

    it('should return false if email domain is incorrect', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('john', 'password', 'test@google', 'password', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(false);
        expect(errorElement.innerText).to.contain("Invalid email domain.");
    });

    it('should return false if email format is incorrect', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('john', 'password', 'testgmail.com', 'password', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(false);
        expect(errorElement.innerText).to.contain("Invalid email address.");
    });

    it('should return false if password and confirm password do not match', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('john', 'password', 'test@gmail.com', 'password2', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(false);
        expect(errorElement.innerText).to.contain("Password and Confirm Password do not match.");
    });

    it('should return true if all values are in the right format', () => {
        const errorElement = { innerText: "" };
        const result = signupValidation('john', 'password', 'test@gmail.com', 'password', 'John', 'Doe', true, 'Description', errorElement);
        expect(result).to.equal(true);
    });

});

// test for the loginValidation function 
describe('#loginValidation', () => {
    
    it('should return false if any field is empty', () => {
        const errorElement = { innerText: "" };
        const result = loginValidation('', 'password', errorElement);
        expect(result).to.equal(false);
    });

    it('should return true if both fields are filled', () => {
        const errorElement = { innerText: "" };
        const result = loginValidation('username', 'password', errorElement);
        expect(result).to.equal(true);
    });

});
