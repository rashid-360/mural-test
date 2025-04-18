require('dotenv').config(); // at the top
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const AUTH_URL = 'https://app.mural.co/api/public/v1/authorization/oauth2/';
const TOKEN_URL = 'https://app.mural.co/api/public/v1/authorization/oauth2/token';
const SCOPE = 'templates:read';
const STATE = 'random_state_123'; // Normally you'd generate this

// Step 1: Start OAuth flow
app.get('/login', (req, res) => {
  const url = `${AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&state=${STATE}`;
  res.redirect(url);
});

// Step 2: Handle OAuth callback
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (state !== STATE) {
    return res.status(400).send('State mismatch.');
  }


  const data = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };


  try {
    // Make the actual token request
    const response = await axios.post(TOKEN_URL, data, { headers });

    const { access_token, refresh_token, expires_in } = response.data;



    res.send(`
      <h2>Access Token:</h2><p>${access_token}</p>
      <h2>Refresh Token:</h2><p>${refresh_token}</p>
      <h2>Expires In:</h2><p>${expires_in} seconds</p>
    `);
  } catch (error) {
    res.status(500).send('Failed to exchange code for token');
  }
});

// Step 3: Example call to Mural API using access token (Optional Testing)
app.get('/workspace', async (req, res) => {
  const accessToken = req.query.token; // Pass token in query param for simplicity

  try {
    const response = await axios.get('https://app.mural.co/api/public/v1/workspaces', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).send('API call failed');
  }
});

app.listen(3000, () => {
  console.log('🚀 Server running at http://localhost:3000');
  console.log('🔐 Start by visiting: http://localhost:3000/login');
});
