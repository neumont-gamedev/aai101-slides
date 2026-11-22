const http=require("http"),fs=require("fs"),path=require("path");const root=process.argv[2], port=+(process.argv[3]||8765);  // usage: node src/serve.js . [port]  (default 8765; each course has its own so both can run at once)
const T={".html":"text/html",".js":"text/javascript",".png":"image/png",".jpg":"image/jpeg",".css":"text/css",".json":"application/json"};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split("?")[0]);if(p.endsWith("/"))p+="index.html";const f=path.join(root,p);
fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end("nf");}r.writeHead(200,{"Content-Type":T[path.extname(f)]||"application/octet-stream","Cache-Control":"no-store"});r.end(d);});}).listen(port,"127.0.0.1",()=>console.log(`serving ${path.resolve(root)} at http://localhost:${port}/`));
