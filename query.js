import { ChromaClient } from "chromadb";
import client from "./foundry.js";


const chroma = new ChromaClient({
    host: "localhost",
    port: 8000
});


const collection = await chroma.getCollection({
    name: "plantcare_documents",
    embeddingFunction: null
});


async function search(query) {

    const embedding = await client.embeddings.create({
        model: "qwen3-embedding-0.6b",
        input: query
    });


    const results = await collection.query({
        queryEmbeddings: [
            embedding.data[0].embedding
        ],
        nResults: 3
    });


    console.log("\nBulunan bilgiler:\n");

    for (let i = 0; i < results.documents[0].length; i++) {

        console.log("--------------------------------");

        console.log(
            results.documents[0][i]
        );

        console.log(
            "Kaynak:",
            results.metadatas[0][i].source
        );
    }
}


search("Yapraklarım sararıyor, ne yapmalıyım?");