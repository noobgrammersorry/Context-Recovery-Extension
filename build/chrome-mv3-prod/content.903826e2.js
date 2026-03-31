var e,t;"function"==typeof(e=globalThis.define)&&(t=e,e=null),function(t,n,o,r,i){var s="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},a="function"==typeof s[r]&&s[r],d=a.cache||{},l="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function c(e,n){if(!d[e]){if(!t[e]){var o="function"==typeof s[r]&&s[r];if(!n&&o)return o(e,!0);if(a)return a(e,!0);if(l&&"string"==typeof e)return l(e);var i=Error("Cannot find module '"+e+"'");throw i.code="MODULE_NOT_FOUND",i}f.resolve=function(n){var o=t[e][1][n];return null!=o?o:n},f.cache={};var u=d[e]=new c.Module(e);t[e][0].call(u.exports,f,u,u.exports,this)}return d[e].exports;function f(e){var t=f.resolve(e);return!1===t?{}:c(t)}}c.isParcelRequire=!0,c.Module=function(e){this.id=e,this.bundle=c,this.exports={}},c.modules=t,c.cache=d,c.parent=a,c.register=function(e,n){t[e]=[function(e,t){t.exports=n},{}]},Object.defineProperty(c,"root",{get:function(){return s[r]}}),s[r]=c;for(var u=0;u<n.length;u++)c(n[u]);if(o){var f=c(o);"object"==typeof exports&&"undefined"!=typeof module?module.exports=f:"function"==typeof e&&e.amd?e(function(){return f}):i&&(this[i]=f)}}({"68oK5":[function(e,t,n){var o=e("~src/content/formSignals");let r=!1;function i(e,t=!1){}(0,o.monitorFormChanges)(e=>{e.changedFieldCount>0&&!r&&(r=!0,chrome.runtime.sendMessage({type:"FORM_TOUCHED",url:window.location.href,snapshot:e}).catch(()=>{}))}),window.addEventListener("beforeunload",()=>{let e=(0,o.readFormSignals)();e.touched&&e.changedFieldCount>0&&chrome.runtime.sendMessage({type:"UNFINISHED_FORM_DETECTED",url:window.location.href,snapshot:e}).catch(()=>{})}),chrome.runtime.onMessage.addListener((e,t)=>{t.id===chrome.runtime.id&&"NOTIFY_INTERRUPTION"===e.type&&e.task&&(e.task.taskLabel,function(e){let t=document.getElementById("context-recovery-notification");t&&t.remove();let n=document.createElement("div");if(n.id="context-recovery-notification",n.style.cssText=`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 380px;
    max-width: calc(100vw - 40px);
    border-radius: 8px;
    border-left: 4px solid #f59e0b;
    background: white;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    animation: slideIn 0.3s ease-out;
  `,n.innerHTML=`
    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
        <div>
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #1f2937;">
            You have unfinished work
          </h3>
        </div>
        <button id="cr-close-btn" style="
          background: none;
          border: none;
          color: #9ca3af;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        " title="Dismiss">
          \u2715
        </button>
      </div>
      <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.4;">
        ${function(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}(e.taskLabel)}
      </p>
      <div style="display: flex; gap: 8px;">
        <button id="cr-open-btn" style="
          flex: 1;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        ">
          Open Dashboard
        </button>
        <button id="cr-dismiss-btn" style="
          padding: 8px 12px;
          background: #e5e7eb;
          color: #374151;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        ">
          Dismiss
        </button>
      </div>
    </div>
  `,!document.getElementById("cr-animation-styles")){let e=document.createElement("style");e.id="cr-animation-styles",e.textContent=`
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      @keyframes slideOut {
        from {
          opacity: 1;
          transform: translateY(0);
        }
        to {
          opacity: 0;
          transform: translateY(20px);
        }
      }
      #context-recovery-notification.closing {
        animation: slideOut 0.3s ease-out;
      }
    `,document.head.appendChild(e)}document.body.appendChild(n);let o=n.querySelector("#cr-close-btn"),r=n.querySelector("#cr-open-btn"),s=n.querySelector("#cr-dismiss-btn"),a=setTimeout(()=>d(),8e3),d=()=>{clearTimeout(a),n.classList.add("closing"),setTimeout(()=>{n.parentNode&&n.remove()},300)};o?.addEventListener("click",d),s?.addEventListener("click",d),r?.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_SIDEPANEL"}).then(()=>i("Sidepanel open request sent")).catch(()=>i("Sidepanel open request failed",!0)),d()})}(e.task))})},{"~src/content/formSignals":"ci4xT"}],ci4xT:[function(e,t,n){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(n),o.export(n,"readFormSignals",()=>i),o.export(n,"monitorFormChanges",()=>s);let r=new WeakMap;function i(){let e=document.querySelectorAll("input[type='text'], input[type='email'], input[type='password'], textarea, select"),t=0,n=!1;return e.forEach(e=>{let o=e.value||"",i=r.get(e);void 0===i?r.set(e,o):o!==i&&(t+=1,n=!0)}),{touched:n,hasInput:e.length>0,fieldCount:e.length,changedFieldCount:t}}function s(e){let t=()=>{let t=i();t.touched&&e(t)};return document.addEventListener("input",t),document.addEventListener("change",t),()=>{document.removeEventListener("input",t),document.removeEventListener("change",t)}}},{"@parcel/transformer-js/src/esmodule-helpers.js":"fRZO2"}],fRZO2:[function(e,t,n){n.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},n.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.exportAll=function(e,t){return Object.keys(e).forEach(function(n){"default"===n||"__esModule"===n||t.hasOwnProperty(n)||Object.defineProperty(t,n,{enumerable:!0,get:function(){return e[n]}})}),t},n.export=function(e,t,n){Object.defineProperty(e,t,{enumerable:!0,get:n})}},{}]},["68oK5"],"68oK5","parcelRequire464e"),globalThis.define=t;