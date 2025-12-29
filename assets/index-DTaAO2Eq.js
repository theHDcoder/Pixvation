(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))s(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const c of n.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&s(c)}).observe(document,{childList:!0,subtree:!0});function o(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(r){if(r.ep)return;r.ep=!0;const n=o(r);fetch(r.href,n)}})();class F{constructor(){this.isInitialized=!0}async fetchProducts(e,o="Sheet1"){const s=o.includes("!")?o.split("!")[0]:"Sheet1",r=`https://docs.google.com/spreadsheets/d/${e}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(s)}`;try{console.log(`Fetching products from spreadsheet: ${e}, sheet: ${s}`);const n=await fetch(r);if(!n.ok)throw new Error(`Failed to fetch sheet data: ${n.statusText}. Ensure the sheet is shared as "Anyone with the link can view".`);const c=await n.text(),h=this.parseCSV(c);if(!h||h.length<=1)return console.warn("No data found in the sheet (only header or empty)"),[];const f=h.slice(1).map((u,p)=>{if(u.length<5)return console.warn(`Skipping incomplete row ${p+2}: ${u.length} columns found, expected 5`),null;const[W,y,E,P,A]=u;if(!y||y.trim()==="")return console.warn(`Skipping row ${p+2}: missing product name`),null;const t=P?P.split(",").map(d=>d.trim()).filter(d=>d):[],a=A?A.split(",").map(d=>d.trim()).filter(d=>d):[];return{id:parseInt(W)||p+1,name:y.trim(),description:(E||"").trim(),images:t,videos:a,primaryImage:t.length>0?t[0]:null,hasVideo:a.length>0}}).filter(u=>u!==null);return console.log(`Fetched ${f.length} products from sheet`),f}catch(n){throw console.error("Error fetching products from Google Sheets:",n),n}}parseCSV(e){const o=[];let s=[],r="",n=!1,c=0;for(;c<e.length;){const h=e[c];h==='"'?n&&e[c+1]==='"'?(r+='"',c++):n=!n:h===","&&!n?(s.push(r),r=""):(h===`
`||h==="\r")&&!n?(h==="\r"&&e[c+1]===`
`&&c++,s.push(r),s.length>0&&o.push(s),s=[],r=""):r+=h,c++}return s.push(r),s.length>0&&o.push(s),o}async getProducts(e,o="Sheet1!A:E",s=0){const r=`products_${e}_${o}`,n=this.getCachedData(r);if(n&&Date.now()-n.timestamp<s)return console.log("Returning cached product data"),n.data;const c=await this.fetchProducts(e,o);return this.setCachedData(r,c),c}getCachedData(e){try{const o=localStorage.getItem(e);return o?JSON.parse(o):null}catch(o){return console.warn("Error reading from cache:",o),null}}setCachedData(e,o){try{const s={data:o,timestamp:Date.now()};localStorage.setItem(e,JSON.stringify(s))}catch(s){console.warn("Error writing to cache:",s)}}clearCache(){try{Object.keys(localStorage).forEach(o=>{o.startsWith("products_")&&localStorage.removeItem(o)}),console.log("Cache cleared")}catch(e){console.warn("Error clearing cache:",e)}}}const $=new F;class O{constructor(){this.resources=new Map,this.loadedCount=0,this.totalCount=0,this.progressCallbacks=[],this.onCompleteCallbacks=[],this.isComplete=!1}addResource(e,o="auto",s="normal"){this.resources.has(e)||(this.resources.set(e,{url:e,type:o,priority:s,loaded:!1,error:!1,startTime:null,endTime:null}),this.totalCount++)}async startLoading(){console.log("[LoadingManager] Starting preload of",this.totalCount,"resources");const e=Array.from(this.resources.values()).sort((r,n)=>{const c={critical:0,high:1,normal:2,low:3};return c[r.priority]-c[n.priority]}),o=e.filter(r=>r.priority==="critical"),s=e.filter(r=>r.priority!=="critical");return await this.loadBatch(o),this.loadBatch(s),this.waitForCompletion()}async loadBatch(e){const o=e.map(s=>this.loadResource(s));await Promise.allSettled(o)}async loadResource(e){if(!e.loaded){e.startTime=performance.now();try{const o=await this.fetchWithCache(e.url,e.type);if(o.ok)e.loaded=!0,e.endTime=performance.now(),this.loadedCount++,this.updateProgress(),console.log(`[LoadingManager] Loaded: ${e.url} (${this.loadedCount}/${this.totalCount})`);else throw new Error(`HTTP ${o.status}`)}catch(o){console.warn(`[LoadingManager] Failed to load: ${e.url}`,o),e.error=!0,e.endTime=performance.now(),this.loadedCount++,this.updateProgress()}}}async fetchWithCache(e,o){if("caches"in window){const n=await(await caches.open("pixvation-static-v1.0.0")).match(e);if(n)return n}const s=await fetch(e,{mode:"cors",credentials:"same-origin"});return"caches"in window&&s.ok&&(await caches.open("pixvation-static-v1.0.0")).put(e,s.clone()),s}updateProgress(){const e=this.loadedCount/this.totalCount;this.progressCallbacks.forEach(o=>o(e,this.loadedCount,this.totalCount)),this.loadedCount>=this.totalCount&&!this.isComplete&&(this.isComplete=!0,this.onCompleteCallbacks.forEach(o=>o()))}waitForCompletion(){return new Promise(e=>{this.isComplete?e():this.onCompleteCallbacks.push(e)})}onProgress(e){this.progressCallbacks.push(e)}onComplete(e){this.onCompleteCallbacks.push(e)}getStats(){const e=Array.from(this.resources.values());return{total:this.totalCount,loaded:this.loadedCount,failed:e.filter(o=>o.error).length,averageLoadTime:e.filter(o=>o.loaded&&o.endTime&&o.startTime).reduce((o,s)=>o+(s.endTime-s.startTime),0)/e.filter(o=>o.loaded).length||0}}}window.loadingManager=new O;window.enhancedLoading={init(){this.setupResourcePreloading(),this.setupProgressTracking(),this.setupServiceWorkerIntegration()},setupResourcePreloading(){const i=["/src/css/styles.css","/src/main.js","/src/navbar.js","/pixvation_logo.png","/selected_1.mp4"],e=["/src/hoverbgeffec.js","/PixelGame.otf","/Pixel Game Extrude.otf","https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js","https://unpkg.com/cursor-effects@latest/dist/browser.js"],o=["/photobooths.mp4","/aiservice.mp4","/arvrxr.mp4","/iotservice.mp4","/appservice.mp4","/otherservice.mp4"];[...i,...e,...o].forEach(s=>{const r=i.includes(s)?"critical":e.includes(s)?"high":"normal";window.loadingManager.addResource(s,this.getResourceType(s),r)})},getResourceType(i){return i.endsWith(".css")?"style":i.endsWith(".js")?"script":i.endsWith(".mp4")||i.endsWith(".webm")?"video":i.endsWith(".otf")||i.endsWith(".ttf")?"font":i.endsWith(".png")||i.endsWith(".jpg")||i.endsWith(".svg")?"image":"auto"},setupProgressTracking(){const i=document.querySelector(".progress-bar"),e=document.querySelector(".loading-text p");window.loadingManager.onProgress((o,s,r)=>{if(i&&(i.style.width=`${o*100}%`),e){const n=Math.round(o*100);e.textContent=`Loading innovative solutions... ${n}%`}}),window.loadingManager.onComplete(()=>{console.log("[EnhancedLoading] All resources loaded!"),this.hideLoadingScreen()})},setupServiceWorkerIntegration(){"serviceWorker"in navigator&&navigator.serviceWorker.addEventListener("message",i=>{i.data&&i.data.type==="CACHE_COMPLETE"&&console.log("[SW] Cache operation completed")})},async hideLoadingScreen(){const i=document.getElementById("loading-screen"),e=document.body;setTimeout(()=>{i&&i.classList.add("hidden"),e.classList.remove("loading"),window.dispatchEvent(new CustomEvent("loadingComplete"))},500)},setupLazyVideoLoading(){document.querySelectorAll(".lazy-video").forEach(e=>{const o=new IntersectionObserver(s=>{s.forEach(r=>{r.isIntersecting&&(this.loadVideo(e),o.unobserve(e))})},{rootMargin:"50px 0px",threshold:.1});o.observe(e)})},async loadVideo(i){const e=i.dataset.src;if(e)try{const o=i.querySelector("source");o&&(o.src=e,i.load()),await new Promise((s,r)=>{i.addEventListener("loadeddata",s,{once:!0}),i.addEventListener("error",r,{once:!0}),setTimeout(s,5e3)}),i.classList.add("loaded"),console.log(`[LazyLoading] Video loaded: ${e}`)}catch(o){console.warn(`[LazyLoading] Failed to load video: ${e}`,o),i.classList.add("loaded")}},async start(){try{await window.loadingManager.startLoading()}catch(i){console.error("[EnhancedLoading] Loading failed:",i),this.hideLoadingScreen()}this.setupLazyVideoLoading()}};window.performanceData={startTime:performance.now(),loadingCompleteTime:null,resourcesLoaded:0,totalResources:0,cacheHits:0,networkRequests:0};const z=()=>{var i;console.log("[Performance] Initializing app at",performance.now()-(((i=window.performanceData)==null?void 0:i.startTime)||0),"ms"),window.enhancedLoading.init(),setTimeout(()=>{window.enhancedLoading.start()},100)};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",z):z();window.addEventListener("loadingComplete",()=>{window.performanceData.loadingCompleteTime=performance.now();const i=window.performanceData.loadingCompleteTime-window.performanceData.startTime;console.log("[Performance] Loading complete in",i.toFixed(2),"ms"),console.log("[Performance] Stats:",window.loadingManager.getStats()),localStorage.setItem("lastLoadTime",i.toString()),localStorage.setItem("lastLoadDate",new Date().toISOString())});const D={spreadsheetId:"1Bs4C63d8sDvO53Rbyoo7dQf8Wx0XAcVeA0oBoxvMAtE",range:"Sheet1!A:E",containerSelector:".products-container"},N={Photobooths:{title:"AI-Powered Photobooths",description:`Transform your events with our cutting-edge AI photobooth solutions that create unforgettable experiences.

