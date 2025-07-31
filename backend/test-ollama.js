const axios = require('axios');

const OLLAMA_URL = 'http://127.0.0.1:11434';

async function testConnection() {
  console.log('Testing Ollama connection...');
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`);
    console.log('✓ Connected to Ollama');
    console.log('Available models:', response.data.models.map(m => m.name).join(', '));
    return true;
  } catch (error) {
    console.error('✗ Cannot connect to Ollama at', OLLAMA_URL);
    console.error('Error:', error.code || error.message);
    return false;
  }
}

async function testGeneration() {
  console.log('\nTesting code generation...');
  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'codellama',
      prompt: 'Write a simple C program that prints Hello World',
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500
      }
    });
    
    console.log('✓ Generation successful');
    console.log('\nResponse:');
    console.log(response.data.response);
  } catch (error) {
    console.error('✗ Generation failed:', error.message);
  }
}

async function testVisualCademyIntegration() {
  console.log('\nTesting VisualCademy integration...');
  
  const code = `#include <stdio.h>
int main() {
    int x = 10;
    int *ptr = &x;
    printf("Value: %d\\n", *ptr);
    return 0;
}`;

  try {
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: 'codellama',
      prompt: `You are an expert C programming tutor. The user has this C code:\n\n${code}\n\nUser: Explain how the pointer works in this code.\n\nAssistant:`,
      stream: false
    });
    
    console.log('✓ Integration test successful');
    console.log('\nAI Explanation:');
    console.log(response.data.response);
  } catch (error) {
    console.error('✗ Integration test failed:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  const connected = await testConnection();
  if (connected) {
    await testGeneration();
    await testVisualCademyIntegration();
  } else {
    console.log('\nPlease ensure Ollama is running:');
    console.log('1. Open a new terminal');
    console.log('2. Run: ollama serve');
    console.log('3. Try this test again');
  }
}

runAllTests();