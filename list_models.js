import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Available Models:');
    if (data.models) {
      data.models.forEach(m => console.log(`- ${m.name} (${m.displayName})`));
    } else {
      console.log('No models returned. Response:', data);
    }
  } catch (err) {
    console.error('Failed to list models:', err);
  }
}

listModels();