🎯 Event Engagement Solutions:
• Interactive AI photo effects and filters
• Real-time background removal and green screen
• Face recognition and emotion detection
• Custom branded overlays and frames
• Social media integration for instant sharing

🎪 Perfect for:
• Corporate events and conferences
• Weddings and celebrations
• Trade shows and exhibitions
• Birthday parties and gatherings
• Holiday events and festivals

💫 Why Choose Our Photobooths?
• Instant photo delivery via email/SMS
• Customizable templates and branding
• Professional photo quality
• Touch-free operation for hygiene
• Analytics and engagement tracking

Make your event memorable with interactive, fun, and engaging photobooth experiences!`},"AI Projects":{title:"Custom AI Solutions",description:`Harness the power of artificial intelligence to revolutionize your business processes and customer experiences.

🤖 AI Solutions We Develop:
• Intelligent chatbots and virtual assistants
• Computer vision and image recognition systems
• Natural language processing applications
• Machine learning predictive analytics
• Automated workflow optimization

🚀 Industry Applications:
• Customer service automation
• Quality control and inspection
• Document processing and analysis
• Personalization and recommendation engines
• Fraud detection and security

💡 Innovation Areas:
• AI-powered gaming experiences
• Smart home automation
• Healthcare diagnostics assistance
• Educational personalized learning
• Retail customer behavior analysis

