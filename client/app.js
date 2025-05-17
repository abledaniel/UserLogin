var API_URL = 'http://localhost:3000/api';

var loginBtn = document.getElementById('login-btn');
var registerBtn = document.getElementById('register-btn');
var logoutBtn = document.getElementById('logout-btn');
var loginSection = document.getElementById('login-section');
var registerSection = document.getElementById('register-section');
var profileSection = document.getElementById('profile-section');
var authButtons = document.getElementById('auth-buttons');
var userMenu = document.getElementById('user-menu');
var welcomeMessage = document.getElementById('welcome-message');

var loginForm = document.getElementById('login-form');
var registerForm = document.getElementById('register-form');
var profileForm = document.getElementById('profile-form');
var pictureUploadForm = document.getElementById('picture-upload-form');

if (localStorage.getItem('token')) {
  fetchProfile();
}

loginBtn.onclick = function() {
  loginSection.classList.remove('hidden');
  registerSection.classList.add('hidden');
  profileSection.classList.add('hidden');
};

registerBtn.onclick = function() {
  registerSection.classList.remove('hidden');
  loginSection.classList.add('hidden');
  profileSection.classList.add('hidden');
};

logoutBtn.onclick = function() {
  localStorage.removeItem('token');
  loginSection.classList.remove('hidden');
  profileSection.classList.add('hidden');
  authButtons.classList.remove('hidden');
  userMenu.classList.add('hidden');
};

loginForm.onsubmit = async function(e) {
  e.preventDefault();
  var data = {
    username: loginForm.username.value,
    password: loginForm.password.value
  };

  var response = await fetch(API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  var result = await response.json();
  if (response.ok) {
    localStorage.setItem('token', result.token);
    fetchProfile();
  }
};

registerForm.onsubmit = async function(e) {
  e.preventDefault();
  var data = {
    username: registerForm.username.value,
    password: registerForm.password.value,
    email: registerForm.email.value,
    firstName: registerForm.firstName.value,
    lastName: registerForm.lastName.value,
    birthday: registerForm.birthday.value,
    biography: registerForm.biography.value,
    favoriteNumber: parseInt(registerForm.favoriteNumber.value)
  };

  var response = await fetch(API_URL + '/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  var result = await response.json();
  if (response.ok) {
    localStorage.setItem('token', result.token);
    fetchProfile();
  }
};

profileForm.onsubmit = async function(e) {
  e.preventDefault();
  var data = {
    email: profileForm.email.value,
    firstName: profileForm.firstName.value,
    lastName: profileForm.lastName.value,
    birthday: profileForm.birthday.value,
    biography: profileForm.biography.value,
    favoriteNumber: parseInt(profileForm.favoriteNumber.value)
  };

  await fetch(API_URL + '/profile', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: JSON.stringify(data)
  });

  fetchProfile();
};

pictureUploadForm.onsubmit = async function(e) {
  e.preventDefault();
  var formData = new FormData(pictureUploadForm);
  
  var response = await fetch(API_URL + '/profile/picture', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    },
    body: formData
  });

  var result = await response.json();
  if (response.ok) {
    document.getElementById('profile-picture').src = result.profilePicture;
  }
};

async function fetchProfile() {
  var response = await fetch(API_URL + '/profile', {
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
  });

  if (response.ok) {
    var user = await response.json();
    displayProfile(user);
    profileSection.classList.remove('hidden');
    loginSection.classList.add('hidden');
    registerSection.classList.add('hidden');
    authButtons.classList.add('hidden');
    userMenu.classList.remove('hidden');
    welcomeMessage.textContent = 'Welcome, ' + user.firstName + '!';
  } else {
    localStorage.removeItem('token');
  }
}

function displayProfile(user) {
  document.getElementById('profile-email').value = user.email;
  document.getElementById('profile-firstname').value = user.firstName;
  document.getElementById('profile-lastname').value = user.lastName;
  document.getElementById('profile-birthday').value = user.birthday.split('T')[0];
  document.getElementById('profile-bio').value = user.biography;
  document.getElementById('profile-favnumber').value = user.favoriteNumber;
  
  var profilePicture = document.getElementById('profile-picture');
  if (user.profilePicture) {
    profilePicture.src = user.profilePicture;
    profilePicture.style.display = 'block';
  } else {
    profilePicture.style.display = 'none';
  }
} 