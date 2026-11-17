const http=require("http"),fs=require("fs"),path=require("path");const root=process.argv[2];
const T={".html":"text/html",".js":"text/javascript",".png":"image/png",".jpg":"image/jpeg",".css":"text/css",".json":"application/json"};
http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split("?")[0]);if(p.endsWith("/"))p+="index.html";const f=path.join(root,p);
fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);return r.end("nf");}r.writeHead(200,{"Content-Type":T[path.extname(f)]||"application/octet-stream","Cache-Control":"no-store"});r.end(d);});}).listen(8765,"127.0.0.1",()=>console.log("up"));