Transform your business with intelligent solutions that learn, adapt, and deliver results!`},"VR/AR/XR Development":{title:"Immersive VR/AR/XR Experiences",description:`Step into the future with our immersive extended reality solutions that blur the lines between digital and physical worlds.

🌟 VR/AR/XR Solutions:
• Virtual reality training simulations
• Augmented reality product visualization
• Mixed reality collaborative workspaces
• 360° virtual tours and experiences
• Interactive product configurators

🎯 Perfect Applications:
• Employee training and onboarding
• Real estate virtual tours
• Product demonstrations and showcases
• Educational interactive lessons
• Therapeutic and rehabilitation programs

🛠️ Our Expertise:
• Unity3D and Unreal Engine development
• Mobile AR (ARKit/ARCore)
• WebXR for browser-based experiences
• Custom hardware integration
• Multi-user collaborative environments

Create mind-blowing immersive experiences that captivate and engage your audience!`},"IOT Projects":{title:"Smart IoT Solutions",description:`Connect the physical and digital worlds with our comprehensive Internet of Things development services.

📡 IoT Solutions We Build:
• Smart home automation systems
• Industrial IoT monitoring platforms
• Wearable device applications
• Sensor network deployments
• Connected device management systems

🏭 Industry Applications:
• Manufacturing process optimization
• Agriculture smart farming
• Healthcare remote monitoring
• Smart city infrastructure
• Energy management systems

