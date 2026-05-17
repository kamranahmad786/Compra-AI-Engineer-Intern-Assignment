import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  try {
    console.log('Testing with key:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Hello! Respond with "success" if you can hear me.');
    console.log('Response:', result.response.text());
  } catch (err) {
    console.error('Error during test:', err);
  }
}

test();
