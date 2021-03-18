const e=["name","type","notnull","dflt_value","pk"],{keys:t}=Object,n=(e,n,c)=>new Promise(((i,u)=>{const m=r(n),p=t(c);e.all(`PRAGMA table_info('${m}')`,((t,n)=>{const{length:f}=n,d=p.map(l,c),h=`tmp_${m}_backup`,E=`CREATE TABLE IF NOT EXISTS '${f?h:m}' (${o(d)})`;f?e.run(E,(t=>{t?u(t):e.all(`PRAGMA table_info('${h}')`,((t,l)=>{if(n.length!==l.length||n.some(a,l)){const t=n.filter(s,l).map((e=>`'${r(e.name)}'`)),a=t.map((e=>`'${m}'.${e}`));e.run(`INSERT INTO '${h}' (${o(t)})\n                      SELECT ${o(a)} FROM '${m}'`,(t=>{t?e.run(`DROP TABLE IF EXISTS '${h}'`,(()=>u(t))):e.run(`DROP TABLE IF EXISTS '${m}'`,(()=>{e.run(`ALTER TABLE '${h}' RENAME TO '${m}'`,i)}))}))}else e.run(`DROP TABLE IF EXISTS '${h}'`,i)}))})):e.run(E,(e=>{e?u(e):i()}))}))})),r=e=>e.replace(/'/g,"''"),o=e=>e.join(", ");function s(e){return-1<this.findIndex((({name:t})=>t===e.name))}function l(e){return`'${r(e)}' ${this[e]}`}function a(t,n){const r=this[n];return e.some((e=>t[e]!==r[e]))}const c=(e,r)=>e(r).then((e=>r.tables?((e,r)=>new Promise(((o,s)=>{const l=[];for(const o of t(r))l.push(n(e,o,r[o]));Promise.all(l).then(o,s)})))((({all:e,query:t})=>({all(t,n){e([t]).then((e=>n(null,e)),n)},run(e,n){t([e]).then((()=>n()),n)}}))(e),r.tables).then((()=>e)):e));const i=new WeakMap,u=(e,...t)=>{const{t:n,v:r}=((e,t)=>{const n=[e[0]],r=[];for(let o=0,s=0,l=0,{length:a}=t;s<a;s++)t[s]instanceof m?n[o]+=t[s].v+e[s+1]:(r[l++]=s,n[++o]=e[s+1]);return{t:n,v:r}})(e,t),o=i.get(e)||i.set(e,{}).get(e);return(o[n]||(o[n]=[n])).concat(r.map((e=>t[e])))};function m(e){this.v=e}const p=(e,t)=>(n,...r)=>new Promise(((o,s)=>{n.some(h)&&s(f(new Error("SQLITE_ERROR: SQL injection hazard")));const[l,...a]=u(n,...r);e[t](l.join("?"),a,((e,t)=>{e?s(e):o(t)}))})),f=e=>(e.code="SQLITE_ERROR",e),d=(e,...t)=>new m(function(e){for(var t=e[0],n=1,r=arguments.length;n<r;n++)t+=arguments[n]+e[n];return t}(e,...t)),h=e=>e.includes("?");function E(e){return{all:p(e,"all"),get:p(e,"get"),query:p(e,"run"),raw:d}}const{assign:g}=Object,w="function"==typeof importScripts,T=w?".":import.meta.url.replace(/\/[^/]*$/,""),b=e=>new Promise(((t,n)=>{const r=()=>{const e=self.module.exports;delete self.exports,self.module=void 0,t(e)};if(self.exports={},self.module={exports:exports},w)importScripts(e),r();else{const{head:t}=document;g(t.appendChild(document.createElement("script")),{onload(){t.removeChild(this),r()},onerror:n,src:e})}})),S=(e,t=1)=>new Promise(((n,r)=>{g(indexedDB.open(e,t),{onupgradeneeded({target:{result:e,transaction:t}}){e.objectStoreNames.contains("sqlite")||e.createObjectStore("sqlite").createIndex("buffer","buffer",{unique:!0}),g(t,{oncomplete(){n(e)}})},onsuccess({target:{result:e}}){n(e)},onerror:r})})),$=(e={})=>new Promise(((t,n)=>{const r=e.dist||T;b(r+"/sql-wasm.js").then((({default:o})=>{Promise.all([S(e.name||"sqlite-worker"),o({locateFile:e=>r+"/"+e})]).then((([r,{Database:o}])=>{const s=e=>r.transaction(["sqlite"],e).objectStore("sqlite");g(s("readonly").get("buffer"),{onsuccess(){let n=Promise.resolve();const{result:r}=this,l=new o(r||e.database||new Uint8Array(0)),a=()=>{n=n.then((()=>new Promise(((t,n)=>{const r=l.export();g(s("readwrite").put(r,"buffer").transaction,{oncomplete(){t(),e.update&&e.update(r)},onabort:n,onerror:n})}))))};r||a();const{all:c,get:i,query:u,raw:m}=E({all(e,t,n){try{const r=l.exec(e,t),o=[];r.forEach(R,o),n(null,o)}catch(e){n(e)}},get(e,t,n){try{const r=l.exec(e+" LIMIT 1",t),o=[];r.forEach(R,o),n(null,o.shift()||null)}catch(e){n(e)}},run(e,t,n){try{n(null,l.run(e,t))}catch(e){n(e)}}});let p=0;t({all:c,get:i,raw:m,query(t){return/\b(?:INSERT|DELETE|UPDATE)\b/i.test(t[0])&&(clearTimeout(p),p=setTimeout(a,e.timeout||250)),u.apply(this,arguments)}})},onerror:n})}),n)}))}));function R({columns:e,values:t}){for(let{length:n}=t,r=0;r<n;r++){const n=t[r],o={};for(let{length:t}=e,r=0;r<t;r++)o[e[r]]=n[r];this.push(o)}}const y=(e={})=>c($,e),I=new Map;let P=0;function j(e={}){const{credentials:t}=e,n=e.dist||T,r=e.worker||n+"/worker.js",o=e=>(t,...n)=>s(e,{template:t,values:n}),s=(e,t)=>new Promise(((n,r)=>{const o=P++;I.set(o,{resolve:n,reject:r}),l.postMessage({id:o,action:e,options:t})})),l=g(new Worker(/^(?:\.|\/)/.test(r)?r:(e=>URL.createObjectURL(new Blob([`importScripts('${e}')`],{type:"text/javascript"})))(r),{credentials:t}),{onmessage({data:{id:e,result:t,error:n}}){const{resolve:r,reject:o}=I.get(e);I.delete(e),n?o(n):r(t)}});return s("init",g({dist:n,library:n+"/init.js"},e)).then((()=>({all:o("all"),get:o("get"),query:o("query")})))}function L(e={}){return c(j,e)}export{L as SQLiteWorker,y as init};
