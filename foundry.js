import OpenAI from "openai";

const client = new OpenAI({
    baseURL: "http://127.0.0.1:54147/v1",
    apiKey: "not-needed"
});

export default client;