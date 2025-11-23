// Quick test to see what's exported
const embeddingsModule = await import('./models/embeddings.js');
console.log('Embeddings module exports:', Object.keys(embeddingsModule));
console.log('getEmbedding type:', typeof embeddingsModule.getEmbedding);
console.log('embedder type:', typeof embeddingsModule.embedder);