🔧 Technical Capabilities:
• Embedded systems programming
• Wireless communication protocols
• Cloud platform integration
• Real-time data analytics
• Mobile and web dashboards

Transform traditional operations into intelligent, connected ecosystems!`},"APP/Web Development":{title:"Full-Stack Application Development",description:`Build powerful, scalable, and user-friendly applications that drive your business forward with modern development practices.

💻 Development Services:
• Progressive Web Applications (PWAs)
• Native mobile applications
• Responsive web platforms
• E-commerce solutions
• Enterprise management systems

🎨 Technology Stack:
• Frontend: React, Vue.js, Angular
• Backend: Node.js, Python, PHP, .NET
• Mobile: React Native, Flutter
• Database: PostgreSQL, MongoDB, MySQL
• Cloud: AWS, Azure, Google Cloud

🚀 Key Features We Deliver:
• Scalable architecture design
• Real-time features and notifications
• Third-party integrations
• Performance optimization
• Security and compliance

Create digital experiences that users love and businesses rely on!`},Others:{title:"Custom Technology Solutions",description:`Looking for something unique? We specialize in custom technology solutions tailored to your specific needs.

🔧 Specialized Services:
• Legacy system modernization
• API development and integration
• Data migration and transformation
• Custom hardware-software integration
• Process automation solutions

📊 Data & Analytics:
• Business intelligence dashboards
• Real-time reporting systems
• Predictive analytics models
• Data visualization platforms
• ETL pipeline development

🎯 Consulting Services:
• Technology strategy planning
• Digital transformation guidance
• System architecture design
• Performance optimization
• Security audits and recommendations

