// function to validate signup input
export function signupValidation(username, password, email, confirmPass, firstName, lastName, profilePhotoChosen, description, errorElement) {
    
    // Regular expressions for validation
    let nameRegex = /^[a-zA-Z]+$/; // Only alphabets for first and last name
    let usernameRegex = /^[a-zA-Z0-9_]+$/; // Alphanumeric and underscore for username
    let passRegex = /^[a-zA-Z0-9$&.]+$/; // Alphanumeric, dollar sign, ampersand, and period for password

    // check if all fields are filled out
    if (![firstName, lastName, username, password, confirmPass, email, description].every(field => field.length > 0)) {
        errorElement.innerText += "Fill out all fields.\n";
        return false;
    }

    // check if first and last name only include specified characters
    if (!(firstName.match(nameRegex)) || !(lastName.match(nameRegex))) {
        errorElement.innerText += "First or last name must not contain special characters.\n";
        return false;
    }

    //check email format
    if (email.indexOf("@") === -1){
        errorElement.innerText += "Invalid email address.";
        return false;
    } else {
        const domains = [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "outlook.com",
            "aol.com",
            "mdx.live.ac.uk",
        ];
        const domain = email.slice(email.indexOf("@") + 1);
        if (!(domains.includes(domain))){
            errorElement.innerText += "Invalid email domain.";
            return false;
        }
    }

    //check username format
    if (!username.match(usernameRegex)){
        errorElement.innerText += "Username contains invalid character(s).\n";
        return false;
    }

    if (password.length < 8) {
        errorElement.innerText += "Password must be at least 8 characters long";
        return false
    }

    // check password length and format
    if (!password.match(passRegex)) {
        errorElement.innerText += "Password must contain only alphanumerics, dollar sign, ampersand, and period.\n";
        return false;
    }

    // check if password and confirm password match
    if (confirmPass !== password){
        errorElement.innerText += "Password and Confirm Password do not match.\n";
        return false;
    }

    // check description length
    if (description.length > 40) {
        errorElement.innerText += "Description must not exceed 40 characters.\n";
        return false;
    }

    // check if a profile photo is chosen
    if (!profilePhotoChosen){
        errorElement.innerText += "Choose a profile photo. (JPEG, JPG, PNG or so., size should be < 1MB)";
        return false;
    }

    // all validations passed, return true 
    return true;
}

// function to validate the input for login
export function loginValidation(username, password, errorText) {

    // if any field is empty, show an error and return false
    if (![username, password].every(field => field.trim().length)) {
        errorText.innerText = "Fill out all fields.";
        return false;
    }
    
    // Validation passed
    return true;
}



// this function handles a few post requests, those that require both text and image data to be sent 
// textData is sent in JSON to request 1, it returns an Id for the docuemnt that is created,
// that document is then updated with the image that is sent as formData seperately
export async function postToDatabase(textData, photoData, collection, request1, request2, submitFunction) {
    try {
        // Create FormData object for photoData
        const photoFormData = new FormData();
        photoFormData.append('photoData', photoData); // Append photoData to FormData

        // First fetch request to make the post with all text data in JSON format
        const response = await fetch(`http://localhost:8080/M00914286/${collection}/${request1}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(textData), // Send textData as JSON in the request body
        });

        // Extract the postId from the response of the first fetch request
         const { postId } = await response.json();

        // Second fetch request to update the document with the post image
        await fetch(`http://localhost:8080/M00914286/${collection}/${request2}/${postId}`, {
            method: 'POST',
            body: photoFormData, // Send photoData as FormData in the request body
        });

        // if a submit function is given, then execute it otherwise skip
        if (submitFunction && typeof submitFunction === 'function') {
            submitFunction();
        }
        //show any errors in the console
    } catch (error) {
        console.error('Error during post:', error);
    }
}

// a function to get the profile photo assoicated with the user given as an argument
export async function getUserProfilePhoto(user) {

    const response = await fetch(`/M00914286/users/profilePhoto/${user}`);
        
    if (response.ok) {
        // Get the profile photo data in base64 format
        const data = await response.json();
        return data.profilePhoto;
    }

}

// function to set a profile photo for a user on an html element
export async function setProfPhoto(user, htmlElement) {
    try {
        // fetch the user's profile photo
        const profilePhotoData = await getUserProfilePhoto(user);

        // if the data is available / response is okay
        if (profilePhotoData) {

            // set the src attribute of the HTML element
            const accountImg = document.querySelector(`#${htmlElement} img`);
            accountImg.setAttribute('src', `data:image/png;base64,${profilePhotoData}`);

        } 
        
        // show any errors that may occure in the console 
    } catch (error) {
        // Handle network errors or other issues
        console.error('Error retrieving profile photo:', error);
    }
}


// this function is used to allow the user to select a photo from their files, it then converts the image to base64 and stores the info in a dataObj
export function attachPhoto(inputElement, buttonElement, imageElement, dataObj, file = false) {
    // When the button is clicked, trigger the file input click
    buttonElement.addEventListener("click", function() {
        inputElement.click();
    });

    // When a file is selected, set the src attribute of the img tag to the selected file
    inputElement.addEventListener("change", function() {
        // get the file selected from the user
        const file = inputElement.files[0];

        if (file) {
            // Check if the selected file is an image
            if (!file.type.startsWith('image/')) {
                // If not an image, reset the input and return
                inputElement.value = ''; // Clear the input
                return; 
            }

            // Check if the file size is less than or equal to 1MB (1048576 bytes)
            if (file.size > 1048576) {
                // If the file size exceeds 1MB, reset the input and return
                inputElement.value = ''; // Clear the input
                return;
            }

            // Read the selected file as a binary string
            const reader = new FileReader();
            reader.onload = function(e) {
                // Convert the binary string to Base64
                const binaryString = e.target.result;
                const base64Data = btoa(binaryString);

                // Update the source of the img tag to display the selected image
                imageElement.src = URL.createObjectURL(file);

                // Store the Base64 data in the data variable
                dataObj.data = base64Data;
                dataObj.chosen = true;

                // If file is set to true, store it in dataObj.file, this is only done for posts 
                if (file) {
                    dataObj.file = file;
                }
            };
            
            reader.readAsBinaryString(file); // Read file as a binary string
        }
    });
}
