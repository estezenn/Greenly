import client from "./foundry.js";

const response = await client.embeddings.create({
    model: "qwen3-embedding-0.6b",
    input: "Bitkilerin yaprakları neden sararır?"
});

console.log(response.data[0].embedding.slice(0, 10));