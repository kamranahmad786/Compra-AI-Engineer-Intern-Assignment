import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `You are a layout design agent that modifies design JSON structures based on user instructions.

You receive a design JSON that describes a canvas with layers (images, text, shapes) positioned on an artboard.

KEY CONCEPTS:
- The artboard has a width and height (e.g., 1080x1080 for Instagram post).
- Each node has: x, y (absolute position), width, height, and normalized values (nx, ny, nw, nh) relative to artboard.
- nx = x / artboard_width, ny = y / artboard_height, nw = width / artboard_width, nh = height / artboard_height
- Text nodes have fontSize, fontFamily, fontWeight, color, and a fontSizeRatio = fontSize / artboard_width
- Image nodes have sourceUrl and fit properties
- Shape nodes can be circles, rectangles, etc.

SEMANTIC UNDERSTANDING OF THE DESIGN:
- "img_1778485681535_4" = Background image (full canvas)
- "text_1778486306230_8" = HEADLINE: "Luxury Comfort, Surprisingly Attainable" (large italic title)
- "text_1778486136643_7" = SUBHEADLINE: "Comfort that defines modern living."
- "text_1778486552508_9" = STATS TEXT: "Over 8,000 happy homes"
- "text_1778486004640_6" = CTA / OFFER TEXT: "Limited time offer"
- "text_1778489078397_16" = DISCOUNT BADGE TEXT: "20% OFF"
- "circle_1778488914968_15" = DISCOUNT BADGE CIRCLE (yellow circle behind "20% OFF")
- "img_1778489515746_17" = PRODUCT IMAGE (the main product/sofa)
- "img_1778486846247_10" through "img_1778487110538_14" = STAR/RATING ICONS

RULES FOR MODIFICATIONS:
1. When resizing the artboard (e.g., "convert to 9:16"), update the artboard width/height and recalculate all element positions proportionally.
2. For "9:16" conversion: width stays 1080, height becomes 1920. Redistribute elements vertically with more spacing.
3. When moving elements, update x, y and recalculate nx, ny.
4. When resizing elements, update width, height and recalculate nw, nh.
5. For font size changes, update fontSize and recalculate fontSizeRatio.
6. Always maintain the normalized values (nx, ny, nw, nh) consistent with absolute values.
7. Keep all IDs, types, names, and structural properties unchanged unless specifically asked.
8. When moving elements "higher" or "to the top", decrease y values. "Lower" or "to the bottom" = increase y.
9. "Make larger" = increase width/height. "Make smaller" = decrease width/height.
10. Always ensure elements stay within the artboard bounds (0 to artboard_width, 0 to artboard_height).

CRITICAL: You must respond with ONLY valid JSON. No markdown, no code fences, no explanation before or after. Just the complete updated design JSON.

The JSON must maintain the exact same structure with "rootNodes", "imageUrl", and "nodes" keys.`;

// Chat history storage (in-memory for POC)
const chatSessions = new Map();

