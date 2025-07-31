const axios = require('axios');

class AIService {
  constructor() {
    this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://127.0.0.1:11434';
    this.model = process.env.OLLAMA_MODEL || 'codellama';
    
    this.axiosInstance = axios.create({
      baseURL: this.ollamaUrl,
      timeout: 60000, // 60 seconds
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async generateResponse(prompt, context = '') {
    try {
      console.log('AIService: Generating response for prompt:', prompt.substring(0, 50) + '...');
      
      const fullPrompt = `You are an expert C programming tutor. ${context}\n\nUser: ${prompt}\n\nAssistant:`;
      
      const requestData = {
        model: this.model,
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1000
        }
      };
      
      const response = await this.axiosInstance.post('/api/generate', requestData);
      
      if (response.data && response.data.response) {
        return response.data.response;
      } else {
        return 'Unable to generate response. Please try again.';
      }
    } catch (error) {
      console.error('AIService Error:', error.message);
      
      // Return helpful fallback based on the prompt
      if (prompt.toLowerCase().includes('int')) {
        return 'The `int` keyword in C declares integer variables. Integers are whole numbers that can be positive, negative, or zero. Typically uses 4 bytes of memory.';
      } else if (prompt.toLowerCase().includes('pointer')) {
        return 'A pointer in C is a variable that stores the memory address of another variable. Use * to declare and dereference pointers, and & to get addresses.';
      } else if (prompt.toLowerCase().includes('array')) {
        return 'Arrays in C are collections of elements of the same type stored in contiguous memory. Declared as: type name[size];';
      } else {
        return `I understand your question about "${prompt}". Currently having trouble connecting to the AI service. Please ensure Ollama is running.`;
      }
    }
  }

  // Stream response for real-time word-by-word effect
  async *generateStreamResponse(prompt, context = '') {
    try {
      const fullPrompt = `You are an expert C programming tutor. ${context}\n\nUser: ${prompt}\n\nAssistant:`;
      
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const json = JSON.parse(line);
              if (json.response) {
                yield json.response;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      yield 'Error: Unable to stream response.';
    }
  }

  async generateTestCases(code) {
    const prompt = `Generate 3 test cases for this C program. Return ONLY a JSON array with fields: input, expectedOutput, description.\n\nCode:\n${code}`;
    
    const response = await this.generateResponse(prompt, 'Generate test cases in valid JSON format.');
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return [{
        input: '',
        expectedOutput: 'Check program output',
        description: 'Basic test case'
      }];
    } catch (error) {
      return [{
        input: '',
        expectedOutput: 'Check program output',
        description: 'Basic test case'
      }];
    }
  }

  async suggestImprovements(code) {
    const prompt = `Analyze this C code and suggest 3 key improvements:\n\n${code}`;
    return this.generateResponse(prompt, 'Provide concise, practical suggestions.');
  }

  async debugCode(code, error) {
    const prompt = `Debug this C code error: ${error}\n\nCode:\n${code}`;
    return this.generateResponse(prompt, 'Provide clear debugging steps.');
  }
}

module.exports = new AIService();