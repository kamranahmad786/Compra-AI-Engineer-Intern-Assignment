import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function test() {
  const models = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash',
  ];
  for (const m of models) {
    try {
      console.log(`\nTesting model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Hello! Respond with "success" if you can hear me.');
      console.log(`✅ Model ${m} Success! Response:`, result.response.text().trim());
      break;
    } catch (err) {
      console.error(`❌ Model ${m} failed:`, err.message || err);
    }
  }
}

test();
