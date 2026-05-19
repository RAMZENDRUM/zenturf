import { Readable } from "stream";
import server from "../dist/server/server.js";

export default async function handler(req, res) {
  // Construct absolute URL
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const url = `${protocol}://${req.headers.host}${req.url}`;
  
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = Readable.toWeb(req);
  }

  const request = new Request(url, {
    method: req.method,
    headers,
    body,
    duplex: "half",
  });

  try {
    const response = await server.fetch(request);
    
    // Copy status and headers
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (error) {
    console.error("Vercel Serverless Function SSR error:", error);
    res.statusCode = 500;
    res.end("Internal Server Error");
  }
}
