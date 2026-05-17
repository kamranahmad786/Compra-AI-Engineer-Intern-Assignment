import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  for (const m of models) {
    try {
      console.log(`Testing model ${m} on v1 API via requestOptions...`);
      // Pass apiVersion: 'v1' as the second parameter to getGenerativeModel
      const model = genAI.getGenerativeModel({ model: m }, { apiVersion: 'v1' });
      const result = await model.generateContent('Hello! Respond with "success" if you can hear me.');
      console.log(`Model ${m} response:`, result.response.text());
      break;
    } catch (err) {
      console.error(`Model ${m} failed:`, err.message || err);
    }
  }
}

test();
