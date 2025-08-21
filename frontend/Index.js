const submitLogin = document.getElementById('submitLogin');
const submitReg = document.getElementById('submitRegister');

// User Clicks Login Button -------------------------------------------------------------
submitLogin.addEventListener('click', async (e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value);
    const password = String(document.getElementById('password').value);

    try {
        // Send request to backed
        const res = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // Evaluate backend response
        if (res.ok) {
            const data = await res.json();
            console.log('Login Successful!', data);

            // Save Username for later use & Open home page
            localStorage.setItem('username', data.username);
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            alert(`Login Failed: ${err}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    }
});

// User Clicks Register button ------------------------------------------------------------
submitReg.addEventListener('click', async(e) => {
    e.preventDefault();

    // Get username and password form UI
    const username = String(document.getElementById('username').value);
    const password = String(document.getElementById('password').value);

    try{
        // send request to backend
        const res = await fetch('http://localhost:3000/api/users', {
            method: 'POST',
            headers: {'content-type': 'application/json'},
            body: JSON.stringify({username, password})
        });

        // evaluate backend response
        if (res.ok){
            alert('User Registered!');

            // save username and open home page
            localStorage.setItem('username', username);
            window.location.href = "home.html";
        } else {
            const err = await res.text();
            alert(`Registration Failed: ${err}`);
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert(`Network Error: ${error}`);
    }
});


