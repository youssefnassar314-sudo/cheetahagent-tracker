// File: api/convert.js

export default async function handler(req, res) {
    // Siguraduhing POST request lang ang tatanggapin
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { fileBase64 } = req.body;
        
        // Kunin ang Cloudmersive API Key mula sa Vercel
        const apiKey = process.env.CLOUDMERSIVE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Missing Cloudmersive API Key in Vercel settings.' });
        }

        if (!fileBase64) {
            return res.status(400).json({ error: 'Missing document data.' });
        }

        // 1. I-convert ang Base64 mula sa frontend pabalik sa Binary Buffer
        const buffer = Buffer.from(fileBase64, 'base64');

        // 2. I-prepare ang data format na hinihingi ni Cloudmersive (multipart/form-data)
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        formData.append('inputFile', blob, 'template.docx');

        // 3. Ipadala sa Cloudmersive Document Conversion API
        const response = await fetch('https://api.cloudmersive.com/convert/docx/to/pdf', {
            method: 'POST',
            headers: {
                'Apikey': apiKey
            },
            body: formData
        });

        // 4. I-check kung successful
        if (!response.ok) {
            const errText = await response.text();
            console.error("Cloudmersive API Error:", errText);
            return res.status(500).json({ error: 'Conversion failed at Cloudmersive.' });
        }

        // 5. Ibalik ang PDF result (diretso file buffer ang binibigay ni Cloudmersive)
        const pdfArrayBuffer = await response.arrayBuffer();
        const pdfBuffer = Buffer.from(pdfArrayBuffer);
        
        // I-convert pabalik to Base64 para maintindihan ng index.html mo
        const pdfBase64 = pdfBuffer.toString('base64');

        return res.status(200).json({ pdfBase64: pdfBase64 });

    } catch (error) {
        console.error("Vercel Serverless Error:", error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
