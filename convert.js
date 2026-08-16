import fs from "fs";
import path from "path";
import mammoth from "mammoth";

const docsPath = "./docs";

const files = fs.readdirSync(docsPath);

for (const file of files) {
    if (!file.endsWith(".docx")) continue;

    const filePath = path.join(docsPath, file);

    const result = await mammoth.convertToMarkdown({
        path: filePath
    });

    const mdName = file.replace(/\.docx$/i, ".md");
    const mdPath = path.join(docsPath, mdName);

    fs.writeFileSync(mdPath, result.value, "utf8");

    console.log(`${file} → ${mdName}`);
}

console.log("\nDönüştürme tamamlandı!");