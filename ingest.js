import fs from "fs";
import path from "path";
import { ChromaClient } from "chromadb";
import client from "./foundry.js";

const docsPath = "./docs";

const chroma = new ChromaClient({
    host: "localhost",
    port: 8000
});

const noopEmbeddingFn = {
    name: "noop",
    generate: async () => [],
    getConfig: () => ({})
};

const collection = await chroma.getOrCreateCollection({
    name: "plantcare_documents",
    embeddingFunction: noopEmbeddingFn
});

function splitText(text, chunkSize = 800) {
    const chunks = [];

    for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.substring(i, i + chunkSize));
    }

    return chunks;
}

const files = fs.readdirSync(docsPath);

let counter = 0;

for (const file of files) {

    if (!file.endsWith(".md")) continue;

    const filePath = path.join(docsPath, file);
    const text = fs.readFileSync(filePath, "utf8");

    const chunks = splitText(text);

    console.log(file, "→", chunks.length, "parça");

    for (const chunk of chunks) {

        const embedding = await client.embeddings.create({
            model: "qwen3-embedding-0.6b",
            input: chunk
        });

        await collection.add({
            ids: [`doc_${counter}`],
            documents: [chunk],
            embeddings: [embedding.data[0].embedding],
            metadatas: [{ source: file }]
        });

        counter++;
    }
}

console.log("\nBitti!");
console.log(counter, "chunk ChromaDB'ye eklendi.");