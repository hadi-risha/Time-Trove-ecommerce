document.addEventListener('DOMContentLoaded', function() {
	console.log('jssssssss workingggggggggggggg');
    const userDetailsDataElement = document.getElementById('userDetailsData');
    const userDetails = JSON.parse(userDetailsDataElement.textContent);

    // Initialize an array to store user details
    var userDetailsArray = [];

    for(let i = 0; i < userDetails.length; i++) {
        userDetailsArray.push({
            name: userDetails[i].name,
            email: userDetails[i].email,
            verified: userDetails[i].verified,
            isBlocked: userDetails[i].isBlocked,
            _id: userDetails[i]._id
        });
    }

    // Function to update the table with the given users
    function updateTable(users) {
        const tbody = document.querySelector('#userTable tbody');
        tbody.innerHTML = ''; // Clear the table body

        users.forEach(user => {
            const row = document.createElement('tr');

            const nameCell = document.createElement('td');
            nameCell.textContent = user.name;
            row.appendChild(nameCell);

            const emailCell = document.createElement('td');
            emailCell.textContent = user.email;
            row.appendChild(emailCell);

            const statusCell = document.createElement('td');
            statusCell.textContent = user.verified ? 'Verified' : 'Not Verified';
            row.appendChild(statusCell);

            const actionsCell = document.createElement('td');
            const blockButton = document.createElement('button');
            blockButton.textContent = user.isBlocked ? 'Unblock' : 'Block';
            blockButton.className = 'status completed blockUnblock red';
            actionsCell.appendChild(blockButton);
            row.appendChild(actionsCell);

            tbody.appendChild(row);
        });
    }

    // Event listener for the search input
    document.getElementById('searchInput').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length >= 1) {
            // Filter the userDetails array
            const filteredUsers = userDetailsArray.filter(user => {
                return user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
            });

            // Update the table with the filtered users
            updateTable(filteredUsers);
        } else {
            // If the search input is empty, show all users
            updateTable(userDetailsArray);
        }
    });
});


// Initial display of all users
updateTable(userDetailsArray);
