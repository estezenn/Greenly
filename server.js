import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { askPlant } from "./chat.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "20mb" }));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;

        console.log("Soru:", message);

        const { reply, sources } = await askPlant(message);

        console.log("Cevap:", reply);
        console.log("Kaynaklar:", sources);

        res.json({ reply, sources });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            reply: "Bir hata oluştu.",
            sources: []
        });

    }

});

app.listen(3000, () => {
    console.log("Sunucu çalışıyor: http://localhost:3000");
});