const API_URL = 'http://127.0.0.1:8080/api';

const photosElement = document.querySelector('.row.row-cols-1.row-cols-sm-2.row-cols-md-3.g-3');
const uploadFormElement = document.getElementById('upload-form');
const searchFormElement = document.getElementById('search-form');
const viewModal = document.querySelector('.modal');
const editFormElement = document.getElementById('modal-form');
const textValue = document.getElementById('text-modal');
const yearValue = document.getElementById('year-modal');
const monthValue = document.getElementById('month-modal');
const locationValue = document.getElementById('location-modal');
const deleteButton = document.getElementById('delete-modal');
const closeButton = document.getElementById('close-modal');

let currentPhoto;

uploadFormElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    uploadPhoto();
});


searchFormElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    searchPhotos();
});

editFormElement.addEventListener('submit', async (event) => {
    event.preventDefault();
    editPhoto();
});

deleteButton.addEventListener('click', (event) => {
    event.preventDefault();
    deletePhoto();
});

closeButton.addEventListener('click', (event) => {
    event.preventDefault();
    closeViewModal();
});

async function loadData() {
    try {
        const response = await fetch(`${API_URL}/load`);
        const data = await response.json();
        data.forEach((photo) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'col';
            photoDiv.innerHTML = `
                <div class="card shadow-sm">
                <img src="static/uploads/${photo['FileName']}" class="card-img-top" alt="Image not found">
                <div class="card-body">
                    <p class="card-text">${photo['Info']}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="btn-group">
                            <button id="view-button" type="button" class="btn btn-sm btn-outline-secondary">View</button>
                            <button id="edit-button" type="button" class="btn btn-sm btn-outline-secondary">Edit</button>
                        </div>
                        <small class="text-body-secondary">Location: ${photo['Location']}, Date: ${photo['Month']} ${photo['Year']}</small>
                    </div>
                </div>
            </div>
            `;
            const editButton = photoDiv.querySelector('#edit-button');
            editButton.addEventListener('click', (event) => {
                event.preventDefault();
                currentPhoto = photo['ID'];
                showViewModal(photo['Info'], photo['Location'], photo['Month'], photo['Year']);
            });
            const viewButton = photoDiv.querySelector('#view-button');
            viewButton.addEventListener('click', (event) => {
                event.preventDefault();
                window.open(`static/uploads/${photo['FileName']}`, '_blank');
            });

            photosElement.appendChild(photoDiv);
        });
    }
    catch (error) {
        alert('Error loading data: ' + error);
    }
}

async function uploadPhoto() {
    const formData = new FormData(uploadFormElement);
    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error);
        }

        uploadFormElement.reset(); 
        resetPhotos();
        loadData();
    }
    catch (error) {
        alert('Error uploading photo: ' + error.message + ', Error:' + error);
    }
}

async function searchPhotos() {
    const formData = new FormData(searchFormElement);
    try {
        const response = await fetch(`${API_URL}/search`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error);
        }

        resetPhotos();
        searchFormElement.reset(); 

        const data = await response.json();
        data.forEach((photo) => {
            const photoDiv = document.createElement('div');
            photoDiv.className = 'col';
            photoDiv.innerHTML = `
                <div class="card shadow-sm">
                <img src="static/uploads/${photo['FileName']}" class="card-img-top" alt="Image not found">
                <div class="card-body">
                    <p class="card-text">${photo['Info']}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="btn-group">
                            <button id="view-button" type="button" class="btn btn-sm btn-outline-secondary">View</button>
                            <button id="edit-button" type="button" class="btn btn-sm btn-outline-secondary">Edit</button>
                        </div>
                        <small class="text-body-secondary">Location: ${photo['Location']}, Date: ${photo['Month']} ${photo['Year']}</small>
                    </div>
                </div>
            </div>
            `;
            const editButton = photoDiv.querySelector('#edit-button');
            editButton.addEventListener('click', (event) => {
                event.preventDefault();
                currentPhoto = photo['ID'];
                showViewModal(photo['Info'], photo['Location'], photo['Month'], photo['Year']);
            });
            const viewButton = photoDiv.querySelector('#view-button');
            viewButton.addEventListener('click', (event) => {
                event.preventDefault();
                window.open(`static/uploads/${photo['FileName']}`, '_blank');
            });
            
            photosElement.appendChild(photoDiv);
        });
    }
    catch (error) {
        alert('Error uploading photo: ' + error.message + ', Error:' + error);
    }
}

async function editPhoto() {
    const formData = new FormData(editFormElement);
    formData.append('ID', currentPhoto);
    try {
        const response = await fetch(`${API_URL}/edit`, {
            method: 'PATCH',
            body: formData,
        });

        if (!response.ok) {
            const errorResponse = await response.json();
            throw new Error(errorResponse.error);
        }

        closeViewModal();
        resetPhotos();
        loadData();
    }
    catch (error) {
        alert('Error uploading photo: ' + error.message + ', Error:' + error);
    }
}

async function deletePhoto() {
    if(confirm('Are you sure you want to delete this photo?')) {
        try {
            const response = await fetch(`${API_URL}/delete/${currentPhoto}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorResponse = await response.json();
                throw new Error(errorResponse.error);
            }

            closeViewModal();
            resetPhotos();
            loadData();
        }
        catch (error) {
            alert('Error deleting photo: ' + error.message + ', Error:' + error);
        }
    }
}

function resetPhotos() {
    photosElement.innerHTML = '';
}

function showViewModal(info, location, month, year) {
    textValue.value = info;
    locationValue.value = location;
    monthValue.value = month;
    yearValue.value = year;
    viewModal.style.display = 'block';
}

function closeViewModal() {
    editFormElement.reset();
    currentPhoto = '';
    viewModal.style.display = 'none';
}

loadData();