Whatever your technological challenge, we have the expertise to solve it!`}};document.addEventListener("DOMContentLoaded",()=>{async function i(){const t=document.querySelector("#productsGrid");if(!t){console.warn("Products grid element not found: #productsGrid");return}t.innerHTML='<div class="loading">Loading products...</div>',t.classList.add("loading");try{!D.spreadsheetId||D.spreadsheetId;const a=await $.getProducts(D.spreadsheetId,D.range,5*60*1e3);s(a),typeof initializePagination=="function"&&(initializePagination(),showPage(1,!1))}catch(a){console.error("Failed to load products:",a),t.innerHTML=`<div class="error">Failed to load products: ${a.message}</div>`}finally{t.classList.remove("loading")}}function e(t){if(!t)return"";if(typeof t!="string")return t;if(t.includes("drive.google.com")){const a=t.match(/[-\w]{25,}/);if(a)return`https://drive.google.com/thumbnail?id=${a[0]}&sz=w1000`}return t}function o(t){if(!t)return"";if(typeof t!="string")return t;if(t.includes("drive.google.com")){const a=t.match(/[-\w]{25,}/);if(a)return`https://drive.google.com/file/d/${a[0]}/preview`}if(t.includes("youtube.com")||t.includes("youtu.be")){let a="";if(t.includes("youtube.com/watch?v=")?a=t.split("v=")[1].split("&")[0]:t.includes("youtu.be/")?a=t.split("youtu.be/")[1].split("?")[0]:t.includes("youtube.com/embed/")&&(a=t.split("embed/")[1].split("?")[0]),a)return`https://www.youtube.com/embed/${a}?autoplay=1&mute=1&loop=1&playlist=${a}&enablejsapi=1&origin=${window.location.origin}`}return t}function s(t){const a=document.querySelector("#productsGrid");if(!a){console.warn("Products grid element not found: #productsGrid");return}if(a.innerHTML="",!t||t.length===0){a.innerHTML='<div class="no-products">No products found</div>';return}t.forEach(d=>{const g=r(d);a.appendChild(g)}),console.log(`Rendered ${t.length} product cards`)}function r(t){const a=document.createElement("div");if(a.className="card",a.setAttribute("data-product-id",t.id),a.setAttribute("data-images",JSON.stringify(t.images)),a.setAttribute("data-videos",JSON.stringify(t.videos)),a.innerHTML=`
      <div class="card-inner">
        <div class="card-front">
          <h3 class="card-title">${t.name}</h3>
        </div>
        <div class="card-back border-less">
          <div class="card-image-container slideshow-container full-screen">
            ${t.images.map((d,g)=>`<img src="${e(d)}" alt="${t.name}" referrerpolicy="no-referrer" class="card-image slideshow-image ${g===0?"active":""}" />`).join("")||'<div class="no-image">No Image</div>'}
          </div>
          <div class="card-content-overlay">
            <h3 class="card-title">${t.name}</h3>
            <p class="click-details">Click here to see details</p>
          </div>
        </div>
      </div>
    `,t.images.length>1){let d,g=0;const w=a.querySelectorAll(".slideshow-image");a.addEventListener("mouseenter",()=>{d=setInterval(()=>{w[g].classList.remove("active"),g=(g+1)%w.length,w[g].classList.add("active")},1500)}),a.addEventListener("mouseleave",()=>{clearInterval(d),w.forEach(C=>C.classList.remove("active")),w[0].classList.add("active"),g=0})}return a.style.cursor="pointer",a.addEventListener("click",()=>{E({title:t.name,desc:t.description,images:t.images,videos:t.videos})}),a}i(),window.clearProductCache=()=>{$.clearCache(),console.log("Product cache cleared. Reloading..."),i()},window.addEventListener("beforeunload",()=>{"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"CLEAR_TEMP_CACHE"})}),window.clearAllTempCaches=()=>{"serviceWorker"in navigator&&navigator.serviceWorker.controller&&navigator.serviceWorker.controller.postMessage({type:"CLEAR_TEMP_CACHE"}),$.clearCache(),console.log("All temporary caches cleared")};const n=document.createElement("div");n.className="pv-modal",n.setAttribute("aria-hidden","true"),n.innerHTML=`
      <div class="pv-modal-overlay"></div>
      <div class="pv-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pv-modal-title">
        <button class="pv-modal-close" type="button" aria-label="Close">×</button>
        <div class="pv-modal-body">
          <div class="pv-modal-left">
            <img src="" alt="" />
          </div>
          <div class="pv-modal-right">
            <h3 id="pv-modal-title"></h3>
            <p class="pv-modal-desc"></p>
          </div>
        </div>
      </div>
    `,document.body.appendChild(n);const c=n.querySelector(".pv-modal-overlay"),h=n.querySelector(".pv-modal-close"),f=n.querySelector(".pv-modal-left"),u=n.querySelector(".pv-modal-left img"),p=n.querySelector("#pv-modal-title"),W=n.querySelector(".pv-modal-desc");let y=null;function E({title:t,desc:a,images:d=[],videos:g=[],isService:w=!1}){p.textContent=t||"Details",W.textContent=a||"",w?n.classList.add("service-modal"):n.classList.remove("service-modal"),y&&(clearInterval(y),y=null);const C=f.querySelector("iframe"),q=f.querySelector("video");C&&C.remove(),q&&q.remove();const R=g&&g.length>0,T=d&&d.length>0;if(R){u.style.display="none",n.classList.add("has-video");const m=g[0];console.log("Processing video URL:",m);const k=m.match(/\.(mp4|webm|ogg|mov|avi)$/)||m.includes("firebasestorage")||m.startsWith("./")||m.startsWith("../")||!m.includes("youtube.com")&&!m.includes("youtu.be")&&!m.includes("drive.google.com")&&!m.includes("vimeo.com");if(console.log("Is direct video:",k),k){console.log("Creating direct video element for:",m);let b=m;(m.startsWith("./")||m.startsWith("../")||!m.startsWith("http"))&&(b=new URL(m,window.location.origin).href);const l=document.createElement("video");l.src=b,l.autoplay=!0,l.muted=!0,l.loop=!0,l.controls=!0,l.className="pv-modal-video",l.preload="auto",l.playsInline=!0,console.log("Video element created with src:",b),l.addEventListener("error",S=>{console.warn("Video failed to load:",b,S),T&&(l.remove(),P(d))}),l.addEventListener("loadstart",()=>console.log("Video load started")),l.addEventListener("loadeddata",()=>console.log("Video data loaded")),l.addEventListener("canplay",()=>console.log("Video can play")),f.appendChild(l),setTimeout(()=>{if(console.log("Attempting to play video, readyState:",l.readyState),l.readyState>=1){const S=l.play();S!==void 0&&S.then(()=>{console.log("Video started playing successfully")}).catch(M=>{console.warn("Video autoplay failed, trying fallback:",M);const L=()=>{l.play().then(()=>console.log("Fallback play successful")).catch(v=>console.warn("Fallback play failed:",v)),document.removeEventListener("click",L),document.removeEventListener("touchstart",L)};document.addEventListener("click",L),document.addEventListener("touchstart",L)})}else l.addEventListener("canplay",()=>{console.log("Video canplay event fired, attempting play"),l.play().then(()=>console.log("Delayed play successful")).catch(S=>{console.warn("Delayed video play failed:",S)})},{once:!0})},200)}else{const b=o(m),l=document.createElement("iframe");l.src=b,l.setAttribute("allow","autoplay; encrypted-media; fullscreen"),l.setAttribute("allowfullscreen","true"),l.className="pv-modal-iframe",f.appendChild(l)}}else T?(n.classList.remove("has-video"),P(d)):(u.style.display="none",n.classList.remove("has-video"));const I=n.querySelector(".pv-modal-dialog");I&&(I.scrollTop=0),n.classList.add("open"),document.body.style.overflow="hidden",n.setAttribute("aria-hidden","false")}function P(t){if(!t||t.length===0)return;let a=0;u.src=e(t[0]),u.alt=p.textContent||"Image",u.style.display="block",u.setAttribute("referrerpolicy","no-referrer"),t.length>1&&(y=setInterval(()=>{a=(a+1)%t.length,u.src=e(t[a])},3e3))}function A(){n.classList.remove("open"),n.classList.remove("has-video"),n.classList.remove("service-modal"),document.body.style.overflow="",n.setAttribute("aria-hidden","true"),y&&(clearInterval(y),y=null);const t=f.querySelector("iframe"),a=f.querySelector("video");t&&t.remove(),a&&a.remove()}c.addEventListener("click",A),h.addEventListener("click",A),document.addEventListener("keydown",t=>{t.key==="Escape"&&A()}),document.querySelectorAll(".card").forEach(t=>{t.dataset.productId||(t.style.cursor="pointer",t.addEventListener("click",a=>{var R,T,I,m,k,b,l,S,M,L;const d=((T=(R=t.querySelector(".card-front .card-title"))==null?void 0:R.textContent)==null?void 0:T.trim())||((m=(I=t.querySelector(".card-back .card-title"))==null?void 0:I.textContent)==null?void 0:m.trim())||"Details",g=((b=(k=t.querySelector(".card-front .card-description"))==null?void 0:k.textContent)==null?void 0:b.trim())||"",w=((S=(l=t.querySelector(".card-back .card-content p"))==null?void 0:l.textContent)==null?void 0:S.trim())||((L=(M=t.querySelector(".card-back p"))==null?void 0:M.textContent)==null?void 0:L.trim())||"",C=[g,w].filter(v=>v&&v!=="Click here to see details").join(" — ");if(t.dataset.service==="true"){const v=N[d],x=v?v.title:d,V=v?v.description:C;E({title:x,desc:V,isService:!0})}else{const v=t.dataset.videoSrc;if(v)E({title:d,desc:C,videos:[v]});else{const x=t.querySelector(".card-back .card-image"),V=(x==null?void 0:x.getAttribute("src"))||"";E({title:d,desc:C,images:[V]})}}}))})});const B="https://script.google.com/macros/s/AKfycbzaVAkvrq4oGdV5fEZ2pzlZizk-Ml_ru5B2zrFtj_Ttu7iUbNAC8_Ra4WglXz-CMG7c/exec";document.addEventListener("DOMContentLoaded",()=>{const i=document.getElementById("contactForm"),e=document.getElementById("formStatus");i&&i.addEventListener("submit",function(o){o.preventDefault();const s=i.querySelector(".send"),r=s.textContent;s.textContent="Sending...",s.disabled=!0,e.classList.remove("show","success","error");const n={name:document.getElementById("name").value,phone:document.getElementById("phone").value,email:document.getElementById("email").value,query:document.getElementById("query").value};fetch(B,{method:"POST",body:JSON.stringify(n)}).then(c=>{if(!c.ok)throw new Error("Network response was not ok");return c.json()}).then(c=>{if(c.status==="success")e.innerText="Thank you! We will get back to you soon.",e.classList.add("show","success"),i.reset();else throw new Error(c.message||"Unknown error occurred")}).catch(c=>{console.error("Form submission error:",c),e.innerText="Something went wrong. Please try again.",e.classList.add("show","error")}).finally(()=>{s.textContent=r,s.disabled=!1})})});document.body.classList.add("loading");document.addEventListener("DOMContentLoaded",function(){const i=document.getElementById("loading-screen"),e=document.querySelector(".progress-bar");if(!i)return;function o(n){e&&(e.style.width=n+"%")}function s(){setTimeout(()=>{i.classList.add("hidden"),document.body.classList.remove("loading"),setTimeout(()=>{i.style.display="none",window.fluidAnimation&&window.fluidAnimation.start()},800)},500)}function r(){const n=document.querySelectorAll("img"),c=document.querySelectorAll("video"),h=n.length+c.length;let f=0;if(h===0){o(100),s();return}function u(){f++;const p=f/h*100;o(p),f>=h&&(o(100),s())}n.forEach(p=>{p.complete?u():(p.addEventListener("load",u),p.addEventListener("error",u))}),c.forEach(p=>{p.readyState>=1?u():(p.addEventListener("loadedmetadata",u),p.addEventListener("error",u))})}setTimeout(()=>{r()},100),setTimeout(()=>{i.classList.contains("hidden")||(o(100),s())},1e4)});new cursoreffects.characterCursor({element:document.querySelector("#character"),characters:["■","■","■","■"],font:"20px monospace",colors:["#30348C","#2D61A6","#F2762E","#D95252"],characterLifeSpanFunction:function(){return Math.floor(Math.random()*40+60)},initialCharacterVelocityFunction:function(){return{x:(Math.random()-.5)*2,y:(Math.random()-.5)*2}},characterVelocityChangeFunctions:{x_func:function(){return(Math.random()-.5)/40},y_func:function(){return(Math.random()-.5)/40}},characterScalingFunction:function(i,e){const o=1-i/e;return Math.max(.6,o*1.5)},characterNewRotationDegreesFunction:function(i,e){return(e-i)*.8}});
