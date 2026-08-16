import { ChromaClient } from "chromadb";
import client from "./foundry.js";

const chroma = new ChromaClient({
    host: "localhost",
    port: 8000
});

const noopEmbeddingFn = {
    name: "noop",
    generate: async () => [],
    getConfig: () => ({})
};

const SIMILARITY_THRESHOLD = 0.4;

async function getCollection() {
    return await chroma.getCollection({
        name: "plantcare_documents",
        embeddingFunction: noopEmbeddingFn
    });
}

async function getContext(question) {

    const collection = await getCollection();

    const embedding = await client.embeddings.create({
        model: "qwen3-embedding-0.6b-generic-cpu",
        input: question
    });

   const results = await collection.query({
        queryEmbeddings: [
            embedding.data[0].embedding
        ],
        nResults: 2,
        include: ["documents", "metadatas", "distances"]
    });

    const documents = results.documents[0] || [];
    const metadatas = results.metadatas[0] || [];
    const distances = results.distances[0] || [];

    return documents
        .map((doc, i) => ({
            doc,
            source: metadatas[i]?.source ?? "bilinmeyen",
            similarity: 1 - distances[i] / 2
        }))
        .filter(item => item.similarity >= SIMILARITY_THRESHOLD);
}


export async function askPlant(question) {

    // Selamlaş malarda RAG çalıştırma
    const lowerQuestion = question.toLowerCase().trim();

    const greetings = [
        "merhaba",
        "selam",
        "selamlar",
        "merhabalar",
        "mrb",
        "nasılsın",
        "nasilsin"
    ];

    if (greetings.includes(lowerQuestion)) {
        return {
            reply: "Merhaba! Bitkilerle ilgili nasıl yardımcı olabilirim?",
            sources: []
        };
    }

    const contextItems = await getContext(question);

    const contextText = contextItems.length > 0
        ? contextItems.map(item => item.doc).join("\n\n")
        : "Kaynak bulunamadı.";

    const sources = [
        ...new Set(contextItems.map(item => item.source))
    ];

    const response = await client.chat.completions.create({

        model: "Phi-4-mini-instruct-generic-cpu",

        messages: [
            {
                role: "system",
                content: `Sen Greenly adlı bitki bakım asistanısın.

Kurallar:
- Her zaman Türkçe cevap ver.
- Yalnızca verilen kaynak bilgisini kullan.
- Cevabı en fazla 2-3 cümleyle ver.
- Kaynakta cevap yoksa "Bu konuda kaynaklarımda bilgi bulunmuyor." de.`
            },
            {
                role: "user",
                content: `Kaynak:
${contextText}

Soru:
${question}`
            }
        ],

        max_tokens: 100,
        temperature: 0.2
    });

    return {
        reply: response.choices[0].message.content,
        sources
    };
}