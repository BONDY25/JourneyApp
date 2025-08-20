const submitLogin = document.getElementById('submitLogin');
const submitReg = document.getElementById('submitRegister');

function checkUser(username, password) {
    const count = 0
    // search database for user assign count
    return count !== 0;
}

// User Clicks Submit Button -------------------------------------------------------------
submitLogin.addEventListener('click', async(e) => {
    e.preventDefault();

    const username = String(document.getElementById('username').value);
    const password = String(document.getElementById('password').value);

    if(checkUser(username,password))
    {
        // Open home.html
        /*
        Store username somewhere so it can be submitted with jounrey data and used to
        retrieve journey data
        */
    }
    else{
        alert("Username & Passwords don't match");
    }
});

// User Clicks Register button ------------------------------------------------------------
submitReg.addEventListener('click', async(e) => {
    e.preventDefault();

    const username = String(document.getElementById('username').value);
    const password = String(document.getElementById('password').value);

    if(checkUser(username))
    {
        alert("Username already exists");
    }
    else{
        // Insert data into database in users cluster
        const userData = {
            username: username,
            password: password,
            dateCreated: new Date(),
        };

        try {
            const res = await fetch('http://localhost:3000/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (res.ok) {
                console.log("User Submission Successful.");
                alert('User Saved!');
            } else {
                const err = await res.text();
                console.log("User Submission failed.");
                alert(`Error: ${err}`);
            }
        } catch (error) {
            console.log('Network Error:', error);
        }
        // Open home.html
        /*
        Store username somewhere so it can be submitted with jounrey data and used to
        retrieve journey data
        */
    }
})