app.post('/api/chat', async (req, res) => {
  try {
    const { message, designJson, sessionId, chatHistory } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ 
        error: 'GEMINI_API_KEY not configured. Please add it to the .env file.' 
      });
    }


    // Build the conversation context
    const conversationParts = [];
    
    // Add system context
    conversationParts.push({
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }]
    });
    conversationParts.push({
      role: 'model',
      parts: [{ text: 'I understand. I am a layout design agent. I will modify design JSON based on user instructions and respond with only valid JSON. I will maintain consistent normalized values and keep elements within bounds.' }]
    });

    // Add chat history for follow-up context
    if (chatHistory && chatHistory.length > 0) {
      for (const entry of chatHistory) {
        if (entry.role === 'user') {
          conversationParts.push({
            role: 'user',
            parts: [{ text: entry.content }]
          });
        } else if (entry.role === 'assistant' && entry.updatedJson) {
          conversationParts.push({
            role: 'model',
            parts: [{ text: JSON.stringify(entry.updatedJson) }]
          });
        }
      }
    }

    // Add current instruction with the design JSON
    conversationParts.push({
      role: 'user',
      parts: [{ text: `Here is the current design JSON:\n${JSON.stringify(designJson, null, 2)}\n\nUser instruction: "${message}"\n\nApply the instruction and return the complete updated JSON.` }]
    });

    const modelsToTry = [
      'gemini-3-flash-preview',
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.0-flash',
    ];
    let lastError = null;
    let responseText = null;
    let selectedModelName = '';

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Layout Agent] Attempting layout transformation using: ${modelName}`);
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 16384,
          }
        });

        const chat = model.startChat({
          history: conversationParts.slice(0, -1),
        });

        const result = await chat.sendMessage(conversationParts[conversationParts.length - 1].parts[0].text);
        responseText = result.response.text();
        selectedModelName = modelName;
        console.log(`[Layout Agent] Successfully generated layout with: ${modelName}`);
        break; // Success, exit loop
      } catch (err) {
        console.warn(`[Layout Agent] Model ${modelName} failed:`, err.message || err);
        lastError = err;
      }
    }

    if (!responseText) {
      const isQuotaError = lastError?.message?.includes('429') || lastError?.message?.includes('Quota') || lastError?.message?.includes('quota');
      if (isQuotaError) {
        return res.status(429).json({
          error: 'Gemini API Free Tier Quota Exceeded. The free tier limits for this API key have been exhausted (or this API key is restricted in your region). Please check your billing details in Google AI Studio or configure a new API key in the .env file.'
        });
      }
      return res.status(500).json({ 
        error: `Failed to process layout instruction. Error: ${lastError?.message || lastError}` 
      });
    }

    // Parse the JSON from the response
    let updatedJson;
    try {
      // Try to extract JSON from the response (handle possible markdown wrapping)
      let jsonStr = responseText;
      
      // Remove markdown code fences if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      updatedJson = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      console.error('Raw response:', responseText.substring(0, 500));
      return res.status(422).json({ 
        error: 'The AI generated an invalid response. Please try rephrasing your instruction.',
        rawResponse: responseText.substring(0, 200)
      });
    }

    // Generate a human-readable summary of changes
    const changes = detectChanges(designJson, updatedJson);

    res.json({
      updatedJson,
      changes,
      message: changes.length > 0 
        ? `I've made ${changes.length} change(s) to the layout.`
        : 'Layout updated based on your instruction.'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred processing your request.' 
    });
  }
});

// Detect changes between original and updated JSON
function detectChanges(original, updated) {
  const changes = [];
  
  if (!original.nodes || !updated.nodes) return changes;

  // Check artboard changes
  const origArtboard = Object.values(original.nodes).find(n => n.type === 'artboard');
  const updArtboard = Object.values(updated.nodes).find(n => n.type === 'artboard');
  
  if (origArtboard && updArtboard) {
    if (origArtboard.width !== updArtboard.width || origArtboard.height !== updArtboard.height) {
      changes.push(`Canvas resized from ${origArtboard.width}x${origArtboard.height} to ${updArtboard.width}x${updArtboard.height}`);
    }
  }

  for (const nodeId of Object.keys(original.nodes)) {
    const origNode = original.nodes[nodeId];
    const updNode = updated.nodes[nodeId];
    
    if (!updNode || origNode.type === 'artboard') continue;
    
    const label = origNode.name || nodeId;
    
    // Position changes
    if (Math.abs(origNode.x - updNode.x) > 1 || Math.abs(origNode.y - updNode.y) > 1) {
      changes.push(`Moved "${label}" from (${Math.round(origNode.x)}, ${Math.round(origNode.y)}) to (${Math.round(updNode.x)}, ${Math.round(updNode.y)})`);
    }
    
    // Size changes
    if (Math.abs(origNode.width - updNode.width) > 1 || Math.abs(origNode.height - updNode.height) > 1) {
      changes.push(`Resized "${label}" from ${Math.round(origNode.width)}x${Math.round(origNode.height)} to ${Math.round(updNode.width)}x${Math.round(updNode.height)}`);
    }
    
    // Font size changes
    if (origNode.style?.visual?.fontSize !== updNode.style?.visual?.fontSize) {
      changes.push(`Changed "${label}" font size from ${origNode.style.visual.fontSize} to ${updNode.style.visual.fontSize}`);
    }
  }
  
  return changes;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!process.env.GEMINI_API_KEY });
});

// Resolve directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static assets from Vite's build directory (dist) in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback all non-API GET requests to index.html for React SPA Router
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Layout Agent API running on http://localhost:${PORT}`);
  console.log(`   API Key configured: ${!!process.env.GEMINI_API_KEY}`);
});
