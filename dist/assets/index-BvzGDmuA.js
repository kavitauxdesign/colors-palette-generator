var ir=Object.defineProperty;var lr=(n,e,t)=>e in n?ir(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var F=(n,e,t)=>lr(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))a(o);new MutationObserver(o=>{for(const r of o)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&a(s)}).observe(document,{childList:!0,subtree:!0});function t(o){const r={};return o.integrity&&(r.integrity=o.integrity),o.referrerPolicy&&(r.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?r.credentials="include":o.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(o){if(o.ep)return;o.ep=!0;const r=t(o);fetch(o.href,r)}})();const L={DISALLOWED_COLORS:new Set,HEX_6_REGEX:/^#[0-9A-F]{6}$/,MAX_UNIQUE_COLOR_ATTEMPTS:500,MAX_PALETTE_COLORS:24,DEFAULT_TARGET_COLORS:["#9EBB89","#6EC5CE","#E7AA6E","#B1BDCD","#6BBDB6","#B88965","#DCC9B3","#A8AA98","#6B8F71","#29A9CA","#B86346","#5BAB9C"],CARD_COPY_TOOLTIP_DEFAULT:"Copiar HEX",HISTORY_COPY_TOOLTIP_DEFAULT:"Copiar paleta",ADD_DISABLED_LABEL:"Esperemos, que con 24 colores la paleta esté completa☝️",DEFAULT_PALETTE_SIZE:9,DEFAULT_PALETTE_BASE_MODE:"color",DEFAULT_TEMPERATURE:{warm:!0,cool:!1},DEFAULT_COLOR_BASE:"#9EBB89",DEFAULT_COLOR_PALETTE_TYPE:"monochromatic",DEFAULT_MONOCHROMATIC_GENERATION_MODE:"automatic",DEFAULT_ANALOGOUS_SEPARATION_MODE:"medium",DEFAULT_BRIGHTNESS:65,DEFAULT_SATURATION:100,LOW_SATURATION_FALLBACK_THRESHOLD:15,LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS:30};window.AppConstants=L;const He=new Map;function ja(n,e){var t;return He.has(n)||He.set(n,new Set),(t=He.get(n))==null||t.add(e),()=>{Ua(n,e)}}function Ua(n,e){const t=He.get(n);t&&(t.delete(e),t.size===0&&He.delete(n))}function $a(n,e={}){const t=He.get(n);!t||t.size===0||t.forEach(a=>{try{a(e)}catch(o){console.error(`AppEventBus listener failed for "${n}".`,o)}})}const qa={on:ja,off:Ua,emit:$a};window.AppEventBus=qa;const ht=new Map;function cr(n,e={}){if(!n||typeof n!="string")throw new Error("AppRegistry.register requires a string id.");const t={id:n,...e||{}};return ht.set(n,t),t}function dr(n){return ht.get(n)||null}function ur(){return Array.from(ht.values())}const gt={register:cr,get:dr,list:ur};window.AppRegistry=gt;async function Wa(n){const e=String(n??"");if(navigator.clipboard&&typeof navigator.clipboard.writeText=="function")try{await navigator.clipboard.writeText(e);return}catch{}const t=document.createElement("textarea");t.value=e,t.style.position="fixed",t.style.left="-9999px",t.style.top="0",t.style.opacity="0",document.body.appendChild(t),t.focus(),t.select();const a=document.execCommand("copy");if(t.remove(),!a)throw new Error("Clipboard copy failed")}const Ya={writeText:Wa};window.AppClipboard=Ya;window.copyTextToClipboard=Wa;function We(n,e){let t=n.length,a,o,r=!1,s=!1;Array.isArray(n[0])?a=n:(a=[n],t=a.length,r=!0),Array.isArray(e[0])?o=e:(o=e.length>0?e.map(u=>[u]):[[]],s=!0);let i=o[0].length,l=o[0].map((u,d)=>o.map(m=>m[d])),c=a.map(u=>l.map(d=>{let m=0;if(!Array.isArray(u)){for(let h of d)m+=u*h;return m}for(let h=0;h<u.length;h++)m+=u[h]*(d[h]||0);return m}));return t===1&&r&&(c=c[0]),i===1&&s?t===1&&r?c[0]:c.map(u=>u[0]):c}function kn(n,e){return n[0]*e[0]+n[1]*e[1]+n[2]*e[2]}function R(n,e,t=[0,0,0]){const a=kn(n,e[0]),o=kn(n,e[1]),r=kn(n,e[2]);return t[0]=a,t[1]=o,t[2]=r,t}function Ge(n){return he(n)==="string"}function he(n){return(Object.prototype.toString.call(n).match(/^\[object\s+(.*?)\]$/)[1]||"").toLowerCase()}function ft(n,{precision:e=16,unit:t}){return B(n)?"none":(n=+Ct(n,e),n+(t??""))}function B(n){return n===null}function k(n){return B(n)?0:n}function Ct(n,e){if(n===0)return 0;let t=~~n,a=0;t&&e&&(a=~~Math.log10(Math.abs(t))+1);const o=10**(e-a);return Math.floor(n*o+.5)/o}function en(n,e,t){return isNaN(n)?e:isNaN(e)?n:n+(e-n)*t}function Xa(n,e,t){return(t-n)/(e-n)}function Zn(n,e,t){return!n||!e||n===e||n[0]===e[0]&&n[1]===e[1]||isNaN(t)||t===null?t:en(e[0],e[1],Xa(n[0],n[1],t))}function vn(n,e,t){return Math.max(Math.min(t,e),n)}function Bn(n,e){return Math.sign(n)===Math.sign(e)?n:-n}function z(n,e){return Bn(Math.abs(n)**e,n)}function xt(n,e){return e===0?0:n/e}function Za(n,e,t=0,a=n.length){for(;t<a;){const o=t+a>>1;n[o]<e?t=o+1:a=o}return t}function ze(n,e){var a;if(n instanceof e)return!0;const t=e.name;for(;n;){const o=Object.getPrototypeOf(n),r=(a=o==null?void 0:o.constructor)==null?void 0:a.name;if(r===t)return!0;if(!r||r==="Object")return!1;n=o}return!1}var mr=Object.freeze({__proto__:null,bisectLeft:Za,clamp:vn,copySign:Bn,interpolate:en,interpolateInv:Xa,isInstance:ze,isNone:B,isString:Ge,mapRange:Zn,multiplyMatrices:We,multiply_v3_m3x3:R,serializeNumber:ft,skipNone:k,spow:z,toPrecision:Ct,type:he,zdiv:xt});class pr{add(e,t,a){if(typeof arguments[0]!="string"){for(var e in arguments[0])this.add(e,arguments[0][e],arguments[1]);return}(Array.isArray(e)?e:[e]).forEach(function(o){this[o]=this[o]||[],t&&this[o][a?"unshift":"push"](t)},this)}run(e,t){this[e]=this[e]||[],this[e].forEach(function(a){a.call(t&&t.context?t.context:t,t)})}}const fe=new pr;var Na,Da,_a,Q={gamut_mapping:"css",precision:5,deltaE:"76",verbose:((_a=(Da=(Na=globalThis==null?void 0:globalThis.process)==null?void 0:Na.env)==null?void 0:Da.NODE_ENV)==null?void 0:_a.toLowerCase())!=="test",warn:function(e){var t,a;this.verbose&&((a=(t=globalThis==null?void 0:globalThis.console)==null?void 0:t.warn)==null||a.call(t,e))}};class zt{constructor(e,t){F(this,"type");F(this,"coordMeta");F(this,"coordRange");F(this,"range");if(typeof e=="object"&&(this.coordMeta=e),t&&(this.coordMeta=t,this.coordRange=t.range??t.refRange),typeof e=="string"){let a=e.trim().match(/^(?<type><[a-z]+>)(\[(?<min>-?[.\d]+),\s*(?<max>-?[.\d]+)\])?$/);if(!a)throw new TypeError(`Cannot parse ${e} as a type definition.`);this.type=a.groups.type;let{min:o,max:r}=a.groups;(o||r)&&(this.range=[+o,+r])}}get computedRange(){return this.range?this.range:this.type==="<percentage>"?this.percentageRange():this.type==="<angle>"?[0,360]:null}get unit(){return this.type==="<percentage>"?"%":this.type==="<angle>"?"deg":""}resolve(e){if(this.type==="<angle>")return e;let t=this.computedRange,a=this.coordRange;return this.type==="<percentage>"&&(a??(a=this.percentageRange())),Zn(t,a,e)}serialize(e,t){let a=this.type==="<percentage>"?this.percentageRange(100):this.computedRange,o=this.unit;return e=Zn(this.coordRange,a,e),ft(e,{unit:o,precision:t})}toString(){let e=this.type;if(this.range){let[t="",a=""]=this.range;e+=`[${t},${a}]`}return e}percentageRange(e=1){let t;return this.coordMeta&&this.coordMeta.range||this.coordRange&&this.coordRange[0]>=0?t=[0,1]:t=[-1,1],[t[0]*e,t[1]*e]}static get(e,t){return ze(e,this)?e:new this(e,t)}}const zn=Symbol("instance");class fn{constructor(e,t=e.space){F(this,"type");F(this,"name");F(this,"spaceCoords");F(this,"coords");F(this,"id");F(this,"alpha");e[zn]=this,this.type="function",this.name="color",Object.assign(this,e),this.space=t,this.type!=="custom"&&(this.spaceCoords=Object.values(t.coords),this.coords||(this.coords=this.spaceCoords.map(a=>{let o=["<number>","<percentage>"];return a.type==="angle"&&o.push("<angle>"),o})),this.coords=this.coords.map((a,o)=>{let r=this.spaceCoords[o];return typeof a=="string"&&(a=a.trim().split(/\s*\|\s*/)),a.map(s=>zt.get(s,r))}))}serializeCoords(e,t,a){return a=e.map((o,r)=>zt.get((a==null?void 0:a[r])??this.coords[r][0],this.spaceCoords[r])),e.map((o,r)=>a[r].serialize(o,t))}coerceCoords(e,t){return Object.entries(this.space.coords).map(([a,o],r)=>{let s=e[r];if(B(s)||isNaN(s))return s;let i=t[r],l=this.coords[r].find(c=>c.type==i);if(!l){let c=o.name||a;throw new TypeError(`${i??(s==null?void 0:s.raw)??s} not allowed for ${c} in ${this.name}()`)}return s=l.resolve(s),l.range&&(t[r]=l.toString()),s})}canSerialize(){return this.type==="function"||this.serialize}parse(e){return null}static get(e,...t){return!e||ze(e,this)?e:e[zn]?e[zn]:new fn(e,...t)}}const W={D50:[.3457/.3585,1,(1-.3457-.3585)/.3585],D65:[.3127/.329,1,(1-.3127-.329)/.329]};function Kn(n){return Array.isArray(n)?n:W[n]}function Cn(n,e,t,a={}){if(n=Kn(n),e=Kn(e),!n||!e)throw new TypeError(`Missing white point to convert ${n?"":"from"}${!n&&!e?"/":""}${e?"":"to"}`);if(n===e)return t;let o={W1:n,W2:e,XYZ:t,options:a};if(fe.run("chromatic-adaptation-start",o),o.M||(o.W1===W.D65&&o.W2===W.D50?o.M=[[1.0479297925449969,.022946870601609652,-.05019226628920524],[.02962780877005599,.9904344267538799,-.017073799063418826],[-.009243040646204504,.015055191490298152,.7518742814281371]]:o.W1===W.D50&&o.W2===W.D65&&(o.M=[[.955473421488075,-.02309845494876471,.06325924320057072],[-.0283697093338637,1.0099953980813041,.021041441191917323],[.012314014864481998,-.020507649298898964,1.330365926242124]])),fe.run("chromatic-adaptation-end",o),o.M)return R(o.XYZ,o.M);throw new TypeError("Only Bradford CAT with white points D50 and D65 supported for now.")}function Ka(n,e){var r,s,i;let t={str:(r=String(n))==null?void 0:r.trim(),options:e};if(fe.run("parse-start",t),t.color)return t.color;t.parsed=gr(t.str);let a,o=t.options?t.options.parseMeta??t.options.meta:null;if(t.parsed){let l=t.parsed.name,c,u,d=t.parsed.args,m=d.map((g,f)=>{var C;return(C=t.parsed.argMeta[f])==null?void 0:C.type});if(l==="color"){let g=d.shift();m.shift();let f=g.startsWith("--")?g.substring(2):`--${g}`,C=[g,f];if(c=b.findFormat({name:l,id:C,type:"function"}),!c){let x,P=g in b.registry?g:f;if(P in b.registry){let I=(i=(s=b.registry[P].formats)==null?void 0:s.color)==null?void 0:i.id;I&&(x=`Did you mean ${n.replace("color("+g,"color("+I)}?`)}throw new TypeError(`Cannot parse ${t.str}. `+(x??"Missing a plugin?"))}u=c.space,c.id.startsWith("--")&&!g.startsWith("--")&&Q.warn(`${u.name} is a non-standard space and not currently supported in the CSS spec. Use prefixed color(${c.id}) instead of color(${g}).`),g.startsWith("--")&&!c.id.startsWith("--")&&Q.warn(`${u.name} is a standard space and supported in the CSS spec. Use color(${c.id}) instead of prefixed color(${g}).`)}else c=b.findFormat({name:l,type:"function"}),u=c.space;o&&Object.assign(o,{format:c,formatId:c.name,types:m,commas:t.parsed.commas});let h=1;t.parsed.lastAlpha&&(h=t.parsed.args.pop(),o&&(o.alphaType=m.pop()));let p=c.coords.length;if(d.length!==p)throw new TypeError(`Expected ${p} coordinates for ${u.id} in ${t.str}), got ${d.length}`);d=c.coerceCoords(d,m),a={spaceId:u.id,coords:d,alpha:h}}else e:for(let l of b.all)for(let c in l.formats){let u=l.formats[c];if(u.type!=="custom"||u.test&&!u.test(t.str))continue;let d=l.getFormat(u),m=d.parse(t.str);if(m){o&&Object.assign(o,{format:d,formatId:c}),a=m;break e}}if(!a)throw new TypeError(`Could not parse ${n} as a color. Missing a plugin?`);return a.alpha=B(a.alpha)?a.alpha:a.alpha===void 0?1:vn(0,a.alpha,1),a}const Ja={"%":.01,deg:1,grad:.9,rad:180/Math.PI,turn:360},xn={function:/^([a-z]+)\(((?:calc\(NaN\)|.)+?)\)$/i,number:/^([-+]?(?:[0-9]*\.)?[0-9]+(e[-+]?[0-9]+)?)$/i,unitValue:RegExp(`(${Object.keys(Ja).join("|")})$`),singleArgument:/\/?\s*(none|NaN|calc\(NaN\)|[-+\w.]+(?:%|deg|g?rad|turn)?)/g};function hr(n){var o;let e={},t=(o=n.match(xn.unitValue))==null?void 0:o[0],a=e.raw=n;return t?(e.type=t==="%"?"<percentage>":"<angle>",e.unit=t,e.unitless=Number(a.slice(0,-t.length)),a=e.unitless*Ja[t]):xn.number.test(a)?(a=Number(a),e.type="<number>"):a==="none"?a=null:a==="NaN"||a==="calc(NaN)"?(a=NaN,e.type="<number>"):e.type="<ident>",{value:a,meta:e}}function gr(n){if(!n)return;n=n.trim();let e=n.match(xn.function);if(e){let t=[],a=[],o=!1,r=e[1].toLowerCase(),s=e[2].replace(xn.singleArgument,(i,l)=>{let{value:c,meta:u}=hr(l);return(i.startsWith("/")||r!=="color"&&t.length===3)&&(o=!0),t.push(c),a.push(u),""});return{name:r,args:t,argMeta:a,lastAlpha:o,commas:s.includes(","),rawName:e[1],rawArgs:e[2]}}}function A(n,e){if(Array.isArray(n))return n.map(a=>A(a,e));if(!n)throw new TypeError("Empty color reference");Ge(n)&&(n=Ka(n,e));let t=n.space||n.spaceId;return typeof t=="string"&&(n.space=b.get(t)),n.alpha===void 0&&(n.alpha=1),n}const fr=75e-6,Z=class Z{constructor(e){var o;this.id=e.id,this.name=e.name,this.base=e.base?Z.get(e.base):null,this.aliases=e.aliases,this.base&&(this.fromBase=e.fromBase,this.toBase=e.toBase);let t=e.coords??this.base.coords;for(let r in t)"name"in t[r]||(t[r].name=r);this.coords=t;let a=e.white??this.base.white??"D65";this.white=Kn(a),this.formats=e.formats??{};for(let r in this.formats){let s=this.formats[r];s.type||(s.type="function"),s.name||(s.name=r)}(o=this.formats.color)!=null&&o.id||(this.formats.color={...this.formats.color??{},id:e.cssId||this.id}),e.gamutSpace?this.gamutSpace=e.gamutSpace==="self"?this:Z.get(e.gamutSpace):this.isPolar?this.gamutSpace=this.base:this.gamutSpace=this,this.gamutSpace.isUnbounded&&(this.inGamut=(r,s)=>!0),this.referred=e.referred,Object.defineProperty(this,"path",{value:Cr(this).reverse(),writable:!1,enumerable:!0,configurable:!0}),fe.run("colorspace-init-end",this)}inGamut(e,{epsilon:t=fr}={}){if(!this.equals(this.gamutSpace))return e=this.to(this.gamutSpace,e),this.gamutSpace.inGamut(e,{epsilon:t});let a=Object.values(this.coords);return e.every((o,r)=>{let s=a[r];if(s.type!=="angle"&&s.range){if(B(o))return!0;let[i,l]=s.range;return(i===void 0||o>=i-t)&&(l===void 0||o<=l+t)}return!0})}get isUnbounded(){return Object.values(this.coords).every(e=>!("range"in e))}get cssId(){var e,t;return((t=(e=this.formats)==null?void 0:e.color)==null?void 0:t.id)||this.id}get isPolar(){for(let e in this.coords)if(this.coords[e].type==="angle")return!0;return!1}getFormat(e){if(!e)return null;e==="default"?e=Object.values(this.formats)[0]:typeof e=="string"&&(e=this.formats[e]);let t=fn.get(e,this);return t!==e&&e.name in this.formats&&(this.formats[e.name]=t),t}equals(e){return e?this===e||this.id===e||this.id===e.id:!1}to(e,t){if(arguments.length===1){const i=A(e);[e,t]=[i.space,i.coords]}if(e=Z.get(e),this.equals(e))return t;t=t.map(i=>B(i)?0:i);let a=this.path,o=e.path,r,s;for(let i=0;i<a.length&&a[i].equals(o[i]);i++)r=a[i],s=i;if(!r)throw new Error(`Cannot convert between color spaces ${this} and ${e}: no connection space was found`);for(let i=a.length-1;i>s;i--)t=a[i].toBase(t);for(let i=s+1;i<o.length;i++)t=o[i].fromBase(t);return t}from(e,t){if(arguments.length===1){const a=A(e);[e,t]=[a.space,a.coords]}return e=Z.get(e),e.to(this,t)}toString(){return`${this.name} (${this.id})`}getMinCoords(){let e=[];for(let t in this.coords){let a=this.coords[t],o=a.range||a.refRange;e.push((o==null?void 0:o.min)??0)}return e}static get all(){return[...new Set(Object.values(Z.registry))]}static register(e,t){if(arguments.length===1&&(t=arguments[0],e=t.id),t=this.get(t),this.registry[e]&&this.registry[e]!==t)throw new Error(`Duplicate color space registration: '${e}'`);if(this.registry[e]=t,arguments.length===1&&t.aliases)for(let a of t.aliases)this.register(a,t);return t}static get(e,...t){if(!e||ze(e,this))return e;if(he(e)==="string"){let o=Z.registry[e.toLowerCase()];if(!o)throw new TypeError(`No color space found with id = "${e}"`);return o}if(t.length)return Z.get(...t);throw new TypeError(`${e} is not a valid color space`)}static findFormat(e,t=Z.all){if(!e)return null;typeof e=="string"&&(e={name:e});for(let a of t)for(let[o,r]of Object.entries(a.formats)){r.name??(r.name=o),r.type??(r.type="function");let s=(!e.name||r.name===e.name)&&(!e.type||r.type===e.type);if(e.id){let i=r.ids||[r.id],l=Array.isArray(e.id)?e.id:[e.id];s&&(s=l.some(c=>i.includes(c)))}if(s){let i=fn.get(r,a);return i!==r&&(a.formats[r.name]=i),i}}return null}static resolveCoord(e,t){var l;let a=he(e),o,r;if(a==="string"?e.includes(".")?[o,r]=e.split("."):[o,r]=[,e]:Array.isArray(e)?[o,r]=e:(o=e.space,r=e.coordId),o=Z.get(o),o||(o=t),!o)throw new TypeError(`Cannot resolve coordinate reference ${e}: No color space specified and relative references are not allowed here`);if(a=he(r),a==="number"||a==="string"&&r>=0){let c=Object.entries(o.coords)[r];if(c)return{space:o,id:c[0],index:r,...c[1]}}o=Z.get(o);let s=r.toLowerCase(),i=0;for(let c in o.coords){let u=o.coords[c];if(c.toLowerCase()===s||((l=u.name)==null?void 0:l.toLowerCase())===s)return{space:o,id:c,index:i,...u};i++}throw new TypeError(`No "${r}" coordinate found in ${o.name}. Its coordinates are: ${Object.keys(o.coords).join(", ")}`)}};F(Z,"registry",{}),F(Z,"DEFAULT_FORMAT",{type:"functions",name:"color"});let b=Z;function Cr(n){let e=[n];for(let t=n;t=t.base;)e.push(t);return e}var V=new b({id:"xyz-d65",name:"XYZ D65",coords:{x:{refRange:[0,1],name:"X"},y:{refRange:[0,1],name:"Y"},z:{refRange:[0,1],name:"Z"}},white:"D65",formats:{color:{ids:["xyz-d65","xyz"]}},aliases:["xyz"]});class U extends b{constructor(e){e.coords||(e.coords={r:{range:[0,1],name:"Red"},g:{range:[0,1],name:"Green"},b:{range:[0,1],name:"Blue"}}),e.base||(e.base=V),e.toXYZ_M&&e.fromXYZ_M&&(e.toBase??(e.toBase=t=>{let a=R(t,e.toXYZ_M);return this.white!==this.base.white&&(a=Cn(this.white,this.base.white,a)),a}),e.fromBase??(e.fromBase=t=>(t=Cn(this.base.white,this.white,t),R(t,e.fromXYZ_M)))),e.referred??(e.referred="display"),super(e)}}function Qa(n,e={}){if(Array.isArray(n))return n.map(l=>Qa(l,e));let{cssProperty:t="background-color",element:a,...o}=e,r=null;try{return A(n,o)}catch(l){r=l}let{CSS:s,getComputedStyle:i}=globalThis;if(Ge(n)&&a&&s&&i&&s.supports(t,n)){let l=a.style[t];n!==l&&(a.style[t]=n);let c=i(a).getPropertyValue(t);if(n!==l&&(a.style[t]=l),c!==n)try{return A(c,o)}catch(u){r=u}else r={message:"Color value is a valid CSS color, but it could not be resolved :("}}return e.errorMeta&&(e.errorMeta.error=r),null}function on(n,e){n=A(n);let t=b.get(e,e==null?void 0:e.space),a=e==null?void 0:e.precision,o;return!t||n.space.equals(t)?o=n.coords.slice():o=t.from(n),a===void 0?o:o.map(r=>Ct(r,a))}function K(n,e){if(n=A(n),e==="alpha")return n.alpha??1;let{space:t,index:a}=b.resolveCoord(e,n.space);return on(n,t)[a]}function bt(n,e,t,a){return n=A(n),Array.isArray(e)&&([e,t,a]=[n.space,e,t]),e=b.get(e),n.coords=e===n.space?t.slice():e.to(n.space,t),a!==void 0&&(n.alpha=a),n}bt.returns="color";function ue(n,e,t){if(n=A(n),arguments.length===2&&he(arguments[1])==="object"){let a=arguments[1];for(let o in a)ue(n,o,a[o])}else if(typeof t=="function"&&(t=t(K(n,e))),e==="alpha")n.alpha=t;else{let{space:a,index:o}=b.resolveCoord(e,n.space),r=on(n,a);r[o]=t,bt(n,a,r)}return n}ue.returns="color";var yt=new b({id:"xyz-d50",name:"XYZ D50",white:"D50",base:V,fromBase:n=>Cn(V.white,"D50",n),toBase:n=>Cn("D50",V.white,n)});const xr=216/24389,Ft=24/116,sn=24389/27;let Fn=W.D50;var J=new b({id:"lab",name:"Lab",coords:{l:{refRange:[0,100],name:"Lightness"},a:{refRange:[-125,125]},b:{refRange:[-125,125]}},white:Fn,base:yt,fromBase(n){let t=n.map((s,i)=>s/Fn[i]).map(s=>s>xr?Math.cbrt(s):(sn*s+16)/116),a=116*t[1]-16,o=500*(t[0]-t[1]),r=200*(t[1]-t[2]);return[a,o,r]},toBase(n){let[e,t,a]=n,o=[];return o[1]=(e+16)/116,o[0]=t/500+o[1],o[2]=o[1]-a/200,[o[0]>Ft?Math.pow(o[0],3):(116*o[0]-16)/sn,n[0]>8?Math.pow((n[0]+16)/116,3):n[0]/sn,o[2]>Ft?Math.pow(o[2],3):(116*o[2]-16)/sn].map((s,i)=>s*Fn[i])},formats:{lab:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <percentage>"]}}});function ae(n){return typeof n!="number"?n:(n%360+360)%360}function eo(n,e){let[t,a]=e,o=B(t),r=B(a);if(o&&r)return[t,a];if(o?t=a:r&&(a=t),n==="raw")return e;t=ae(t),a=ae(a);let s=a-t;return n==="increasing"?s<0&&(a+=360):n==="decreasing"?s>0&&(t+=360):n==="longer"?-180<s&&s<180&&(s>0?t+=360:a+=360):n==="shorter"&&(s>180?t+=360:s<-180&&(a+=360)),[t,a]}var ee=new b({id:"lch",name:"LCH",coords:{l:{refRange:[0,100],name:"Lightness"},c:{refRange:[0,150],name:"Chroma"},h:{refRange:[0,360],type:"angle",name:"Hue"}},base:J,fromBase(n){if(this.ε===void 0){let i=Object.values(this.base.coords)[1].refRange,l=i[1]-i[0];this.ε=l/1e5}let[e,t,a]=n,o=Math.abs(t)<this.ε&&Math.abs(a)<this.ε,r=o?null:ae(Math.atan2(a,t)*180/Math.PI),s=o?0:Math.sqrt(t**2+a**2);return[e,s,r]},toBase(n){let[e,t,a]=n,o=null,r=null;return B(a)||(t=t<0?0:t,o=t*Math.cos(a*Math.PI/180),r=t*Math.sin(a*Math.PI/180)),[e,o,r]},formats:{lch:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <angle>"]}}});const Nt=25**7,bn=Math.PI,Dt=180/bn,we=bn/180;function _t(n){const e=n*n;return e*e*e*n}function no(n,e,{kL:t=1,kC:a=1,kH:o=1}={}){[n,e]=A([n,e]);let[r,s,i]=J.from(n),l=ee.from(J,[r,s,i])[1],[c,u,d]=J.from(e),m=ee.from(J,[c,u,d])[1];l<0&&(l=0),m<0&&(m=0);let h=(l+m)/2,p=_t(h),g=.5*(1-Math.sqrt(p/(p+Nt))),f=(1+g)*s,C=(1+g)*u,x=Math.sqrt(f**2+i**2),P=Math.sqrt(C**2+d**2),I=f===0&&i===0?0:Math.atan2(i,f),v=C===0&&d===0?0:Math.atan2(d,C);I<0&&(I+=2*bn),v<0&&(v+=2*bn),I*=Dt,v*=Dt;let O=c-r,y=P-x,S=v-I,M=I+v,$=Math.abs(S),j;x*P===0?j=0:$<=180?j=S:S>180?j=S-360:S<-180?j=S+360:Q.warn("the unthinkable has happened");let oe=2*Math.sqrt(P*x)*Math.sin(j*we/2),ie=(r+c)/2,re=(x+P)/2,ye=_t(re),q;x*P===0?q=M:$<=180?q=M/2:M<360?q=(M+360)/2:q=(M-360)/2;let ve=(ie-50)**2,Be=1+.015*ve/Math.sqrt(20+ve),me=1+.045*re,le=1;le-=.17*Math.cos((q-30)*we),le+=.24*Math.cos(2*q*we),le+=.32*Math.cos((3*q+6)*we),le-=.2*Math.cos((4*q-63)*we);let pe=1+.015*re*le,je=30*Math.exp(-1*((q-275)/25)**2),Te=2*Math.sqrt(ye/(ye+Nt)),ce=-1*Math.sin(2*je*we)*Te,Y=(O/(t*Be))**2;return Y+=(y/(a*me))**2,Y+=(oe/(o*pe))**2,Y+=ce*(y/(a*me))*(oe/(o*pe)),Math.sqrt(Y)}const br=[[.819022437996703,.3619062600528904,-.1288737815209879],[.0329836539323885,.9292868615863434,.0361446663506424],[.0481771893596242,.2642395317527308,.6335478284694309]],yr=[[1.2268798758459243,-.5578149944602171,.2813910456659647],[-.0405757452148008,1.112286803280317,-.0717110580655164],[-.0763729366746601,-.4214933324022432,1.5869240198367816]],Pr=[[.210454268309314,.7936177747023054,-.0040720430116193],[1.9779985324311684,-2.42859224204858,.450593709617411],[.0259040424655478,.7827717124575296,-.8086757549230774]],ge=[[1,.3963377773761749,.2158037573099136],[1,-.1055613458156586,-.0638541728258133],[1,-.0894841775298119,-1.2914855480194092]];var se=new b({id:"oklab",name:"Oklab",coords:{l:{refRange:[0,1],name:"Lightness"},a:{refRange:[-.4,.4]},b:{refRange:[-.4,.4]}},white:"D65",base:V,fromBase(n){let e=R(n,br);return e[0]=Math.cbrt(e[0]),e[1]=Math.cbrt(e[1]),e[2]=Math.cbrt(e[2]),R(e,Pr,e)},toBase(n){let e=R(n,ge);return e[0]=e[0]**3,e[1]=e[1]**3,e[2]=e[2]**3,R(e,yr,e)},formats:{oklab:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <percentage>"]}}});function Jn(n,e){[n,e]=A([n,e]);let[t,a,o]=se.from(n),[r,s,i]=se.from(e),l=t-r,c=a-s,u=o-i;return Math.sqrt(l**2+c**2+u**2)}const Sr=75e-6;function Se(n,e,{epsilon:t=Sr}={}){n=A(n),e||(e=n.space),e=b.get(e);let a=n.coords;return e!==n.space&&(a=e.from(n)),e.inGamut(a,{epsilon:t})}function Fe(n){return{space:n.space,coords:n.coords.slice(),alpha:n.alpha}}function to(n,e,t="lab"){t=b.get(t);let a=t.from(n),o=t.from(e);return Math.sqrt(a.reduce((r,s,i)=>{let l=o[i];return B(s)||B(l)?r:r+(l-s)**2},0))}function Ir(n,e){return to(n,e,"lab")}const Ar=Math.PI,Vt=Ar/180;function Mr(n,e,{l:t=2,c:a=1}={}){[n,e]=A([n,e]);let[o,r,s]=J.from(n),[,i,l]=ee.from(J,[o,r,s]),[c,u,d]=J.from(e),m=ee.from(J,[c,u,d])[1];i<0&&(i=0),m<0&&(m=0);let h=o-c,p=i-m,g=r-u,f=s-d,C=g**2+f**2-p**2,x=.511;o>=16&&(x=.040975*o/(1+.01765*o));let P=.0638*i/(1+.0131*i)+.638,I;B(l)&&(l=0),l>=164&&l<=345?I=.56+Math.abs(.2*Math.cos((l+168)*Vt)):I=.36+Math.abs(.4*Math.cos((l+35)*Vt));let v=Math.pow(i,4),O=Math.sqrt(v/(v+1900)),y=P*(O*I+1-O),S=(h/(t*x))**2;return S+=(p/(a*P))**2,S+=C/y**2,Math.sqrt(S)}const Gt=203;var Pt=new b({id:"xyz-abs-d65",cssId:"--xyz-abs-d65",name:"Absolute XYZ D65",coords:{x:{refRange:[0,9504.7],name:"Xa"},y:{refRange:[0,1e4],name:"Ya"},z:{refRange:[0,10888.3],name:"Za"}},base:V,fromBase(n){return n.map(e=>e*Gt)},toBase(n){return n.map(e=>e/Gt)}});const ln=1.15,cn=.66,jt=2610/2**14,vr=2**14/2610,Ut=3424/2**12,$t=2413/2**7,qt=2392/2**7,Br=1.7*2523/2**5,Wt=2**5/(1.7*2523),dn=-.56,Nn=16295499532821565e-27,Tr=[[.41478972,.579999,.014648],[-.20151,1.120649,.0531008],[-.0166008,.2648,.6684799]],Er=[[1.9242264357876067,-1.0047923125953657,.037651404030618],[.35031676209499907,.7264811939316552,-.06538442294808501],[-.09098281098284752,-.3127282905230739,1.5227665613052603]],wr=[[.5,.5,0],[3.524,-4.066708,.542708],[.199076,1.096799,-1.295875]],Lr=[[1,.13860504327153927,.05804731615611883],[1,-.1386050432715393,-.058047316156118904],[1,-.09601924202631895,-.811891896056039]];var ao=new b({id:"jzazbz",name:"Jzazbz",coords:{jz:{refRange:[0,1],name:"Jz"},az:{refRange:[-.21,.21]},bz:{refRange:[-.21,.21]}},base:Pt,fromBase(n){let[e,t,a]=n,o=ln*e-(ln-1)*a,r=cn*t-(cn-1)*e,i=R([o,r,a],Tr).map(function(m){let h=Ut+$t*z(m/1e4,jt),p=1+qt*z(m/1e4,jt);return z(h/p,Br)}),[l,c,u]=R(i,wr);return[(1+dn)*l/(1+dn*l)-Nn,c,u]},toBase(n){let[e,t,a]=n,o=(e+Nn)/(1+dn-dn*(e+Nn)),s=R([o,t,a],Lr).map(function(m){let h=Ut-z(m,Wt),p=qt*z(m,Wt)-$t;return 1e4*z(h/p,vr)}),[i,l,c]=R(s,Er),u=(i+(ln-1)*c)/ln,d=(l+(cn-1)*u)/cn;return[u,d,c]},formats:{jzazbz:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <percentage>"]}}}),Qn=new b({id:"jzczhz",name:"JzCzHz",coords:{jz:{refRange:[0,1],name:"Jz"},cz:{refRange:[0,.26],name:"Chroma"},hz:{refRange:[0,360],type:"angle",name:"Hue"}},base:ao,fromBase:ee.fromBase,toBase:ee.toBase,formats:{jzczhz:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <angle>"]}}});function Rr(n,e){[n,e]=A([n,e]);let[t,a,o]=Qn.from(n),[r,s,i]=Qn.from(e),l=t-r,c=a-s;B(o)&&B(i)?(o=0,i=0):B(o)?o=i:B(i)&&(i=o);let u=o-i,d=2*Math.sqrt(a*s)*Math.sin(u/2*(Math.PI/180));return Math.sqrt(l**2+c**2+d**2)}const oo=3424/4096,ro=2413/128,so=2392/128,Yt=2610/16384,Or=2523/32,Hr=16384/2610,Xt=32/2523,kr=[[.3592832590121217,.6976051147779502,-.035891593232029],[-.1920808463704993,1.100476797037432,.0753748658519118],[.0070797844607479,.0748396662186362,.8433265453898765]],zr=[[2048/4096,2048/4096,0],[6610/4096,-13613/4096,7003/4096],[17933/4096,-17390/4096,-543/4096]],Fr=[[.9999999999999998,.0086090370379328,.111029625003026],[.9999999999999998,-.0086090370379328,-.1110296250030259],[.9999999999999998,.5600313357106791,-.3206271749873188]],Nr=[[2.0701522183894223,-1.3263473389671563,.2066510476294053],[.3647385209748072,.6805660249472273,-.0453045459220347],[-.0497472075358123,-.0492609666966131,1.1880659249923042]];var et=new b({id:"ictcp",name:"ICTCP",coords:{i:{refRange:[0,1],name:"I"},ct:{refRange:[-.5,.5],name:"CT"},cp:{refRange:[-.5,.5],name:"CP"}},base:Pt,fromBase(n){let e=R(n,kr);return Dr(e)},toBase(n){let e=_r(n);return R(e,Nr)},formats:{ictcp:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <percentage>"]}}});function Dr(n){let e=n.map(function(t){let a=oo+ro*(t/1e4)**Yt,o=1+so*(t/1e4)**Yt;return(a/o)**Or});return R(e,zr)}function _r(n){return R(n,Fr).map(function(a){let o=Math.max(a**Xt-oo,0),r=ro-so*a**Xt;return 1e4*(o/r)**Hr})}function Vr(n,e){[n,e]=A([n,e]);let[t,a,o]=et.from(n),[r,s,i]=et.from(e);return 720*Math.sqrt((t-r)**2+.25*(a-s)**2+(o-i)**2)}function Gr(n,e){[n,e]=A([n,e]);let t=2,[a,o,r]=se.from(n),[s,i,l]=se.from(e),c=a-s,u=t*(o-i),d=t*(r-l);return Math.sqrt(c**2+u**2+d**2)}const jr=W.D65,io=.42,Zt=1/io,Dn=2*Math.PI,lo=[[.401288,.650173,-.051461],[-.250268,1.204414,.045854],[-.002079,.048952,.953127]],Ur=[[1.8620678550872327,-1.0112546305316843,.14918677544445175],[.38752654323613717,.6214474419314753,-.008973985167612518],[-.015841498849333856,-.03412293802851557,1.0499644368778496]],$r=[[460,451,288],[460,-891,-261],[460,-220,-6300]],qr={dark:[.8,.525,.8],dim:[.9,.59,.9],average:[1,.69,1]},Pe={h:[20.14,90,164.25,237.53,380.14],e:[.8,.7,1,1.2,.8],H:[0,100,200,300,400]},Wr=180/Math.PI,Kt=Math.PI/180;function co(n,e){return n.map(a=>{const o=z(e*Math.abs(a)*.01,io);return 400*Bn(o,a)/(o+27.13)})}function Yr(n,e){const t=100/e*27.13**Zt;return n.map(a=>{const o=Math.abs(a);return Bn(t*z(o/(400-o),Zt),a)})}function Xr(n){let e=ae(n);e<=Pe.h[0]&&(e+=360);const t=Za(Pe.h,e)-1,[a,o]=Pe.h.slice(t,t+2),[r,s]=Pe.e.slice(t,t+2),i=Pe.H[t],l=(e-a)/r;return i+100*l/(l+(o-e)/s)}function Zr(n){let e=(n%400+400)%400;const t=Math.floor(.01*e);e=e%100;const[a,o]=Pe.h.slice(t,t+2),[r,s]=Pe.e.slice(t,t+2);return ae((e*(s*a-r*o)-100*a*s)/(e*(s-r)-100*s))}function uo(n,e,t,a,o){const r={};r.discounting=o,r.refWhite=n,r.surround=a;const s=n.map(f=>f*100);r.la=e,r.yb=t;const i=s[1],l=R(s,lo);let c=qr[r.surround];const u=c[0];r.c=c[1],r.nc=c[2];const m=(1/(5*r.la+1))**4;r.fl=m*r.la+.1*(1-m)*(1-m)*Math.cbrt(5*r.la),r.flRoot=r.fl**.25,r.n=r.yb/i,r.z=1.48+Math.sqrt(r.n),r.nbb=.725*r.n**-.2,r.ncb=r.nbb;const h=Math.max(Math.min(u*(1-1/3.6*Math.exp((-r.la-42)/92)),1),0);r.dRgb=l.map(f=>en(1,i/f,h)),r.dRgbInv=r.dRgb.map(f=>1/f);const p=l.map((f,C)=>f*r.dRgb[C]),g=co(p,r.fl);return r.aW=r.nbb*(2*g[0]+g[1]+.05*g[2]),r}const Jt=uo(jr,64/Math.PI*.2,20,"average",!1);function nt(n,e){if(!(n.J!==void 0^n.Q!==void 0))throw new Error("Conversion requires one and only one: 'J' or 'Q'");if(!(n.C!==void 0^n.M!==void 0^n.s!==void 0))throw new Error("Conversion requires one and only one: 'C', 'M' or 's'");if(!(n.h!==void 0^n.H!==void 0))throw new Error("Conversion requires one and only one: 'h' or 'H'");if(n.J===0||n.Q===0)return[0,0,0];let t=0;n.h!==void 0?t=ae(n.h)*Kt:t=Zr(n.H)*Kt;const a=Math.cos(t),o=Math.sin(t);let r=0;n.J!==void 0?r=z(n.J,1/2)*.1:n.Q!==void 0&&(r=.25*e.c*n.Q/((e.aW+4)*e.flRoot));let s=0;n.C!==void 0?s=n.C/r:n.M!==void 0?s=n.M/e.flRoot/r:n.s!==void 0&&(s=4e-4*n.s**2*(e.aW+4)/e.c);const i=z(s*Math.pow(1.64-Math.pow(.29,e.n),-.73),10/9),l=.25*(Math.cos(t+2)+3.8),c=e.aW*z(r,2/e.c/e.z),u=5e4/13*e.nc*e.ncb*l,d=c/e.nbb,m=23*(d+.305)*xt(i,23*u+i*(11*a+108*o)),h=m*a,p=m*o,g=Yr(R([d,h,p],$r).map(f=>f*1/1403),e.fl);return R(g.map((f,C)=>f*e.dRgbInv[C]),Ur).map(f=>f/100)}function mo(n,e){const t=n.map(P=>P*100),a=co(R(t,lo).map((P,I)=>P*e.dRgb[I]),e.fl),o=a[0]+(-12*a[1]+a[2])/11,r=(a[0]+a[1]-2*a[2])/9,s=(Math.atan2(r,o)%Dn+Dn)%Dn,i=.25*(Math.cos(s+2)+3.8),l=5e4/13*e.nc*e.ncb*xt(i*Math.sqrt(o**2+r**2),a[0]+a[1]+1.05*a[2]+.305),c=z(l,.9)*Math.pow(1.64-Math.pow(.29,e.n),.73),u=e.nbb*(2*a[0]+a[1]+.05*a[2]),d=z(u/e.aW,.5*e.c*e.z),m=100*z(d,2),h=4/e.c*d*(e.aW+4)*e.flRoot,p=c*d,g=p*e.flRoot,f=ae(s*Wr),C=Xr(f),x=50*z(e.c*c/(e.aW+4),1/2);return{J:m,C:p,h:f,s:x,Q:h,M:g,H:C}}var Kr=new b({id:"cam16-jmh",cssId:"--cam16-jmh",name:"CAM16-JMh",coords:{j:{refRange:[0,100],name:"J"},m:{refRange:[0,105],name:"Colorfulness"},h:{refRange:[0,360],type:"angle",name:"Hue"}},base:V,fromBase(n){this.ε===void 0&&(this.ε=Object.values(this.coords)[1].refRange[1]/1e5);const e=mo(n,Jt),t=Math.abs(e.M)<this.ε;return[e.J,t?0:e.M,t?null:e.h]},toBase(n){return nt({J:n[0],M:n[1],h:n[2]},Jt)}});const Jr=W.D65,Qr=216/24389,po=24389/27;function es(n){return 116*(n>Qr?Math.cbrt(n):(po*n+16)/116)-16}function tt(n){return n>8?Math.pow((n+16)/116,3):n/po}function ns(n,e){let[t,a,o]=n,r=[],s=0;if(o===0)return[0,0,0];let i=tt(o);o>0?s=.00379058511492914*o**2+.608983189401032*o+.9155088574762233:s=9514440756550361e-21*o**2+.08693057439788597*o-21.928975842194614;const l=2e-12,c=15;let u=0,d=1/0;for(;u<=c;){r=nt({J:s,C:a,h:t},e);const m=Math.abs(r[1]-i);if(m<d){if(m<=l)return r;d=m}s=s-(r[1]-i)*s/(2*r[1]),u+=1}return nt({J:s,C:a,h:t},e)}function ts(n,e){const t=es(n[1]);if(t===0)return[0,0,0];const a=mo(n,St);return[ae(a.h),a.C,t]}const St=uo(Jr,200/Math.PI*tt(50),tt(50)*100,"average",!1);var nn=new b({id:"hct",name:"HCT",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},c:{refRange:[0,145],name:"Colorfulness"},t:{refRange:[0,100],name:"Tone"}},base:V,fromBase(n){this.ε===void 0&&(this.ε=Object.values(this.coords)[1].refRange[1]/1e5);let e=ts(n);return e[1]<this.ε&&(e[1]=0,e[0]=null),e},toBase(n){return ns(n,St)},formats:{color:{id:"--hct",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}});const as=Math.PI/180,Qt=[1,.007,.0228];function ea(n){n[1]<0&&(n=nn.fromBase(nn.toBase(n)));const e=Math.log(Math.max(1+Qt[2]*n[1]*St.flRoot,1))/Qt[2],t=n[0]*as,a=e*Math.cos(t),o=e*Math.sin(t);return[n[2],a,o]}function os(n,e){[n,e]=A([n,e]);let[t,a,o]=ea(nn.from(n)),[r,s,i]=ea(nn.from(e));return Math.sqrt((t-r)**2+(a-s)**2+(o-i)**2)}var Ne={deltaE76:Ir,deltaECMC:Mr,deltaE2000:no,deltaEJz:Rr,deltaEITP:Vr,deltaEOK:Jn,deltaEOK2:Gr,deltaEHCT:os};function rs(n){const e=n?Math.floor(Math.log10(Math.abs(n))):0;return Math.max(parseFloat(`1e${e-2}`),1e-6)}const na={hct:{method:"hct.c",jnd:2,deltaEMethod:"hct",blackWhiteClamp:{}},"hct-tonal":{method:"hct.c",jnd:0,deltaEMethod:"hct",blackWhiteClamp:{channel:"hct.t",min:0,max:100}}};function Ce(n,{method:e=Q.gamut_mapping,space:t=void 0,deltaEMethod:a="",jnd:o=2,blackWhiteClamp:r=void 0}={}){if(n=A(n),Ge(arguments[1])?t=arguments[1]:t||(t=n.space),t=b.get(t),Se(n,t,{epsilon:0}))return n;let s;if(e==="css")s=ss(n,{space:t});else{if(e!=="clip"&&!Se(n,t)){Object.prototype.hasOwnProperty.call(na,e)&&({method:e,jnd:o,deltaEMethod:a,blackWhiteClamp:r}=na[e]);let i=no;if(a!==""){for(let c in Ne)if("deltae"+a.toLowerCase()===c.toLowerCase()){i=Ne[c];break}}o===0&&(o=1e-16);let l=Ce(w(n,t),{method:"clip",space:t});if(i(n,l)>o){if(r&&Object.keys(r).length===3){let x=b.resolveCoord(r.channel),P=K(w(n,x.space),x.id);if(B(P)&&(P=0),P>=r.max)return w({space:"xyz-d65",coords:W.D65},n.space);if(P<=r.min)return w({space:"xyz-d65",coords:[0,0,0]},n.space)}let c=b.resolveCoord(e),u=c.space,d=c.id,m=w(n,u);m.coords.forEach((x,P)=>{B(x)&&(m.coords[P]=0)});let p=(c.range||c.refRange)[0],g=rs(o),f=p,C=K(m,d);for(;C-f>g;){let x=Fe(m);x=Ce(x,{space:t,method:"clip"}),i(m,x)-o<g?f=K(m,d):C=K(m,d),ue(m,d,(f+C)/2)}s=w(m,t)}else s=l}else s=w(n,t);if(e==="clip"||!Se(s,t,{epsilon:0})){let i=Object.values(t.coords).map(l=>l.range||[]);s.coords=s.coords.map((l,c)=>{let[u,d]=i[c];return u!==void 0&&(l=Math.max(u,l)),d!==void 0&&(l=Math.min(l,d)),l})}}return t!==n.space&&(s=w(s,n.space)),n.coords=s.coords,n}Ce.returns="color";const ta={WHITE:{space:se,coords:[1,0,0],alpha:1},BLACK:{space:se,coords:[0,0,0],alpha:1}};function ss(n,{space:e}={}){n=A(n),e||(e=n.space),e=b.get(e);const o=b.get("oklch");if(e.isUnbounded)return w(n,e);const r=w(n,o);let s=r.coords[0];if(s>=1){const p=w(ta.WHITE,e);return p.alpha=n.alpha,w(p,e)}if(s<=0){const p=w(ta.BLACK,e);return p.alpha=n.alpha,w(p,e)}if(Se(r,e,{epsilon:0}))return w(r,e);function i(p){const g=w(p,e),f=Object.values(e.coords);return g.coords=g.coords.map((C,x)=>{if("range"in f[x]){const[P,I]=f[x].range;return vn(P,C,I)}return C}),g}let l=0,c=r.coords[1],u=!0,d=Fe(r),m=i(d),h=Jn(m,d);if(h<.02)return m;for(;c-l>1e-4;){const p=(l+c)/2;if(d.coords[1]=p,u&&Se(d,e,{epsilon:0}))l=p;else if(m=i(d),h=Jn(m,d),h<.02){if(.02-h<1e-4)break;u=!1,l=p}else c=p}return m}function w(n,e,{inGamut:t}={}){n=A(n),e=b.get(e);let a=e.from(n),o={space:e,coords:a,alpha:n.alpha};return t&&(o=Ce(o,t===!0?void 0:t)),o}w.returns="color";function Ze(n,e={}){var h;let{precision:t=Q.precision,format:a,inGamut:o=!0,coords:r,alpha:s,commas:i}=e,l,c=A(n),u=a,d=c.parseMeta;d&&!a&&(d.format.canSerialize()&&(a=d.format,u=d.formatId),r??(r=d.types),s??(s=d.alphaType),i??(i=d.commas)),u&&(a=c.space.getFormat(a)??b.findFormat(u)),a||(a=c.space.getFormat("default")??b.DEFAULT_FORMAT,u=a.name),a&&a.space&&a.space!==c.space&&(c=w(c,a.space));let m=c.coords.slice();if(o||(o=a.toGamut),o&&!Se(c)&&(m=Ce(Fe(c),o===!0?void 0:o).coords),a.type==="custom")if(a.serialize)l=a.serialize(m,c.alpha,e);else throw new TypeError(`format ${u} can only be used to parse colors, not for serialization`);else{let p=a.name||"color",g=a.serializeCoords(m,t,r);if(p==="color"){let I=a.id||((h=a.ids)==null?void 0:h[0])||c.space.cssId||c.space.id;g.unshift(I)}let f=c.alpha;s!==void 0&&typeof s!="object"&&(s=typeof s=="string"?{type:s}:{include:s});let C=(s==null?void 0:s.type)??"<number>",x=(s==null?void 0:s.include)===!0||a.alpha===!0||(s==null?void 0:s.include)!==!1&&a.alpha!==!1&&f<1,P="";if(i??(i=a.commas),x){if(t!==null){let I;C==="<percentage>"&&(I="%",f*=100),f=ft(f,{precision:t,unit:I})}P=`${i?",":" /"} ${f}`}l=`${p}(${g.join(i?", ":" ")}${P})`}return l}const is=[[.6369580483012914,.14461690358620832,.1688809751641721],[.2627002120112671,.6779980715188708,.05930171646986196],[0,.028072693049087428,1.060985057710791]],ls=[[1.716651187971268,-.355670783776392,-.25336628137366],[-.666684351832489,1.616481236634939,.0157685458139111],[.017639857445311,-.042770613257809,.942103121235474]];var tn=new U({id:"rec2020-linear",cssId:"--rec2020-linear",name:"Linear REC.2020",white:"D65",toXYZ_M:is,fromXYZ_M:ls}),ho=new U({id:"rec2020",name:"REC.2020",base:tn,toBase(n){return n.map(function(e){let t=e<0?-1:1,a=e*t;return t*Math.pow(a,2.4)})},fromBase(n){return n.map(function(e){let t=e<0?-1:1,a=e*t;return t*Math.pow(a,1/2.4)})}});const cs=[[.4865709486482162,.26566769316909306,.1982172852343625],[.2289745640697488,.6917385218365064,.079286914093745],[0,.04511338185890264,1.043944368900976]],ds=[[2.493496911941425,-.9313836179191239,-.40271078445071684],[-.8294889695615747,1.7626640603183463,.023624685841943577],[.03584583024378447,-.07617238926804182,.9568845240076872]];var go=new U({id:"p3-linear",cssId:"display-p3-linear",name:"Linear P3",white:"D65",toXYZ_M:cs,fromXYZ_M:ds});const us=[[.41239079926595934,.357584339383878,.1804807884018343],[.21263900587151027,.715168678767756,.07219231536073371],[.01933081871559182,.11919477979462598,.9505321522496607]],N=[[3.2409699419045226,-1.537383177570094,-.4986107602930034],[-.9692436362808796,1.8759675015077202,.04155505740717559],[.05563007969699366,-.20397695888897652,1.0569715142428786]];var fo=new U({id:"srgb-linear",name:"Linear sRGB",white:"D65",toXYZ_M:us,fromXYZ_M:N}),aa={aliceblue:[240/255,248/255,1],antiquewhite:[250/255,235/255,215/255],aqua:[0,1,1],aquamarine:[127/255,1,212/255],azure:[240/255,1,1],beige:[245/255,245/255,220/255],bisque:[1,228/255,196/255],black:[0,0,0],blanchedalmond:[1,235/255,205/255],blue:[0,0,1],blueviolet:[138/255,43/255,226/255],brown:[165/255,42/255,42/255],burlywood:[222/255,184/255,135/255],cadetblue:[95/255,158/255,160/255],chartreuse:[127/255,1,0],chocolate:[210/255,105/255,30/255],coral:[1,127/255,80/255],cornflowerblue:[100/255,149/255,237/255],cornsilk:[1,248/255,220/255],crimson:[220/255,20/255,60/255],cyan:[0,1,1],darkblue:[0,0,139/255],darkcyan:[0,139/255,139/255],darkgoldenrod:[184/255,134/255,11/255],darkgray:[169/255,169/255,169/255],darkgreen:[0,100/255,0],darkgrey:[169/255,169/255,169/255],darkkhaki:[189/255,183/255,107/255],darkmagenta:[139/255,0,139/255],darkolivegreen:[85/255,107/255,47/255],darkorange:[1,140/255,0],darkorchid:[153/255,50/255,204/255],darkred:[139/255,0,0],darksalmon:[233/255,150/255,122/255],darkseagreen:[143/255,188/255,143/255],darkslateblue:[72/255,61/255,139/255],darkslategray:[47/255,79/255,79/255],darkslategrey:[47/255,79/255,79/255],darkturquoise:[0,206/255,209/255],darkviolet:[148/255,0,211/255],deeppink:[1,20/255,147/255],deepskyblue:[0,191/255,1],dimgray:[105/255,105/255,105/255],dimgrey:[105/255,105/255,105/255],dodgerblue:[30/255,144/255,1],firebrick:[178/255,34/255,34/255],floralwhite:[1,250/255,240/255],forestgreen:[34/255,139/255,34/255],fuchsia:[1,0,1],gainsboro:[220/255,220/255,220/255],ghostwhite:[248/255,248/255,1],gold:[1,215/255,0],goldenrod:[218/255,165/255,32/255],gray:[128/255,128/255,128/255],green:[0,128/255,0],greenyellow:[173/255,1,47/255],grey:[128/255,128/255,128/255],honeydew:[240/255,1,240/255],hotpink:[1,105/255,180/255],indianred:[205/255,92/255,92/255],indigo:[75/255,0,130/255],ivory:[1,1,240/255],khaki:[240/255,230/255,140/255],lavender:[230/255,230/255,250/255],lavenderblush:[1,240/255,245/255],lawngreen:[124/255,252/255,0],lemonchiffon:[1,250/255,205/255],lightblue:[173/255,216/255,230/255],lightcoral:[240/255,128/255,128/255],lightcyan:[224/255,1,1],lightgoldenrodyellow:[250/255,250/255,210/255],lightgray:[211/255,211/255,211/255],lightgreen:[144/255,238/255,144/255],lightgrey:[211/255,211/255,211/255],lightpink:[1,182/255,193/255],lightsalmon:[1,160/255,122/255],lightseagreen:[32/255,178/255,170/255],lightskyblue:[135/255,206/255,250/255],lightslategray:[119/255,136/255,153/255],lightslategrey:[119/255,136/255,153/255],lightsteelblue:[176/255,196/255,222/255],lightyellow:[1,1,224/255],lime:[0,1,0],limegreen:[50/255,205/255,50/255],linen:[250/255,240/255,230/255],magenta:[1,0,1],maroon:[128/255,0,0],mediumaquamarine:[102/255,205/255,170/255],mediumblue:[0,0,205/255],mediumorchid:[186/255,85/255,211/255],mediumpurple:[147/255,112/255,219/255],mediumseagreen:[60/255,179/255,113/255],mediumslateblue:[123/255,104/255,238/255],mediumspringgreen:[0,250/255,154/255],mediumturquoise:[72/255,209/255,204/255],mediumvioletred:[199/255,21/255,133/255],midnightblue:[25/255,25/255,112/255],mintcream:[245/255,1,250/255],mistyrose:[1,228/255,225/255],moccasin:[1,228/255,181/255],navajowhite:[1,222/255,173/255],navy:[0,0,128/255],oldlace:[253/255,245/255,230/255],olive:[128/255,128/255,0],olivedrab:[107/255,142/255,35/255],orange:[1,165/255,0],orangered:[1,69/255,0],orchid:[218/255,112/255,214/255],palegoldenrod:[238/255,232/255,170/255],palegreen:[152/255,251/255,152/255],paleturquoise:[175/255,238/255,238/255],palevioletred:[219/255,112/255,147/255],papayawhip:[1,239/255,213/255],peachpuff:[1,218/255,185/255],peru:[205/255,133/255,63/255],pink:[1,192/255,203/255],plum:[221/255,160/255,221/255],powderblue:[176/255,224/255,230/255],purple:[128/255,0,128/255],rebeccapurple:[102/255,51/255,153/255],red:[1,0,0],rosybrown:[188/255,143/255,143/255],royalblue:[65/255,105/255,225/255],saddlebrown:[139/255,69/255,19/255],salmon:[250/255,128/255,114/255],sandybrown:[244/255,164/255,96/255],seagreen:[46/255,139/255,87/255],seashell:[1,245/255,238/255],sienna:[160/255,82/255,45/255],silver:[192/255,192/255,192/255],skyblue:[135/255,206/255,235/255],slateblue:[106/255,90/255,205/255],slategray:[112/255,128/255,144/255],slategrey:[112/255,128/255,144/255],snow:[1,250/255,250/255],springgreen:[0,1,127/255],steelblue:[70/255,130/255,180/255],tan:[210/255,180/255,140/255],teal:[0,128/255,128/255],thistle:[216/255,191/255,216/255],tomato:[1,99/255,71/255],turquoise:[64/255,224/255,208/255],violet:[238/255,130/255,238/255],wheat:[245/255,222/255,179/255],white:[1,1,1],whitesmoke:[245/255,245/255,245/255],yellow:[1,1,0],yellowgreen:[154/255,205/255,50/255]};let oa=Array(3).fill("<percentage> | <number>[0, 255]"),ra=Array(3).fill("<number>[0, 255]");var Ie=new U({id:"srgb",name:"sRGB",base:fo,fromBase:n=>n.map(e=>{let t=e<0?-1:1,a=e*t;return a>.0031308?t*(1.055*a**(1/2.4)-.055):12.92*e}),toBase:n=>n.map(e=>{let t=e<0?-1:1,a=e*t;return a<=.04045?e/12.92:t*((a+.055)/1.055)**2.4}),formats:{rgb:{coords:oa},rgb_number:{name:"rgb",commas:!0,coords:ra,alpha:!1},color:{},rgba:{coords:oa,commas:!0,alpha:!0},rgba_number:{name:"rgba",commas:!0,coords:ra},hex:{type:"custom",toGamut:!0,test:n=>/^#(([a-f0-9]{2}){3,4}|[a-f0-9]{3,4})$/i.test(n),parse(n){n.length<=5&&(n=n.replace(/[a-f0-9]/gi,"$&$&"));let e=[];return n.replace(/[a-f0-9]{2}/gi,t=>{e.push(parseInt(t,16)/255)}),{spaceId:"srgb",coords:e.slice(0,3),alpha:e.slice(3)[0]}},serialize:(n,e,{collapse:t=!0,alpha:a}={})=>{(a!==!1&&e<1||a===!0)&&n.push(e),n=n.map(s=>Math.round(s*255));let o=t&&n.every(s=>s%17===0);return"#"+n.map(s=>o?(s/17).toString(16):s.toString(16).padStart(2,"0")).join("")}},keyword:{type:"custom",test:n=>/^[a-z]+$/i.test(n),parse(n){n=n.toLowerCase();let e={spaceId:"srgb",coords:null,alpha:1};if(n==="transparent"?(e.coords=aa.black,e.alpha=0):e.coords=aa[n],e.coords)return e}}}}),Co=new U({id:"p3",cssId:"display-p3",name:"P3",base:go,fromBase:Ie.fromBase,toBase:Ie.toBase});Q.display_space=Ie;let ms;if(typeof CSS<"u"&&CSS.supports)for(let n of[J,ho,Co]){let e=n.getMinCoords(),a=Ze({space:n,coords:e,alpha:1});if(CSS.supports("color",a)){Q.display_space=n;break}}function ps(n,{space:e=Q.display_space,...t}={}){n=A(n);let a=Ze(n,t);if(typeof CSS>"u"||CSS.supports("color",a)||!Q.display_space)a=new String(a),a.color=n;else{let o=n;if((n.coords.some(B)||B(n.alpha))&&!(ms??(ms=CSS.supports("color","hsl(none 50% 50%)")))&&(o=Fe(n),o.coords=o.coords.map(k),o.alpha=k(o.alpha),a=Ze(o,t),CSS.supports("color",a)))return a=new String(a),a.color=o,a;o=w(o,e),a=new String(Ze(o,t)),a.color=o}return a}function hs(n,e,{space:t,hue:a="shorter"}={}){n=A(n),t||(t=n.space),t=b.get(t);let o=Object.values(t.coords);[n,e]=[n,e].map(c=>w(c,t));let[r,s]=[n,e].map(c=>c.coords),i=r.map((c,u)=>{let d=o[u],m=s[u];return d.type==="angle"&&([c,m]=eo(a,[c,m])),sa(c,m)}),l=sa(n.alpha,e.alpha);return{space:t,coords:i,alpha:l}}function sa(n,e){return B(n)||B(e)?n===e?null:0:n-e}function gs(n,e){return n=A(n),e=A(e),n.space===e.space&&n.alpha===e.alpha&&n.coords.every((t,a)=>t===e.coords[a])}function xe(n){return K(n,[V,"y"])}function xo(n,e){ue(n,[V,"y"],e)}function fs(n){Object.defineProperty(n.prototype,"luminance",{get(){return xe(this)},set(e){xo(this,e)}})}var Cs=Object.freeze({__proto__:null,getLuminance:xe,register:fs,setLuminance:xo});function xs(n,e){n=A(n),e=A(e);let t=Math.max(xe(n),0),a=Math.max(xe(e),0);return a>t&&([t,a]=[a,t]),(t+.05)/(a+.05)}const bs=.56,ys=.57,Ps=.62,Ss=.65,ia=.022,Is=1.414,As=.1,Ms=5e-4,vs=1.14,la=.027,Bs=1.14;function ca(n){return n>=ia?n:n+(ia-n)**Is}function Le(n){let e=n<0?-1:1,t=Math.abs(n);return e*Math.pow(t,2.4)}function Ts(n,e){e=A(e),n=A(n);let t,a,o,r,s,i;e=w(e,"srgb"),[r,s,i]=e.coords.map(h=>B(h)?0:h);let l=Le(r)*.2126729+Le(s)*.7151522+Le(i)*.072175;n=w(n,"srgb"),[r,s,i]=n.coords.map(h=>B(h)?0:h);let c=Le(r)*.2126729+Le(s)*.7151522+Le(i)*.072175,u=ca(l),d=ca(c),m=d>u;return Math.abs(d-u)<Ms?a=0:m?(t=d**bs-u**ys,a=t*vs):(t=d**Ss-u**Ps,a=t*Bs),Math.abs(a)<As?o=0:a>0?o=a-la:o=a+la,o*100}function Es(n,e){n=A(n),e=A(e);let t=Math.max(xe(n),0),a=Math.max(xe(e),0);a>t&&([t,a]=[a,t]);let o=t+a;return o===0?0:(t-a)/o}const ws=5e4;function Ls(n,e){n=A(n),e=A(e);let t=Math.max(xe(n),0),a=Math.max(xe(e),0);return a>t&&([t,a]=[a,t]),a===0?ws:(t-a)/a}function Rs(n,e){n=A(n),e=A(e);let t=K(n,[J,"l"]),a=K(e,[J,"l"]);return Math.abs(t-a)}const Os=216/24389,da=24/116,un=24389/27;let _n=W.D65;var at=new b({id:"lab-d65",name:"Lab D65",coords:{l:{refRange:[0,100],name:"Lightness"},a:{refRange:[-125,125]},b:{refRange:[-125,125]}},white:_n,base:V,fromBase(n){let t=n.map((a,o)=>a/_n[o]).map(a=>a>Os?Math.cbrt(a):(un*a+16)/116);return[116*t[1]-16,500*(t[0]-t[1]),200*(t[1]-t[2])]},toBase(n){let e=[];return e[1]=(n[0]+16)/116,e[0]=n[1]/500+e[1],e[2]=e[1]-n[2]/200,[e[0]>da?Math.pow(e[0],3):(116*e[0]-16)/un,n[0]>8?Math.pow((n[0]+16)/116,3):n[0]/un,e[2]>da?Math.pow(e[2],3):(116*e[2]-16)/un].map((a,o)=>a*_n[o])},formats:{"lab-d65":{coords:["<number> | <percentage>","<number> | <percentage>","<number> | <percentage>"]}}});const Vn=Math.pow(5,.5)*.5+.5;function Hs(n,e){n=A(n),e=A(e);let t=K(n,[at,"l"]),a=K(e,[at,"l"]),o=Math.abs(Math.pow(t,Vn)-Math.pow(a,Vn)),r=Math.pow(o,1/Vn)*Math.SQRT2-40;return r<7.5?0:r}var gn=Object.freeze({__proto__:null,contrastAPCA:Ts,contrastDeltaPhi:Hs,contrastLstar:Rs,contrastMichelson:Es,contrastWCAG21:xs,contrastWeber:Ls});function ks(n,e,t){Ge(t)&&(t={algorithm:t});let{algorithm:a,...o}=t||{};if(!a){let r=Object.keys(gn).map(s=>s.replace(/^contrast/,"")).join(", ");throw new TypeError(`contrast() function needs a contrast algorithm. Please specify one of: ${r}`)}n=A(n),e=A(e);for(let r in gn)if("contrast"+a.toLowerCase()===r.toLowerCase())return gn[r](n,e,o);throw new TypeError(`Unknown contrast algorithm: ${a}`)}function Tn(n){let[e,t,a]=on(n,V),o=e+15*t+3*a;return[4*e/o,9*t/o]}function bo(n){let[e,t,a]=on(n,V),o=e+t+a;return[e/o,t/o]}function zs(n){Object.defineProperty(n.prototype,"uv",{get(){return Tn(this)}}),Object.defineProperty(n.prototype,"xy",{get(){return bo(this)}})}var Fs=Object.freeze({__proto__:null,register:zs,uv:Tn,xy:bo});function Ye(n,e,t={}){Ge(t)&&(t={method:t});let{method:a=Q.deltaE,...o}=t;for(let r in Ne)if("deltae"+a.toLowerCase()===r.toLowerCase())return Ne[r](n,e,o);throw new TypeError(`Unknown deltaE method: ${a}`)}function yo(n,e=.25){let a=[b.get("oklch","lch"),"l"];return ue(n,a,o=>o*(1+e))}function Po(n,e=.25){let a=[b.get("oklch","lch"),"l"];return ue(n,a,o=>o*(1-e))}yo.returns="color";Po.returns="color";var Ns=Object.freeze({__proto__:null,darken:Po,lighten:yo});function So(n,e,t,a={}){return[n,e]=[A(n),A(e)],he(t)==="object"&&([t,a]=[.5,t]),rn(n,e,a)(t??.5)}function Io(n,e,t={}){let a;It(n)&&([a,t]=[n,e],[n,e]=a.rangeArgs.colors);let{maxDeltaE:o,deltaEMethod:r,steps:s=2,maxSteps:i=1e3,...l}=t;a||([n,e]=[A(n),A(e)],a=rn(n,e,l));let c=Ye(n,e),u=o>0?Math.max(s,Math.ceil(c/o)+1):s,d=[];if(i!==void 0&&(u=Math.min(u,i)),u===1)d=[{p:.5,color:a(.5)}];else{let m=1/(u-1);d=Array.from({length:u},(h,p)=>{let g=p*m;return{p:g,color:a(g)}})}if(o>0){let m=d.reduce((h,p,g)=>{if(g===0)return 0;let f=Ye(p.color,d[g-1].color,r);return Math.max(h,f)},0);for(;m>o;){m=0;for(let h=1;h<d.length&&d.length<i;h++){let p=d[h-1],g=d[h],f=(g.p+p.p)/2,C=a(f);m=Math.max(m,Ye(C,p.color),Ye(C,g.color)),d.splice(h,0,{p:f,color:a(f)}),h++}}}return d=d.map(m=>m.color),d}function rn(n,e,t={}){if(It(n)){let[l,c]=[n,e];return rn(...l.rangeArgs.colors,{...l.rangeArgs.options,...c})}let{space:a,outputSpace:o,progression:r,premultiplied:s}=t;n=A(n),e=A(e),n=Fe(n),e=Fe(e);let i={colors:[n,e],options:t};if(a?a=b.get(a):a=b.registry[Q.interpolationSpace]||n.space,o=o?b.get(o):a,n=w(n,a),e=w(e,a),n=Ce(n),e=Ce(e),a.coords.h&&a.coords.h.type==="angle"){let l=t.hue=t.hue||"shorter",c=[a,"h"],[u,d]=[K(n,c),K(e,c)];B(u)&&!B(d)?u=d:B(d)&&!B(u)&&(d=u),[u,d]=eo(l,[u,d]),ue(n,c,u),ue(e,c,d)}return s&&(n.coords=n.coords.map(l=>l*n.alpha),e.coords=e.coords.map(l=>l*e.alpha)),Object.assign(l=>{l=r?r(l):l;let c=n.coords.map((m,h)=>{let p=e.coords[h];return en(m,p,l)}),u=en(n.alpha,e.alpha,l),d={space:a,coords:c,alpha:u};return s&&(d.coords=d.coords.map(m=>m/u)),o!==a&&(d=w(d,o)),d},{rangeArgs:i})}function It(n){return he(n)==="function"&&!!n.rangeArgs}Q.interpolationSpace="lab";function Ds(n){n.defineFunction("mix",So,{returns:"color"}),n.defineFunction("range",rn,{returns:"function<color>"}),n.defineFunction("steps",Io,{returns:"array<color>"})}var _s=Object.freeze({__proto__:null,isRange:It,mix:So,range:rn,register:Ds,steps:Io}),Vs=new b({id:"hsl",name:"HSL",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,100],name:"Saturation"},l:{range:[0,100],name:"Lightness"}},base:Ie,fromBase:n=>{let e=Math.max(...n),t=Math.min(...n),[a,o,r]=n,[s,i,l]=[null,0,(t+e)/2],c=e-t;if(c!==0){switch(i=l===0||l===1?0:(e-l)/Math.min(l,1-l),e){case a:s=(o-r)/c+(o<r?6:0);break;case o:s=(r-a)/c+2;break;case r:s=(a-o)/c+4}s=s*60}return i<0&&(s+=180,i=Math.abs(i)),s>=360&&(s-=360),[s,i*100,l*100]},toBase:n=>{let[e,t,a]=n;e=e%360,e<0&&(e+=360),t/=100,a/=100;function o(r){let s=(r+e/30)%12,i=t*Math.min(a,1-a);return a-i*Math.max(-1,Math.min(s-3,9-s,1))}return[o(0),o(8),o(4)]},formats:{hsl:{coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]},hsla:{coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"],commas:!0,alpha:!0}}}),Ao=new b({id:"hsv",name:"HSV",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,100],name:"Saturation"},v:{range:[0,100],name:"Value"}},base:Ie,fromBase(n){let e=Math.max(...n),t=Math.min(...n),[a,o,r]=n,[s,i,l]=[null,0,e],c=e-t;if(c!==0){switch(e){case a:s=(o-r)/c+(o<r?6:0);break;case o:s=(r-a)/c+2;break;case r:s=(a-o)/c+4}s=s*60}return l&&(i=c/l),s>=360&&(s-=360),[s,i*100,l*100]},toBase(n){let[e,t,a]=n;e=e%360,e<0&&(e+=360),t/=100,a/=100;function o(r){let s=(r+e/60)%6;return a-a*t*Math.max(0,Math.min(s,4-s,1))}return[o(5),o(3),o(1)]},formats:{color:{id:"--hsv",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}}),Gs=new b({id:"hwb",name:"HWB",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},w:{range:[0,100],name:"Whiteness"},b:{range:[0,100],name:"Blackness"}},base:Ao,fromBase(n){let[e,t,a]=n;return[e,a*(100-t)/100,100-a]},toBase(n){let[e,t,a]=n;t/=100,a/=100;let o=t+a;if(o>=1){let i=t/o;return[e,0,i*100]}let r=1-a,s=r===0?0:1-t/r;return[e,s*100,r*100]},formats:{hwb:{coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}});const js=[[.5766690429101305,.1855582379065463,.1882286462349947],[.29734497525053605,.6273635662554661,.07529145849399788],[.02703136138641234,.07068885253582723,.9913375368376388]],Us=[[2.0415879038107465,-.5650069742788596,-.34473135077832956],[-.9692436362808795,1.8759675015077202,.04155505740717557],[.013444280632031142,-.11836239223101838,1.0151749943912054]];var Mo=new U({id:"a98rgb-linear",cssId:"--a98-rgb-linear",name:"Linear Adobe® 98 RGB compatible",white:"D65",toXYZ_M:js,fromXYZ_M:Us}),$s=new U({id:"a98rgb",cssId:"a98-rgb",name:"Adobe® 98 RGB compatible",base:Mo,toBase:n=>n.map(e=>Math.pow(Math.abs(e),563/256)*Math.sign(e)),fromBase:n=>n.map(e=>Math.pow(Math.abs(e),256/563)*Math.sign(e))});const qs=[[.7977666449006423,.13518129740053308,.0313477341283922],[.2880748288194013,.711835234241873,8993693872564e-17],[0,0,.8251046025104602]],Ws=[[1.3457868816471583,-.25557208737979464,-.05110186497554526],[-.5446307051249019,1.5082477428451468,.02052744743642139],[0,0,1.2119675456389452]];var vo=new U({id:"prophoto-linear",cssId:"--prophoto-rgb-linear",name:"Linear ProPhoto",white:"D50",base:yt,toXYZ_M:qs,fromXYZ_M:Ws});const Ys=1/512,Xs=16/512;var Zs=new U({id:"prophoto",cssId:"prophoto-rgb",name:"ProPhoto",base:vo,toBase(n){return n.map(e=>{let t=e<0?-1:1,a=e*t;return a<Xs?e/16:t*a**1.8})},fromBase(n){return n.map(e=>{let t=e<0?-1:1,a=e*t;return a>=Ys?t*a**(1/1.8):16*e})}});const mn=1.09929682680944,ua=.018053968510807;var Ks=new U({id:"--rec2020-oetf",name:"REC.2020_Scene_Referred",base:tn,referred:"scene",toBase(n){return n.map(function(e){let t=e<0?-1:1,a=e*t;return a<ua*4.5?e/4.5:t*Math.pow((a+mn-1)/mn,1/.45)})},fromBase(n){return n.map(function(e){let t=e<0?-1:1,a=e*t;return a>=ua?t*(mn*Math.pow(a,.45)-(mn-1)):4.5*e})}}),Js=new b({id:"oklch",name:"OkLCh",coords:{l:{refRange:[0,1],name:"Lightness"},c:{refRange:[0,.4],name:"Chroma"},h:{refRange:[0,360],type:"angle",name:"Hue"}},white:"D65",base:se,fromBase:ee.fromBase,toBase:ee.toBase,formats:{oklch:{coords:["<percentage> | <number>","<number> | <percentage>","<number> | <angle>"]}}});const De=2*Math.PI,yn=[[4.076741636075958,-3.307711539258063,.2309699031821043],[-1.2684379732850315,2.609757349287688,-.341319376002657],[-.0041960761386756,-.7034186179359362,1.7076146940746117]],Pn=[[[-1.8817031,-.80936501],[1.19086277,1.76576728,.59662641,.75515197,.56771245]],[[1.8144408,-1.19445267],[.73956515,-.45954404,.08285427,.12541073,-.14503204]],[[.13110758,1.81333971],[1.35733652,-.00915799,-1.1513021,-.50559606,.00692167]]],Gn=Number.MAX_VALUE,Ke=.206,At=.03,Xe=(1+Ke)/(1+At);function D(n,e){let t=n.length;if(t!==e.length)throw new Error(`Vectors of size ${t} and ${e.length} are not aligned`);let a=0;return n.forEach((o,r)=>{a+=o*e[r]}),a}function Je(n){return .5*(Xe*n-Ke+Math.sqrt((Xe*n-Ke)*(Xe*n-Ke)+4*At*Xe*n))}function ke(n){return(n**2+Ke*n)/(Xe*(n+At))}function Mt(n){let[e,t]=n;return[t/e,t/(1-e)]}function Qs(n,e){let t=.11516993+1/(7.4477897+4.1590124*e+n*(-2.19557347+1.75198401*e+n*(-2.13704948-10.02301043*e+n*(-4.24894561+5.38770819*e+4.69891013*n)))),a=.11239642+1/(1.6132032-.68124379*e+n*(.40370612+.90148123*e+n*(-.27087943+.6122399*e+n*(.00299215-.45399568*e-.14661872*n))));return[t,a]}function vt(n,e){let t=R(n,ge);return t[0]=t[0]**3,t[1]=t[1]**3,t[2]=t[2]**3,R(t,e,t)}function En(n,e,t,a){let o=ni(n,e,t,a),r=vt([1,o*n,o*e],t),s=z(1/Math.max(...r),1/3),i=s*o;return[s,i]}function ei(n,e,t,a,o,r,s,i){let l;if(i===void 0&&(i=En(n,e,r,s)),(t-o)*i[1]-(i[0]-o)*a<=0)l=i[1]*o/(a*i[0]+i[1]*(o-t));else{l=i[1]*(o-1)/(a*(i[0]-1)+i[1]*(o-t));let c=t-o,u=a,d=D(ge[0].slice(1),[n,e]),m=D(ge[1].slice(1),[n,e]),h=D(ge[2].slice(1),[n,e]),p=c+u*d,g=c+u*m,f=c+u*h,C=o*(1-l)+l*t,x=l*a,P=C+x*d,I=C+x*m,v=C+x*h,O=P**3,y=I**3,S=v**3,M=3*p*P**2,$=3*g*I**2,j=3*f*v**2,oe=6*p**2*P,ie=6*g**2*I,re=6*f**2*v,ye=D(r[0],[O,y,S])-1,q=D(r[0],[M,$,j]),ve=D(r[0],[oe,ie,re]),Be=q/(q*q-.5*ye*ve),me=-ye*Be,le=D(r[1],[O,y,S])-1,pe=D(r[1],[M,$,j]),je=D(r[1],[oe,ie,re]),Te=pe/(pe*pe-.5*le*je),ce=-le*Te,Y=D(r[2],[O,y,S])-1,Ue=D(r[2],[M,$,j]),Hn=D(r[2],[oe,ie,re]),de=Ue/(Ue*Ue-.5*Y*Hn),$e=-Y*de;me=Be>=0?me:Gn,ce=Te>=0?ce:Gn,$e=de>=0?$e:Gn,l+=Math.min(me,Math.min(ce,$e))}return l}function Bo(n,e,t){let[a,o,r]=n,s=En(o,r,e,t),i=ei(o,r,a,1,a,e,t,s),l=Mt(s),c=i/Math.min(a*l[0],(1-a)*l[1]),u=Qs(o,r),d=a*u[0],m=(1-a)*u[1],h=.9*c*Math.sqrt(Math.sqrt(1/(1/d**4+1/m**4)));return d=a*.4,m=(1-a)*.8,[Math.sqrt(1/(1/d**2+1/m**2)),h,i]}function ni(n,e,t,a){let o,r,s,i,l,c,u,d;D(a[0][0],[n,e])>1?([o,r,s,i,l]=a[0][1],[c,u,d]=t[0]):D(a[1][0],[n,e])>1?([o,r,s,i,l]=a[1][1],[c,u,d]=t[1]):([o,r,s,i,l]=a[2][1],[c,u,d]=t[2]);let m=o+r*n+s*e+i*n**2+l*n*e,h=D(ge[0].slice(1),[n,e]),p=D(ge[1].slice(1),[n,e]),g=D(ge[2].slice(1),[n,e]),f=1+m*h,C=1+m*p,x=1+m*g,P=f**3,I=C**3,v=x**3,O=3*h*f**2,y=3*p*C**2,S=3*g*x**2,M=6*h**2*f,$=6*p**2*C,j=6*g**2*x,oe=c*P+u*I+d*v,ie=c*O+u*y+d*S,re=c*M+u*$+d*j;return m=m-oe*ie/(ie**2-.5*oe*re),m}function ti(n,e,t){let[a,o,r]=n,s=ke(r),i=null,l=null;if(a=ae(a)/360,s!==0&&s!==1&&o!==0){let c=Math.cos(De*a),u=Math.sin(De*a),[d,m,h]=Bo([s,c,u],e,t),p=.8,g=1.25,f,C,x,P;o<p?(f=g*o,C=0,x=p*d,P=1-x/m):(f=5*(o-.8),C=m,x=.2*m**2*1.25**2/d,P=1-x/(h-m));let I=C+f*x/(1-P*f);i=I*c,l=I*u}return[s,i,l]}function ai(n,e,t){let a=1e-7,o=1e-4,r=n[0],s=0,i=Je(r),l=Math.sqrt(n[1]**2+n[2]**2),c=.5+Math.atan2(-n[2],-n[1])/De;if(i!==0&&i!==1&&l!==0){let d=n[1]/l,m=n[2]/l,[h,p,g]=Bo([r,d,m],e,t),f=.8,C=1.25,x,P,I,v;l<p?(P=f*h,I=1-P/p,v=l/(P+I*l),s=v*f):(x=p,P=.2*p**2*C**2/h,I=1-P/(g-p),v=(l-x)/(P+I*(l-x)),s=f+.2*v)}const u=Math.abs(s)<o;return u||i===0||Math.abs(1-i)<a?(c=null,u||(s=0)):c=ae(c*360),[c,s,i]}var oi=new b({id:"okhsl",name:"Okhsl",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,1],name:"Saturation"},l:{range:[0,1],name:"Lightness"}},base:se,gamutSpace:"self",fromBase(n){return ai(n,yn,Pn)},toBase(n){return ti(n,yn,Pn)},formats:{color:{id:"--okhsl",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}}),To=new b({id:"oklrab",name:"Oklrab",coords:{l:{refRange:[0,1],name:"Lightness"},a:{refRange:[-.4,.4]},b:{refRange:[-.4,.4]}},white:"D65",base:se,fromBase(n){return[Je(n[0]),n[1],n[2]]},toBase(n){return[ke(n[0]),n[1],n[2]]},formats:{color:{coords:["<percentage> | <number>","<number> | <percentage>[-1,1]","<number> | <percentage>[-1,1]"]}}}),ri=new b({id:"oklrch",name:"Oklrch",coords:{l:{refRange:[0,1],name:"Lightness"},c:{refRange:[0,.4],name:"Chroma"},h:{refRange:[0,360],type:"angle",name:"Hue"}},white:"D65",base:To,fromBase:ee.fromBase,toBase:ee.toBase,formats:{color:{coords:["<percentage> | <number>","<number> | <percentage>[0,1]","<number> | <angle>"]}}});function si(n,e,t){let[a,o,r]=n;a=ae(a)/360;let s=ke(r),i=null,l=null;if(s!==0&&o!==0){let c=Math.cos(De*a),u=Math.sin(De*a),d=En(c,u,e,t),[m,h]=Mt(d),p=.5,g=1-p/m,f=1-o*p/(p+h-h*g*o),C=o*h*p/(p+h-h*g*o);s=r*f;let x=r*C,P=ke(f),I=C*P/f,v=ke(s);x=x*v/s,s=v;let[O,y,S]=vt([P,c*I,u*I],e),M=z(1/Math.max(Math.max(O,y),Math.max(S,0)),1/3);s=s*M,x=x*M,i=x*c,l=x*u}return[s,i,l]}function ii(n,e,t){let a=1e-4,o=n[0],r=0,s=Je(o),i=Math.sqrt(n[1]**2+n[2]**2),l=.5+Math.atan2(-n[2],-n[1])/De;if(o!==0&&o!==1&&i!==0){let c=n[1]/i,u=n[2]/i,d=En(c,u,e,t),[m,h]=Mt(d),p=.5,g=1-p/m,f=h/(i+o*h),C=f*o,x=f*i,P=ke(C),I=x*P/C,[v,O,y]=vt([P,c*I,u*I],e),S=z(1/Math.max(Math.max(v,O),Math.max(y,0)),1/3);o=o/S,i=i/S,i=i*Je(o)/o,o=Je(o),s=o/C,r=(p+h)*x/(h*p+h*g*x)}return Math.abs(r)<a||s===0?l=null:l=ae(l*360),[l,r,s]}var li=new b({id:"okhsv",name:"Okhsv",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,1],name:"Saturation"},v:{range:[0,1],name:"Value"}},base:se,gamutSpace:"self",fromBase(n){return ii(n,yn,Pn)},toBase(n){return si(n,yn,Pn)},formats:{color:{id:"--okhsv",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}});let Eo=W.D65;const ci=216/24389,ma=24389/27,[pa,ha]=Tn({space:V,coords:Eo});var wo=new b({id:"luv",name:"Luv",coords:{l:{refRange:[0,100],name:"Lightness"},u:{refRange:[-215,215]},v:{refRange:[-215,215]}},white:Eo,base:V,fromBase(n){let e=[k(n[0]),k(n[1]),k(n[2])],t=e[1],[a,o]=Tn({space:V,coords:e});if(!Number.isFinite(a)||!Number.isFinite(o))return[0,0,0];let r=t<=ci?ma*t:116*Math.cbrt(t)-16;return[r,13*r*(a-pa),13*r*(o-ha)]},toBase(n){let[e,t,a]=n;if(e===0||B(e))return[0,0,0];t=k(t),a=k(a);let o=t/(13*e)+pa,r=a/(13*e)+ha,s=e<=8?e/ma:Math.pow((e+16)/116,3);return[s*(9*o/(4*r)),s,s*((12-3*o-20*r)/(4*r))]},formats:{color:{id:"--luv",coords:["<number> | <percentage>","<number> | <percentage>","<number> | <percentage>"]}}}),Bt=new b({id:"lchuv",name:"LChuv",coords:{l:{refRange:[0,100],name:"Lightness"},c:{refRange:[0,220],name:"Chroma"},h:{refRange:[0,360],type:"angle",name:"Hue"}},base:wo,fromBase:ee.fromBase,toBase:ee.toBase,formats:{color:{id:"--lchuv",coords:["<number> | <percentage>","<number> | <percentage>","<number> | <angle>"]}}});const di=216/24389,ui=24389/27,ga=N[0][0],fa=N[0][1],jn=N[0][2],Ca=N[1][0],xa=N[1][1],Un=N[1][2],ba=N[2][0],ya=N[2][1],$n=N[2][2];function Re(n,e,t){const a=e/(Math.sin(t)-n*Math.cos(t));return a<0?1/0:a}function Sn(n){const e=Math.pow(n+16,3)/1560896,t=e>di?e:n/ui,a=t*(284517*ga-94839*jn),o=t*(838422*jn+769860*fa+731718*ga),r=t*(632260*jn-126452*fa),s=t*(284517*Ca-94839*Un),i=t*(838422*Un+769860*xa+731718*Ca),l=t*(632260*Un-126452*xa),c=t*(284517*ba-94839*$n),u=t*(838422*$n+769860*ya+731718*ba),d=t*(632260*$n-126452*ya);return{r0s:a/r,r0i:o*n/r,r1s:a/(r+126452),r1i:(o-769860)*n/(r+126452),g0s:s/l,g0i:i*n/l,g1s:s/(l+126452),g1i:(i-769860)*n/(l+126452),b0s:c/d,b0i:u*n/d,b1s:c/(d+126452),b1i:(u-769860)*n/(d+126452)}}function Pa(n,e){const t=e/360*Math.PI*2,a=Re(n.r0s,n.r0i,t),o=Re(n.r1s,n.r1i,t),r=Re(n.g0s,n.g0i,t),s=Re(n.g1s,n.g1i,t),i=Re(n.b0s,n.b0i,t),l=Re(n.b1s,n.b1i,t);return Math.min(a,o,r,s,i,l)}var mi=new b({id:"hsluv",name:"HSLuv",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,100],name:"Saturation"},l:{range:[0,100],name:"Lightness"}},base:Bt,gamutSpace:Ie,fromBase(n){let[e,t,a]=[k(n[0]),k(n[1]),k(n[2])],o;if(e>99.9999999)o=0,e=100;else if(e<1e-8)o=0,e=0;else{let r=Sn(e),s=Pa(r,a);o=t/s*100}return[a,o,e]},toBase(n){let[e,t,a]=[k(n[0]),k(n[1]),k(n[2])],o;if(a>99.9999999)a=100,o=0;else if(a<1e-8)a=0,o=0;else{let r=Sn(a);o=Pa(r,e)/100*t}return[a,o,e]},formats:{color:{id:"--hsluv",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}});N[0][0];N[0][1];N[0][2];N[1][0];N[1][1];N[1][2];N[2][0];N[2][1];N[2][2];function Oe(n,e){return Math.abs(e)/Math.sqrt(Math.pow(n,2)+1)}function Sa(n){let e=Oe(n.r0s,n.r0i),t=Oe(n.r1s,n.r1i),a=Oe(n.g0s,n.g0i),o=Oe(n.g1s,n.g1i),r=Oe(n.b0s,n.b0i),s=Oe(n.b1s,n.b1i);return Math.min(e,t,a,o,r,s)}var pi=new b({id:"hpluv",name:"HPLuv",coords:{h:{refRange:[0,360],type:"angle",name:"Hue"},s:{range:[0,100],name:"Saturation"},l:{range:[0,100],name:"Lightness"}},base:Bt,gamutSpace:"self",fromBase(n){let[e,t,a]=[k(n[0]),k(n[1]),k(n[2])],o;if(e>99.9999999)o=0,e=100;else if(e<1e-8)o=0,e=0;else{let r=Sn(e),s=Sa(r);o=t/s*100}return[a,o,e]},toBase(n){let[e,t,a]=[k(n[0]),k(n[1]),k(n[2])],o;if(a>99.9999999)a=100,o=0;else if(a<1e-8)a=0,o=0;else{let r=Sn(a);o=Sa(r)/100*t}return[a,o,e]},formats:{color:{id:"--hpluv",coords:["<number> | <angle>","<percentage> | <number>","<percentage> | <number>"]}}}),Tt=new U({id:"rec2100-linear",name:"Linear REC.2100",white:"D65",toBase:tn.toBase,fromBase:tn.fromBase});const Ia=203,Aa=2610/2**14,hi=2**14/2610,gi=2523/2**5,Ma=2**5/2523,va=3424/2**12,Ba=2413/2**7,Ta=2392/2**7;var fi=new U({id:"rec2100pq",cssId:"rec2100-pq",name:"REC.2100-PQ",base:Tt,toBase(n){return n.map(function(e){return(Math.max(e**Ma-va,0)/(Ba-Ta*e**Ma))**hi*1e4/Ia})},fromBase(n){return n.map(function(e){let t=Math.max(e*Ia/1e4,0),a=va+Ba*t**Aa,o=1+Ta*t**Aa;return(a/o)**gi})}});const Ea=.17883277,wa=.28466892,La=.55991073,qn=3.7743;var Ci=new U({id:"rec2100hlg",cssId:"rec2100-hlg",name:"REC.2100-HLG",referred:"scene",base:Tt,toBase(n){return n.map(function(e){return e<=.5?e**2/3*qn:(Math.exp((e-La)/Ea)+wa)/12*qn})},fromBase(n){return n.map(function(e){return e/=qn,e<=1/12?z(3*e,.5):Ea*Math.log(12*e-wa)+La})}});const Lo={};fe.add("chromatic-adaptation-start",n=>{n.options.method&&(n.M=Ro(n.W1,n.W2,n.options.method))});fe.add("chromatic-adaptation-end",n=>{n.M||(n.M=Ro(n.W1,n.W2,n.options.method))});function wn({id:n,toCone_M:e,fromCone_M:t}){Lo[n]=arguments[0]}function Ro(n,e,t="Bradford"){let a=Lo[t],[o,r,s]=We(a.toCone_M,n),[i,l,c]=We(a.toCone_M,e),u=[[i/o,0,0],[0,l/r,0],[0,0,c/s]],d=We(u,a.toCone_M);return We(a.fromCone_M,d)}wn({id:"von Kries",toCone_M:[[.40024,.7076,-.08081],[-.2263,1.16532,.0457],[0,0,.91822]],fromCone_M:[[1.8599363874558397,-1.1293816185800916,.21989740959619328],[.3611914362417676,.6388124632850422,-6370596838649899e-21],[0,0,1.0890636230968613]]});wn({id:"Bradford",toCone_M:[[.8951,.2664,-.1614],[-.7502,1.7135,.0367],[.0389,-.0685,1.0296]],fromCone_M:[[.9869929054667121,-.14705425642099013,.15996265166373122],[.4323052697233945,.5183602715367774,.049291228212855594],[-.00852866457517732,.04004282165408486,.96848669578755]]});wn({id:"CAT02",toCone_M:[[.7328,.4296,-.1624],[-.7036,1.6975,.0061],[.003,.0136,.9834]],fromCone_M:[[1.0961238208355142,-.27886900021828726,.18274517938277307],[.4543690419753592,.4735331543074117,.07209780371722911],[-.009627608738429355,-.00569803121611342,1.0153256399545427]]});wn({id:"CAT16",toCone_M:[[.401288,.650173,-.051461],[-.250268,1.204414,.045854],[-.002079,.048952,.953127]],fromCone_M:[[1.862067855087233,-1.0112546305316845,.14918677544445172],[.3875265432361372,.6214474419314753,-.008973985167612521],[-.01584149884933386,-.03412293802851557,1.0499644368778496]]});Object.assign(W,{A:[1.0985,1,.35585],C:[.98074,1,1.18232],D55:[.95682,1,.92149],D75:[.94972,1,1.22638],E:[1,1,1],F2:[.99186,1,.67393],F7:[.95041,1,1.08747],F11:[1.00962,1,.6435]});W.ACES=[.32168/.33767,1,(1-.32168-.33767)/.33767];const xi=[[.6624541811085053,.13400420645643313,.1561876870049078],[.27222871678091454,.6740817658111484,.05368951740793705],[-.005574649490394108,.004060733528982826,1.0103391003129971]],bi=[[1.6410233796943257,-.32480329418479,-.23642469523761225],[-.6636628587229829,1.6153315916573379,.016756347685530137],[.011721894328375376,-.008284441996237409,.9883948585390215]];var Oo=new U({id:"acescg",cssId:"--acescg",name:"ACEScg",coords:{r:{range:[0,65504],name:"Red"},g:{range:[0,65504],name:"Green"},b:{range:[0,65504],name:"Blue"}},referred:"scene",white:W.ACES,toXYZ_M:xi,fromXYZ_M:bi});const pn=2**-16,Wn=-.35828683,hn=(Math.log2(65504)+9.72)/17.52;var yi=new U({id:"acescc",cssId:"--acescc",name:"ACEScc",coords:{r:{range:[Wn,hn],name:"Red"},g:{range:[Wn,hn],name:"Green"},b:{range:[Wn,hn],name:"Blue"}},referred:"scene",base:Oo,toBase(n){const e=-.3013698630136986;return n.map(function(t){return t<=e?(2**(t*17.52-9.72)-pn)*2:t<hn?2**(t*17.52-9.72):65504})},fromBase(n){return n.map(function(e){return e<=0?(Math.log2(pn)+9.72)/17.52:e<pn?(Math.log2(pn+e*.5)+9.72)/17.52:(Math.log2(e)+9.72)/17.52})}}),Ra=Object.freeze({__proto__:null,A98RGB:$s,A98RGB_Linear:Mo,ACEScc:yi,ACEScg:Oo,CAM16_JMh:Kr,HCT:nn,HPLuv:pi,HSL:Vs,HSLuv:mi,HSV:Ao,HWB:Gs,ICTCP:et,JzCzHz:Qn,Jzazbz:ao,LCH:ee,LCHuv:Bt,Lab:J,Lab_D65:at,Luv:wo,OKLCH:Js,OKLab:se,OKLrCH:ri,OKLrab:To,Okhsl:oi,Okhsv:li,P3:Co,P3_Linear:go,ProPhoto:Zs,ProPhoto_Linear:vo,REC_2020:ho,REC_2020_Linear:tn,REC_2020_Scene_Referred:Ks,REC_2100_HLG:Ci,REC_2100_Linear:Tt,REC_2100_PQ:fi,XYZ_ABS_D65:Pt,XYZ_D50:yt,XYZ_D65:V,sRGB:Ie,sRGB_Linear:fo});let H=class X{constructor(...e){let t;if(e.length===1){let s={};typeof e[0]=="object"&&Object.getPrototypeOf(e[0]).constructor===Object&&(e[0]={...e[0]}),t=A(e[0],{parseMeta:s}),s.format&&(this.parseMeta=s)}let a,o,r;t?(a=t.space||t.spaceId,o=t.coords,r=t.alpha):[a,o,r]=e,Object.defineProperty(this,"space",{value:b.get(a),writable:!1,enumerable:!0,configurable:!0}),this.coords=o?o.slice():[0,0,0],this.alpha=B(r)?r:r===void 0?1:vn(0,r,1);for(let s in this.space.coords)Object.defineProperty(this,s,{get:()=>this.get(s),set:i=>this.set(s,i)})}get spaceId(){return this.space.id}clone(){return new X(this.space,this.coords,this.alpha)}toJSON(){return{spaceId:this.spaceId,coords:this.coords,alpha:this.alpha}}display(...e){let t=ps(this,...e);return t.color=new X(t.color),t}static get(e,...t){return ze(e,this)?e:new X(e,...t)}static try(e,t){if(ze(e,this))return e;let a=Qa(e,t);return a?new X(a):null}static defineFunction(e,t,a=t){let{instance:o=!0,returns:r}=a,s=function(...i){let l=t(...i);if(r==="color")l=X.get(l);else if(r==="function<color>"){let c=l;l=function(...u){let d=c(...u);return X.get(d)},Object.assign(l,c)}else r==="array<color>"&&(l=l.map(c=>X.get(c)));return l};e in X||(X[e]=s),o&&(X.prototype[e]=function(...i){return s(this,...i)})}static defineFunctions(e){for(let t in e)X.defineFunction(t,e[t],e[t])}static extend(e){if(e.register)e.register(X);else for(let t in e)X.defineFunction(t,e[t])}};H.defineFunctions({get:K,getAll:on,set:ue,setAll:bt,to:w,equals:gs,inGamut:Se,toGamut:Ce,distance:to,deltas:hs,toString:Ze});Object.assign(H,{util:mr,hooks:fe,WHITES:W,Space:b,spaces:b.registry,parse:Ka,defaults:Q});for(let n of Object.keys(Ra))b.register(Ra[n]);for(let n in b.registry)ot(n,b.registry[n]);fe.add("colorspace-init-end",n=>{var e;ot(n.id,n),(e=n.aliases)==null||e.forEach(t=>{ot(t,n)})});function ot(n,e){let t=n.replace(/-/g,"_");Object.defineProperty(H.prototype,t,{get(){let a=this.getAll(n);if(typeof Proxy>"u")return a;let o=new Proxy(a,{has:(r,s)=>{try{return b.resolveCoord([e,s]),!0}catch{}return Reflect.has(r,s)},get:(r,s,i)=>{if(s&&typeof s!="symbol"&&!(s in r)&&s in o){let{index:l}=b.resolveCoord([e,s]);if(l>=0)return r[l]}return Reflect.get(r,s,i)},set:(r,s,i,l)=>{if(s&&typeof s!="symbol"&&!(s in r)||Number(s)>=0){let{index:c}=b.resolveCoord([e,s]);if(c>=0)return r[c]=i,this.setAll(n,r),!0}return Reflect.set(r,s,i,l)}});return o},set(a){this.setAll(n,a)},configurable:!0,enumerable:!0})}H.extend(Ne);H.extend({deltaE:Ye});Object.assign(H,{deltaEMethods:Ne});H.extend(Ns);H.extend({contrast:ks});H.extend(Fs);H.extend(Cs);H.extend(_s);H.extend(gn);function Ln(n){return String(n??"").trim().toUpperCase()}function T(n,e,t){return Math.min(t,Math.max(e,n))}function Ae(n,e=0){const t=Number.isFinite(Number(n))?Number(n):Number(e);return Number.isFinite(t)?(t%360+360)%360:0}function G(n){if(n instanceof H)return n;if(n&&typeof n=="object"&&Number.isFinite(n.r)&&Number.isFinite(n.g)&&Number.isFinite(n.b))try{return new H("srgb",[T((n.r||0)/255,0,1),T((n.g||0)/255,0,1),T((n.b||0)/255,0,1)])}catch{return null}if(n&&typeof n=="object"&&Number.isFinite(n.h)&&Number.isFinite(n.s)&&Number.isFinite(n.l))try{return new H("hsl",[Ae(n.h),T(n.s,0,100),T(n.l,0,100)])}catch{return null}if(n&&typeof n=="object"&&typeof n.hex=="string")return G(n.hex);if(n&&typeof n=="object"&&typeof n.space<"u"&&Array.isArray(n.coords))try{return new H(n)}catch{return null}const e=String(n??"").trim();if(!e)return null;try{return new H(e)}catch{return null}}function be(n){const e=G(n);if(!e)return null;try{return Ln(e.to("srgb").toString({format:"hex",alpha:!1,collapse:!1}))}catch{return null}}function Pi(n){const e=Ln(n);return L.HEX_6_REGEX.test(e)&&be(e)===e}function Si(n){const e=String(n??"").trim();if(!e)return null;const t=G(e),a=be(t);if(!t||!a)return null;const o=t.to("srgb"),r=t.to("hsl"),s=t.to("oklch"),[i=0,l=0,c=0]=o.coords||[],[u=0,d=0,m=0]=r.coords||[],[h=0,p=0,g=Number.NaN]=s.coords||[];return{color:t,inputValue:e,css:a,hex:a,rgb:[Math.round(T(i,0,1)*255),Math.round(T(l,0,1)*255),Math.round(T(c,0,1)*255)],hsl:{h:Ae(u),s:T(d,0,100),l:T(m,0,100)},oklch:{l:T(h,0,1),c:T(p,0,.4),h:Ae(g,u)}}}function In(n){var r;if(n&&typeof n=="object"&&Number.isFinite(n.r)&&Number.isFinite(n.g)&&Number.isFinite(n.b))return{r:Math.round(T(n.r,0,255)),g:Math.round(T(n.g,0,255)),b:Math.round(T(n.b,0,255))};const e=(r=G(n))==null?void 0:r.to("srgb"),[t=0,a=0,o=0]=(e==null?void 0:e.coords)||[];return{r:Math.round(T(t,0,1)*255),g:Math.round(T(a,0,1)*255),b:Math.round(T(o,0,1)*255)}}function Ii(n){return n&&typeof n=="object"&&Number.isFinite(n.r)&&Number.isFinite(n.g)&&Number.isFinite(n.b)?Ln(`#${[n.r,n.g,n.b].map(e=>T(Math.round(e),0,255).toString(16).padStart(2,"0")).join("")}`):be(n)}function Ai(n,e,t){return be(new H("hsl",[Ae(n),T(Number(e),0,100),T(Number(t),0,100)]))}function Mi(n){var r;const e=(r=G(n))==null?void 0:r.to("hsl"),[t=0,a=0,o=0]=(e==null?void 0:e.coords)||[];return{h:Ae(t),s:T(a,0,100),l:T(o,0,100)}}function Et(n,e={}){var r,s,i;const t=G(n);if(!t)return null;const a=Number.isFinite(e.maxChroma)?Number(e.maxChroma):.4,o=Number.isFinite(e.fallbackHue)?Number(e.fallbackHue):((i=(s=(r=G(n))==null?void 0:r.to("hsl"))==null?void 0:s.coords)==null?void 0:i[0])||0;try{const l=t.to("oklch"),[c=0,u=0,d=Number.NaN]=l.coords||[];return{l:T(c,0,1),c:T(u,0,a),h:Ae(d,o)}}catch{return null}}function vi(n,e={}){return Et(n,e)}function Bi(n,e,t,a={}){const o=Number.isFinite(a.minLightness)?Number(a.minLightness):0,r=Number.isFinite(a.maxLightness)?Number(a.maxLightness):1,s=Number.isFinite(a.maxChroma)?Number(a.maxChroma):.4,i=a.outputSpace||"srgb",l=a.gamutMethod||"oklch.c";let c=null;try{c=new H("oklch",[T(Number(n),o,r),T(Number(e),0,s),Ae(t,a.fallbackHue)])}catch{return null}if(typeof c.toGamut=="function")try{c=c.toGamut({space:i,method:l})}catch{return null}return be(c)}function Ti(n){const e=G(n);return e?e.luminance:0}function Ei(n){const e=Et(n);if(e)return e.l;const{r:t,g:a,b:o}=In(n);return(t*299+a*587+o*114)/2550}function Ho(n,e){const t=In(n),a=In(e),o=t.r-a.r,r=t.g-a.g,s=t.b-a.b;return Math.sqrt(o*o+r*r+s*s)}function wi(n,e,t={}){const a=String(t.method||"deltae76").toLowerCase();if(a==="rgb")return Ho(n,e);const o=G(n),r=G(e);return!o||!r?Number.POSITIVE_INFINITY:a==="deltae2000"||a==="2000"?o.deltaE(r,"2000"):o.deltaE(r,"76")}function rt(n,e){const t=G(n),a=G(e);return!t||!a?1:t.contrast(a,"WCAG21")}function Li(n,e={}){const t=e.lightColor||"#FFFFFF",a=e.darkColor||"#000000",o=rt(t,n),r=rt(a,n);return o>=r?t:a}function Ri(n,e,t,a={}){const o=G(n),r=G(e);if(!o||!r)return null;const s=o.range(r,{space:a.space||"srgb",outputSpace:"srgb"});return be(s(T(Number(t),0,1)))}function Oi(n,e,t,a={}){const o=G(n),r=G(e),s=Math.max(2,Math.round(Number(t)||0));return!o||!r?[]:o.steps(r,{space:a.space||"oklch",outputSpace:a.outputSpace||"srgb",steps:s}).map(i=>be(i)).filter(Boolean)}const _e={Color:H,createColor:G,parseCssColor:Si,colorToHex:be,normalizeHexColor:Ln,isValidHexColor:Pi,hexToRgb:In,rgbToHex:Ii,hslToHex:Ai,hexToHsl:Mi,colorToOklch:Et,hexToOklch:vi,oklchToHex:Bi,getRelativeLuminance:Ti,getPerceivedLightness:Ei,getRgbDistance:Ho,getColorDistance:wi,getContrastRatio:rt,getReadableTextColor:Li,mixHexColors:Ri,getHexColorSteps:Oi};window.Color=H;window.AppColorUtils=_e;const{normalizeHexColor:Rn,isValidHexColor:On}=_e,Yn=Array.isArray(L.DEFAULT_TARGET_COLORS)?L.DEFAULT_TARGET_COLORS.map(n=>Rn(n)).filter(n=>On(n)):[],Oa=Rn(L.DEFAULT_COLOR_BASE||""),ko=Yn.length>0?Yn[Math.floor(Math.random()*Yn.length)]:On(Oa)?Oa:null;let ne={palette:[],activeColor:ko,lastSource:null};function Ve(){return{palette:[...ne.palette],activeColor:ne.activeColor,lastSource:ne.lastSource}}function zo(n,e={}){$a("shared-colors:changed",{type:n,state:Ve(),metadata:e})}function Hi(n){return Array.isArray(n)?n.map(e=>Rn(e)).filter(e=>On(e)):[]}function ki(n,e={}){const t=Hi(n);return(t.length!==ne.palette.length||t.some((o,r)=>o!==ne.palette[r]))&&(ne={...ne,palette:t,lastSource:String(e.source||ne.lastSource||"")},zo("palette",e)),Ve()}function zi(n,e={}){const t=Rn(n),a=On(t)?t:null;return a===ne.activeColor||(ne={...ne,activeColor:a,lastSource:String(e.source||ne.lastSource||"")},zo("activeColor",e)),Ve()}function Fi(n){return ja("shared-colors:changed",n)}const _={getState:Ve,getDefaultActiveColor(){return ko},setPalette:ki,setActiveColor:zi,subscribe:Fi};window.AppSharedColors=_;const Ni=new Set(["automatic","monochromatic","complementary","analogous","triad","tetrad"]),Di=new Set(["color","temperature","image"]),_i=new Set(["automatic","shades","tints"]),Vi=new Set(["soft","medium","intense"]),{normalizeHexColor:Qe,isValidHexColor:wt}=_e,st=new Set;function An(n,e){return Number.isFinite(n)?Math.min(100,Math.max(0,Number(n))):e}function it(n){return Array.isArray(n)?n.map(e=>Qe(e)).filter(e=>wt(e)):[]}function Fo(n){return Di.has(n)?n:L.DEFAULT_PALETTE_BASE_MODE}function lt(n,e=L.DEFAULT_COLOR_PALETTE_TYPE){return Ni.has(n)?n:e}function No(n){return _i.has(n)?n:L.DEFAULT_MONOCHROMATIC_GENERATION_MODE}function Do(n){return Vi.has(n)?n:L.DEFAULT_ANALOGOUS_SEPARATION_MODE}function _o(n,e){const t=!!(n!=null&&n.warm),a=!!(n!=null&&n.cool);return!t&&!a?{...e}:{warm:t,cool:a}}function Gi(n){if(!n||typeof n!="object")return null;const e=String(n.dataUrl||"").trim();return e?{name:String(n.name||""),type:String(n.type||""),dataUrl:e,analysisCache:n.analysisCache??null}:null}function ji(n){if(Array.isArray(n)){const r=it(n);return r.length===0?null:{colors:r,createdAt:null,isAlternative:!1,pinnedIndexes:[],settings:null}}if(!n||typeof n!="object")return null;const e=n,t=it(e.colors);if(t.length===0)return null;const a=e.createdAt,o=a instanceof Date?new Date(a.getTime()):typeof a=="string"?a:null;return{colors:t,createdAt:o,isAlternative:!!e.isAlternative,pinnedIndexes:Array.isArray(e.pinnedIndexes)?e.pinnedIndexes.map(r=>Number(r)).filter(r=>Number.isFinite(r)&&r>=0):[],settings:e.settings&&typeof e.settings=="object"?{...e.settings}:null}}function Ui(n){return Array.isArray(n)?n.map(ji).filter(e=>!!e):[]}function $i(n){return n?{...n,analysisCache:n.analysisCache&&typeof n.analysisCache=="object"?{...n.analysisCache}:n.analysisCache}:null}function qi(n){return{colors:[...n.colors],createdAt:n.createdAt instanceof Date?new Date(n.createdAt.getTime()):n.createdAt??null,isAlternative:!!n.isAlternative,pinnedIndexes:[...n.pinnedIndexes],settings:n.settings&&typeof n.settings=="object"?{...n.settings}:null}}function Wi(n){return{...n,paletteHistory:n.paletteHistory.map(qi),uploadedBaseImage:$i(n.uploadedBaseImage),temperature:{...n.temperature},currentPalette:[...n.currentPalette],adjustments:{...n.adjustments}}}function Yi(n={}){const e=Mn();st.forEach(t=>{t(e,n)})}var Va,Ga;const Ha=((Va=_.getDefaultActiveColor)==null?void 0:Va.call(_))||((Ga=_.getState)==null?void 0:Ga.call(_).activeColor)||L.DEFAULT_COLOR_BASE;let E={paletteSize:Number(L.DEFAULT_PALETTE_SIZE)||0,paletteHistory:[],paletteHistoryIndex:-1,paletteBaseMode:Fo(L.DEFAULT_PALETTE_BASE_MODE),uploadedBaseImage:null,prioritizeImageDominantColors:!0,imagePaletteVariantIndex:0,imageInspirationVariantIndex:0,colorPaletteVariantIndex:0,selectedPaletteBaseColor:wt(Qe(Ha))?Qe(Ha):Qe(L.DEFAULT_COLOR_BASE),selectedColorPaletteType:lt(L.DEFAULT_COLOR_PALETTE_TYPE),selectedMonochromaticGenerationMode:No(L.DEFAULT_MONOCHROMATIC_GENERATION_MODE),selectedAnalogousSeparationMode:Do(L.DEFAULT_ANALOGOUS_SEPARATION_MODE),resolvedAutomaticColorPaletteType:"triad",temperature:_o(L.DEFAULT_TEMPERATURE,{warm:!0,cool:!1}),currentPalette:[],adjustments:{brightness:An(L.DEFAULT_BRIGHTNESS,L.DEFAULT_BRIGHTNESS),saturation:An(L.DEFAULT_SATURATION,L.DEFAULT_SATURATION)}};function qe(n,e={}){var a,o;if(!n||typeof n!="object")return Mn();const t={...E,paletteSize:Number.isFinite(n.paletteSize)?Math.max(0,Number(n.paletteSize)):E.paletteSize,paletteHistory:Object.prototype.hasOwnProperty.call(n,"paletteHistory")?Ui(n.paletteHistory):E.paletteHistory,paletteHistoryIndex:Number.isFinite(n.paletteHistoryIndex)?Number(n.paletteHistoryIndex):E.paletteHistoryIndex,paletteBaseMode:Object.prototype.hasOwnProperty.call(n,"paletteBaseMode")?Fo(n.paletteBaseMode):E.paletteBaseMode,uploadedBaseImage:Object.prototype.hasOwnProperty.call(n,"uploadedBaseImage")?Gi(n.uploadedBaseImage):E.uploadedBaseImage,prioritizeImageDominantColors:Object.prototype.hasOwnProperty.call(n,"prioritizeImageDominantColors")?!!n.prioritizeImageDominantColors:E.prioritizeImageDominantColors,imagePaletteVariantIndex:Number.isFinite(n.imagePaletteVariantIndex)?Math.max(0,Number(n.imagePaletteVariantIndex)):E.imagePaletteVariantIndex,imageInspirationVariantIndex:Number.isFinite(n.imageInspirationVariantIndex)?Math.max(0,Number(n.imageInspirationVariantIndex)):E.imageInspirationVariantIndex,colorPaletteVariantIndex:Number.isFinite(n.colorPaletteVariantIndex)?Math.max(0,Number(n.colorPaletteVariantIndex)):E.colorPaletteVariantIndex,selectedPaletteBaseColor:Object.prototype.hasOwnProperty.call(n,"selectedPaletteBaseColor")?(()=>{const r=Qe(n.selectedPaletteBaseColor);return wt(r)?r:E.selectedPaletteBaseColor})():E.selectedPaletteBaseColor,selectedColorPaletteType:Object.prototype.hasOwnProperty.call(n,"selectedColorPaletteType")?lt(n.selectedColorPaletteType,E.selectedColorPaletteType):E.selectedColorPaletteType,selectedMonochromaticGenerationMode:Object.prototype.hasOwnProperty.call(n,"selectedMonochromaticGenerationMode")?No(n.selectedMonochromaticGenerationMode):E.selectedMonochromaticGenerationMode,selectedAnalogousSeparationMode:Object.prototype.hasOwnProperty.call(n,"selectedAnalogousSeparationMode")?Do(n.selectedAnalogousSeparationMode):E.selectedAnalogousSeparationMode,resolvedAutomaticColorPaletteType:Object.prototype.hasOwnProperty.call(n,"resolvedAutomaticColorPaletteType")?lt(n.resolvedAutomaticColorPaletteType,E.resolvedAutomaticColorPaletteType):E.resolvedAutomaticColorPaletteType,temperature:Object.prototype.hasOwnProperty.call(n,"temperature")?_o(n.temperature,E.temperature):{...E.temperature},currentPalette:Object.prototype.hasOwnProperty.call(n,"currentPalette")?it(n.currentPalette):E.currentPalette,adjustments:{brightness:Object.prototype.hasOwnProperty.call(n,"adjustments")?An((a=n.adjustments)==null?void 0:a.brightness,E.adjustments.brightness):E.adjustments.brightness,saturation:Object.prototype.hasOwnProperty.call(n,"adjustments")?An((o=n.adjustments)==null?void 0:o.saturation,E.adjustments.saturation):E.adjustments.saturation}};return t.paletteHistory.length===0?t.paletteHistoryIndex=-1:t.paletteHistoryIndex=Math.max(-1,Math.min(t.paletteHistoryIndex,t.paletteHistory.length-1)),E=t,Yi(e),Mn()}function Mn(){return Wi(E)}function Xi(n){return typeof n!="function"?()=>{}:(st.add(n),()=>{st.delete(n)})}const Zi={getState:Mn,patchState:qe,syncFromLegacy(n,e={}){return qe(n,{...e,source:e.source||"legacy"})},syncCurrentPalette(n,e={}){return qe({currentPalette:n},e)},syncHistory(n,e,t={}){return qe({paletteHistory:n,paletteHistoryIndex:e},t)},syncAdjustments(n,e={}){return qe({adjustments:n},e)},subscribe:Xi};window.PaletteGeneratorStore=Zi;const{normalizeHexColor:ct,isValidHexColor:Ki,hexToOklch:Lt,oklchToHex:Ji,getColorDistance:Xn}=_e;function te(n,e,t){return Math.min(t,Math.max(e,Number(n)))}function Qi(n,e,t){const a=Number(n)||0,o=Number(e)||0,r=Number(t)||0;return a+(o-a)*r}function an(n={},e={}){return{brightness:Number.isFinite(n==null?void 0:n.brightness)?Number(n.brightness):Number.isFinite(e==null?void 0:e.brightness)?Number(e.brightness):0,saturation:Number.isFinite(n==null?void 0:n.saturation)?Number(n.saturation):Number.isFinite(e==null?void 0:e.saturation)?Number(e.saturation):0}}function el(n={},e={},t={}){const a=an(n,t),o=an(e,t);return{brightnessDelta:a.brightness-o.brightness,saturationDelta:a.saturation-o.saturation}}function dt(n,e={}){const t=Number.isFinite(e.minLightness)?Number(e.minLightness):.18,a=Number.isFinite(e.maxLightness)?Number(e.maxLightness):.94,o=Number.isFinite(e.gamma)?Number(e.gamma):.84,r=te((Number(n)||0)/100,0,1);return t+(a-t)*r**o}function ut(n,e={}){const t=Number.isFinite(e.minChroma)?Number(e.minChroma):.0015,a=Number.isFinite(e.maxChroma)?Number(e.maxChroma):.24,o=Number.isFinite(e.gamma)?Number(e.gamma):1.7,r=te((Number(n)||0)/100,0,1);return t+(a-t)*r**o}function nl(n,e={}){const t=ct(n),a=Lt(t);if(!a)return t;const o=Number.isFinite(e.variantIndex)?Number(e.variantIndex):0,r=an(e.settings,e.fallbackSettings),s=an(e.baseSettings,e.fallbackSettings),i=[0,-.014,.014,-.028,.028,-.04,.04],l=[0],c=[1,.99,1.01,.97,1.03],u=i[o%i.length],d=l[Math.floor(o/i.length)%l.length],m=c[Math.floor(o/(i.length*l.length))%c.length],h={minChroma:.001,maxChroma:.24,gamma:1.35},p=dt(s.brightness),g=dt(r.brightness),f=ut(s.saturation,h),C=ut(r.saturation,h),x=(g-p)*.7,P=f>1e-4?C/f:1,I=te(a.l+x+u,.14,.96),v=Math.max(a.c,.003)*m,O=te(v*te(P,.02,1.25),.001,.28);return ct(Ji(I,O,a.h+d,{minLightness:.14,maxLightness:.96,maxChroma:.28})||t)}function Me(n){return Array.isArray(n)?n.map(e=>ct(e)).filter(e=>Ki(e)):[]}function Vo(n,e){const t=Me(n),a=Me(e);if(t.length===0||a.length===0)return{exactMatch:!1,sharedColorCount:0,nextCount:t.length,referenceCount:a.length};const o=t.length===a.length&&t.every((i,l)=>i===a[l]),r=new Set(a),s=t.reduce((i,l)=>i+(r.has(l)?1:0),0);return{exactMatch:o,sharedColorCount:s,nextCount:t.length,referenceCount:a.length}}function tl(n,e){const t=Me(n),a=Me(e),o=Math.min(t.length,a.length);let r=0;for(let s=0;s<o;s+=1)t[s]===a[s]&&(r+=1);return{samePositionCount:r,comparableCount:o,nextCount:t.length,referenceCount:a.length}}function al(n,e){const t=Vo(n,e);return t.exactMatch||t.sharedColorCount>=Math.max(t.nextCount-1,3)}function ol(n,e){return e?n.samePositionCount!==e.samePositionCount?(n.samePositionCount||0)<(e.samePositionCount||0):n.isTooSimilar!==e.isTooSimilar?!n.isTooSimilar:(n.score||0)>(e.score||0):!0}function rl(n){const e=Me(n);if(e.length===0)return-1/0;if(e.length===1)return 0;const t=e.map(d=>Lt(d));let a=0,o=0,r=0;for(let d=0;d<e.length;d+=1)for(let m=d+1;m<e.length;m+=1){const h=(Xn==null?void 0:Xn(e[d],e[m],{method:"deltae2000"}))||0;a+=Math.min(h/34,1),h<10&&(r+=(10-h)/10),o+=1}const s=o>0?a/o:0,i=t.reduce((d,m)=>d+te(((m==null?void 0:m.c)??0)/.24*100,0,100),0)/t.length,l=t.reduce((d,m)=>d+te(((m==null?void 0:m.l)??.5)*100,0,100),0)/t.length,c=1-Math.min(Math.abs(i-42)/42,1),u=1-Math.min(Math.abs(l-58)/58,1);return s*2.1+c*.75+u*.7-r*.9}function sl(n){const e=Me(n);if(e.length===0)return-1/0;const t=e.map(p=>Lt(p)),a=t.reduce((p,g)=>p+te(((g==null?void 0:g.c)??0)/.24*100,0,100),0)/t.length,o=t.reduce((p,g)=>p+te(((g==null?void 0:g.l)??.5)*100,0,100),0)/t.length,r=t.reduce((p,g)=>{const f=te(((g==null?void 0:g.c)??0)/.24*100,0,100);return p+Math.abs(f-a)},0)/t.length,s=t.reduce((p,g)=>{const f=te(((g==null?void 0:g.l)??.5)*100,0,100);return p+Math.abs(f-o)},0)/t.length,i=t.filter(p=>((p==null?void 0:p.c)??0)/.24*100>62).length,l=t.filter(p=>{const g=((p==null?void 0:p.l)??.5)*100;return g<22||g>82}).length,c=t.filter(p=>{const g=((p==null?void 0:p.c)??0)/.24*100;return g>=18&&g<=52}).length,u=1-Math.min(Math.abs(a-36)/36,1),d=1-Math.min(Math.abs(o-58)/58,1),m=1-Math.min(Math.abs(r-12)/20,1),h=1-Math.min(Math.abs(s-13)/22,1);return u*.95+d*.85+m*.65+h*.6+c/t.length*.4-i/t.length*.85-l/t.length*.75}const il={clampControlValue:te,blendControlValue:Qi,resolvePaletteAdjustmentSettings:an,getPaletteAdjustmentDeltas:el,mapBrightnessValueToOklchLightness:dt,mapSaturationValueToOklchChroma:ut,getAdjustedPaletteColor:nl,normalizePaletteHexCollection:Me,getPaletteSimilarityMetrics:Vo,getPalettePositionalSimilarityMetrics:tl,arePalettesTooSimilar:al,isBetterPaletteFallbackCandidate:ol,scorePaletteHarmony:rl,scorePaletteElegance:sl};window.PaletteGeneratorCoreHelpers=il;function ll(){if(window.AppDom)return window.AppDom;const n=document.getElementById("palette"),e=document.querySelector(".controls"),t=document.querySelector(".palette-section"),a=document.getElementById("history"),o=document.getElementById("paletteBaseControlGroup"),r=document.getElementById("paletteBaseModeSelect"),s=document.getElementById("colorBasePanel"),i=document.getElementById("temperatureBasePanel"),l=document.getElementById("imageBasePanel"),c=document.getElementById("paletteColorSwatchBtn"),u=document.getElementById("paletteColorSwatchFill"),d=document.getElementById("paletteColorTextInput"),m=document.getElementById("paletteColorInputFeedback"),h=document.getElementById("paletteColorPicker"),p=document.getElementById("paletteTypeOptions"),g=document.getElementById("paletteTypeResolvedLabel"),f=document.getElementById("monochromaticModeControl"),C=document.getElementById("monochromaticModeSelect"),x=document.getElementById("analogousSeparationControl"),P=document.getElementById("analogousSeparationSelect"),I=document.getElementById("paletteImageInput"),v=document.getElementById("paletteImageDropzonePanel"),O=document.getElementById("paletteImageDropzone"),y=document.getElementById("paletteImagePreview"),S=document.getElementById("paletteImagePreviewImg"),M=document.getElementById("paletteImageName"),$=document.getElementById("paletteImageDominantToggle"),j=document.getElementById("paletteImageReplaceBtn"),oe=document.getElementById("paletteIntensityControlGroup"),ie=document.getElementById("brightnessControlGroup"),re=document.getElementById("brightness"),ye=document.getElementById("saturation"),q=document.getElementById("saturationControlGroup"),ve=document.getElementById("paletteAdjustBtn"),Be=document.getElementById("paletteAdjustPanel"),me=document.getElementById("paletteUndoBtn"),le=document.getElementById("paletteRedoBtn"),pe=document.getElementById("paletteViewport"),je=document.getElementById("paletteLoadingOverlay"),Te=document.getElementById("paletteImageExtractionAlert"),ce=document.getElementById("addColorBtn"),Y=document.getElementById("colorPicker"),Ue=document.querySelector(".add-color"),Hn=document.getElementById("paletteGenerationButtons"),de=document.getElementById("copyHexBtn"),$e=document.getElementById("paletteRegenerateBtn"),$o=document.getElementById("paletteInspirationBtn"),qo=document.getElementById("generateBtn"),Wo=document.getElementById("surpriseBtn"),Yo=(de==null?void 0:de.querySelector(".tooltip"))??null,Xo=(de==null?void 0:de.querySelector("span"))??null,Zo=document.getElementById("resetPaletteBtn"),Ko=document.getElementById("warmBtn"),Jo=document.getElementById("coolBtn"),Qo=document.querySelectorAll(".size"),er=(ce==null?void 0:ce.querySelector("span"))??null,nr=document.getElementById("brightnessValue"),Ot=document.querySelectorAll(".brightness-labels .brightness-icon"),tr=Ot[0]||null,ar=Ot[1]||null,or=document.getElementById("saturationValue"),Ht=document.querySelectorAll(".saturation-labels .saturation-icon"),rr=Ht[0]||null,sr=Ht[1]||null;let Ee=document.querySelector(".card-edit-input");Ee||(Ee=document.createElement("input"),Ee.type="color",Ee.className="card-edit-input",document.body.appendChild(Ee)),Y&&(Y.disabled=!0,Y.tabIndex=-1,Y.style.pointerEvents="none",Y.setAttribute("aria-hidden","true"));const kt={paletteContainer:n,controlsPanel:e,paletteSection:t,historyContainer:a,paletteBaseControlGroup:o,paletteBaseModeSelect:r,colorBasePanel:s,temperatureBasePanel:i,imageBasePanel:l,paletteColorSwatchBtn:c,paletteColorSwatchFill:u,paletteColorTextInput:d,paletteColorInputFeedback:m,paletteColorPicker:h,paletteTypeOptions:p,paletteTypeResolvedLabel:g,monochromaticModeControl:f,monochromaticModeSelect:C,analogousSeparationControl:x,analogousSeparationSelect:P,paletteImageInput:I,paletteImageDropzonePanel:v,paletteImageDropzone:O,paletteImagePreview:y,paletteImagePreviewImg:S,paletteImageName:M,paletteImageDominantToggle:$,paletteImageReplaceBtn:j,paletteIntensityControlGroup:oe,brightnessControlGroup:ie,brightnessInput:re,saturationInput:ye,saturationControlGroup:q,paletteAdjustBtn:ve,paletteAdjustPanel:Be,paletteUndoBtn:me,paletteRedoBtn:le,paletteViewport:pe,paletteLoadingOverlay:je,paletteImageExtractionAlert:Te,addColorBtn:ce,colorPicker:Y,addColorElement:Ue,paletteGenerationButtons:Hn,copyHexBtn:de,paletteRegenerateBtn:$e,paletteInspirationBtn:$o,generateBtn:qo,surpriseBtn:Wo,copyHexBtnTooltip:Yo,copyHexBtnLabel:Xo,resetPaletteBtn:Zo,warmBtn:Ko,coolBtn:Jo,sizeButtons:Qo,addColorLabel:er,brightnessValueLabel:nr,darkBrightnessIcon:tr,lightBrightnessIcon:ar,saturationValueLabel:or,lowSaturationIcon:rr,highSaturationIcon:sr,globalEditPicker:Ee};return window.AppDom=kt,kt}let ka=!1;function cl(){if(ka)return window.AppShell;const n="palette_generator",e=Array.from(document.querySelectorAll(".view-tab")),t=Array.from(document.querySelectorAll("nav button")),a=document.querySelector(".logo img");function o(c){const u=String(c??"").trim();return e.some(m=>m.id===u)?u:n}function r(c){t.forEach(u=>{u.classList.toggle("active",u.getAttribute("data-view")===c)})}function s(c,u={}){const d=o(c);return e.forEach(m=>{m.classList.toggle("active",m.id===d)}),r(d),qa.emit("app:view-changed",{view:d,metadata:u}),d}function i(){return s(location.hash.replace("#",""),{source:"location"})}if(t.forEach(c=>{c.addEventListener("click",()=>{const u=c.getAttribute("data-view");if(!u)return;const d=s(u,{source:"nav"});history.replaceState(null,"",`#${d}`),window.scrollTo({top:0,behavior:"auto"})})}),window.addEventListener("hashchange",i),i(),a&&!matchMedia("(prefers-reduced-motion: reduce)").matches){const c=()=>{a.style.setProperty("--scroll-rotate",`${window.scrollY*.2}deg`)};window.addEventListener("scroll",c,{passive:!0}),c()}const l={showView:s,getCurrentView(){var c;return((c=document.querySelector(".view-tab.active"))==null?void 0:c.id)||n}};return window.AppShell=l,ka=!0,l}function dl(){gt.list().forEach(e=>{typeof(e==null?void 0:e.initialize)=="function"&&e.initialize()})}class Rt{constructor(e,t,a){F(this,"r");F(this,"g");F(this,"b");this.r=0,this.g=0,this.b=0,this.set(e,t,a)}set(e,t,a){this.r=this.clamp(e),this.g=this.clamp(t),this.b=this.clamp(a)}copyFrom(e){return this.set(e.r,e.g,e.b),this}toCssRgb(){return`rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`}hueRotate(e=0){const t=e/180*Math.PI,a=Math.sin(t),o=Math.cos(t);this.multiply([.213+o*.787-a*.213,.715-o*.715-a*.715,.072-o*.072+a*.928,.213-o*.213+a*.143,.715+o*.285+a*.14,.072-o*.072-a*.283,.213-o*.213-a*.787,.715-o*.715+a*.715,.072+o*.928+a*.072])}grayscale(e=1){this.multiply([.2126+.7874*(1-e),.7152-.7152*(1-e),.0722-.0722*(1-e),.2126-.2126*(1-e),.7152+.2848*(1-e),.0722-.0722*(1-e),.2126-.2126*(1-e),.7152-.7152*(1-e),.0722+.9278*(1-e)])}sepia(e=1){this.multiply([.393+.607*(1-e),.769-.769*(1-e),.189-.189*(1-e),.349-.349*(1-e),.686+.314*(1-e),.168-.168*(1-e),.272-.272*(1-e),.534-.534*(1-e),.131+.869*(1-e)])}saturate(e=1){this.multiply([.213+.787*e,.715-.715*e,.072-.072*e,.213-.213*e,.715+.285*e,.072-.072*e,.213-.213*e,.715-.715*e,.072+.928*e])}brightness(e=1){this.linear(e)}contrast(e=1){this.linear(e,-(.5*e)+.5)}linear(e=1,t=0){this.r=this.clamp(this.r*e+t*255),this.g=this.clamp(this.g*e+t*255),this.b=this.clamp(this.b*e+t*255)}invert(e=1){this.r=this.clamp((e+this.r/255*(1-2*e))*255),this.g=this.clamp((e+this.g/255*(1-2*e))*255),this.b=this.clamp((e+this.b/255*(1-2*e))*255)}multiply(e){const t=this.clamp(this.r*e[0]+this.g*e[1]+this.b*e[2]),a=this.clamp(this.r*e[3]+this.g*e[4]+this.b*e[5]),o=this.clamp(this.r*e[6]+this.g*e[7]+this.b*e[8]);this.r=t,this.g=a,this.b=o}hsl(){const e=this.r/255,t=this.g/255,a=this.b/255,o=Math.max(e,t,a),r=Math.min(e,t,a),s=o-r;let i=0,l=0;const c=(o+r)/2;if(s!==0){switch(l=c>.5?s/(2-o-r):s/(o+r),o){case e:i=(t-a)/s+(t<a?6:0);break;case t:i=(a-e)/s+2;break;default:i=(e-t)/s+4;break}i/=6}return{h:i*100,s:l*100,l:c*100}}clamp(e){return Math.max(0,Math.min(255,e))}}class Go{constructor(e){F(this,"target");F(this,"targetHsl");F(this,"reusedColor");this.target=e,this.targetHsl=e.hsl(),this.reusedColor=new Rt(0,0,0)}solve(){const e=this.solveWide(),t=this.solveNarrow(e),a=this.solveAdaptive(t),o=this.colorFromFilters(a.values);return{values:a.values,loss:a.loss,filterValue:this.filterValue(a.values),css:this.css(a.values),colorCss:o.toCssRgb()}}solveWide(){const a=[60,180,18e3,600,1.2,1.2],o=[50,20,3750,50,100,100];let r={loss:Number.POSITIVE_INFINITY,values:o};for(let s=0;s<7&&r.loss>2.5;s+=1){const i=this.spsa(5,a,15,o.slice(),1200);i.loss<r.loss&&(r=i)}return r}solveNarrow(e){let t={...e,values:e.values.slice()};for(let a=0;a<4;a+=1){const o=t.loss,r=2,s=o+1,i=[.25*s,.25*s,s,.25*s,.2*s,.2*s],l=this.spsa(o,i,r,t.values.slice(),600);if(l.loss<t.loss&&(t=l),t.loss<.8)break}return t}solveAdaptive(e){let t={...e,values:e.values.slice()};if(t.loss<=6)return t;const a=t.loss>12?3:2,o=t.loss>12?900:700;for(let r=0;r<a;r+=1){const s=t.loss+1,i=1.5,l=[.22*s,.22*s,.95*s,.22*s,.18*s,.18*s],c=this.spsa(s,l,i,t.values.slice(),o);if(c.loss<t.loss&&(t=c),t.loss<3)break}return t}spsa(e,t,a,o,r){const i=.16666666666666666;let l=Number.POSITIVE_INFINITY,c=o.slice();const u=new Array(6).fill(0),d=new Array(6).fill(0),m=new Array(6).fill(0);for(let h=0;h<r;h+=1){const p=a/Math.pow(h+1,i);for(let C=0;C<6;C+=1)u[C]=Math.random()>.5?1:-1,d[C]=o[C]+p*u[C],m[C]=o[C]-p*u[C];const g=this.loss(d)-this.loss(m);for(let C=0;C<6;C+=1){const x=g/(2*p)*u[C],P=t[C]/Math.pow(e+h+1,1);o[C]=this.fix(o[C]-P*x,C)}const f=this.loss(o);f<l&&(l=f,c=o.slice())}return{values:c,loss:l}}fix(e,t){let a=100;return t===2?a=7500:(t===4||t===5)&&(a=200),t===3?e>a?e%a:e<0?a+e%a:e:Math.max(0,Math.min(a,e))}loss(e){const t=this.colorFromFilters(e),a=t.hsl();return Math.abs(t.r-this.target.r)+Math.abs(t.g-this.target.g)+Math.abs(t.b-this.target.b)+Math.abs(a.h-this.targetHsl.h)+Math.abs(a.s-this.targetHsl.s)+Math.abs(a.l-this.targetHsl.l)}colorFromFilters(e){const t=this.reusedColor;return t.set(0,0,0),t.invert(e[0]/100),t.sepia(e[1]/100),t.saturate(e[2]/100),t.hueRotate(e[3]*3.6),t.brightness(e[4]/100),t.contrast(e[5]/100),t}filterValue(e){return[`invert(${Math.round(e[0])}%)`,`sepia(${Math.round(e[1])}%)`,`saturate(${Math.round(e[2])}%)`,`hue-rotate(${Math.round(e[3]*3.6)}deg)`,`brightness(${Math.round(e[4])}%)`,`contrast(${Math.round(e[5])}%)`].join(" ")}css(e){return`filter: ${this.filterValue(e)};`}}function mt(n){const e=String(n??"").trim();return/^#?[0-9a-f]{3}([0-9a-f]{3})?$/i.test(e)?e.startsWith("#")?e.toUpperCase():`#${e.toUpperCase()}`:e}function jo(n){return n<1?"Resultado excelente.":n<4?"Resultado muy cercano al color objetivo.":n<10?"Resultado bueno, con una ligera desviacion.":"Resultado util, pero algo alejado del color objetivo."}const ul={Color:Rt,Solver:Go,normalizeHexInputValue:mt,getLossMessage:jo};window.HexToFilterCore=ul;let pt=!1,Uo=()=>!1;function ml(n){const e=n.querySelector(".target"),t=n.querySelector(".filter-copy-btn"),a=n.querySelector(".target-color-swatch"),o=n.querySelector(".target-color-swatch-fill"),r=n.querySelector(".filter-target-picker"),s=n.querySelector(".filter-tool-feedback"),i=n.querySelector(".filter-code-output"),l=n.querySelector(".lossDetail"),c=n.querySelector(".filterPixel"),u=n.querySelector(".filter-source-icon-after");return!e||!t||!a||!o||!r||!s||!i||!l||!c||!u?null:{textInput:e,copyButton:t,swatchButton:a,swatchFill:o,colorPicker:r,feedback:s,filterCodeOutput:i,lossDetail:l,filterPreviewPixel:c,filterPreviewImage:u,copyTooltip:t.querySelector(".tooltip")}}function za(){var P,I,v,O;if(pt)return;const n=document.getElementById("hex_to_code");if(!n)return;const e=ml(n);if(!e)return;const t=Array.isArray(L.DEFAULT_TARGET_COLORS)?L.DEFAULT_TARGET_COLORS:["#9EBB89"],a=((P=_.getDefaultActiveColor)==null?void 0:P.call(_))||((I=_.getState)==null?void 0:I.call(_).activeColor)||L.DEFAULT_COLOR_BASE||t[0];pt=!0;const o=((v=e.copyTooltip)==null?void 0:v.textContent)??"Copiar CSS a portapapeles";let r=null,s=null,i="";function l(y){const S=mt(y);if(!S)return null;const M=_e.parseCssColor(S);return M?{hex:M.hex,css:M.css,rgb:M.rgb,inputValue:S}:null}function c(){e.textInput.classList.remove("is-invalid"),e.feedback.textContent=""}function u(){e.textInput.classList.add("is-invalid"),e.feedback.textContent="No se ha detectado un color valido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido."}function d(y,S={}){e.swatchFill.style.backgroundColor=y.css,e.colorPicker.value=y.hex,S.publish!==!1&&_.setActiveColor(y.hex,{source:S.source||"hex-to-filter"})}function m(y){const S=l(y);return S&&_e.getReadableTextColor(S.hex)==="#000000"?"var(--primary)":"var(--on-accent)"}function h(){if(!e.copyTooltip)return;const y=i||e.filterPreviewPixel.style.backgroundColor||"var(--accent)",S=m(y);e.copyTooltip.style.setProperty("--tooltip-feedback-bg",y),e.copyTooltip.style.setProperty("--tooltip-feedback-fg",S),e.copyTooltip.textContent="¡Copiado!",e.copyTooltip.classList.add("is-copied-feedback"),e.copyButton.classList.add("show-feedback"),s&&window.clearTimeout(s),s=window.setTimeout(()=>{e.copyTooltip&&(e.copyTooltip.textContent=o,e.copyTooltip.classList.remove("is-copied-feedback"),e.copyButton.classList.remove("show-feedback"),e.copyTooltip.style.removeProperty("--tooltip-feedback-bg"),e.copyTooltip.style.removeProperty("--tooltip-feedback-fg"))},1400)}function p(y){i=y.colorCss,e.filterCodeOutput.textContent=y.css,e.lossDetail.textContent=`Loss: ${y.loss.toFixed(1)}. ${jo(y.loss)}`,e.filterPreviewPixel.style.backgroundColor=y.colorCss,e.filterPreviewImage.style.filter=y.filterValue}function g(y={}){const S=y.normalizedColor||l(e.textInput.value);if(!S)return u(),null;e.textInput.value!==S.inputValue&&(e.textInput.value=S.inputValue),c(),d(S,y);const M=new Rt(S.rgb[0],S.rgb[1],S.rgb[2]),j=new Go(M).solve();return p(j),j}function f(y,S={}){const M=l(y);return M?(e.textInput.value=M.inputValue,!!g({normalizedColor:M,publish:S.publish,source:S.source})):!1}function C(){r&&window.clearTimeout(r),r=window.setTimeout(()=>{const y=l(e.textInput.value);y&&g({normalizedColor:y})},220)}Uo=f,e.textInput.addEventListener("input",()=>{const y=l(e.textInput.value);y&&(e.textInput.value!==y.inputValue&&(e.textInput.value=y.inputValue),c(),d(y,{publish:!1}),C())}),e.textInput.addEventListener("blur",()=>{const y=mt(e.textInput.value);y&&e.textInput.value!==y&&(e.textInput.value=y)}),e.textInput.addEventListener("keydown",y=>{y.key==="Enter"&&(y.preventDefault(),g())}),e.swatchButton.addEventListener("click",()=>{if(typeof e.colorPicker.showPicker=="function"){e.colorPicker.showPicker();return}e.colorPicker.click()}),e.colorPicker.addEventListener("input",()=>{const y=e.colorPicker.value.toUpperCase();f(y,{source:"hex-to-filter"})}),e.copyButton.addEventListener("click",async()=>{var y;try{await Ya.writeText(((y=e.filterCodeOutput.textContent)==null?void 0:y.trim())||""),h()}catch{}}),e.textInput.value=a,e.colorPicker.value=a;const x=l(e.textInput.value)||l(a);x&&g({normalizedColor:x,publish:!1}),(O=_.subscribe)==null||O.call(_,(y={})=>{const{type:S,state:M,metadata:$}=y;S!=="activeColor"||!(M!=null&&M.activeColor)||($==null?void 0:$.source)!=="hex-to-filter"&&f(String(M.activeColor),{publish:!1})})}function pl(){const n={initialize:za,setTargetColor(e){return pt||za(),Uo(e,{source:"hex-to-filter"})}};return window.HexToFilterApp=n,gt.register("hex-to-filter",n),n}function hl(n){if(document.querySelector(`script[data-legacy-script="${n.id}"]`))return;const e=document.createElement("script");e.type="text/javascript",e.dataset.legacyScript=n.id,e.text=`${n.code}
//# sourceURL=${n.id}`,document.body.appendChild(e)}function gl(n){n.forEach(hl)}const fl=`// COLOR NAMES CUSTOM LIST
// Used to find the nearest color name for a HEX value

window.AppColorNames = [

  // ━━━━━━━━━━━━━━━━━━━
  // 1 · NEUTRALS
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Void", hex: "#1a1a1a" },
  { name: "Obsidian", hex: "#0b0b0b" },
  { name: "Charcoal", hex: "#2f2f2f" },
  { name: "Graphite", hex: "#3b3b3b" },
  { name: "Slate", hex: "#708090" },
  { name: "Stone", hex: "#7a7a7a" },
  { name: "Nimbus", hex: "#8c92ac" },
  { name: "Pewter", hex: "#96a8a1" },
  { name: "Smoke", hex: "#b2b2b2" },
  { name: "Ash", hex: "#d3d3d3" },
  { name: "Silver", hex: "#c0c0c0" },
  { name: "Platinum", hex: "#e5e4e2" },

  // ━━━━━━━━━━━━━━━━━━━
  // 2 · LIGHTS
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Ivory", hex: "#fffff0" },
  { name: "Pearl", hex: "#f8f6f0" },
  { name: "Cream", hex: "#fffdd0" },
  { name: "Vanilla", hex: "#f3e5ab" },
  { name: "Beige", hex: "#f5f5dc" },
  { name: "Linen", hex: "#faf0e6" },
  { name: "Almond", hex: "#efdecd" },
  { name: "Champagne", hex: "#f7e7ce" },
  { name: "Bone", hex: "#e3dac9" },
  { name: "Porcelain", hex: "#f8f8ff" },
  { name: "Shell", hex: "#f2e9de" },
  { name: "Oat", hex: "#dfd3c3" },

  // ━━━━━━━━━━━━━━━━━━━
  // 3 · RED
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Scarlet", hex: "#ff2400" },
  { name: "Crimson", hex: "#dc143c" },
  { name: "Ruby", hex: "#b00030" },
  { name: "Cherry", hex: "#d2042d" },
  { name: "Rose", hex: "#ff6b81" },
  { name: "Cerise", hex: "#de3163" },
  { name: "Burgundy", hex: "#800020" },
  { name: "Wine", hex: "#722f37" },
  { name: "Garnet", hex: "#8b0000" },
  { name: "Brick", hex: "#b22222" },
  { name: "Poppy", hex: "#ff4040" },

  // ━━━━━━━━━━━━━━━━━━━
  // 4 · ORANGE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Tangerine", hex: "#ffa500" },
  { name: "Ember", hex: "#ff8c00" },
  { name: "Apricot", hex: "#ffd39b" },
  { name: "Amber", hex: "#ffbf00" },
  { name: "Peach", hex: "#ffcc99" },
  { name: "Carrot", hex: "#ed9121" },
  { name: "Pumpkin", hex: "#ff7518" },
  { name: "Flame", hex: "#e25822" },
  { name: "Sunset", hex: "#fd5e53" },
  { name: "Papaya", hex: "#ff9700" },
  { name: "Marigold", hex: "#fdae1d" },
  { name: "Cantaloupe", hex: "#fca172" },

  // ━━━━━━━━━━━━━━━━━━━
  // 5 · YELLOW
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Solar", hex: "#ffff00" },
  { name: "Saffron", hex: "#ffdf00" },
  { name: "Lemon", hex: "#fff44f" },
  { name: "Mustard", hex: "#e1ad01" },
  { name: "Gold", hex: "#ffd700" },
  { name: "Honey", hex: "#ffc30b" },
  { name: "Butter", hex: "#fff1a8" },
  { name: "Canary", hex: "#ffef00" },
  { name: "Dandelion", hex: "#f0e130" },
  { name: "Flax", hex: "#eedc82" },
  { name: "Maize", hex: "#f4d054" },
  { name: "Sunflower", hex: "#ffda03" },

  // ━━━━━━━━━━━━━━━━━━━
  // 6 · GREEN
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Lime", hex: "#32cd32" },
  { name: "Emerald", hex: "#008000" },
  { name: "Pine", hex: "#01796f" },
  { name: "Meadow", hex: "#90ee90" },
  { name: "Olive", hex: "#808000" },
  { name: "Mint", hex: "#98ff98" },
  { name: "Jade", hex: "#00a86b" },
  { name: "Moss", hex: "#8a9a5b" },
  { name: "Clover", hex: "#3ea055" },
  { name: "Fern", hex: "#4f7942" },
  { name: "Sage", hex: "#9caf88" },
  { name: "Matcha", hex: "#7fbf5f" },

  // ━━━━━━━━━━━━━━━━━━━
  // 7 · TURQUOISE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Teal", hex: "#008080" },
  { name: "Turquoise", hex: "#40e0d0" },
  { name: "Cyan", hex: "#00ffff" },
  { name: "Lagoon", hex: "#20b2aa" },
  { name: "Aqua", hex: "#7fdbff" },
  { name: "Glacier", hex: "#78dbe2" },
  { name: "Ice", hex: "#99ffff" },
  { name: "Breeze", hex: "#6ec6ca" },
  { name: "Caribbean", hex: "#00cc99" },
  { name: "Seafoam", hex: "#71eeb8" },
  { name: "Atoll", hex: "#00b3b8" },

  // ━━━━━━━━━━━━━━━━━━━
  // 8 · BLUE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Blue", hex: "#0000ff" },
  { name: "Sky", hex: "#87ceeb" },
  { name: "Azure", hex: "#007fff" },
  { name: "Cobalt", hex: "#0047ab" },
  { name: "Navy", hex: "#000080" },
  { name: "Indigo", hex: "#4b0082" },
  { name: "Denim", hex: "#1560bd" },
  { name: "Ocean Deep", hex: "#006994" },
  { name: "Sapphire", hex: "#0f52ba" },
  { name: "Cornflower", hex: "#6495ed" },
  { name: "Cerulean", hex: "#2a52be" },
  { name: "Midnight", hex: "#191970" },

  // ━━━━━━━━━━━━━━━━━━━
  // 9 · PURPLE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Orchid", hex: "#800080" },
  { name: "Amethyst", hex: "#9966cc" },
  { name: "Lilac", hex: "#c8a2c8" },
  { name: "Violet", hex: "#8f00ff" },
  { name: "Lavender", hex: "#e6e6fa" },
  { name: "Plum", hex: "#8e4585" },
  { name: "Grape", hex: "#6f2da8" },
  { name: "Mulberry", hex: "#70193d" },
  { name: "Iris", hex: "#5a4fcf" },
  { name: "Periwinkle", hex: "#ccccff" },
  { name: "Wisteria", hex: "#c9a0dc" },

  // ━━━━━━━━━━━━━━━━━━━
  // 10 · PINK
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Magenta", hex: "#ff00ff" },
  { name: "Fuchsia", hex: "#ff4fd8" },
  { name: "Pink", hex: "#ffc0cb" },
  { name: "Flamingo", hex: "#ff69b4" },
  { name: "Blush", hex: "#f4c2c2" },
  { name: "Rosewater", hex: "#f6c1cc" },
  { name: "Bubblegum", hex: "#ff85c1" },
  { name: "Petal", hex: "#ffb7c5" },
  { name: "Carnation", hex: "#ffa6c9" },
  { name: "Peony", hex: "#ff8fb1" },
  { name: "Cotton Candy", hex: "#ffbcd9" },

  // ━━━━━━━━━━━━━━━━━━━
  // 11 · EARTH
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Umber", hex: "#8b4513" },
  { name: "Sienna", hex: "#a0522d" },
  { name: "Mocha", hex: "#967969" },
  { name: "Chocolate", hex: "#7b3f00" },
  { name: "Terracotta", hex: "#e2725b" },
  { name: "Cinnamon", hex: "#d2691e" },
  { name: "Clay", hex: "#b66a50" },
  { name: "Russet", hex: "#80461b" },
  { name: "Walnut", hex: "#5d432c" },
  { name: "Chestnut", hex: "#954535" },
  { name: "Toffee", hex: "#c68642" },

  // ━━━━━━━━━━━━━━━━━━━
  // 12 · WATER
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Ocean", hex: "#0077be" },
  { name: "Deep Sea", hex: "#003f5c" },
  { name: "Wave", hex: "#4ca3dd" },
  { name: "River", hex: "#3f8fc1" },
  { name: "Lake", hex: "#4f86a6" },
  { name: "Glacial", hex: "#b2f0ff" },
  { name: "Ice Water", hex: "#dff6ff" },
  { name: "Mist", hex: "#cfdfe8" },

  // ━━━━━━━━━━━━━━━━━━━
  // 13 · SKY
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Dawn", hex: "#f4c2c2" },
  { name: "Sunrise", hex: "#ffb347" },
  { name: "Golden Hour", hex: "#f6c85f" },
  { name: "Twilight", hex: "#6b5ca5" },
  { name: "Dusk", hex: "#4a3f55" },
  { name: "Night Sky", hex: "#1c1f4a" },

  // ━━━━━━━━━━━━━━━━━━━
  // 14 · NATURE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Forest", hex: "#2e5d34" },
  { name: "Leaf", hex: "#6b8e23" },
  { name: "Grass", hex: "#7cfc00" },
  { name: "Bark", hex: "#6a4e42" },
  { name: "Soil", hex: "#5c4033" },
  { name: "Sand Dune", hex: "#d2b48c" },

  // ━━━━━━━━━━━━━━━━━━━
  // 15 · COFFEE
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Espresso", hex: "#4b2e2b" },
  { name: "Americano", hex: "#6f4e37" },
  { name: "Cappuccino", hex: "#c0a080" },
  { name: "Latte", hex: "#d6bfa9" },
  { name: "Macchiato", hex: "#c8a27a" },
  { name: "Flat White", hex: "#e6d3b3" },
  { name: "Roasted Bean", hex: "#3b2f2f" },
  { name: "Cold Brew", hex: "#5a3a2e" },

  // ━━━━━━━━━━━━━━━━━━━
  // 16 · SWEETS
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Caramel", hex: "#c68e17" },
  { name: "Honey Syrup", hex: "#f2aa4c" },
  { name: "Vanilla Frosting", hex: "#f3e5ab" },
  { name: "Strawberry Cream", hex: "#ff9aa2" },
  { name: "Blueberry Jam", hex: "#4f5d95" },
  { name: "Chocolate Glaze", hex: "#5a3825" },
  { name: "Sugar Dust", hex: "#fff5f5" },

  // ━━━━━━━━━━━━━━━━━━━
  // 17 · FLOWERS
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Rose Petal", hex: "#ffb7c5" },
  { name: "Tulip", hex: "#ff878d" },
  { name: "Cherry Blossom", hex: "#ffc1cc" },
  { name: "Lavender Bloom", hex: "#c4a3ff" },
  { name: "Orchid Bloom", hex: "#da70d6" },
  { name: "Sunflower Bloom", hex: "#ffc512" },
  { name: "Daisy", hex: "#fff8dc" },
  { name: "Bluebell", hex: "#7289da" },

  // ━━━━━━━━━━━━━━━━━━━
  // 18 · COSMIC (final)
  // ━━━━━━━━━━━━━━━━━━━

  { name: "Cosmos", hex: "#483d8b" },
  { name: "Aurora", hex: "#7fffd4" },
  { name: "Galaxy", hex: "#2a2a72" },
  { name: "Comet", hex: "#d6f0ff" },
  { name: "Meteor", hex: "#ff6f3c" },
  { name: "Nebula", hex: "#6c63ff" },
  { name: "Stardust", hex: "#cfd8ff" },
  { name: "Moonbeam", hex: "#dfefff" },

];`,Cl=`\uFEFF// GLOBAL VARIABLES

const {
  paletteContainer,
  controlsPanel,
  paletteSection,
  historyContainer,
  paletteBaseControlGroup,
  paletteBaseModeSelect,
  colorBasePanel,
  temperatureBasePanel,
  imageBasePanel,
  paletteColorSwatchBtn,
  paletteColorSwatchFill,
  paletteColorTextInput,
  paletteColorInputFeedback,
  paletteColorPicker,
  paletteTypeOptions,
  paletteTypeResolvedLabel,
  monochromaticModeControl,
  monochromaticModeSelect,
  analogousSeparationControl,
  analogousSeparationSelect,
  paletteImageInput,
  paletteImageDropzonePanel,
  paletteImageDropzone,
  paletteImagePreview,
  paletteImagePreviewImg,
  paletteImageName,
  paletteImageDominantToggle,
  paletteImageReplaceBtn,
  paletteIntensityControlGroup,
  brightnessControlGroup,
  brightnessInput,
  saturationInput,
  saturationControlGroup,
  paletteAdjustBtn,
  paletteAdjustPanel,
  paletteUndoBtn,
  paletteRedoBtn,
  paletteViewport,
  paletteLoadingOverlay,
  paletteImageExtractionAlert,
  addColorBtn,
  addColorElement,
  paletteGenerationButtons,
  copyHexBtn,
  paletteRegenerateBtn,
  paletteInspirationBtn,
  generateBtn,
  surpriseBtn,
  copyHexBtnTooltip,
  copyHexBtnLabel,
  resetPaletteBtn,
  warmBtn,
  coolBtn,
  sizeButtons,
  addColorLabel,
  brightnessValueLabel,
  darkBrightnessIcon,
  lightBrightnessIcon,
  saturationValueLabel,
  lowSaturationIcon,
  highSaturationIcon,
  globalEditPicker,
} = window.AppDom;

const {
  DISALLOWED_COLORS,
  MAX_UNIQUE_COLOR_ATTEMPTS,
  MAX_PALETTE_COLORS,
  CARD_COPY_TOOLTIP_DEFAULT,
  HISTORY_COPY_TOOLTIP_DEFAULT,
  ADD_DISABLED_LABEL,
  DEFAULT_PALETTE_SIZE,
  DEFAULT_PALETTE_BASE_MODE,
  DEFAULT_TEMPERATURE,
  DEFAULT_COLOR_BASE,
  DEFAULT_COLOR_PALETTE_TYPE,
  DEFAULT_MONOCHROMATIC_GENERATION_MODE,
  DEFAULT_ANALOGOUS_SEPARATION_MODE,
  DEFAULT_BRIGHTNESS,
  DEFAULT_SATURATION,
  LOW_SATURATION_FALLBACK_THRESHOLD,
  LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS,
} = window.AppConstants;

const colorUtilsForState = window.AppColorUtils || {};
const stateCreateColor =
  typeof colorUtilsForState.createColor === "function"
    ? colorUtilsForState.createColor
    : () => null;

const COLOR_NAME_REFERENCES = Array.isArray(window.AppColorNames)
  ? window.AppColorNames
  : [];
const paletteGeneratorStore = window.PaletteGeneratorStore || null;
const paletteGeneratorStoreState = paletteGeneratorStore?.getState?.() || null;

// Shared runtime state used by all script files
let paletteSize = Number.isFinite(paletteGeneratorStoreState?.paletteSize)
  ? paletteGeneratorStoreState.paletteSize
  : DEFAULT_PALETTE_SIZE;
let paletteHistory = Array.isArray(paletteGeneratorStoreState?.paletteHistory)
  ? [...paletteGeneratorStoreState.paletteHistory]
  : [];
let paletteHistoryIndex = Number.isFinite(paletteGeneratorStoreState?.paletteHistoryIndex)
  ? paletteGeneratorStoreState.paletteHistoryIndex
  : -1;
let paletteBaseMode = paletteGeneratorStoreState?.paletteBaseMode || DEFAULT_PALETTE_BASE_MODE;
let uploadedBaseImage = paletteGeneratorStoreState?.uploadedBaseImage || null;
let prioritizeImageDominantColors =
  typeof paletteGeneratorStoreState?.prioritizeImageDominantColors === "boolean"
    ? paletteGeneratorStoreState.prioritizeImageDominantColors
    : (paletteImageDominantToggle?.checked ?? true);
let imagePaletteVariantIndex = Number.isFinite(paletteGeneratorStoreState?.imagePaletteVariantIndex)
  ? paletteGeneratorStoreState.imagePaletteVariantIndex
  : 0;
let imageInspirationVariantIndex = Number.isFinite(
  paletteGeneratorStoreState?.imageInspirationVariantIndex
)
  ? paletteGeneratorStoreState.imageInspirationVariantIndex
  : 0;
let recentInspiredPalettes = [];
let selectedPaletteBaseColor =
  paletteGeneratorStoreState?.selectedPaletteBaseColor ||
  window.AppSharedColors?.getDefaultActiveColor?.() ||
  window.AppSharedColors?.getState?.().activeColor ||
  DEFAULT_COLOR_BASE;
let selectedColorPaletteType =
  paletteGeneratorStoreState?.selectedColorPaletteType || DEFAULT_COLOR_PALETTE_TYPE;
let selectedMonochromaticGenerationMode =
  paletteGeneratorStoreState?.selectedMonochromaticGenerationMode ||
  DEFAULT_MONOCHROMATIC_GENERATION_MODE;
let selectedAnalogousSeparationMode =
  paletteGeneratorStoreState?.selectedAnalogousSeparationMode ||
  DEFAULT_ANALOGOUS_SEPARATION_MODE;
let resolvedAutomaticColorPaletteType =
  paletteGeneratorStoreState?.resolvedAutomaticColorPaletteType || "triad";
let temperature = paletteGeneratorStoreState?.temperature
  ? {
      warm: !!paletteGeneratorStoreState.temperature.warm,
      cool: !!paletteGeneratorStoreState.temperature.cool,
    }
  : {
      warm: !!DEFAULT_TEMPERATURE.warm,
      cool: !!DEFAULT_TEMPERATURE.cool,
    };

const copyHexBtnDefaultTooltip =
  copyHexBtnTooltip?.textContent ?? HISTORY_COPY_TOOLTIP_DEFAULT;
const copyHexBtnDefaultLabel = copyHexBtnLabel?.textContent?.trim() ?? "Copiar HEX";
const addColorDefaultLabel = addColorLabel?.textContent?.trim() ?? "Añadir color";
let currentPalette = Array.isArray(paletteGeneratorStoreState?.currentPalette)
  ? [...paletteGeneratorStoreState.currentPalette]
  : [];
let paletteAdjustmentBase = [];
let paletteAdjustmentBaseSettings = {
  brightness: Number.isFinite(paletteGeneratorStoreState?.adjustments?.brightness)
    ? paletteGeneratorStoreState.adjustments.brightness
    : DEFAULT_BRIGHTNESS,
  saturation: Number.isFinite(paletteGeneratorStoreState?.adjustments?.saturation)
    ? paletteGeneratorStoreState.adjustments.saturation
    : DEFAULT_SATURATION,
};
let copyBtnFeedbackTimeout = null;
let activeEditCard = null;
let activeEditOriginalColor = "#000000";

function getPaletteGeneratorStoreAdjustmentValues(settings = {}) {
  return {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : (brightnessInput ? Number(brightnessInput.value) : paletteAdjustmentBaseSettings.brightness),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : (saturationInput ? Number(saturationInput.value) : paletteAdjustmentBaseSettings.saturation),
  };
}

function syncPaletteGeneratorStoreState(partial = {}, metadata = {}) {
  if (!paletteGeneratorStore?.syncFromLegacy) {
    return null;
  }

  return paletteGeneratorStore.syncFromLegacy(partial, metadata);
}

function syncPaletteGeneratorStoreAdjustments(settings = {}, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      adjustments: getPaletteGeneratorStoreAdjustmentValues(settings),
    },
    metadata
  );
}

function syncPaletteGeneratorStoreCurrentPalette(colors = currentPalette, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      currentPalette: Array.isArray(colors) ? [...colors] : [],
    },
    metadata
  );
}

function syncPaletteGeneratorStoreHistoryState(metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      paletteHistory,
      paletteHistoryIndex,
    },
    metadata
  );
}

function syncPaletteGeneratorStoreColorVariantIndex(variantIndex = 0, metadata = {}) {
  return syncPaletteGeneratorStoreState(
    {
      colorPaletteVariantIndex: Number.isFinite(variantIndex) ? variantIndex : 0,
    },
    metadata
  );
}

function syncPaletteGeneratorStoreWithLegacyState(partial = {}, metadata = {}) {
  const nextState = {
    paletteSize,
    paletteHistory,
    paletteHistoryIndex,
    paletteBaseMode,
    uploadedBaseImage,
    prioritizeImageDominantColors,
    imagePaletteVariantIndex,
    imageInspirationVariantIndex,
    selectedPaletteBaseColor,
    selectedColorPaletteType,
    selectedMonochromaticGenerationMode,
    selectedAnalogousSeparationMode,
    resolvedAutomaticColorPaletteType,
    temperature: {
      warm: !!temperature?.warm,
      cool: !!temperature?.cool,
    },
    currentPalette,
    adjustments: getPaletteGeneratorStoreAdjustmentValues(),
    ...partial,
  };

  if (typeof colorPaletteVariantIndex !== "undefined") {
    nextState.colorPaletteVariantIndex = colorPaletteVariantIndex;
  }

  return syncPaletteGeneratorStoreState(nextState, metadata);
}

syncPaletteGeneratorStoreWithLegacyState();

const COLOR_NAME_REFERENCES_COLOR = COLOR_NAME_REFERENCES.map((entry) => ({
  ...entry,
  color: stateCreateColor(entry.hex),
}));
`,xl=`\uFEFF// Palette generator core: shared state helpers, adjustments, scoring and commit flow.
const controlsHslToHex = window.AppColorUtils?.hslToHex;
const controlsNormalizeHexColor = window.AppColorUtils?.normalizeHexColor;
const controlsIsValidHexColor = window.AppColorUtils?.isValidHexColor;
const controlsHexToRgb = window.AppColorUtils?.hexToRgb;
const controlsHexToHsl = window.AppColorUtils?.hexToHsl;
const controlsHexToOklch = window.AppColorUtils?.hexToOklch;
const controlsOklchToHex = window.AppColorUtils?.oklchToHex;
const controlsGetRgbDistance = window.AppColorUtils?.getRgbDistance;
if (
  typeof controlsHslToHex !== "function" ||
  typeof controlsNormalizeHexColor !== "function" ||
  typeof controlsIsValidHexColor !== "function" ||
  typeof controlsHexToRgb !== "function" ||
  typeof controlsHexToHsl !== "function" ||
  typeof controlsHexToOklch !== "function" ||
  typeof controlsOklchToHex !== "function" ||
  typeof controlsGetRgbDistance !== "function"
) {
  throw new Error("AppColorUtils helpers are required before script-controls.js loads.");
}
const paletteGeneratorCoreHelpers = window.PaletteGeneratorCoreHelpers || {};
if (
  typeof paletteGeneratorCoreHelpers.clampControlValue !== "function" ||
  typeof paletteGeneratorCoreHelpers.blendControlValue !== "function" ||
  typeof paletteGeneratorCoreHelpers.resolvePaletteAdjustmentSettings !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPaletteAdjustmentDeltas !== "function" ||
  typeof paletteGeneratorCoreHelpers.mapBrightnessValueToOklchLightness !== "function" ||
  typeof paletteGeneratorCoreHelpers.mapSaturationValueToOklchChroma !== "function" ||
  typeof paletteGeneratorCoreHelpers.getAdjustedPaletteColor !== "function" ||
  typeof paletteGeneratorCoreHelpers.normalizePaletteHexCollection !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPaletteSimilarityMetrics !== "function" ||
  typeof paletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics !== "function" ||
  typeof paletteGeneratorCoreHelpers.arePalettesTooSimilar !== "function" ||
  typeof paletteGeneratorCoreHelpers.isBetterPaletteFallbackCandidate !== "function" ||
  typeof paletteGeneratorCoreHelpers.scorePaletteHarmony !== "function" ||
  typeof paletteGeneratorCoreHelpers.scorePaletteElegance !== "function"
) {
  throw new Error("PaletteGeneratorCoreHelpers are required before palette-generator-core.js loads.");
}

let saturationAttentionTimeout = null;
let isPaletteImageDropzoneVisible = true;
let isReplaceImagePending = false;
let isPaletteAdjustPanelOpen = false;
let paletteLoadingOverlayDepth = 0;
const imagePanelTransitionMs = 320;
const allowedPaletteImageTypes = new Set(["image/jpeg", "image/png", "image/svg+xml", "image/webp"]);
const allowedPaletteImageExtensions = [".jpg", ".jpeg", ".png", ".svg", ".webp"];
const IMAGE_EXTRACTION_ERROR_MESSAGE =
  "No se ha podido extraer colores. Has de intentar subir otra imagen.";
const IMAGE_PALETTE_VARIANT_PROFILES = [
  { hueShift: 0, saturationShift: 0, lightnessShift: 0, stagger: [0, 0, 0, 0] },
  { hueShift: 4, saturationShift: -6, lightnessShift: 8, stagger: [0, 6, -4, 10] },
  { hueShift: -5, saturationShift: 8, lightnessShift: -6, stagger: [0, -8, 6, -12] },
  { hueShift: 10, saturationShift: -10, lightnessShift: 4, stagger: [0, 10, -6, 14] },
  { hueShift: -12, saturationShift: 6, lightnessShift: 10, stagger: [0, -10, 8, -6] },
  { hueShift: 16, saturationShift: -4, lightnessShift: -10, stagger: [0, 12, -10, 6] },
];
const IMAGE_INSPIRATION_VARIANT_PROFILES = [
  { hueShift: 10, saturationShift: 10, lightnessShift: 8, accentHueShift: 22, accentBoost: 18, neutralLift: 8 },
  { hueShift: -14, saturationShift: 6, lightnessShift: -6, accentHueShift: -24, accentBoost: 20, neutralLift: 3 },
  { hueShift: 18, saturationShift: -8, lightnessShift: 10, accentHueShift: 28, accentBoost: 16, neutralLift: 10 },
  { hueShift: -20, saturationShift: 12, lightnessShift: 4, accentHueShift: -26, accentBoost: 22, neutralLift: 4 },
  { hueShift: 8, saturationShift: -6, lightnessShift: -10, accentHueShift: 18, accentBoost: 14, neutralLift: -2 },
  { hueShift: 24, saturationShift: 4, lightnessShift: -4, accentHueShift: 34, accentBoost: 24, neutralLift: 6 },
  { hueShift: -26, saturationShift: -2, lightnessShift: 12, accentHueShift: -32, accentBoost: 18, neutralLift: 11 },
];
const MAX_RECENT_INSPIRED_PALETTES = 8;

function blendControlValue(fromValue, toValue, ratio) {
  return paletteGeneratorCoreHelpers.blendControlValue(fromValue, toValue, ratio);
}

function setPaletteLoadingOverlayState(isVisible) {
  if (!paletteLoadingOverlay || !paletteViewport) {
    return;
  }

  paletteLoadingOverlay.hidden = !isVisible;
  paletteLoadingOverlay.setAttribute("aria-hidden", isVisible ? "false" : "true");
  paletteViewport.classList.toggle("is-loading", isVisible);
}

function waitForPaletteLoadingOverlayPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

async function withPaletteLoadingOverlay(task) {
  const shouldWaitForPaint = paletteLoadingOverlayDepth === 0;
  paletteLoadingOverlayDepth += 1;
  setPaletteLoadingOverlayState(true);

  try {
    if (shouldWaitForPaint) {
      await waitForPaletteLoadingOverlayPaint();
    }

    return await task();
  } finally {
    paletteLoadingOverlayDepth = Math.max(0, paletteLoadingOverlayDepth - 1);
    if (paletteLoadingOverlayDepth === 0) {
      setPaletteLoadingOverlayState(false);
    }
  }
}

function resolvePaletteAdjustmentSettings(settings = {}) {
  return paletteGeneratorCoreHelpers.resolvePaletteAdjustmentSettings(
    settings,
    {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    }
  );
}

function isValidPaletteHex(hex) {
  return controlsIsValidHexColor(hex);
}

function updateUploadedImageAnalysisCache(cachePatch) {
  if (!uploadedBaseImage) {
    return;
  }

  uploadedBaseImage.analysisCache = {
    ...(uploadedBaseImage.analysisCache || {}),
    ...cachePatch,
  };

  syncPaletteGeneratorStoreState(
    {
      uploadedBaseImage,
    },
    {
      scope: "uploaded-image-cache",
    }
  );
}

function updateRangeControl(input, valueLabel, lowIcon, highIcon) {
  if (!input) {
    return;
  }

  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const value = parseFloat(input.value);

  // Update slider fill based on current value
  const percent = ((value - min) / (max - min)) * 100;

  input.style.setProperty("--value", percent + "%");
  if (valueLabel) {
    valueLabel.textContent = \`\${Math.round(percent)}%\`;
  }

  if (lowIcon) {
    lowIcon.style.transform = "none";
    lowIcon.style.opacity = \`\${Math.max(0.5, 1 - (percent / 100) * 0.4)}\`;
  }
  if (highIcon) {
    highIcon.style.transform = "none";
    highIcon.style.opacity = \`\${Math.max(0.5, 0.5 + (percent / 100) * 0.4)}\`;
  }
}

const updateBrightnessProgress = () =>
  updateRangeControl(
    brightnessInput,
    brightnessValueLabel,
    darkBrightnessIcon,
    lightBrightnessIcon
  );

const updateSaturationProgress = () =>
  updateRangeControl(
    saturationInput,
    saturationValueLabel,
    lowSaturationIcon,
    highSaturationIcon
  );

function getCurrentPaletteAdjustmentSnapshot() {
  return resolvePaletteAdjustmentSettings();
}

function capturePaletteAdjustmentBase(colors = currentPalette, settings = getCurrentPaletteAdjustmentSnapshot()) {
  const validColors = Array.isArray(colors)
    ? colors
        .map((color) => controlsNormalizeHexColor(color))
        .filter((hex) => isValidPaletteHex(hex))
    : [];

  paletteAdjustmentBase = [...validColors];
  paletteAdjustmentBaseSettings = resolvePaletteAdjustmentSettings({
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : DEFAULT_BRIGHTNESS,
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : DEFAULT_SATURATION,
  });
}

function getPaletteAdjustmentDeltas(
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  return paletteGeneratorCoreHelpers.getPaletteAdjustmentDeltas(
    settings,
    baseSettings,
    {
      brightness: getCurrentBrightnessValue(),
      saturation: getCurrentSaturationValue(),
    }
  );
}

function mapBrightnessValueToOklchLightness(
  brightness,
  options = {}
) {
  return paletteGeneratorCoreHelpers.mapBrightnessValueToOklchLightness(brightness, options);
}

function mapSaturationValueToOklchChroma(
  saturation,
  options = {}
) {
  return paletteGeneratorCoreHelpers.mapSaturationValueToOklchChroma(saturation, options);
}

function getAdjustedPaletteColor(
  hex,
  variantIndex = 0,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  return paletteGeneratorCoreHelpers.getAdjustedPaletteColor(
    hex,
    {
      variantIndex,
      settings,
      baseSettings,
      fallbackSettings: {
        brightness: DEFAULT_BRIGHTNESS,
        saturation: DEFAULT_SATURATION,
      },
    }
  );
}

function buildAdjustedPaletteFromBase(
  colors = paletteAdjustmentBase,
  settings = getCurrentPaletteAdjustmentSnapshot(),
  baseSettings = paletteAdjustmentBaseSettings
) {
  const adjustedPalette = [];
  const usedColors = new Set();
  const baseCardIndex =
    paletteBaseMode === "color" && typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(Array.isArray(colors) ? colors.length : 0)
      : -1;
  const complementaryCardIndex =
    paletteBaseMode === "color" && typeof getComplementaryRoleCardIndex === "function"
      ? getComplementaryRoleCardIndex(Array.isArray(colors) ? colors.length : 0)
      : -1;

  colors.forEach((color, colorIndex) => {
    if (colorIndex === baseCardIndex && paletteBaseMode === "color") {
      const fixedBaseColor = controlsNormalizeHexColor(selectedPaletteBaseColor || color);
      if (!usedColors.has(fixedBaseColor)) {
        usedColors.add(fixedBaseColor);
        adjustedPalette.push(fixedBaseColor);
        return;
      }
    }

    if (colorIndex === complementaryCardIndex && paletteBaseMode === "color") {
      const fixedComplementaryColor = controlsNormalizeHexColor(color);
      if (!usedColors.has(fixedComplementaryColor)) {
        usedColors.add(fixedComplementaryColor);
        adjustedPalette.push(fixedComplementaryColor);
        return;
      }
    }

    let fallbackCandidate = controlsNormalizeHexColor(color);

    for (let variantIndex = 0; variantIndex < 28; variantIndex++) {
      const candidate = getAdjustedPaletteColor(
        color,
        variantIndex + colorIndex * 2,
        settings,
        baseSettings
      );
      fallbackCandidate = candidate || fallbackCandidate;
      if (usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      adjustedPalette.push(candidate);
      return;
    }

    adjustedPalette.push(fallbackCandidate);
  });

  return adjustedPalette;
}

function buildRenderedPaletteFromBaseColors(colors, settings) {
  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  return buildAdjustedPaletteFromBase(colors, resolvedSettings, resolvedSettings);
}

function renderAdjustedPalette(colors) {
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mergedColors = mergePaletteWithPinnedColors(colors, pinnedEntries);
  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedColors.length)
    .map((entry) => entry.index);
  const cards = Array.from(getColorCards());

  if (cards.length !== mergedColors.length) {
    getColorCards().forEach((card) => card.remove());
    mergedColors.forEach((color, index) => {
      createColorCard(color, {
        pinned: pinnedIndexes.includes(index),
      });
    });
  } else {
    cards.forEach((card, index) => {
      setCardColor(card, mergedColors[index]);
      setCardPinnedState(card, pinnedIndexes.includes(index));
    });
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();
  syncCurrentPaletteFromDom();
}

function applyCurrentPaletteAdjustments() {
  if (!Array.isArray(paletteAdjustmentBase) || paletteAdjustmentBase.length === 0) {
    return;
  }

  renderAdjustedPalette(buildAdjustedPaletteFromBase());
}

function normalizePaletteHexCollection(colors) {
  return paletteGeneratorCoreHelpers.normalizePaletteHexCollection(colors);
}

function getPaletteSimilarityMetrics(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.getPaletteSimilarityMetrics(nextPalette, referencePalette);
}

function getPalettePositionalSimilarityMetrics(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.getPalettePositionalSimilarityMetrics(
    nextPalette,
    referencePalette
  );
}

function arePalettesTooSimilar(nextPalette, referencePalette) {
  return paletteGeneratorCoreHelpers.arePalettesTooSimilar(nextPalette, referencePalette);
}

function getPinnedPaletteIndexSet(pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  const indexSet = new Set();

  if (!Array.isArray(pinnedEntries)) {
    return indexSet;
  }

  pinnedEntries.forEach((entry) => {
    if (Number.isFinite(entry?.index) && entry.index >= 0) {
      indexSet.add(entry.index);
    }
  });

  return indexSet;
}

function getComparablePaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);

  if (normalizedColors.length === 0 || pinnedIndexes.size === 0) {
    return normalizedColors;
  }

  return normalizedColors.filter((color, index) => !pinnedIndexes.has(index));
}

function getComparableMergedPaletteSlice(colors, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  return getComparablePaletteSlice(
    mergePaletteWithPinnedColors(colors, pinnedEntries),
    pinnedEntries
  );
}

function isBetterPaletteFallbackCandidate(nextCandidate, currentFallbackCandidate) {
  return paletteGeneratorCoreHelpers.isBetterPaletteFallbackCandidate(
    nextCandidate,
    currentFallbackCandidate
  );
}

function getMutablePaletteSlotCount(totalCount = paletteSize, pinnedEntries = getPinnedPaletteEntriesSnapshot()) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) {
    return 0;
  }

  const pinnedIndexes = getPinnedPaletteIndexSet(pinnedEntries);
  let pinnedCount = 0;

  pinnedIndexes.forEach((index) => {
    if (index < totalCount) {
      pinnedCount += 1;
    }
  });

  return Math.max(0, totalCount - pinnedCount);
}

function clearRecentInspiredPalettes() {
  recentInspiredPalettes = [];
}

function rememberInspiredPalette(colors) {
  const normalizedPalette = normalizePaletteHexCollection(colors);
  if (normalizedPalette.length === 0) {
    return;
  }

  const signature = normalizedPalette.join("|");
  recentInspiredPalettes = recentInspiredPalettes
    .filter((palette) => normalizePaletteHexCollection(palette).join("|") !== signature)
    .concat([normalizedPalette])
    .slice(-MAX_RECENT_INSPIRED_PALETTES);
}

function isPaletteTooSimilarToRecentInspiredPalettes(nextPalette, recentPalettes = recentInspiredPalettes) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(recentPalettes) || recentPalettes.length === 0) {
    return false;
  }

  return recentPalettes.some((palette) => arePalettesTooSimilar(normalizedPalette, palette));
}
function clampControlValue(value, min, max) {
  return paletteGeneratorCoreHelpers.clampControlValue(value, min, max);
}

function getCurrentBrightnessValue() {
  const sliderValue = brightnessInput
    ? parseFloat(brightnessInput.value)
    : DEFAULT_BRIGHTNESS;

  return Number.isFinite(sliderValue) ? sliderValue : DEFAULT_BRIGHTNESS;
}

function getCurrentSaturationValue() {
  const saturationValue = saturationInput
    ? parseFloat(saturationInput.value)
    : DEFAULT_SATURATION;

  return Number.isFinite(saturationValue) ? saturationValue : DEFAULT_SATURATION;
}

function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}
function scorePaletteHarmony(colors) {
  return paletteGeneratorCoreHelpers.scorePaletteHarmony(colors);
}

function scorePaletteElegance(colors) {
  return paletteGeneratorCoreHelpers.scorePaletteElegance(colors);
}

function setPaletteAdjustmentControls(settings) {
  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    updateSaturationProgress();
  }

  syncTemperatureControlsState();
  syncPaletteGeneratorStoreAdjustments(settings, {
    scope: "adjustments-controls",
  });
}

function getPinnedPaletteEntriesSnapshot() {
  if (typeof getCurrentPaletteCardEntries !== "function") {
    return [];
  }

  if (
    typeof isCardPinningAvailable === "function" &&
    !isCardPinningAvailable()
  ) {
    return [];
  }

  if (
    typeof isColorModeMonochromaticScaleActive === "function" &&
    isColorModeMonochromaticScaleActive()
  ) {
    return [];
  }

  return getCurrentPaletteCardEntries()
    .filter((entry) => {
      if (!entry.pinned) {
        return false;
      }

      if (entry.card?.dataset.readonlyFixedPin === "true") {
        return false;
      }

      // In color mode, the base card is controlled by the base-color input,
      // so it should not behave like a regular pinned slot during regeneration.
      const baseCardIndex =
        typeof getColorModeBaseCardIndex === "function"
          ? getColorModeBaseCardIndex(getColorCards().length)
          : 0;
      if (paletteBaseMode === "color" && entry.index === baseCardIndex) {
        return false;
      }

      const complementaryCardIndex =
        typeof getComplementaryRoleCardIndex === "function"
          ? getComplementaryRoleCardIndex(getColorCards().length)
          : -1;
      if (
        typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected() &&
        paletteBaseMode === "color" &&
        entry.index === complementaryCardIndex
      ) {
        return false;
      }

      return true;
    })
    .map((entry) => ({
      index: entry.index,
      hex: controlsNormalizeHexColor(entry.hex),
    }))
    .filter((entry) => isValidPaletteHex(entry.hex));
}

function mergePaletteWithPinnedColors(nextPalette, pinnedEntries = []) {
  const normalizedPalette = normalizePaletteHexCollection(nextPalette);
  if (normalizedPalette.length === 0 || !Array.isArray(pinnedEntries) || pinnedEntries.length === 0) {
    return normalizedPalette;
  }

  const mergedPalette = new Array(normalizedPalette.length).fill(null);
  const usedColors = new Set();

  pinnedEntries.forEach((entry) => {
    if (!Number.isFinite(entry?.index) || entry.index < 0 || entry.index >= mergedPalette.length) {
      return;
    }

    const normalizedHex = controlsNormalizeHexColor(entry.hex);
    if (!isValidPaletteHex(normalizedHex) || usedColors.has(normalizedHex)) {
      return;
    }

    mergedPalette[entry.index] = normalizedHex;
    usedColors.add(normalizedHex);
  });

  const availableColors = normalizedPalette.filter((color) => !usedColors.has(color));
  let colorCursor = 0;

  for (let index = 0; index < mergedPalette.length; index += 1) {
    if (mergedPalette[index]) {
      continue;
    }

    const nextColor = availableColors[colorCursor];
    if (!nextColor) {
      break;
    }

    mergedPalette[index] = nextColor;
    usedColors.add(nextColor);
    colorCursor += 1;
  }

  return mergedPalette.filter((color) => isValidPaletteHex(color));
}

function commitGeneratedPalette(nextPalette, options = {}) {
  const previousPalette = normalizePaletteHexCollection(
    options.previousPalette ?? currentPalette
  );
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  let mergedPalette = mergePaletteWithPinnedColors(nextPalette, pinnedEntries);

  if (
    paletteBaseMode === "color" &&
    options.effectiveType === "complementary" &&
    paletteSize === 2 &&
    typeof buildComplementaryColorModePalette === "function"
  ) {
    const explicitComplementaryPair = buildComplementaryColorModePalette(
      2,
      getCurrentPaletteAdjustmentSnapshot(),
      {
        baseColor:
          typeof getPaletteBaseColorSnapshot === "function"
            ? getPaletteBaseColorSnapshot()
            : null,
        variantIndex: 0,
      }
    );

    if (explicitComplementaryPair.length === 2) {
      mergedPalette = explicitComplementaryPair;
    }
  }

  const pinnedIndexes = pinnedEntries
    .filter((entry) => Number.isFinite(entry?.index) && entry.index >= 0 && entry.index < mergedPalette.length)
    .map((entry) => entry.index);

  setPaletteImageExtractionFeedback(false);
  getColorCards().forEach((card) => card.remove());

  capturePaletteAdjustmentBase(mergedPalette);
  const shouldRenderRawGeneratedPalette =
    paletteBaseMode === "color" &&
    ["monochromatic", "complementary", "analogous", "triad", "tetrad"].includes(
      options.effectiveType
    );

  currentPalette = shouldRenderRawGeneratedPalette
    ? [...mergedPalette]
    : mergePaletteWithPinnedColors(
      buildAdjustedPaletteFromBase(),
      pinnedEntries
    );
  currentPalette.forEach((color, index) => {
    createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
    });
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();

  const generatedPalette = normalizePaletteHexCollection(currentPalette);
  const hasExactPaletteChanged =
    previousPalette.length !== generatedPalette.length ||
    previousPalette.some((color, index) => color !== generatedPalette[index]);

  if (hasExactPaletteChanged || paletteHistory.length === 0) {
    saveHistory(currentPalette, {
      isAlternative: !!options.usedAlternativePalette,
      pinnedIndexes,
    });
  }
}

async function generatePalette(options = {}) {
  return withPaletteLoadingOverlay(async () => {
    let nextPalette = [];
    let usedAlternativePalette = false;
    let effectiveColorPaletteType = null;
    const previousPalette = normalizePaletteHexCollection(
      options.referencePalette ?? currentPalette
    );

    if (paletteBaseMode === "image") {
      try {
        nextPalette = await buildImageBasedPalette(paletteSize);
      } catch (error) {
        console.error(error);
        alert("No se pudo generar una paleta desde esta imagen.");
        return;
      }

      if (nextPalette.length === 0) {
        setPaletteImageExtractionFeedback(true);
        revealPaletteImageDropzoneForRetry();
        return;
      }
    } else if (paletteBaseMode === "color") {
      const effectiveType = options.effectiveType || getEffectiveColorPaletteType();
      const shouldRecalculateFromScratch = !!options.recalculateFromScratch;
      const candidate = shouldRecalculateFromScratch
        ? {
            palette: buildColorModePaletteForSettings(
              paletteSize,
              getCurrentPaletteAdjustmentSnapshot(),
              {
                baseColor:
                  typeof getPaletteBaseColorSnapshot === "function"
                    ? getPaletteBaseColorSnapshot()
                    : null,
                effectiveType,
                variantIndex:
                  effectiveType === "monochromatic" || effectiveType === "complementary"
                    ? 0
                    : colorPaletteVariantIndex,
              }
            ),
            effectiveType,
            variantIndex:
              effectiveType === "monochromatic" || effectiveType === "complementary"
                ? 0
                : colorPaletteVariantIndex,
          }
        : createColorModePaletteCandidate(getCurrentPaletteAdjustmentSnapshot(), {
            referencePalette: previousPalette,
            effectiveType,
          });

      if (!candidate?.palette?.length) {
        alert("No se pudo generar una paleta válida a partir del color base.");
        return;
      }

      nextPalette = candidate.palette;
      effectiveColorPaletteType = candidate.effectiveType;
      colorPaletteVariantIndex = candidate.variantIndex;
      syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
        scope: "color-variant",
      });
    } else {
      const temperatureResult = buildTemperaturePaletteForSettings(paletteSize);
      nextPalette = temperatureResult.palette;
      usedAlternativePalette = temperatureResult.usedAlternativePalette;
    }

    commitGeneratedPalette(nextPalette, {
      effectiveType: effectiveColorPaletteType,
      usedAlternativePalette,
      previousPalette,
    });
  });
}

// GENERATE COLOR

function generateColor() {
  const hue = getTemperatureBasedHue();
  const chroma = mapSaturationValueToOklchChroma(getCurrentSaturationValue(), {
    minChroma: 0.006,
    maxChroma: 0.22,
    gamma: 1.08,
  });
  const lightness = mapBrightnessValueToOklchLightness(getCurrentBrightnessValue(), {
    minLightness: 0.18,
    maxLightness: 0.92,
  });

  return controlsNormalizeHexColor(
    controlsOklchToHex(lightness, chroma, hue, {
      minLightness: 0.12,
      maxLightness: 0.94,
      maxChroma: 0.24,
    })
  );
}
`,bl=`// Palette generator image analysis: sampling, clustering and derived candidates.
const imageAnalysisColorUtils = window.AppColorUtils || {};
const imageAnalysisRgbToHex = imageAnalysisColorUtils.rgbToHex;
const imageAnalysisGetRgbDistance = imageAnalysisColorUtils.getRgbDistance;

if (
  typeof imageAnalysisRgbToHex !== "function" ||
  typeof imageAnalysisGetRgbDistance !== "function"
) {
  throw new Error("AppColorUtils helpers are required before palette-generator-image-analysis.js loads.");
}

function rotateImagePaletteCandidates(values, offset) {
  if (!Array.isArray(values) || values.length <= 1) {
    return Array.isArray(values) ? [...values] : [];
  }

  const normalizedOffset = ((offset % values.length) + values.length) % values.length;
  if (normalizedOffset === 0) {
    return [...values];
  }

  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function rgbToHex(color) {
  return imageAnalysisRgbToHex(color);
}

function getRgbDistanceBetween(colorA, colorB) {
  return imageAnalysisGetRgbDistance(colorA, colorB);
}

function loadImageElement(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for palette extraction."));
    image.src = dataUrl;
  });
}

async function getUploadedImageSamplePoints() {
  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  if (Array.isArray(uploadedBaseImage.analysisCache?.points)) {
    return uploadedBaseImage.analysisCache.points;
  }

  const image = await loadImageElement(uploadedBaseImage.dataUrl);
  const maxDimension = 56;
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height)
  );
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return [];
  }

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height).data;
  const quantizedColors = new Map();

  for (let index = 0; index < imageData.length; index += 4) {
    const alpha = imageData[index + 3];
    if (alpha < 40) {
      continue;
    }

    const r = Math.round(imageData[index] / 16) * 16;
    const g = Math.round(imageData[index + 1] / 16) * 16;
    const b = Math.round(imageData[index + 2] / 16) * 16;
    const key = \`\${r}-\${g}-\${b}\`;
    const existingPoint = quantizedColors.get(key);

    if (existingPoint) {
      existingPoint.weight += 1;
      continue;
    }

    quantizedColors.set(key, {
      r,
      g,
      b,
      weight: 1,
    });
  }

  const points = Array.from(quantizedColors.values());
  updateUploadedImageAnalysisCache({
    points,
    width,
    height,
  });
  return points;
}

function getWeightedRandomPoint(points, weightResolver) {
  const totalWeight = points.reduce((sum, point) => sum + weightResolver(point), 0);
  if (totalWeight <= 0) {
    return points[Math.floor(Math.random() * points.length)];
  }

  let threshold = Math.random() * totalWeight;
  for (const point of points) {
    threshold -= weightResolver(point);
    if (threshold <= 0) {
      return point;
    }
  }

  return points[points.length - 1];
}

function initializeImageClusterCenters(points, clusterCount) {
  const centers = [];
  centers.push({ ...getWeightedRandomPoint(points, (point) => point.weight) });

  while (centers.length < clusterCount) {
    const nextPoint = getWeightedRandomPoint(points, (point) => {
      const nearestDistance = Math.min(
        ...centers.map((center) => {
          const distance = getRgbDistanceBetween(point, center);
          return distance * distance;
        })
      );
      return point.weight * Math.max(nearestDistance, 1);
    });

    centers.push({ ...nextPoint });
  }

  return centers;
}

function clusterImageColors(points, clusterCount) {
  const safeClusterCount = Math.max(1, Math.min(clusterCount, points.length));
  let centers = initializeImageClusterCenters(points, safeClusterCount);

  for (let iteration = 0; iteration < 8; iteration++) {
    const buckets = Array.from({ length: safeClusterCount }, () => ({
      r: 0,
      g: 0,
      b: 0,
      weight: 0,
    }));

    points.forEach((point) => {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      centers.forEach((center, index) => {
        const distance = getRgbDistanceBetween(point, center);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const bucket = buckets[nearestIndex];
      bucket.r += point.r * point.weight;
      bucket.g += point.g * point.weight;
      bucket.b += point.b * point.weight;
      bucket.weight += point.weight;
    });

    centers = centers.map((center, index) => {
      const bucket = buckets[index];
      if (!bucket.weight) {
        return { ...getWeightedRandomPoint(points, (point) => point.weight) };
      }

      return {
        r: bucket.r / bucket.weight,
        g: bucket.g / bucket.weight,
        b: bucket.b / bucket.weight,
      };
    });
  }

  const clusters = centers.map((center) => ({
    r: Math.round(center.r),
    g: Math.round(center.g),
    b: Math.round(center.b),
    weight: 0,
  }));

  points.forEach((point) => {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    clusters.forEach((cluster, index) => {
      const distance = getRgbDistanceBetween(point, cluster);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    clusters[nearestIndex].weight += point.weight;
  });

  return clusters
    .filter((cluster) => cluster.weight > 0)
    .sort((clusterA, clusterB) => clusterB.weight - clusterA.weight);
}

function cleanImageClusterDuplicates(clusters) {
  const deduplicatedClusters = [];

  clusters.forEach((cluster) => {
    const hex = controlsNormalizeHexColor(rgbToHex(cluster));
    if (isDisallowedColor(hex)) {
      return;
    }

    const isNearExistingCluster = deduplicatedClusters.some(
      (existingCluster) => getRgbDistanceBetween(existingCluster, cluster) < 26
    );
    if (isNearExistingCluster) {
      return;
    }

    const hsl = controlsHexToHsl(hex);
    const oklch = window.AppColorUtils?.hexToOklch?.(hex);
    const chromaPercent = clampControlValue(((oklch?.c ?? 0) / 0.24) * 100, 0, 100);
    const lightnessPercent = clampControlValue((oklch?.l ?? 0.5) * 100, 0, 100);
    deduplicatedClusters.push({
      ...cluster,
      hex,
      hsl,
      oklch,
      relevance:
        cluster.weight *
        (1 + chromaPercent / 260) *
        (0.92 + Math.abs(lightnessPercent - 58) / 190),
    });
  });

  return deduplicatedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImageClusterPriorityScore(cluster, allClusters, selectedClusters = []) {
  const safeClusters = Array.isArray(allClusters) && allClusters.length > 0
    ? allClusters
    : [cluster];
  const maxWeight = Math.max(
    ...safeClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) / 100;
  const lightnessDistance = Math.min(Math.abs((cluster.oklch?.l ?? 0.5) - 0.5) / 0.42, 1);
  const nearestDistance = selectedClusters.length > 0
    ? Math.min(
        ...selectedClusters.map((selectedCluster) =>
          getRgbDistanceBetween(selectedCluster, cluster)
        )
      )
    : 72;
  const normalizedDistance = Math.min(nearestDistance / 100, 1.25);

  if (prioritizeImageDominantColors) {
    const dominanceBaseScore =
      (cluster.weight || 0) *
      (1 + saturationFactor * 0.35) *
      (0.96 + lightnessDistance * 0.18);
    const diversityBoost = selectedClusters.length > 0
      ? 0.8 + normalizedDistance * 0.34
      : 1;

    return dominanceBaseScore * diversityBoost;
  }

  const accentBaseScore =
    Math.pow(Math.max(cluster.weight || 1, 1), 0.45) *
    (1 + saturationFactor * 1.15) *
    (1 + lightnessDistance * 0.45) *
    (0.62 + (1 - normalizedWeight) * 1.12);
  const diversityBoost = selectedClusters.length > 0
    ? 0.96 + normalizedDistance * 0.62
    : 1.12;

  return accentBaseScore * diversityBoost;
}

function selectRelevantImageClusters(clusters, targetCount, variantIndex = 0) {
  const candidatePoolSize = Math.min(
    clusters.length,
    Math.max(targetCount + 4, targetCount * 2)
  );
  const prioritizedClusters = [...clusters].sort((clusterA, clusterB) => {
    const scoreA = getImageClusterPriorityScore(clusterA, clusters);
    const scoreB = getImageClusterPriorityScore(clusterB, clusters);
    return scoreB - scoreA;
  });
  const rotatedPriorityPool = rotateImagePaletteCandidates(
    prioritizedClusters.slice(0, candidatePoolSize),
    variantIndex
  );
  const pool = [
    ...rotatedPriorityPool,
    ...prioritizedClusters.slice(candidatePoolSize),
  ];
  const selectedClusters = [];
  const selectionTarget = Math.min(targetCount, clusters.length);

  if (pool.length > 0) {
    selectedClusters.push(pool.shift());
  }

  while (pool.length > 0 && selectedClusters.length < selectionTarget) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((cluster, index) => {
      const poolOffset = Math.max(0, candidatePoolSize - index);
      const rotationBias = 1 + (poolOffset / Math.max(candidatePoolSize, 1)) * 0.12;
      const score =
        getImageClusterPriorityScore(cluster, clusters, selectedClusters) * rotationBias;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    selectedClusters.push(pool.splice(bestIndex, 1)[0]);
  }

  return selectedClusters.sort(
    (clusterA, clusterB) => clusterB.relevance - clusterA.relevance
  );
}

function getImagePaletteVariantHex(cluster, clusterIndex, variantIndex) {
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];

  if (normalizedVariantIndex === 0) {
    return cluster.hex;
  }

  const baseOklch = cluster.oklch || window.AppColorUtils?.hexToOklch?.(cluster.hex);
  if (!baseOklch) {
    return cluster.hex;
  }

  const direction = (clusterIndex + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
  const stagger = profile.stagger[clusterIndex % profile.stagger.length] || 0;
  const hueOffset = profile.hueShift * direction + (clusterIndex % 3) * direction * 2;
  const chromaOffset = (profile.saturationShift + stagger * 0.45) * 0.0018;
  const lightnessOffset = (profile.lightnessShift + stagger * 0.8) * 0.006;

  return controlsNormalizeHexColor(
    window.AppColorUtils?.oklchToHex?.(
      clampControlValue(baseOklch.l + lightnessOffset, 0.08, 0.95),
      clampControlValue(Math.max(baseOklch.c, 0.01) + chromaOffset, 0.004, 0.26),
      baseOklch.h + hueOffset,
      {
        minLightness: 0.08,
        maxLightness: 0.95,
        maxChroma: 0.26,
      }
    ) || cluster.hex
  );
}

function getImageClusterStartPenalty(cluster, allClusters) {
  const maxWeight = Math.max(
    ...allClusters.map((candidateCluster) => candidateCluster.weight || 0),
    1
  );
  const normalizedWeight = clampControlValue((cluster.weight || 0) / maxWeight, 0, 1);
  const saturationFactor = clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) / 100;
  const balancedLightness = 1 - Math.min(Math.abs((cluster.oklch?.l ?? 0.58) - 0.58) / 0.38, 1);

  if (prioritizeImageDominantColors) {
    return (1 - normalizedWeight) * 0.2 + (1 - balancedLightness) * 0.04;
  }

  return (1 - saturationFactor) * 0.12 + (1 - balancedLightness) * 0.05;
}

function getImageClusterHarmonyDistance(clusterA, clusterB) {
  const hueDifference = Math.abs((clusterA.oklch?.h ?? clusterA.hsl?.h ?? 0) - (clusterB.oklch?.h ?? clusterB.hsl?.h ?? 0));
  const wrappedHueDifference = Math.min(hueDifference, 360 - hueDifference) / 180;
  const saturationDifference = Math.abs((clusterA.oklch?.c ?? 0) - (clusterB.oklch?.c ?? 0)) / 0.24;
  const lightnessDifference = Math.abs((clusterA.oklch?.l ?? 0.5) - (clusterB.oklch?.l ?? 0.5));

  return (
    wrappedHueDifference * 0.6 +
    saturationDifference * 0.2 +
    lightnessDifference * 0.2
  );
}

function orderImageClustersByHarmony(clusters) {
  if (!Array.isArray(clusters) || clusters.length <= 2) {
    return [...clusters];
  }

  const totalClusters = clusters.length;
  const totalMasks = 1 << totalClusters;
  const pathCosts = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(Infinity)
  );
  const previousIndexes = Array.from({ length: totalMasks }, () =>
    Array(totalClusters).fill(-1)
  );

  clusters.forEach((cluster, index) => {
    pathCosts[1 << index][index] = getImageClusterStartPenalty(cluster, clusters);
  });

  for (let mask = 1; mask < totalMasks; mask += 1) {
    for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
      const currentCost = pathCosts[mask][lastIndex];
      if (!Number.isFinite(currentCost)) {
        continue;
      }

      for (let nextIndex = 0; nextIndex < totalClusters; nextIndex += 1) {
        if (mask & (1 << nextIndex)) {
          continue;
        }

        const nextMask = mask | (1 << nextIndex);
        const nextCost =
          currentCost +
          getImageClusterHarmonyDistance(clusters[lastIndex], clusters[nextIndex]);

        if (nextCost < pathCosts[nextMask][nextIndex]) {
          pathCosts[nextMask][nextIndex] = nextCost;
          previousIndexes[nextMask][nextIndex] = lastIndex;
        }
      }
    }
  }

  const fullMask = totalMasks - 1;
  let bestLastIndex = 0;
  let bestPathCost = Infinity;

  for (let lastIndex = 0; lastIndex < totalClusters; lastIndex += 1) {
    if (pathCosts[fullMask][lastIndex] < bestPathCost) {
      bestPathCost = pathCosts[fullMask][lastIndex];
      bestLastIndex = lastIndex;
    }
  }

  const orderedClusters = [];
  let currentMask = fullMask;
  let currentIndex = bestLastIndex;

  while (currentIndex !== -1) {
    orderedClusters.unshift(clusters[currentIndex]);
    const previousIndex = previousIndexes[currentMask][currentIndex];
    currentMask ^= 1 << currentIndex;
    currentIndex = previousIndex;
  }

  return orderedClusters;
}

function expandImagePalette(selectedClusters, targetCount, variantIndex = 0, seedPalette = []) {
  const palette = [...seedPalette];
  const usedColors = new Set(palette);
  const normalizedVariantIndex = Math.max(0, variantIndex);
  const profile =
    IMAGE_PALETTE_VARIANT_PROFILES[
      normalizedVariantIndex % IMAGE_PALETTE_VARIANT_PROFILES.length
    ];
  const lightnessOffsets = normalizedVariantIndex === 0
    ? [-0.14, 0.14, -0.08, 0.08, -0.2, 0.2, -0.26, 0.26]
    : profile.stagger.map((offset) => offset * 0.01).concat([-0.16, 0.16, -0.22, 0.22]);
  let expansionStep = 0;

  while (palette.length < targetCount && selectedClusters.length > 0) {
    const cluster = selectedClusters[
      (normalizedVariantIndex + expansionStep) % selectedClusters.length
    ];
    const offset = lightnessOffsets[
      Math.floor(expansionStep / selectedClusters.length) % lightnessOffsets.length
    ];
    const direction = (expansionStep + normalizedVariantIndex) % 2 === 0 ? 1 : -1;
    const baseOklch = cluster.oklch || window.AppColorUtils?.hexToOklch?.(cluster.hex);
    if (!baseOklch) {
      expansionStep += 1;
      if (expansionStep > selectedClusters.length * lightnessOffsets.length * 2) {
        break;
      }
      continue;
    }

    const variantHex = controlsNormalizeHexColor(
      window.AppColorUtils?.oklchToHex?.(
        clampControlValue(
          baseOklch.l + offset + profile.lightnessShift * 0.0055,
          0.08,
          0.95
        ),
        clampControlValue(
          Math.max(baseOklch.c, 0.01) +
            ((offset > 0 ? -6 : 8) + profile.saturationShift * 0.7) * 0.0018,
          0.004,
          0.26
        ),
        baseOklch.h + profile.hueShift * direction,
        {
          minLightness: 0.08,
          maxLightness: 0.95,
          maxChroma: 0.26,
        }
      ) || cluster.hex
    );

    if (!usedColors.has(variantHex) && !isDisallowedColor(variantHex)) {
      usedColors.add(variantHex);
      palette.push(variantHex);
    }

    expansionStep += 1;
    if (expansionStep > selectedClusters.length * lightnessOffsets.length * 2) {
      break;
    }
  }

  return palette.slice(0, targetCount);
}

function getCachedImageColorClusters() {
  return Array.isArray(uploadedBaseImage?.analysisCache?.deduplicatedClusters)
    ? uploadedBaseImage.analysisCache.deduplicatedClusters
    : [];
}

async function getImageColorClusters() {
  const cachedClusters = getCachedImageColorClusters();
  if (cachedClusters.length > 0) {
    return cachedClusters;
  }

  if (!uploadedBaseImage?.dataUrl) {
    return [];
  }

  const points = await getUploadedImageSamplePoints();
  if (points.length === 0) {
    return [];
  }

  const clusterCount = Math.min(Math.max(MAX_PALETTE_COLORS, 12), points.length);
  const clusters = cleanImageClusterDuplicates(clusterImageColors(points, clusterCount));

  updateUploadedImageAnalysisCache({
    deduplicatedClusters: clusters,
  });

  return clusters;
}
`,yl=`function getImageBasedCandidateColor(
  existingColors = new Set(),
  adjacentBaseNames = [],
  options = {}
) {
  const imageClusters = getCachedImageColorClusters();
  if (imageClusters.length === 0) {
    return null;
  }

  const excludedColors = options.excludedColors instanceof Set
    ? options.excludedColors
    : new Set();
  const variantSeed = Number.isFinite(options.variantSeed)
    ? Math.max(0, options.variantSeed)
    : Math.max(0, imagePaletteVariantIndex + 1);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, options.maxVariantSweeps)
    : Math.max(8, IMAGE_PALETTE_VARIANT_PROFILES.length * 3);
  let bestCandidate = null;
  let bestConflictCount = Infinity;
  let bestPriorityScore = -Infinity;

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    imageClusters.forEach((cluster, clusterIndex) => {
      const candidate = getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        isDisallowedColor(candidate)
      ) {
        return;
      }

      const candidateBaseName = typeof getNearestColorName === "function"
        ? getNearestColorName(candidate)
        : "";
      const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
        return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
      }, 0);
      const priorityScore =
        getImageClusterPriorityScore(cluster, imageClusters) - variantOffset * 0.04;

      if (conflictCount === 0) {
        if (priorityScore > bestPriorityScore) {
          bestCandidate = candidate;
          bestConflictCount = 0;
          bestPriorityScore = priorityScore;
        }
        return;
      }

      if (
        conflictCount < bestConflictCount ||
        (conflictCount === bestConflictCount && priorityScore > bestPriorityScore)
      ) {
        bestCandidate = candidate;
        bestConflictCount = conflictCount;
        bestPriorityScore = priorityScore;
      }
    });

    if (bestCandidate && bestConflictCount === 0) {
      break;
    }
  }

  return bestCandidate;
}

function getImageRegenerationColorForCard(card, existingColors = new Set(), options = {}) {
  const adjacentBaseNames = typeof getAdjacentBaseColorNames === "function"
    ? getAdjacentBaseColorNames(card)
    : [];
  const currentHex = normalizeHexColor(
    card?.querySelector(".color-label")?.textContent?.trim() || ""
  );
  const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
  const excludedColors = options.excludedColors instanceof Set
    ? new Set(options.excludedColors)
    : new Set();

  if (isValidPaletteHex(currentHex)) {
    excludedColors.add(currentHex);
  }

  const variantSeedBase = Number.isFinite(options.variantSeed)
    ? Math.max(0, options.variantSeed)
    : imagePaletteVariantIndex + 1;
  const variantSeedOffset = Number.isFinite(options.variantSeedOffset)
    ? options.variantSeedOffset
    : 0;
  const variantSeed =
    variantSeedBase +
    variantSeedOffset +
    (Number.isFinite(cardIndex) && cardIndex >= 0 ? cardIndex * 2 : 0);
  const maxVariantSweeps = Number.isFinite(options.maxVariantSweeps)
    ? Math.max(1, options.maxVariantSweeps)
    : Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6);
  const candidate = getImageBasedCandidateColor(existingColors, adjacentBaseNames, {
    excludedColors,
    variantSeed,
    maxVariantSweeps,
  });

  const fallbackCandidate = candidate || getAlternativeImagePaletteColor(
    existingColors,
    excludedColors,
    variantSeed +
      (Number.isFinite(cardIndex) && cardIndex >= 0 ? cardIndex : 0),
    maxVariantSweeps
  );

  if (fallbackCandidate) {
    imagePaletteVariantIndex += 1;
  }

  return fallbackCandidate;
}

function buildImagePaletteCandidate(selectedClusters, targetCount, variantIndex) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const basePalette = [];
  const usedColors = new Set();

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    const variantHex = getImagePaletteVariantHex(cluster, clusterIndex, variantIndex);
    const nextHex =
      !usedColors.has(variantHex) && !isDisallowedColor(variantHex)
        ? variantHex
        : cluster.hex;

    if (usedColors.has(nextHex) || isDisallowedColor(nextHex)) {
      return;
    }

    usedColors.add(nextHex);
    basePalette.push(nextHex);
  });

  return expandImagePalette(harmonyOrderedClusters, targetCount, variantIndex, basePalette);
}

async function buildImageBasedPalette(targetCount) {
  const result = await buildImageBasedPaletteCandidate(targetCount);
  imagePaletteVariantIndex = result.variantIndex;
  syncPaletteGeneratorStoreState(
    {
      imagePaletteVariantIndex,
    },
    {
      scope: "image-palette-variant",
    }
  );
  return result.palette;
}

function getAlternativeImagePaletteColor(
  existingColors = new Set(),
  excludedColors = new Set(),
  variantSeed = 0,
  maxVariantSweeps = Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6)
) {
  const clusters = getCachedImageColorClusters();
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return null;
  }

  for (let variantOffset = 0; variantOffset < maxVariantSweeps; variantOffset += 1) {
    for (let clusterIndex = 0; clusterIndex < clusters.length; clusterIndex += 1) {
      const cluster = clusters[clusterIndex];
      const candidate = getImagePaletteVariantHex(
        cluster,
        clusterIndex,
        variantSeed + variantOffset
      );

      if (
        !candidate ||
        existingColors.has(candidate) ||
        excludedColors.has(candidate) ||
        isDisallowedColor(candidate)
      ) {
        continue;
      }

      return candidate;
    }
  }

  return null;
}

function ensureMutableImagePaletteSlotsChange(
  candidatePalette,
  referencePalette,
  pinnedEntries = getPinnedPaletteEntriesSnapshot(),
  variantSeed = 0
) {
  const mergedPalette = mergePaletteWithPinnedColors(candidatePalette, pinnedEntries);
  const normalizedReferencePalette = normalizePaletteHexCollection(referencePalette);
  const pinnedIndexSet = getPinnedPaletteIndexSet(pinnedEntries);
  const nextPalette = [...mergedPalette];

  nextPalette.forEach((color, index) => {
    if (pinnedIndexSet.has(index)) {
      return;
    }

    const referenceColor = normalizedReferencePalette[index];
    if (!referenceColor || referenceColor !== color) {
      return;
    }

    const existingColors = new Set(
      nextPalette.filter((entry, entryIndex) => entryIndex !== index)
    );
    const alternative = getAlternativeImagePaletteColor(
      existingColors,
      new Set([color]),
      variantSeed + index * 3
    );

    if (alternative) {
      nextPalette[index] = alternative;
    }
  });

  return nextPalette;
}

async function buildImageBasedPaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para generar una paleta desde ella.");
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imagePaletteVariantIndex,
    };
  }

  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(
      options.referencePalette ??
      (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette),
      pinnedEntries
    )
  );
  const variantStartIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imagePaletteVariantIndex;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 3);
  let fallbackPalette = [];
  let fallbackVariantIndex = variantStartIndex;
  let fallbackSamePositionCount = Infinity;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = variantStartIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(clusters, targetCount, variantIndex);
    const candidatePalette = buildImagePaletteCandidate(
      selectedClusters,
      targetCount,
      variantIndex
    );
    const referenceSourcePalette =
      options.referencePalette ??
      (paletteAdjustmentBase.length > 0 ? paletteAdjustmentBase : currentPalette);
    const repairedPalette = ensureMutableImagePaletteSlotsChange(
      candidatePalette,
      referenceSourcePalette,
      pinnedEntries,
      variantIndex
    );
    const candidateComparablePalette = getComparablePaletteSlice(
      repairedPalette,
      pinnedEntries
    );
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      candidateComparablePalette,
      referencePalette
    );

    if (candidatePalette.length === 0) {
      continue;
    }

    if (positionalSimilarityMetrics.samePositionCount < fallbackSamePositionCount) {
      fallbackPalette = repairedPalette;
      fallbackVariantIndex = variantIndex;
      fallbackSamePositionCount = positionalSimilarityMetrics.samePositionCount;
    }

    if (
      positionalSimilarityMetrics.samePositionCount === 0 &&
      !arePalettesTooSimilar(candidateComparablePalette, referencePalette)
    ) {
      return {
        palette: repairedPalette,
        variantIndex,
      };
    }
  }

  return {
    palette: fallbackPalette,
    variantIndex: fallbackVariantIndex,
  };
}

function getImageInspirationAtmosphere(clusters) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return {
      averageSaturation: 42,
      averageLightness: 58,
      averageHue: 35,
      maxWeight: 1,
      maxSaturation: 58,
      lightnessSpread: 0.3,
      warmthBias: 0,
    };
  }

  const totalWeight = clusters.reduce((sum, cluster) => sum + Math.max(cluster.weight || 0, 1), 0);
  const maxWeight = Math.max(
    ...clusters.map((cluster) => Math.max(cluster.weight || 0, 1)),
    1
  );
  const hueVector = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hueRadians = ((cluster.oklch?.h ?? cluster.hsl?.h ?? 0) / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians) * weight,
      y: sum.y + Math.sin(hueRadians) * weight,
    };
  }, { x: 0, y: 0 });
  const maxSaturation = Math.max(
    ...clusters.map((cluster) =>
      clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100)
    ),
    0
  );
  const lightnessValues = clusters.map((cluster) =>
    clampControlValue((cluster.oklch?.l ?? 0.5) * 100, 0, 100)
  );
  const averageSaturation = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + clampControlValue(((cluster.oklch?.c ?? 0) / 0.24) * 100, 0, 100) * weight;
  }, 0) / totalWeight;
  const averageLightness = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    return sum + clampControlValue((cluster.oklch?.l ?? 0.5) * 100, 0, 100) * weight;
  }, 0) / totalWeight;
  const warmthBias = clusters.reduce((sum, cluster) => {
    const weight = Math.max(cluster.weight || 0, 1);
    const hue = cluster.oklch?.h ?? cluster.hsl?.h ?? 0;
    const hueRadians = (hue / 180) * Math.PI;
    return sum + Math.cos(hueRadians) * weight;
  }, 0) / totalWeight;
  const averageHue = (
    (Math.atan2(hueVector.y, hueVector.x) * 180) / Math.PI + 360
  ) % 360;

  return {
    averageSaturation,
    averageLightness,
    averageHue,
    maxWeight,
    maxSaturation,
    lightnessSpread:
      (Math.max(...lightnessValues, averageLightness) - Math.min(...lightnessValues, averageLightness)) /
      100,
    warmthBias,
  };
}

function orderPaletteHexColorsByHarmony(colors) {
  const nodes = normalizePaletteHexCollection(colors).map((hex) => ({
    hex,
    hsl: controlsHexToHsl(hex),
    oklch: window.AppColorUtils?.hexToOklch?.(hex) || null,
    weight: 1,
  }));

  return orderImageClustersByHarmony(nodes).map((node) => node.hex);
}

function isPaletteColorTooClose(candidateColor, palette, minimumDistance = 24) {
  return palette.some((existingColor) => {
    return getRgbDistanceBetween(candidateColor, existingColor) < minimumDistance;
  });
}

function getInspiredClusterRole(seedIndex, targetCount) {
  if (seedIndex === 0) {
    return "dominant";
  }

  if (targetCount >= 6 && seedIndex === 1) {
    return "dominant";
  }

  if (seedIndex === targetCount - 1) {
    return "accent";
  }

  if (targetCount >= 5 && seedIndex === targetCount - 2) {
    return "accent";
  }

  return "support";
}

function getShortestHueDelta(fromHue, toHue) {
  return ((toHue - fromHue + 540) % 360) - 180;
}

function shiftHueTowards(fromHue, toHue, ratio) {
  return (fromHue + getShortestHueDelta(fromHue, toHue) * ratio + 360) % 360;
}

function getPaletteAtmosphereMetrics(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return {
      averageHue: 35,
      averageSaturation: 42,
      averageLightness: 58,
      warmthBias: 0,
      lightnessSpread: 0.3,
    };
  }

  const paletteOklch = normalizedColors.map((color) => window.AppColorUtils?.hexToOklch?.(color));
  const hueVector = paletteOklch.reduce((sum, color) => {
    const hueRadians = ((color?.h ?? 0) / 180) * Math.PI;
    return {
      x: sum.x + Math.cos(hueRadians),
      y: sum.y + Math.sin(hueRadians),
    };
  }, { x: 0, y: 0 });
  const lightnessValues = paletteOklch.map((color) =>
    clampControlValue((color?.l ?? 0.5) * 100, 0, 100)
  );
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100), 0) /
    paletteOklch.length;
  const warmthBias =
    paletteOklch.reduce((sum, color) => {
      const hueRadians = ((color?.h ?? 0) / 180) * Math.PI;
      return sum + Math.cos(hueRadians);
    }, 0) / paletteOklch.length;

  return {
    averageHue: (
      (Math.atan2(hueVector.y, hueVector.x) * 180) / Math.PI + 360
    ) % 360,
    averageSaturation,
    averageLightness,
    warmthBias,
    lightnessSpread:
      (Math.max(...lightnessValues) - Math.min(...lightnessValues)) / 100,
  };
}

function getAtmosphereAlignmentScore(candidateMetrics, referenceMetrics) {
  const saturationAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.averageSaturation - referenceMetrics.averageSaturation) / 30,
    1
  );
  const lightnessAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.averageLightness - referenceMetrics.averageLightness) / 24,
    1
  );
  const warmthAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.warmthBias - referenceMetrics.warmthBias) / 1.2,
    1
  );
  const spreadAlignment = 1 - Math.min(
    Math.abs(candidateMetrics.lightnessSpread - referenceMetrics.lightnessSpread) / 0.3,
    1
  );

  return (
    saturationAlignment * 0.3 +
    lightnessAlignment * 0.35 +
    warmthAlignment * 0.25 +
    spreadAlignment * 0.1
  );
}

function getInspiredImageVariantHex(cluster, role, clusterIndex, variantIndex, atmosphere) {
  const profile =
    IMAGE_INSPIRATION_VARIANT_PROFILES[
      Math.abs(variantIndex) % IMAGE_INSPIRATION_VARIANT_PROFILES.length
    ];
  const direction = (clusterIndex + variantIndex) % 2 === 0 ? 1 : -1;
  const variantCycle = Math.floor(
    Math.abs(variantIndex) / IMAGE_INSPIRATION_VARIANT_PROFILES.length
  );
  const oklch = cluster.oklch || window.AppColorUtils?.hexToOklch?.(cluster.hex);
  if (!oklch) {
    return cluster.hex;
  }

  const weightRatio = clampControlValue(
    Math.max(cluster.weight || 0, 1) / Math.max(atmosphere.maxWeight || 1, 1),
    0,
    1
  );
  const atmosphereHue = Number.isFinite(atmosphere.averageHue)
    ? atmosphere.averageHue
    : oklch.h;
  const atmosphereChroma = clampControlValue((atmosphere.averageSaturation / 100) * 0.24, 0.01, 0.24);
  const maximumAtmosphereChroma = clampControlValue((atmosphere.maxSaturation / 100) * 0.24, 0.01, 0.26);
  const atmosphereLightness = clampControlValue(atmosphere.averageLightness / 100, 0.18, 0.86);
  const warmthAdjustment = atmosphere.warmthBias * 9;
  const orbitOffset =
    (variantCycle % 3 - 1) * (role === "accent" ? 18 : role === "dominant" ? 10 : 14);
  let hue = shiftHueTowards(
    oklch.h,
    atmosphereHue,
    role === "dominant" ? 0.42 : role === "accent" ? 0.22 : 0.3
  );
  let chroma = oklch.c;
  let lightness = oklch.l;

  if (role === "dominant") {
    hue += profile.hueShift * 0.95 * direction + orbitOffset * 0.45 + warmthAdjustment * 0.4;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        atmosphereChroma + 0.012 + profile.saturationShift * 0.0018 - weightRatio * 0.008,
        0.04,
        0.18
      ),
      0.58
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness + profile.neutralLift * 0.006 + orbitOffset * 0.0018,
        0.28,
        0.72
      ),
      0.62
    );
  } else if (role === "accent") {
    hue += profile.accentHueShift * 1.15 * direction + orbitOffset + warmthAdjustment * 0.24;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        Math.max(
          atmosphereChroma + profile.accentBoost * 0.0018,
          maximumAtmosphereChroma * 0.7
        ),
        0.08,
        0.24
      ),
      0.72
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness +
          profile.lightnessShift * 0.006 +
          direction * 0.12 * (0.5 + atmosphere.lightnessSpread) +
          orbitOffset * 0.003,
        0.24,
        0.8
      ),
      0.64
    );
  } else {
    hue +=
      profile.hueShift * 1.1 * direction +
      direction * 8 +
      orbitOffset * 0.75 +
      warmthAdjustment * 0.28;
    chroma = blendControlValue(
      oklch.c,
      clampControlValue(
        atmosphereChroma + 0.02 + profile.saturationShift * 0.0018,
        0.05,
        0.2
      ),
      0.66
    );
    lightness = blendControlValue(
      oklch.l,
      clampControlValue(
        atmosphereLightness +
          profile.lightnessShift * 0.006 +
          direction * 0.07 * (0.45 + atmosphere.lightnessSpread) +
          orbitOffset * 0.0022,
        0.24,
        0.78
      ),
      0.6
    );
  }

  hue = (hue + 360) % 360;
  chroma = clampControlValue(
    chroma,
    role === "accent" ? 0.07 : 0.035,
    role === "dominant" ? 0.18 : 0.24
  );
  lightness = clampControlValue(lightness, 0.22, role === "accent" ? 0.82 : 0.78);

  let candidate = controlsNormalizeHexColor(
    window.AppColorUtils?.oklchToHex(lightness, chroma, hue, {
      minLightness: 0.22,
      maxLightness: role === "accent" ? 0.82 : 0.78,
      maxChroma: 0.26,
    }) || cluster.hex
  );

  if (candidate === cluster.hex || isPaletteColorTooClose(candidate, [cluster.hex], 18)) {
    candidate = controlsNormalizeHexColor(
      window.AppColorUtils?.oklchToHex(
        clampControlValue(lightness + direction * (role === "accent" ? 0.08 : 0.06), 0.12, 0.88),
        clampControlValue(chroma + (role === "accent" ? 0.018 : 0.012), 0.01, 0.26),
        (hue + direction * (role === "accent" ? 18 : 12) + orbitOffset + 360) % 360,
        {
          minLightness: 0.12,
          maxLightness: 0.88,
          maxChroma: 0.26,
        }
      ) || candidate
    );
  }

  return candidate;
}

function expandInspiredPalette(selectedClusters, targetCount, variantIndex, atmosphere, seedPalette = []) {
  const palette = [...seedPalette];
  const candidateRoles = ["support", "accent", "dominant", "support"];

  for (let cycleIndex = 0; palette.length < targetCount && cycleIndex < targetCount * 6; cycleIndex += 1) {
    const cluster = selectedClusters[cycleIndex % selectedClusters.length];
    const role = candidateRoles[cycleIndex % candidateRoles.length];
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      cycleIndex,
      variantIndex + cycleIndex + 1,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      palette.includes(candidate) ||
      isPaletteColorTooClose(candidate, palette, 22)
    ) {
      continue;
    }

    palette.push(candidate);
  }

  return palette.slice(0, targetCount);
}

function buildInspiredPaletteFromClusters(selectedClusters, targetCount, variantIndex, atmosphere) {
  const harmonyOrderedClusters = orderImageClustersByHarmony(selectedClusters);
  const seedPalette = [];

  harmonyOrderedClusters.forEach((cluster, clusterIndex) => {
    if (seedPalette.length >= targetCount) {
      return;
    }

    const role = getInspiredClusterRole(seedPalette.length, targetCount);
    const candidate = getInspiredImageVariantHex(
      cluster,
      role,
      clusterIndex,
      variantIndex,
      atmosphere
    );

    if (
      isDisallowedColor(candidate) ||
      seedPalette.includes(candidate) ||
      isPaletteColorTooClose(candidate, seedPalette, 22)
    ) {
      return;
    }

    seedPalette.push(candidate);
  });

  return expandInspiredPalette(
    harmonyOrderedClusters,
    targetCount,
    variantIndex,
    atmosphere,
    seedPalette
  );
}

function validateInspiredPaletteCandidate(candidatePalette, extractedPalette, clusters, atmosphere) {
  const normalizedCandidate = normalizePaletteHexCollection(candidatePalette);
  const uniqueCount = new Set(normalizedCandidate).size;
  const extractedAtmosphere = getPaletteAtmosphereMetrics(extractedPalette);
  const candidateAtmosphere = getPaletteAtmosphereMetrics(normalizedCandidate);
  const targetAtmosphere = {
    averageHue: atmosphere?.averageHue ?? extractedAtmosphere.averageHue,
    averageSaturation: blendControlValue(
      extractedAtmosphere.averageSaturation,
      atmosphere?.averageSaturation ?? extractedAtmosphere.averageSaturation,
      0.5
    ),
    averageLightness: blendControlValue(
      extractedAtmosphere.averageLightness,
      atmosphere?.averageLightness ?? extractedAtmosphere.averageLightness,
      0.5
    ),
    warmthBias: blendControlValue(
      extractedAtmosphere.warmthBias,
      atmosphere?.warmthBias ?? extractedAtmosphere.warmthBias,
      0.5
    ),
    lightnessSpread: blendControlValue(
      extractedAtmosphere.lightnessSpread,
      atmosphere?.lightnessSpread ?? extractedAtmosphere.lightnessSpread,
      0.5
    ),
  };
  const similarityToExtraction = getPaletteSimilarityMetrics(
    normalizedCandidate,
    extractedPalette
  );

  const nearestClusterDistances = normalizedCandidate.map((color) => {
    return Math.min(
      ...clusters.map((cluster) =>
        getRgbDistanceBetween(color, {
          r: cluster.r,
          g: cluster.g,
          b: cluster.b,
        })
      )
    );
  });

  const averageNearestClusterDistance =
    nearestClusterDistances.length > 0
      ? nearestClusterDistances.reduce((sum, distance) => sum + distance, 0) /
        nearestClusterDistances.length
      : 0;
  const inspirationDistanceScore = clampControlValue(
    1 - Math.abs(averageNearestClusterDistance - 58) / 34,
    0,
    1
  );
  const atmosphereAlignmentScore = getAtmosphereAlignmentScore(
    candidateAtmosphere,
    targetAtmosphere
  );
  const sharedColorRatioToExtraction =
    similarityToExtraction.sharedColorCount / Math.max(normalizedCandidate.length, 1);

  return {
    hasRepeatedColors: uniqueCount !== normalizedCandidate.length,
    isExactExtractionCopy: similarityToExtraction.exactMatch,
    similarityToExtraction,
    sharedColorRatioToExtraction,
    averageNearestClusterDistance,
    inspirationDistanceScore,
    atmosphereAlignmentScore,
    isCoherentWithImage: atmosphereAlignmentScore >= 0.42,
  };
}

function derivePaletteAdjustmentSettingsFromColors(colors) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length === 0) {
    return resolvePaletteAdjustmentSettings();
  }

  const paletteOklch = normalizedColors.map((color) => window.AppColorUtils?.hexToOklch?.(color));
  const averageSaturation =
    paletteOklch.reduce((sum, color) => {
      return sum + clampControlValue(((color?.c ?? 0) / 0.24) * 100, 0, 100);
    }, 0) / paletteOklch.length;
  const averageLightness =
    paletteOklch.reduce((sum, color) => sum + clampControlValue((color?.l ?? 0.5) * 100, 0, 100), 0) /
    paletteOklch.length;

  return resolvePaletteAdjustmentSettings({
    saturation: clampControlValue(Math.round(averageSaturation / 5) * 5, 0, 100),
    brightness: clampControlValue(
      Math.round(((((averageLightness / 100) - 0.18) / 0.76) * 100) / 5) * 5,
      0,
      100
    ),
  });
}

async function buildInspiredImagePaletteCandidate(targetCount, options = {}) {
  if (!uploadedBaseImage?.dataUrl) {
    alert("Sube una imagen primero para activar el modo inspiración.");
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const clusters = await getImageColorClusters();
  if (clusters.length === 0) {
    return {
      palette: [],
      variantIndex: imageInspirationVariantIndex,
      validation: null,
      settings: resolvePaletteAdjustmentSettings(),
    };
  }

  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const safeTargetCount = Number.isFinite(targetCount) && targetCount > 0 ? targetCount : 5;
  const atmosphere = getImageInspirationAtmosphere(clusters);
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  const recentInspiredReferences = Array.isArray(options.recentPalettes)
    ? options.recentPalettes.map((palette) => getComparableMergedPaletteSlice(palette, pinnedEntries))
    : recentInspiredPalettes.map((palette) => getComparableMergedPaletteSlice(palette, pinnedEntries));
  const startVariantIndex = Number.isFinite(options.startVariantIndex)
    ? Math.max(0, options.startVariantIndex)
    : imageInspirationVariantIndex + 1;
  const maxVariantAttempts = Number.isFinite(options.maxVariantAttempts)
    ? Math.max(1, options.maxVariantAttempts)
    : Math.max(
        18,
        IMAGE_INSPIRATION_VARIANT_PROFILES.length * 8,
        recentInspiredReferences.length * 4 + 12
      );
  let fallbackCandidate = null;
  let bestCandidate = null;

  for (let attempt = 0; attempt < maxVariantAttempts; attempt += 1) {
    const variantIndex = startVariantIndex + attempt;
    const selectedClusters = selectRelevantImageClusters(
      clusters,
      Math.min(clusters.length, Math.max(safeTargetCount + 3, 6)),
      variantIndex
    );
    const extractedReferencePalette = orderImageClustersByHarmony(selectedClusters)
      .map((cluster) => cluster.hex)
      .slice(0, safeTargetCount);
    const candidatePalette = buildInspiredPaletteFromClusters(
      selectedClusters,
      safeTargetCount,
      variantIndex,
      atmosphere
    );
    const orderedPalette = orderPaletteHexColorsByHarmony(candidatePalette);
    const mergedOrderedPalette = mergePaletteWithPinnedColors(orderedPalette, pinnedEntries);
    const comparableOrderedPalette = getComparablePaletteSlice(
      mergedOrderedPalette,
      pinnedEntries
    );

    if (orderedPalette.length === 0) {
      continue;
    }

    const validation = validateInspiredPaletteCandidate(
      orderedPalette,
      extractedReferencePalette,
      clusters,
      atmosphere
    );
    const isTooSimilarToRecentInspired = isPaletteTooSimilarToRecentInspiredPalettes(
      comparableOrderedPalette,
      recentInspiredReferences
    );
    const similarityToCurrent =
      getPaletteSimilarityMetrics(comparableOrderedPalette, referencePalette).sharedColorCount /
      Math.max(comparableOrderedPalette.length, 1);
    const eleganceScore = scorePaletteElegance(mergedOrderedPalette);
    const score =
      scorePaletteHarmony(mergedOrderedPalette) +
      eleganceScore * 1.2 +
      validation.atmosphereAlignmentScore * 1.8 +
      validation.inspirationDistanceScore * 1.45 +
      (validation.isCoherentWithImage ? 0.45 : 0) -
      similarityToCurrent * 1.05 -
      validation.sharedColorRatioToExtraction * 1.2 -
      (isTooSimilarToRecentInspired ? 1.1 : 0) -
      (validation.isExactExtractionCopy ? 1.4 : 0) -
      (validation.hasRepeatedColors ? 3 : 0);
    const candidate = {
      palette: orderedPalette,
      mergedPalette: mergedOrderedPalette,
      variantIndex,
      validation,
      isTooSimilarToRecentInspired,
      settings: derivePaletteAdjustmentSettingsFromColors(mergedOrderedPalette),
      score,
    };

    if (
      !fallbackCandidate ||
      (fallbackCandidate.isTooSimilarToRecentInspired && !candidate.isTooSimilarToRecentInspired) ||
      (
        fallbackCandidate.isTooSimilarToRecentInspired === candidate.isTooSimilarToRecentInspired &&
        candidate.score > fallbackCandidate.score
      )
    ) {
      fallbackCandidate = candidate;
    }

    if (
      !validation.hasRepeatedColors &&
      !validation.isExactExtractionCopy &&
      !isTooSimilarToRecentInspired &&
      validation.averageNearestClusterDistance >= 34 &&
      validation.atmosphereAlignmentScore >= 0.42 &&
      !arePalettesTooSimilar(comparableOrderedPalette, referencePalette) &&
      (!bestCandidate || candidate.score > bestCandidate.score)
    ) {
      bestCandidate = candidate;
    }
  }

  const resolvedCandidate = bestCandidate || fallbackCandidate || {
    palette: [],
    variantIndex: startVariantIndex,
    validation: null,
    settings: resolvePaletteAdjustmentSettings(),
  };
  updateUploadedImageAnalysisCache({
    lastInspiredPaletteValidation: resolvedCandidate.validation,
  });
  return resolvedCandidate;
}
`,Pl=`function getRandomSteppedValue(min = 0, max = 100, step = 5) {
  const steps = Math.round((max - min) / step);
  return min + Math.floor(Math.random() * (steps + 1)) * step;
}

function getRandomTemperatureSelection() {
  return [
    { warm: true, cool: false },
    { warm: false, cool: true },
    { warm: true, cool: true },
  ][Math.floor(Math.random() * 3)];
}

function getCurrentTemperatureSelectionKey() {
  return \`\${temperature.warm ? 1 : 0}:\${temperature.cool ? 1 : 0}\`;
}

function withTemporaryTemperatureSelection(nextSelection, callback) {
  const previousSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  temperature = {
    warm: !!nextSelection?.warm,
    cool: !!nextSelection?.cool,
  };

  try {
    return callback();
  } finally {
    temperature = previousSelection;
  }
}

function createTemperatureCandidate(settings, options = {}) {
  const attemptCount = Number.isFinite(options.attemptCount)
    ? Math.max(1, options.attemptCount)
    : Math.max(24, paletteSize * 8);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  let bestDistinctCandidate = null;
  let bestFallbackCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const candidateResult = buildTemperaturePaletteForSettings(paletteSize, settings);
    if (candidateResult.palette.length === 0) {
      continue;
    }

    const renderedPalette = buildRenderedPaletteFromBaseColors(
      candidateResult.palette,
      settings
    );
    const comparableRenderedPalette = getComparableMergedPaletteSlice(
      renderedPalette,
      pinnedEntries
    );
    const similarityMetrics = getPaletteSimilarityMetrics(comparableRenderedPalette, referencePalette);
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      comparableRenderedPalette,
      referencePalette
    );
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(comparableRenderedPalette.length, 1);
    const candidate = {
      palette: candidateResult.palette,
      renderedPalette,
      usedAlternativePalette: candidateResult.usedAlternativePalette,
      score: scorePaletteHarmony(renderedPalette) - similarityPenalty * 0.85,
      samePositionCount: positionalSimilarityMetrics.samePositionCount,
      isTooSimilar: arePalettesTooSimilar(comparableRenderedPalette, referencePalette),
    };

    if (isBetterPaletteFallbackCandidate(candidate, bestFallbackCandidate)) {
      bestFallbackCandidate = candidate;
    }

    if (
      candidate.samePositionCount === 0 &&
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

async function regenerateTemperaturePaletteKeepingPreferences() {
  const lockedSettings = {
    brightness: getCurrentBrightnessValue(),
    saturation: getCurrentSaturationValue(),
  };
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const candidate = createTemperatureCandidate(lockedSettings, {
    referencePalette: currentPalette,
    pinnedEntries,
  });

  if (!candidate) {
    await generatePalette();
    return;
  }

  commitGeneratedPalette(candidate.palette, {
    usedAlternativePalette: candidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

async function surpriseTemperaturePalette() {
  const currentTemperatureKey = getCurrentTemperatureSelectionKey();
  const currentSettings = getCurrentPaletteAdjustmentSnapshot();
  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(currentPalette, pinnedEntries)
  );
  let bestCandidate = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const nextTemperatureSelection = getRandomTemperatureSelection();
    const nextSettings = {
      brightness: getRandomSteppedValue(0, 100, 5),
      saturation: getRandomSteppedValue(0, 100, 5),
    };
    const temperatureSelectionKey =
      \`\${nextTemperatureSelection.warm ? 1 : 0}:\${nextTemperatureSelection.cool ? 1 : 0}\`;
    const candidate = withTemporaryTemperatureSelection(
      nextTemperatureSelection,
      () =>
        createTemperatureCandidate(nextSettings, {
          referencePalette,
          pinnedEntries,
          attemptCount: 10,
        })
    );

    if (!candidate) {
      continue;
    }

    const controlDistance =
      Math.abs(nextSettings.brightness - currentSettings.brightness) +
      Math.abs(nextSettings.saturation - currentSettings.saturation);
    const temperatureBonus = temperatureSelectionKey !== currentTemperatureKey ? 0.28 : 0;
    const noveltyBonus = Math.min(controlDistance / 120, 0.75);
    const score = candidate.score + noveltyBonus + temperatureBonus;

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        temperatureSelection: nextTemperatureSelection,
        settings: nextSettings,
        palette: candidate.palette,
        usedAlternativePalette: candidate.usedAlternativePalette,
        score,
      };
    }
  }

  if (!bestCandidate) {
    await regenerateTemperaturePaletteKeepingPreferences();
    return;
  }

  setTemperatureSelection(bestCandidate.temperatureSelection);
  setPaletteAdjustmentControls(bestCandidate.settings);
  commitGeneratedPalette(bestCandidate.palette, {
    usedAlternativePalette: bestCandidate.usedAlternativePalette,
    previousPalette: currentPalette,
  });
}

function surprisePinnedTemperaturePaletteSlots() {
  if (
    typeof getCurrentPaletteCardEntries !== "function" ||
    typeof getRegeneratedColorForCard !== "function"
  ) {
    return false;
  }

  const cardEntries = getCurrentPaletteCardEntries();
  const mutableEntries = cardEntries.filter((entry) => !entry.pinned);

  if (mutableEntries.length === 0) {
    return false;
  }

  setTemperatureSelection(getRandomTemperatureSelection());
  setPaletteAdjustmentControls({
    brightness: getRandomSteppedValue(0, 100, 5),
    saturation: getRandomSteppedValue(0, 100, 5),
  });

  const nextColors = cardEntries.map((entry) => normalizeHexColor(entry.hex));
  let hasChanged = false;

  mutableEntries.forEach((entry) => {
    const candidate = getRegeneratedColorForCard(entry.card, new Set(nextColors));

    if (!candidate || candidate === entry.hex) {
      return;
    }

    setCardColor(entry.card, candidate);
    nextColors[entry.index] = normalizeHexColor(candidate);
    hasChanged = true;
  });

  if (hasChanged) {
    persistCurrentPaletteSnapshot();
  }

  return hasChanged;
}

function surprisePinnedImagePaletteSlots() {
  if (
    typeof regeneratePinnedPaletteSlots !== "function" ||
    !uploadedBaseImage?.dataUrl
  ) {
    return false;
  }

  const nextPriorityPreference = Math.random() < 0.5;
  prioritizeImageDominantColors = nextPriorityPreference;
  if (paletteImageDominantToggle) {
    paletteImageDominantToggle.checked = nextPriorityPreference;
  }
  syncPaletteGeneratorStoreState(
    {
      prioritizeImageDominantColors,
    },
    {
      scope: "image-dominant-toggle",
    }
  );

  setPaletteAdjustmentControls({
    brightness: getRandomSteppedValue(0, 100, 5),
    saturation: getRandomSteppedValue(0, 100, 5),
  });

  return regeneratePinnedPaletteSlots();
}

async function surpriseImagePalette() {
  const runSurprise = async () => {
    if (!uploadedBaseImage?.dataUrl) {
      return;
    }

    const originalPriorityPreference = prioritizeImageDominantColors;
    const pinnedEntries = getPinnedPaletteEntriesSnapshot();
    const referencePalette = normalizePaletteHexCollection(
      getComparablePaletteSlice(currentPalette, pinnedEntries)
    );
    const currentSettings = getCurrentPaletteAdjustmentSnapshot();
    let bestCandidate = null;

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const candidatePriorityPreference = Math.random() < 0.5;
      const candidateSettings = {
        brightness: getRandomSteppedValue(0, 100, 5),
        saturation: getRandomSteppedValue(0, 100, 5),
      };
      const candidateVariantIndex =
        imagePaletteVariantIndex +
        1 +
        Math.floor(Math.random() * IMAGE_PALETTE_VARIANT_PROFILES.length * 2);

      prioritizeImageDominantColors = candidatePriorityPreference;
      const candidateResult = await buildImageBasedPaletteCandidate(paletteSize, {
        startVariantIndex: candidateVariantIndex,
        referencePalette,
        pinnedEntries,
        maxVariantAttempts: IMAGE_PALETTE_VARIANT_PROFILES.length * 3,
      });

      if (candidateResult.palette.length === 0) {
        continue;
      }

      const renderedPalette = buildRenderedPaletteFromBaseColors(
        candidateResult.palette,
        candidateSettings
      );
      const comparableRenderedPalette = getComparableMergedPaletteSlice(
        renderedPalette,
        pinnedEntries
      );
      const similarityMetrics = getPaletteSimilarityMetrics(comparableRenderedPalette, referencePalette);
      const similarityPenalty =
        similarityMetrics.sharedColorCount / Math.max(comparableRenderedPalette.length, 1);
      const controlDistance =
        Math.abs(candidateSettings.brightness - currentSettings.brightness) +
        Math.abs(candidateSettings.saturation - currentSettings.saturation);
      const priorityBonus =
        candidatePriorityPreference !== originalPriorityPreference ? 0.16 : 0;
      const score =
        scorePaletteHarmony(renderedPalette) -
        similarityPenalty * 0.7 +
        Math.min(controlDistance / 120, 0.8) +
        priorityBonus;

      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          prioritizeDominant: candidatePriorityPreference,
          settings: candidateSettings,
          palette: candidateResult.palette,
          variantIndex: candidateResult.variantIndex,
          score,
        };
      }
    }

    prioritizeImageDominantColors = originalPriorityPreference;

    if (!bestCandidate) {
      await syncImagePaletteFromSource({ advanceVariant: true });
      return;
    }

    prioritizeImageDominantColors = bestCandidate.prioritizeDominant;
    if (paletteImageDominantToggle) {
      paletteImageDominantToggle.checked = bestCandidate.prioritizeDominant;
    }
    syncPaletteGeneratorStoreState(
      {
        prioritizeImageDominantColors,
      },
      {
        scope: "image-dominant-toggle",
      }
    );
    setPaletteAdjustmentControls(bestCandidate.settings);
    imagePaletteVariantIndex = bestCandidate.variantIndex;
    syncPaletteGeneratorStoreState(
      {
        imagePaletteVariantIndex,
      },
      {
        scope: "image-palette-variant",
      }
    );
    commitGeneratedPalette(bestCandidate.palette, {
      previousPalette: currentPalette,
    });
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runSurprise);
  }

  return runSurprise();
}

async function applyInspiredImagePalette() {
  const runInspiration = async () => {
    const targetCount = Number.isFinite(paletteSize) && paletteSize > 0 ? paletteSize : 5;
    const result = await buildInspiredImagePaletteCandidate(targetCount, {
      referencePalette: currentPalette,
    });

    if (!Array.isArray(result.palette) || result.palette.length === 0) {
      setPaletteImageExtractionFeedback(true, IMAGE_EXTRACTION_ERROR_MESSAGE);
      revealPaletteImageDropzoneForRetry();
      return;
    }

    imageInspirationVariantIndex = result.variantIndex + 1;
    syncPaletteGeneratorStoreState(
      {
        imageInspirationVariantIndex,
      },
      {
        scope: "image-inspiration-variant",
      }
    );
    rememberInspiredPalette(result.palette);
    setPaletteAdjustmentControls(result.settings);
    commitGeneratedPalette(result.palette, {
      previousPalette: currentPalette,
    });
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runInspiration);
  }

  return runInspiration();
}

function setupSurpriseButton() {
  if (!surpriseBtn) {
    return;
  }

  surpriseBtn.addEventListener("click", () => {
    if (surpriseBtn.disabled) {
      return;
    }

    if (paletteBaseMode === "temperature" && getPinnedPaletteEntriesSnapshot().length > 0) {
      if (surprisePinnedTemperaturePaletteSlots()) {
        return;
      }
    }

    if (paletteBaseMode === "image" && getPinnedPaletteEntriesSnapshot().length > 0) {
      surprisePinnedImagePaletteSlots();
      return;
    }

    if (paletteBaseMode === "image") {
      void surpriseImagePalette();
      return;
    }

    void surpriseTemperaturePalette();
  });
}
function shouldUseAlternativePalette() {
  return getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD;
}

function getTemperatureTargetLightness(settings) {
  return mapBrightnessValueToOklchLightness(
    Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    {
      minLightness: 0.2,
      maxLightness: 0.92,
      gamma: 0.86,
    }
  );
}

function getTemperatureTargetChroma(settings, options = {}) {
  return mapSaturationValueToOklchChroma(
    Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
    {
      minChroma: Number.isFinite(options.minChroma) ? options.minChroma : 0.0015,
      maxChroma: Number.isFinite(options.maxChroma) ? options.maxChroma : 0.22,
      gamma: Number.isFinite(options.gamma) ? options.gamma : 1.7,
    }
  );
}

function createTemperatureOklchHex(hue, lightness, chroma) {
  return controlsNormalizeHexColor(
    controlsOklchToHex(lightness, chroma, hue, {
      minLightness: 0.12,
      maxLightness: 0.94,
      maxChroma: 0.24,
    })
  );
}

function getTemperatureBasedHue() {
  const useWarmPalette =
    temperature.warm && (!temperature.cool || Math.random() < 0.5);

  if (useWarmPalette) {
    return Math.random() < 0.2
      ? 300 + Math.random() * 60
      : Math.random() * 60;
  }

  return 120 + Math.random() * 180;
}

function buildAlternativeMonochromePalette(targetCount) {
  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = getTemperatureTargetLightness({
    brightness: getCurrentBrightnessValue(),
  });
  const monochromeChroma = getTemperatureTargetChroma(
    {
      saturation: clampControlValue(
        getCurrentSaturationValue(),
        0,
        LOW_SATURATION_FALLBACK_THRESHOLD
      ),
    },
    {
      minChroma: 0.001,
      maxChroma: 0.05,
      gamma: 1.5,
    }
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 0.07, 0.28, 0.56);

  let minLightness = clampControlValue(centerLightness - spread / 2, 0.14, 0.9);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 0.18, 0.94);

  if (maxLightness - minLightness < 0.24) {
    minLightness = 0.14;
    maxLightness = 0.94;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -0.018, 0.018, -0.036, 0.036, -0.054, 0.054];
  const chromaAdjustments = [0, -0.004, 0.004, -0.008, 0.008];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const chromaAdjustment =
        chromaAdjustments[
          Math.abs(Math.round((adjustment || 0) * 1000)) % chromaAdjustments.length
        ];
      const candidate = createTemperatureOklchHex(
        baseHue,
        clampControlValue(baseLightness + adjustment, 0.12, 0.94),
        clampControlValue(monochromeChroma + chromaAdjustment, 0.004, 0.07)
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function buildTemperatureColorFromSettings(settings) {
  const hue = getTemperatureBasedHue();
  const lightness = getTemperatureTargetLightness(settings);
  const chroma = getTemperatureTargetChroma(settings);

  return createTemperatureOklchHex(hue, lightness, chroma);
}

function buildAlternativeMonochromePaletteForSettings(targetCount, settings) {
  if (!settings) {
    return buildAlternativeMonochromePalette(targetCount);
  }

  if (targetCount <= 0) {
    return [];
  }

  const palette = [];
  const usedColors = new Set();
  const centerLightness = getTemperatureTargetLightness(settings);
  const monochromeChroma = getTemperatureTargetChroma(
    {
      saturation: clampControlValue(
        settings.saturation,
        0,
        LOW_SATURATION_FALLBACK_THRESHOLD
      ),
    },
    {
      minChroma: 0.001,
      maxChroma: 0.05,
      gamma: 1.5,
    }
  );
  const baseHue = getTemperatureBasedHue();
  const spread = clampControlValue(targetCount * 0.07, 0.28, 0.56);

  let minLightness = clampControlValue(centerLightness - spread / 2, 0.14, 0.9);
  let maxLightness = clampControlValue(centerLightness + spread / 2, 0.18, 0.94);

  if (maxLightness - minLightness < 0.24) {
    minLightness = 0.14;
    maxLightness = 0.94;
  }

  const lightnessStops = Array.from({ length: targetCount }, (_, index) => {
    if (targetCount === 1) {
      return centerLightness;
    }

    return minLightness + ((maxLightness - minLightness) * index) / (targetCount - 1);
  });

  const adjustments = [0, -0.018, 0.018, -0.036, 0.036, -0.054, 0.054];
  const chromaAdjustments = [0, -0.004, 0.004, -0.008, 0.008];

  lightnessStops.forEach((baseLightness) => {
    for (const adjustment of adjustments) {
      const chromaAdjustment =
        chromaAdjustments[
          Math.abs(Math.round((adjustment || 0) * 1000)) % chromaAdjustments.length
        ];
      const candidate = createTemperatureOklchHex(
        baseHue,
        clampControlValue(baseLightness + adjustment, 0.12, 0.94),
        clampControlValue(monochromeChroma + chromaAdjustment, 0.004, 0.07)
      );

      if (isDisallowedColor(candidate) || usedColors.has(candidate)) {
        continue;
      }

      usedColors.add(candidate);
      palette.push(candidate);
      break;
    }
  });

  return palette;
}

function buildTemperaturePaletteForSettings(targetCount, settings) {
  const resolvedSettings = {
    brightness: Number.isFinite(settings?.brightness)
      ? settings.brightness
      : getCurrentBrightnessValue(),
    saturation: Number.isFinite(settings?.saturation)
      ? settings.saturation
      : getCurrentSaturationValue(),
  };
  const usedColors = new Set();
  const nextPalette = [];
  const maxRetriesPerColor = 12;

  for (let index = 0; index < targetCount; index += 1) {
    let color = null;
    let retries = 0;

    while (!color && retries < maxRetriesPerColor) {
      const candidate = buildTemperatureColorFromSettings(resolvedSettings);
      if (!usedColors.has(candidate)) {
        color = candidate;
      }
      retries += 1;
    }

    if (!color) {
      break;
    }

    usedColors.add(color);
    nextPalette.push(color);
  }

  let usedAlternativePalette = false;
  if (
    nextPalette.length < targetCount &&
    resolvedSettings.saturation <= LOW_SATURATION_FALLBACK_THRESHOLD
  ) {
    const alternativePalette = buildAlternativeMonochromePaletteForSettings(
      targetCount,
      resolvedSettings
    );

    if (alternativePalette.length === targetCount) {
      return {
        palette: alternativePalette,
        usedAlternativePalette: true,
      };
    }
  }

  return {
    palette: nextPalette,
    usedAlternativePalette,
  };
}
`,Sl=`// Palette generator color mode: color parsing, harmony rules and generation.

const COLOR_MODE_PALETTE_SIZES = Object.freeze({
  automatic: [2, 3, 4, 6, 9],
  monochromatic: [6, 9, 12],
  complementary: [2, 6],
  analogous: [3],
  triad: [3],
  tetrad: [4],
});
const MONOCHROMATIC_GENERATION_MODES = new Set(["automatic", "shades", "tints"]);
const ANALOGOUS_SEPARATION_DEGREES = Object.freeze({
  soft: 15,
  medium: 30,
  intense: 60,
});
const COMPLEMENTARY_VARIANT_PROFILES = Object.freeze([
  { complementLightnessOffset: 0, complementChromaScale: 1, tintStrength: 0.66, shadeStrength: 0.58 },
  { complementLightnessOffset: 0.02, complementChromaScale: 0.94, tintStrength: 0.72, shadeStrength: 0.54 },
  { complementLightnessOffset: -0.02, complementChromaScale: 1.06, tintStrength: 0.62, shadeStrength: 0.62 },
]);
const TRIAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [120, -120], lightnessBiases: [-0.014, 0.014], chromaScales: [0.98, 0.92] },
  { offsets: [114, -114], lightnessBiases: [-0.01, 0.01], chromaScales: [0.94, 0.96] },
  { offsets: [126, -126], lightnessBiases: [-0.018, 0.018], chromaScales: [1, 0.9] },
]);
const TETRAD_VARIANT_PROFILES = Object.freeze([
  { offsets: [90, 180, 270], lightnessBiases: [-0.012, 0, -0.006], chromaScales: [0.92, 0.88, 0.94] },
  { offsets: [84, 180, 276], lightnessBiases: [-0.008, 0.004, -0.012], chromaScales: [0.94, 0.9, 0.9] },
  { offsets: [96, 180, 264], lightnessBiases: [-0.016, -0.002, -0.004], chromaScales: [0.9, 0.86, 0.96] },
]);

let colorModeParserElement = null;
const paletteGeneratorStoreSnapshotForColorMode = window.PaletteGeneratorStore?.getState?.() || null;
let colorPaletteVariantIndex = Number.isFinite(
  paletteGeneratorStoreSnapshotForColorMode?.colorPaletteVariantIndex
)
  ? paletteGeneratorStoreSnapshotForColorMode.colorPaletteVariantIndex
  : 0;
syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
  scope: "color-variant",
});

function normalizeMonochromaticGenerationMode(mode) {
  return MONOCHROMATIC_GENERATION_MODES.has(mode)
    ? mode
    : DEFAULT_MONOCHROMATIC_GENERATION_MODE;
}

function normalizeAnalogousSeparationMode(mode) {
  return Object.prototype.hasOwnProperty.call(ANALOGOUS_SEPARATION_DEGREES, mode)
    ? mode
    : DEFAULT_ANALOGOUS_SEPARATION_MODE;
}

function shouldShowMonochromaticModeControl() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "monochromatic";
}

function shouldShowAnalogousSeparationControl() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "analogous";
}

function syncMonochromaticModeControlState() {
  const resolvedMode = normalizeMonochromaticGenerationMode(
    selectedMonochromaticGenerationMode
  );
  selectedMonochromaticGenerationMode = resolvedMode;
  syncPaletteGeneratorStoreState(
    {
      selectedMonochromaticGenerationMode,
    },
    {
      scope: "monochromatic-mode",
    }
  );

  if (monochromaticModeSelect) {
    monochromaticModeSelect.value = resolvedMode;
  }

  if (monochromaticModeControl) {
    monochromaticModeControl.hidden = !shouldShowMonochromaticModeControl();
  }
}

function syncAnalogousSeparationControlState() {
  const resolvedMode = normalizeAnalogousSeparationMode(
    selectedAnalogousSeparationMode
  );
  selectedAnalogousSeparationMode = resolvedMode;
  syncPaletteGeneratorStoreState(
    {
      selectedAnalogousSeparationMode,
    },
    {
      scope: "analogous-separation",
    }
  );

  if (analogousSeparationSelect) {
    analogousSeparationSelect.value = resolvedMode;
  }

  if (analogousSeparationControl) {
    analogousSeparationControl.hidden = !shouldShowAnalogousSeparationControl();
  }
}

function ensureColorModeParserElement() {
  if (colorModeParserElement) {
    return colorModeParserElement;
  }

  const parserElement = document.createElement("div");
  parserElement.style.position = "absolute";
  parserElement.style.opacity = "0";
  parserElement.style.pointerEvents = "none";
  parserElement.style.inset = "-9999px auto auto -9999px";
  document.body.appendChild(parserElement);
  colorModeParserElement = parserElement;
  return colorModeParserElement;
}

function normalizePaletteBaseColorInput(value) {
  return String(value ?? "").trim();
}

function normalizePaletteBaseCssColor(value) {
  if (typeof window.AppColorUtils?.parseCssColor === "function") {
    return window.AppColorUtils.parseCssColor(value);
  }

  const normalizedInputValue = normalizePaletteBaseColorInput(value);
  if (!normalizedInputValue) {
    return null;
  }

  const parserElement = ensureColorModeParserElement();
  parserElement.style.color = "";
  parserElement.style.color = normalizedInputValue;

  if (!parserElement.style.color) {
    return null;
  }

  const computedColor = window.getComputedStyle(parserElement).color;
  const rgbMatch = computedColor.match(/rgba?\\(([^)]+)\\)/i);
  if (!rgbMatch) {
    return null;
  }

  const rgbChannels = rgbMatch[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => Number.parseFloat(channel.trim()));

  if (
    rgbChannels.length !== 3 ||
    rgbChannels.some((channel) => !Number.isFinite(channel))
  ) {
    return null;
  }

  const hex = controlsNormalizeHexColor(
    \`#\${rgbChannels
      .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
      .join("")}\`
  );

  return {
    inputValue: normalizedInputValue,
    css: computedColor,
    hex,
    rgb: rgbChannels,
    hsl: controlsHexToHsl(hex),
    oklch: window.AppColorUtils?.hexToOklch?.(hex) || null,
  };
}

function setPaletteBaseColorFeedback(message = "", isInvalid = false) {
  if (paletteColorInputFeedback) {
    paletteColorInputFeedback.textContent = message;
  }

  if (paletteColorTextInput) {
    paletteColorTextInput.classList.toggle("is-invalid", !!isInvalid);
  }
}

function applyPaletteBaseColorInputState(parsedColor, options = {}) {
  if (!parsedColor) {
    setPaletteBaseColorFeedback(
      "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
      true
    );
    return false;
  }

  selectedPaletteBaseColor = parsedColor.hex;
  syncPaletteGeneratorStoreState(
    {
      selectedPaletteBaseColor,
    },
    {
      scope: "base-color",
    }
  );

  if (paletteColorTextInput && options.syncTextInput !== false) {
    paletteColorTextInput.value = parsedColor.inputValue;
  }

  if (paletteColorPicker) {
    paletteColorPicker.value = parsedColor.hex;
  }

  if (paletteColorSwatchFill) {
    paletteColorSwatchFill.style.backgroundColor = parsedColor.css;
  }

  setPaletteBaseColorFeedback("");
  syncSelectedPaletteBaseColorCard();
  return true;
}

function syncSelectedPaletteBaseColorCard() {
  if (
    paletteBaseMode !== "color" ||
    currentPalette.length === 0 ||
    typeof getColorCards !== "function" ||
    typeof setCardColor !== "function" ||
    typeof syncCurrentPaletteFromDom !== "function"
  ) {
    return;
  }

  const cards = Array.from(getColorCards());
  const baseCardIndex =
    typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(cards.length)
      : 0;
  const baseCard = cards[baseCardIndex];
  if (!baseCard) {
    return;
  }

  setCardColor(baseCard, selectedPaletteBaseColor);
  if (typeof setCardPinnedState === "function") {
    setCardPinnedState(baseCard, true);
  }
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  syncCurrentPaletteFromDom();
}

function getPaletteBaseColorSnapshot() {
  return normalizePaletteBaseCssColor(paletteColorTextInput?.value || selectedPaletteBaseColor);
}

function hasValidSelectedPaletteBaseColor() {
  return !!getPaletteBaseColorSnapshot();
}

function getAllowedPaletteSizesForType(type) {
  return COLOR_MODE_PALETTE_SIZES[type] || COLOR_MODE_PALETTE_SIZES.automatic;
}

function getDefaultPaletteSizeForType(type) {
  if (type === "monochromatic") {
    return 9;
  }

  const allowedSizes = getAllowedPaletteSizesForType(type);
  return allowedSizes[0];
}

function resolveAutomaticColorPaletteType(targetCount = paletteSize) {
  if (targetCount === 2) {
    return "complementary";
  }

  if (targetCount === 3) {
    return "triad";
  }

  if (targetCount === 4) {
    return "tetrad";
  }

  if (targetCount === 6) {
    return "analogous";
  }

  const baseColor = getPaletteBaseColorSnapshot();
  const referenceSaturation = Number.isFinite(baseColor?.hsl?.s)
    ? baseColor.hsl.s
    : getCurrentSaturationValue();

  return referenceSaturation <= 42 ? "monochromatic" : "analogous";
}

function getEffectiveColorPaletteType(targetCount = paletteSize) {
  if (selectedColorPaletteType !== "automatic") {
    return selectedColorPaletteType;
  }

  return resolveAutomaticColorPaletteType(targetCount);
}

function isColorModeMonochromaticScaleActive(targetCount = paletteSize) {
  return (
    paletteBaseMode === "color" &&
    getEffectiveColorPaletteType(targetCount) === "monochromatic"
  );
}

function getAllowedPaletteSizesForCurrentMode() {
  if (paletteBaseMode !== "color") {
    return [3, 6, 9];
  }

  return getAllowedPaletteSizesForType(selectedColorPaletteType);
}

function getNearestAllowedPaletteSize(nextSize, allowedSizes = getAllowedPaletteSizesForCurrentMode()) {
  if (allowedSizes.includes(nextSize)) {
    return nextSize;
  }

  return [...allowedSizes]
    .sort((left, right) => {
      const leftDistance = Math.abs(left - nextSize);
      const rightDistance = Math.abs(right - nextSize);

      if (leftDistance !== rightDistance) {
        return leftDistance - rightDistance;
      }

      return left - right;
    })[0];
}

function resolvePaletteSizeForType(type, nextSize) {
  const allowedSizes = getAllowedPaletteSizesForType(type);

  if (allowedSizes.includes(nextSize)) {
    return nextSize;
  }

  const defaultSize = getDefaultPaletteSizeForType(type);
  if (allowedSizes.includes(defaultSize)) {
    return defaultSize;
  }

  return getNearestAllowedPaletteSize(nextSize, allowedSizes);
}

function syncPaletteTypeOptionStates() {
  if (!(paletteTypeOptions instanceof HTMLSelectElement)) {
    return;
  }

  paletteTypeOptions.value = selectedColorPaletteType;

  const resolvedType = getEffectiveColorPaletteType();
  resolvedAutomaticColorPaletteType = resolvedType;
  syncPaletteGeneratorStoreState(
    {
      selectedColorPaletteType,
      resolvedAutomaticColorPaletteType,
    },
    {
      scope: "palette-type",
    }
  );

  if (paletteTypeResolvedLabel) {
    const shouldShowResolvedType = selectedColorPaletteType === "automatic";
    paletteTypeResolvedLabel.hidden = !shouldShowResolvedType;
    paletteTypeResolvedLabel.textContent = shouldShowResolvedType
      ? \`Resultado automático: \${getPaletteTypeDisplayLabel(resolvedType)}\`
      : "";
  }
}

function getPaletteTypeDisplayLabel(type) {
  switch (type) {
    case "monochromatic":
      return "Monocromática";
    case "complementary":
      return "Complementaria";
    case "analogous":
      return "Análoga";
    case "triad":
      return "Triada";
    case "tetrad":
      return "Tétrada";
    default:
      return "Automática";
  }
}

function syncColorModeBaseControls() {
  const parsedColor = normalizePaletteBaseCssColor(selectedPaletteBaseColor);
  if (parsedColor) {
    applyPaletteBaseColorInputState(parsedColor, {
      syncTextInput: true,
    });
  }

  syncPaletteTypeOptionStates();
  syncMonochromaticModeControlState();
  syncAnalogousSeparationControlState();
}

function setSelectedColorPaletteType(nextType, options = {}) {
  selectedColorPaletteType = COLOR_MODE_PALETTE_SIZES[nextType]
    ? nextType
    : DEFAULT_COLOR_PALETTE_TYPE;
  syncPaletteTypeOptionStates();
  syncMonochromaticModeControlState();
  syncAnalogousSeparationControlState();

  if (typeof clearUnavailablePinnedCards === "function") {
    clearUnavailablePinnedCards();
  }

  const allowedSizes = getAllowedPaletteSizesForCurrentMode();
  const nextSize = selectedColorPaletteType === "monochromatic"
    ? resolvePaletteSizeForType(selectedColorPaletteType, paletteSize)
    : getNearestAllowedPaletteSize(paletteSize, allowedSizes);
  const didSizeChange = nextSize !== paletteSize;
  setPaletteSize(nextSize);
  syncPaletteGeneratorStoreState(
    {
      selectedColorPaletteType,
      paletteSize,
    },
    {
      scope: "palette-type",
    }
  );

  if (typeof updatePaletteSizeButtonsAvailability === "function") {
    updatePaletteSizeButtonsAvailability();
  }

  if (typeof updatePaletteModeActionVisibility === "function") {
    updatePaletteModeActionVisibility();
  }

  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }

  if (options.generate !== false && paletteBaseMode === "color") {
    if (didSizeChange) {
      void generatePalette();
      return;
    }

    if (currentPalette.length > 0) {
      void generatePalette();
    }
  }
}

function setSelectedPaletteBaseColor(nextValue, options = {}) {
  const parsedColor = normalizePaletteBaseCssColor(nextValue);
  const wasApplied = applyPaletteBaseColorInputState(parsedColor, {
    syncTextInput: options.syncTextInput !== false,
  });

  if (!wasApplied) {
    if (typeof updatePaletteModeActionVisibility === "function") {
      updatePaletteModeActionVisibility();
    }
    if (typeof updatePaletteActionButtonsAvailability === "function") {
      updatePaletteActionButtonsAvailability();
    }
    return false;
  }

  if (options.publish !== false) {
    window.AppSharedColors?.setActiveColor(selectedPaletteBaseColor, {
      source: "palette-generator",
      action: "color-base-update",
    });
  }

  if (options.generate !== false && paletteBaseMode === "color" && currentPalette.length > 0) {
    void generatePalette();
  }

  if (typeof updatePaletteModeActionVisibility === "function") {
    updatePaletteModeActionVisibility();
  }

  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }

  return true;
}

function setSelectedMonochromaticGenerationMode(nextMode, options = {}) {
  selectedMonochromaticGenerationMode = normalizeMonochromaticGenerationMode(nextMode);
  syncPaletteGeneratorStoreState(
    {
      selectedMonochromaticGenerationMode,
    },
    {
      scope: "monochromatic-mode",
    }
  );
  syncMonochromaticModeControlState();

  if (
    options.generate !== false &&
    paletteBaseMode === "color" &&
    selectedColorPaletteType === "monochromatic" &&
    currentPalette.length > 0
  ) {
    void generatePalette();
  }
}

function setSelectedAnalogousSeparationMode(nextMode, options = {}) {
  selectedAnalogousSeparationMode = normalizeAnalogousSeparationMode(nextMode);
  syncPaletteGeneratorStoreState(
    {
      selectedAnalogousSeparationMode,
    },
    {
      scope: "analogous-separation",
    }
  );
  syncAnalogousSeparationControlState();

  if (
    options.generate !== false &&
    paletteBaseMode === "color" &&
    selectedColorPaletteType === "analogous" &&
    currentPalette.length > 0
  ) {
    void generatePalette();
  }
}

function getColorModeAnchorOffsets(type, targetCount, variantIndex) {
  const direction = variantIndex % 2 === 0 ? 1 : -1;

  switch (type) {
    case "monochromatic":
      return [0];
    case "complementary":
      return [0, 180];
    case "analogous":
      if (targetCount <= 2) {
        return [0, 26 * direction];
      }
      return [0, 22 * direction, -22 * direction, 42 * direction, -42 * direction];
    case "triad":
      return [0, 120, 240];
    case "tetrad":
      return [0, 90, 180, 270];
    default:
      return [0];
  }
}

function getColorModeVariantOffsets(index, variantIndex) {
  const lightnessOffsets = [0, 14, -12, 22, -20, 8, -8, 28, -26];
  const saturationOffsets = [0, -10, 12, -16, 18, -6, 6, -14, 10];
  const rotation = Math.abs(variantIndex) % lightnessOffsets.length;
  const pointer = (index + rotation) % lightnessOffsets.length;

  return {
    lightnessOffset: lightnessOffsets[pointer],
    saturationOffset: saturationOffsets[pointer],
  };
}

function getColorModeSaturationInfluence(saturation, options = {}) {
  const ratio = clampControlValue((Number(saturation) || 0) / 100, 0, 1);
  const knee = Number.isFinite(options.knee) ? options.knee : 0.2;
  const protectedFloor = Number.isFinite(options.protectedFloor)
    ? options.protectedFloor
    : 0.2;
  const upperGamma = Number.isFinite(options.upperGamma) ? options.upperGamma : 0.78;
  const lowerGamma = Number.isFinite(options.lowerGamma) ? options.lowerGamma : 1.85;

  if (ratio <= 0) {
    return 0;
  }

  if (ratio >= 1) {
    return 1;
  }

  if (ratio > knee) {
    const normalizedUpperRatio = (ratio - knee) / (1 - knee);
    return protectedFloor + (1 - protectedFloor) * (normalizedUpperRatio ** upperGamma);
  }

  return protectedFloor * ((ratio / knee) ** lowerGamma);
}

function getColorModeTargetChroma(saturation, options = {}) {
  const minimumChroma = Number.isFinite(options.minChroma) ? options.minChroma : 0.0015;
  const maximumChroma = Number.isFinite(options.maxChroma) ? options.maxChroma : 0.24;
  const saturationInfluence = getColorModeSaturationInfluence(saturation, options);

  return minimumChroma + (maximumChroma - minimumChroma) * saturationInfluence;
}

function createColorModeCandidateColor(baseColor, hueOffset, index, variantIndex, settings) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const targetSaturation = Number.isFinite(settings?.saturation)
    ? settings.saturation
    : getCurrentSaturationValue();
  const targetBrightness = Number.isFinite(settings?.brightness)
    ? settings.brightness
    : getCurrentBrightnessValue();
  const { lightnessOffset, saturationOffset } = getColorModeVariantOffsets(index, variantIndex);
  const centerLightness = mapBrightnessValueToOklchLightness(targetBrightness, {
    minLightness: 0.2,
    maxLightness: 0.92,
  });
  const targetChroma = getColorModeTargetChroma(targetSaturation, {
    minChroma: 0.0015,
    maxChroma: 0.24,
  });
  const chroma = clampControlValue(
    blendControlValue(Math.max(baseOklch.chroma, 0.012), targetChroma, 0.78) +
      saturationOffset * 0.0014,
    0.001,
    0.26
  );
  const lightness = clampControlValue(
    blendControlValue(baseOklch.lightness, centerLightness, 0.72) + lightnessOffset / 100,
    0.16,
    0.94
  );
  const hue = baseOklch.hue + hueOffset;

  return createColorModeOklchHex(lightness, chroma, hue);
}

function getMonochromaticScalePerceivedLightness(hex) {
  return typeof window.AppColorUtils?.getPerceivedLightness === "function"
    ? window.AppColorUtils.getPerceivedLightness(hex)
    : controlsHexToHsl(hex).l;
}

function resolveAutomaticMonochromaticScaleDirection(baseColor) {
  const baseLightness = Number.isFinite(baseColor?.oklch?.l)
    ? baseColor.oklch.l
    : Number.isFinite(baseColor?.hsl?.l)
      ? baseColor.hsl.l / 100
      : 0.5;
  const perceivedLightness = typeof baseColor?.hex === "string"
    ? getMonochromaticScalePerceivedLightness(baseColor.hex)
    : baseLightness;
  const resolvedLightness = blendControlValue(baseLightness, perceivedLightness, 0.68);

  return resolvedLightness >= 0.72 ? "dark" : "light";
}

function getMonochromaticScaleDirection(baseColor) {
  const mode = normalizeMonochromaticGenerationMode(selectedMonochromaticGenerationMode);

  if (mode === "shades") {
    return "dark";
  }

  if (mode === "tints") {
    return "light";
  }

  return resolveAutomaticMonochromaticScaleDirection(baseColor);
}

function getMonochromaticBaseOklch(baseColor) {
  const color = baseColor?.color || window.AppColorUtils?.createColor?.(baseColor?.hex);
  if (!color) {
    return null;
  }

  const [lightness = 0, chroma = 0, hue = 0] = color.to("oklch").coords || [];
  return {
    lightness: clampControlValue(lightness, 0, 1),
    chroma: clampControlValue(chroma, 0, 0.4),
    hue: Number.isFinite(hue) ? hue : 0,
  };
}

function getMonochromaticScaleTarget(baseColor, settings, direction) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  if (direction === "light") {
    const maximumLightness = clampControlValue(0.992 - (1 - brightnessRatio) * 0.008, 0.965, 0.995);
    const lightnessRoom = Math.max(0.2, maximumLightness - baseOklch.lightness);
    const targetLightness = clampControlValue(
      baseOklch.lightness + lightnessRoom * (0.86 + brightnessRatio * 0.1),
      Math.min(maximumLightness, baseOklch.lightness + 0.22),
      maximumLightness
    );
    const chromaScale = 0.05 + saturationInfluence * 0.22;

    return {
      lightness: targetLightness,
      chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.001, 0.085),
      hue: baseOklch.hue,
    };
  }

  const minimumLightness = clampControlValue(0.1 + (1 - brightnessRatio) * 0.035, 0.085, 0.16);
  const darknessRoom = Math.max(0.16, baseOklch.lightness - minimumLightness);
  const targetLightness = clampControlValue(
    baseOklch.lightness - darknessRoom * (0.72 + (1 - brightnessRatio) * 0.08),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.18)
  );
  const chromaScale = 0.22 + saturationInfluence * 0.64;

  return {
    lightness: targetLightness,
    chroma: clampControlValue(baseOklch.chroma * chromaScale, 0.003, 0.22),
    hue: baseOklch.hue,
  };
}

function createMonochromaticScaleTargetHex(baseColor, settings, direction) {
  const target = getMonochromaticScaleTarget(baseColor, settings, direction);
  if (!target) {
    return null;
  }

  return window.AppColorUtils?.oklchToHex?.(
    target.lightness,
    target.chroma,
    target.hue,
    {
      minLightness: 0.085,
      maxLightness: 0.995,
      maxChroma: 0.28,
    }
  ) || null;
}

function createColorModeOklchHex(lightness, chroma, hue) {
  return window.AppColorUtils?.oklchToHex?.(
    clampControlValue(lightness, 0, 1),
    clampControlValue(chroma, 0, 0.4),
    hue,
    {
      minLightness: 0.08,
      maxLightness: 0.97,
      maxChroma: 0.28,
    }
  ) || null;
}

function getComplementaryVariantProfile(variantIndex = 0) {
  const profiles = COMPLEMENTARY_VARIANT_PROFILES;
  return profiles[Math.abs(variantIndex) % profiles.length] || profiles[0];
}

function buildComplementaryHueColor(baseColor, settings, variantIndex = 0) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const profile = getComplementaryVariantProfile(variantIndex);
  const lightness = clampControlValue(
    baseOklch.lightness + profile.complementLightnessOffset,
    0.22,
    0.9
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.038) * profile.complementChromaScale,
    0.03,
    0.24
  );

  return createColorModeOklchHex(lightness, chroma, baseOklch.hue + 180);
}

function createComplementaryScaleTargetHex(baseColor, settings, direction) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation, {
    protectedFloor: 0.22,
  });
  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const targetCenterLightness = mapBrightnessValueToOklchLightness(settings.brightness, {
    minLightness: 0.22,
    maxLightness: 0.93,
    gamma: 0.86,
  });

  if (direction === "light") {
    const maximumLightness = clampControlValue(0.94 + brightnessRatio * 0.04, 0.88, 0.985);
    const lightnessRoom = Math.max(0.1, maximumLightness - baseOklch.lightness);
    const lightnessPull = clampControlValue(0.42 + brightnessRatio * 0.34, 0.42, 0.78);
    const targetLightness = clampControlValue(
      blendControlValue(
        baseOklch.lightness + lightnessRoom * lightnessPull,
        Math.max(baseOklch.lightness + 0.07, targetCenterLightness + 0.08),
        0.4
      ),
      Math.min(maximumLightness, baseOklch.lightness + 0.1 + brightnessRatio * 0.08),
      maximumLightness
    );
    const chromaScale = 0.002 + saturationInfluence * 0.86;
    const minimumChroma = 0.0002 + saturationInfluence * 0.0016;
    const maximumChroma = 0.004 + saturationInfluence * 0.094;

    return createColorModeOklchHex(
      targetLightness,
      clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
      baseOklch.hue
    );
  }

  const minimumLightness = clampControlValue(0.3 - brightnessRatio * 0.04, 0.24, 0.32);
  const darknessRoom = Math.max(0.1, baseOklch.lightness - minimumLightness);
  const darknessPull = clampControlValue(0.18 + (1 - brightnessRatio) * 0.2, 0.16, 0.4);
  const targetLightness = clampControlValue(
    blendControlValue(
      baseOklch.lightness - darknessRoom * darknessPull,
      Math.min(baseOklch.lightness - 0.05, targetCenterLightness - 0.08),
      0.28
    ),
    minimumLightness,
    Math.max(minimumLightness, baseOklch.lightness - 0.06)
  );
  const chromaScale = 0.004 + saturationInfluence * 0.98;
  const minimumChroma = 0.00025 + saturationInfluence * 0.0018;
  const maximumChroma = 0.005 + saturationInfluence * 0.112;

  return createColorModeOklchHex(
    targetLightness,
    clampControlValue(baseOklch.chroma * chromaScale, minimumChroma, maximumChroma),
    baseOklch.hue
  );
}

function buildAnalogousRoleColor(baseColor, settings, directionSign, degreeOffset) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessRatio = clampControlValue(settings.brightness / 100, 0, 1);
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const lightnessOffset = directionSign < 0
    ? 0.016 - (1 - brightnessRatio) * 0.006
    : -0.016 + brightnessRatio * 0.006;
  const chromaScale = directionSign < 0
    ? 0.28 + saturationInfluence * 0.82
    : 0.24 + saturationInfluence * 0.86;

  return createColorModeOklchHex(
    clampControlValue(baseOklch.lightness + lightnessOffset, 0.22, 0.9),
    clampControlValue(Math.max(baseOklch.chroma, 0.02) * chromaScale, 0.0015, 0.22),
    baseOklch.hue + degreeOffset * directionSign
  );
}

function buildAnalogousColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const separationMode = normalizeAnalogousSeparationMode(selectedAnalogousSeparationMode);
  const separationDegrees = ANALOGOUS_SEPARATION_DEGREES[separationMode];
  const attemptOffsets = [0, 6, 10, 14];
  let leftHex = null;
  let rightHex = null;

  for (const extraOffset of attemptOffsets) {
    const nextDegrees = separationDegrees + extraOffset;
    const candidateLeft = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      -1,
      nextDegrees
    );
    const candidateRight = buildAnalogousRoleColor(
      parsedBaseColor,
      resolvedSettings,
      1,
      nextDegrees
    );

    if (
      candidateLeft &&
      candidateRight &&
      candidateLeft !== baseHex &&
      candidateRight !== baseHex &&
      candidateLeft !== candidateRight &&
      !isDisallowedColor(candidateLeft) &&
      !isDisallowedColor(candidateRight)
    ) {
      leftHex = controlsNormalizeHexColor(candidateLeft);
      rightHex = controlsNormalizeHexColor(candidateRight);
      break;
    }
  }

  if (!leftHex || !rightHex) {
    return [baseHex];
  }

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (targetCount === 2) {
    return [baseHex, rightHex];
  }

  return [leftHex, baseHex, rightHex];
}

function getTriadVariantProfile(variantIndex = 0) {
  return TRIAD_VARIANT_PROFILES[Math.abs(variantIndex) % TRIAD_VARIANT_PROFILES.length] ||
    TRIAD_VARIANT_PROFILES[0];
}

function getTetradVariantProfile(variantIndex = 0) {
  return TETRAD_VARIANT_PROFILES[Math.abs(variantIndex) % TETRAD_VARIANT_PROFILES.length] ||
    TETRAD_VARIANT_PROFILES[0];
}

function buildBalancedHarmonyRoleColor(baseColor, settings, hueOffset, lightnessBias = 0, chromaScale = 1) {
  const baseOklch = getMonochromaticBaseOklch(baseColor);
  if (!baseOklch) {
    return null;
  }

  const brightnessBias = clampControlValue(
    (settings.brightness - DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationInfluence = getColorModeSaturationInfluence(settings.saturation);
  const balancedLightness = blendControlValue(
    baseOklch.lightness,
    0.56 + brightnessBias * 0.08,
    0.42
  );
  const lightness = clampControlValue(
    balancedLightness + lightnessBias,
    0.34,
    0.76
  );
  const chroma = clampControlValue(
    Math.max(baseOklch.chroma, 0.02) * (0.18 + saturationInfluence * 0.92) * chromaScale,
    0.0015,
    0.18
  );

  return createColorModeOklchHex(
    lightness,
    chroma,
    baseOklch.hue + hueOffset
  );
}

function buildTriadColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;
  const variantProfiles = [
    getTriadVariantProfile(variantIndex),
    ...TRIAD_VARIANT_PROFILES.filter((profile) => profile !== getTriadVariantProfile(variantIndex)),
  ];

  for (const profile of variantProfiles) {
    const [leftOffset, rightOffset] = profile.offsets;
    const leftHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      leftOffset,
      profile.lightnessBiases[0],
      profile.chromaScales[0]
    );
    const rightHex = buildBalancedHarmonyRoleColor(
      parsedBaseColor,
      resolvedSettings,
      rightOffset,
      profile.lightnessBiases[1],
      profile.chromaScales[1]
    );

    if (
      !leftHex ||
      !rightHex ||
      leftHex === baseHex ||
      rightHex === baseHex ||
      leftHex === rightHex ||
      isDisallowedColor(leftHex) ||
      isDisallowedColor(rightHex)
    ) {
      continue;
    }

    const sideDistance = window.AppColorUtils?.getColorDistance?.(leftHex, rightHex, {
      method: "deltae2000",
    });
    const leftDistanceFromBase = window.AppColorUtils?.getColorDistance?.(leftHex, baseHex, {
      method: "deltae2000",
    });
    const rightDistanceFromBase = window.AppColorUtils?.getColorDistance?.(rightHex, baseHex, {
      method: "deltae2000",
    });

    if (
      sideDistance >= 10 &&
      leftDistanceFromBase >= 8 &&
      rightDistanceFromBase >= 8
    ) {
      return [leftHex, baseHex, rightHex];
    }
  }

  return [baseHex];
}

function buildTetradColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;
  const variantProfiles = [
    getTetradVariantProfile(variantIndex),
    ...TETRAD_VARIANT_PROFILES.filter((profile) => profile !== getTetradVariantProfile(variantIndex)),
  ];

  for (const profile of variantProfiles) {
    const roleHexes = profile.offsets.map((offset, index) =>
      buildBalancedHarmonyRoleColor(
        parsedBaseColor,
        resolvedSettings,
        offset,
        profile.lightnessBiases[index],
        profile.chromaScales[index]
      )
    );

    if (
      roleHexes.some((hex) => !hex || hex === baseHex || isDisallowedColor(hex)) ||
      new Set(roleHexes).size !== roleHexes.length
    ) {
      continue;
    }

    const palette = [baseHex, ...roleHexes];
    const hasEnoughDistance = palette.every((color, colorIndex) => {
      return palette.every((otherColor, otherIndex) => {
        if (otherIndex <= colorIndex) {
          return true;
        }

        const minimumDistance =
          colorIndex === 0 || otherIndex === 0
            ? 8
            : 10;
        const distance = window.AppColorUtils?.getColorDistance?.(color, otherColor, {
          method: "deltae2000",
        });

        return distance >= minimumDistance;
      });
    });

    if (hasEnoughDistance) {
      return palette.slice(0, targetCount);
    }
  }

  return [baseHex];
}

function buildComplementaryScaleVariant(baseHex, direction, settings, ratio, existingColors = new Set()) {
  const parsedColor = normalizePaletteBaseCssColor(baseHex);
  if (!parsedColor) {
    return null;
  }

  const targetHex = createComplementaryScaleTargetHex(parsedColor, settings, direction);
  if (!targetHex || targetHex === baseHex) {
    return null;
  }

  const steps = buildMonochromaticScaleCandidates(baseHex, targetHex, 8).slice(1);
  if (steps.length === 0) {
    return null;
  }

  const idealIndex = Math.max(
    0,
    Math.min(steps.length - 1, Math.round((steps.length - 1) * clampControlValue(ratio, 0.35, 0.9)))
  );
  const candidateIndexes = [
    ...steps.slice(idealIndex).map((_, index) => idealIndex + index),
    ...steps.slice(0, idealIndex).map((_, index) => idealIndex - index - 1),
  ];

  function resolveComplementaryScaleCandidate(candidateIndex) {
    let resolvedIndex = candidateIndex;
    let candidate = controlsNormalizeHexColor(steps[resolvedIndex]);

    while (
      resolvedIndex > 0 &&
      (candidate === "#FFFFFF" || candidate === "#000000")
    ) {
      resolvedIndex -= 1;
      candidate = controlsNormalizeHexColor(steps[resolvedIndex]);
    }

    return candidate;
  }

  for (const candidateIndex of candidateIndexes) {
    const candidate = resolveComplementaryScaleCandidate(candidateIndex);
    if (
      !candidate ||
      candidate === baseHex ||
      existingColors.has(candidate) ||
      isDisallowedColor(candidate)
    ) {
      continue;
    }

    const isDistinctEnough = [...existingColors].every((existingColor) => {
      const deltaE = window.AppColorUtils?.getColorDistance?.(candidate, existingColor, {
        method: "deltae2000",
      });
      return deltaE >= 8;
    });

    if (isDistinctEnough) {
      return candidate;
    }
  }

  const fallbackCandidate = resolveComplementaryScaleCandidate(steps.length - 1);
  if (
    fallbackCandidate &&
    fallbackCandidate !== baseHex &&
    !existingColors.has(fallbackCandidate) &&
    !isDisallowedColor(fallbackCandidate)
  ) {
    return fallbackCandidate;
  }

  return null;
}

function buildComplementaryColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const profile = getComplementaryVariantProfile(variantIndex);
  const brightnessBias = clampControlValue(
    (resolvedSettings.brightness - DEFAULT_BRIGHTNESS) / 35,
    -1,
    1
  );
  const saturationLoss = Math.pow(
    clampControlValue((DEFAULT_SATURATION - resolvedSettings.saturation) / 100, 0, 1),
    0.9
  );
  const tintRatio = targetCount >= 6
    ? clampControlValue(
        profile.tintStrength - 0.34 + brightnessBias * 0.08 - saturationLoss * 0.08,
        0.18,
        0.5
      )
    : profile.tintStrength;
  const shadeRatio = clampControlValue(
    profile.shadeStrength - 0.22 - brightnessBias * 0.08 + saturationLoss * 0.06,
    0.24,
    0.54
  );
  const baseHex = parsedBaseColor.hex;
  const complementHex = buildComplementaryHueColor(
    parsedBaseColor,
    resolvedSettings,
    variantIndex
  );

  if (!complementHex || complementHex === baseHex) {
    return [baseHex];
  }

  if (targetCount <= 2) {
    return [baseHex, complementHex];
  }

  const palette = [];
  const usedColors = new Set();
  const baseTint = buildComplementaryScaleVariant(
    baseHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors
  );
  if (baseTint) {
    palette.push(baseTint);
    usedColors.add(baseTint);
  }

  palette.push(baseHex);
  usedColors.add(baseHex);

  const baseShade = buildComplementaryScaleVariant(
    baseHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors
  );
  if (baseShade) {
    palette.push(baseShade);
    usedColors.add(baseShade);
  }

  const complementTint = buildComplementaryScaleVariant(
    complementHex,
    "light",
    resolvedSettings,
    tintRatio,
    usedColors
  );
  if (complementTint) {
    palette.push(complementTint);
    usedColors.add(complementTint);
  }

  if (!usedColors.has(complementHex)) {
    palette.push(complementHex);
    usedColors.add(complementHex);
  }

  const complementShade = buildComplementaryScaleVariant(
    complementHex,
    "dark",
    resolvedSettings,
    shadeRatio,
    usedColors
  );
  if (complementShade) {
    palette.push(complementShade);
    usedColors.add(complementShade);
  }

  return palette.slice(0, targetCount);
}

function getMonochromaticColorOklchLightness(hex) {
  const color = window.AppColorUtils?.createColor?.(hex);
  const [lightness = 0] = color?.to("oklch")?.coords || [];
  return clampControlValue(lightness, 0, 1);
}

function buildMonochromaticScaleCandidates(baseHex, targetHex, stepCount) {
  if (typeof window.AppColorUtils?.getHexColorSteps !== "function") {
    return [];
  }

  return window.AppColorUtils.getHexColorSteps(baseHex, targetHex, stepCount, {
    space: "oklch",
    outputSpace: "srgb",
  });
}

function filterDistinctMonochromaticScaleColors(baseHex, colors, desiredCount, targetCount) {
  const palette = [];
  const usedColors = new Set([baseHex]);
  const strictMinimumDistance = targetCount >= 12 ? 1.9 : targetCount >= 9 ? 2.5 : 3.8;
  const relaxedMinimumDistance = targetCount >= 12 ? 1.2 : targetCount >= 9 ? 1.6 : 2.4;
  const strictMinimumLightnessGap = targetCount >= 12 ? 0.008 : targetCount >= 9 ? 0.012 : 0.02;
  const relaxedMinimumLightnessGap = targetCount >= 12 ? 0.005 : targetCount >= 9 ? 0.008 : 0.014;

  [true, false].forEach((useStrictThresholds) => {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = controlsNormalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColor(normalizedColor)
      ) {
        return;
      }

      const candidateLightness = getMonochromaticColorOklchLightness(normalizedColor);
      const minimumDistance = useStrictThresholds
        ? strictMinimumDistance
        : relaxedMinimumDistance;
      const minimumLightnessGap = useStrictThresholds
        ? strictMinimumLightnessGap
        : relaxedMinimumLightnessGap;
      const hasEnoughSeparation = palette.every((existingColor) => {
        const deltaE = window.AppColorUtils?.getColorDistance?.(normalizedColor, existingColor, {
          method: "deltae2000",
        });
        const lightnessGap = Math.abs(
          candidateLightness - getMonochromaticColorOklchLightness(existingColor)
        );

        return deltaE >= minimumDistance && lightnessGap >= minimumLightnessGap;
      });

      if (!hasEnoughSeparation) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  });

  if (palette.length < desiredCount * 2) {
    colors.forEach((color) => {
      if (palette.length >= desiredCount * 4 || !color) {
        return;
      }

      const normalizedColor = controlsNormalizeHexColor(color);
      if (
        normalizedColor === baseHex ||
        usedColors.has(normalizedColor) ||
        isDisallowedColor(normalizedColor)
      ) {
        return;
      }

      usedColors.add(normalizedColor);
      palette.push(normalizedColor);
    });
  }

  return palette;
}

function selectMonochromaticScaleStops(colors, desiredCount, direction) {
  if (colors.length <= desiredCount) {
    return [...colors];
  }

  const selectedIndexes = new Set();
  const maxIndex = colors.length - 1;
  const distributionGamma = direction === "dark" ? 1.32 : 1;

  for (let slotIndex = 1; slotIndex <= desiredCount; slotIndex += 1) {
    const normalizedPosition = slotIndex / desiredCount;
    const idealIndex = Math.round((normalizedPosition ** distributionGamma) * maxIndex);
    let resolvedIndex = idealIndex;
    let searchOffset = 0;

    while (selectedIndexes.has(resolvedIndex) && searchOffset <= maxIndex) {
      searchOffset += 1;
      const forwardIndex = idealIndex + searchOffset;
      const backwardIndex = idealIndex - searchOffset;

      if (forwardIndex <= maxIndex && !selectedIndexes.has(forwardIndex)) {
        resolvedIndex = forwardIndex;
        break;
      }

      if (backwardIndex >= 0 && !selectedIndexes.has(backwardIndex)) {
        resolvedIndex = backwardIndex;
        break;
      }
    }

    selectedIndexes.add(resolvedIndex);
  }

  return [...selectedIndexes]
    .sort((left, right) => left - right)
    .map((index) => colors[index])
    .filter(Boolean);
}

function orderMonochromaticScaleColors(baseHex, colors, direction) {
  const baseLightness = getMonochromaticColorOklchLightness(baseHex);

  return [...colors].sort((leftColor, rightColor) => {
    const leftLightness = getMonochromaticColorOklchLightness(leftColor);
    const rightLightness = getMonochromaticColorOklchLightness(rightColor);
    const leftDistanceFromBase = Math.abs(leftLightness - baseLightness);
    const rightDistanceFromBase = Math.abs(rightLightness - baseLightness);

    if (leftDistanceFromBase !== rightDistanceFromBase) {
      return leftDistanceFromBase - rightDistanceFromBase;
    }

    return direction === "dark"
      ? rightLightness - leftLightness
      : leftLightness - rightLightness;
  });
}

// Monochromatic palettes stay on one side of the scale and keep the base color fixed in the first slot.
function buildMonochromaticColorModePalette(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const resolvedSettings = resolvePaletteAdjustmentSettings(settings);
  const baseHex = parsedBaseColor.hex;
  const direction = getMonochromaticScaleDirection(parsedBaseColor);
  const targetHex = createMonochromaticScaleTargetHex(
    parsedBaseColor,
    resolvedSettings,
    direction
  );

  if (targetCount <= 1) {
    return [baseHex];
  }

  if (!targetHex || targetHex === baseHex) {
    return [baseHex];
  }

  const desiredCount = targetCount - 1;
  const stepCounts = [
    desiredCount * 2 + 4,
    desiredCount * 4 + 6,
    desiredCount * 6 + 8,
  ];
  let scaleColors = [];

  stepCounts.some((stepCount) => {
    const candidates = buildMonochromaticScaleCandidates(
      baseHex,
      targetHex,
      stepCount
    ).slice(1);
    const distinctColors = filterDistinctMonochromaticScaleColors(
      baseHex,
      candidates,
      desiredCount,
      targetCount
    );
    const sampledColors = selectMonochromaticScaleStops(
      distinctColors,
      desiredCount,
      direction
    );

    if (sampledColors.length > scaleColors.length) {
      scaleColors = sampledColors;
    }

    return sampledColors.length >= desiredCount;
  });

  return [baseHex, ...orderMonochromaticScaleColors(baseHex, scaleColors, direction)];
}

function orderColorModePaletteByHarmony(colors, baseHex, options = {}) {
  const normalizedColors = normalizePaletteHexCollection(colors);
  if (normalizedColors.length <= 2 || typeof orderPaletteHexColorsByHarmony !== "function") {
    return normalizedColors;
  }

  const harmonyOrderedColors = orderPaletteHexColorsByHarmony(normalizedColors);
  const baseIndex = harmonyOrderedColors.indexOf(baseHex);
  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(normalizedColors.length);

  if (effectiveType === "triad" && harmonyOrderedColors.length === 3 && baseIndex !== -1) {
    const sideColors = harmonyOrderedColors.filter((color) => color !== baseHex);
    if (sideColors.length === 2) {
      return [sideColors[0], baseHex, sideColors[1]];
    }
  }

  if (baseIndex <= 0) {
    return harmonyOrderedColors;
  }

  return [
    ...harmonyOrderedColors.slice(baseIndex),
    ...harmonyOrderedColors.slice(0, baseIndex),
  ];
}

function buildColorModePaletteForSettings(targetCount, settings, options = {}) {
  const parsedBaseColor = options.baseColor || getPaletteBaseColorSnapshot();
  if (!parsedBaseColor) {
    return [];
  }

  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(targetCount);
  const variantIndex = Number.isFinite(options.variantIndex)
    ? options.variantIndex
    : colorPaletteVariantIndex;
  const baseHex = parsedBaseColor.hex;

  if (effectiveType === "monochromatic") {
    return buildMonochromaticColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "complementary") {
    return buildComplementaryColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "analogous" && selectedColorPaletteType === "analogous") {
    return buildAnalogousColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "triad") {
    return buildTriadColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  if (effectiveType === "tetrad") {
    return buildTetradColorModePalette(targetCount, settings, {
      baseColor: parsedBaseColor,
      variantIndex,
    });
  }

  const palette = [baseHex];
  const usedColors = new Set([baseHex]);
  const anchorOffsets = getColorModeAnchorOffsets(effectiveType, targetCount, variantIndex);
  const maxAttemptsPerColor = 12;

  for (let index = 1; index < targetCount; index += 1) {
    let nextColor = null;

    for (let attempt = 0; attempt < maxAttemptsPerColor; attempt += 1) {
      const anchorOffset = anchorOffsets[(index + attempt - 1) % anchorOffsets.length];
      const hueOffset = anchorOffset + (attempt > 0 ? (attempt % 2 === 0 ? attempt * 2 : -attempt * 2) : 0);
      const candidate = createColorModeCandidateColor(
        parsedBaseColor,
        hueOffset,
        index + attempt,
        variantIndex + attempt,
        settings
      );

      if (usedColors.has(candidate) || isDisallowedColor(candidate)) {
        continue;
      }

      nextColor = candidate;
      break;
    }

    if (!nextColor) {
      break;
    }

    usedColors.add(nextColor);
    palette.push(nextColor);
  }

  return orderColorModePaletteByHarmony(palette, baseHex, {
    effectiveType,
  });
}

function createColorModePaletteCandidate(settings, options = {}) {
  const attemptCount = Number.isFinite(options.attemptCount)
    ? Math.max(1, options.attemptCount)
    : Math.max(18, paletteSize * 6);
  const pinnedEntries = Array.isArray(options.pinnedEntries)
    ? options.pinnedEntries
    : getPinnedPaletteEntriesSnapshot();
  const referencePalette = normalizePaletteHexCollection(
    getComparablePaletteSlice(options.referencePalette ?? currentPalette, pinnedEntries)
  );
  const baseColor = options.baseColor || getPaletteBaseColorSnapshot();
  const effectiveType = options.effectiveType || getEffectiveColorPaletteType(paletteSize);

  if (effectiveType === "monochromatic") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "complementary") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "triad") {
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex: 0,
      }
    );

    return palette.length === paletteSize
      ? {
          palette,
          effectiveType,
          variantIndex: 0,
          samePositionCount: getPalettePositionalSimilarityMetrics(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ).samePositionCount,
          isTooSimilar: arePalettesTooSimilar(
            getComparableMergedPaletteSlice(palette, pinnedEntries),
            referencePalette
          ),
          score: scorePaletteHarmony(palette),
        }
      : null;
  }

  if (effectiveType === "tetrad") {
    let bestCandidate = null;

    for (let attempt = 0; attempt < attemptCount; attempt += 1) {
      const variantForAttempt = colorPaletteVariantIndex + 1 + attempt;
      const palette = buildColorModePaletteForSettings(
        paletteSize,
        settings,
        {
          baseColor,
          effectiveType,
          variantIndex: variantForAttempt,
        }
      );

      if (palette.length !== paletteSize) {
        continue;
      }

      const comparablePalette = getComparableMergedPaletteSlice(palette, pinnedEntries);
      const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
        comparablePalette,
        referencePalette
      );
      const candidate = {
        palette,
        effectiveType,
        variantIndex: variantForAttempt,
        samePositionCount: positionalSimilarityMetrics.samePositionCount,
        isTooSimilar: arePalettesTooSimilar(comparablePalette, referencePalette),
        score: scorePaletteHarmony(palette),
      };

      if (
        !bestCandidate ||
        isBetterPaletteFallbackCandidate(candidate, bestCandidate)
      ) {
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  let bestDistinctCandidate = null;
  let bestFallbackCandidate = null;

  for (let attempt = 0; attempt < attemptCount; attempt += 1) {
    const variantIndex = colorPaletteVariantIndex + 1 + attempt;
    const palette = buildColorModePaletteForSettings(
      paletteSize,
      settings,
      {
        baseColor,
        effectiveType,
        variantIndex,
      }
    );

    if (palette.length !== paletteSize) {
      continue;
    }

    const comparablePalette = getComparableMergedPaletteSlice(palette, pinnedEntries);
    const similarityMetrics = getPaletteSimilarityMetrics(comparablePalette, referencePalette);
    const positionalSimilarityMetrics = getPalettePositionalSimilarityMetrics(
      comparablePalette,
      referencePalette
    );
    const similarityPenalty =
      similarityMetrics.sharedColorCount / Math.max(comparablePalette.length, 1);
    const candidate = {
      palette,
      effectiveType,
      variantIndex,
      samePositionCount: positionalSimilarityMetrics.samePositionCount,
      isTooSimilar: arePalettesTooSimilar(comparablePalette, referencePalette),
      score: scorePaletteHarmony(palette) - similarityPenalty * 0.8,
    };

    if (isBetterPaletteFallbackCandidate(candidate, bestFallbackCandidate)) {
      bestFallbackCandidate = candidate;
    }

    if (
      candidate.samePositionCount === 0 &&
      !candidate.isTooSimilar &&
      (!bestDistinctCandidate || candidate.score > bestDistinctCandidate.score)
    ) {
      bestDistinctCandidate = candidate;
    }
  }

  return bestDistinctCandidate || bestFallbackCandidate;
}

function getColorModeRegenerationColorForCard(card, existingColors = new Set()) {
  if (isColorModeMonochromaticScaleActive()) {
    return null;
  }

  const cardIndex = Number.parseInt(card?.dataset?.index || "-1", 10);
  const currentHex = normalizeHexColor(
    card?.querySelector(".color-label")?.textContent?.trim() || ""
  );

  if (!Number.isFinite(cardIndex) || cardIndex <= 0) {
    return null;
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = createColorModePaletteCandidate(getCurrentPaletteAdjustmentSnapshot(), {
      referencePalette: currentPalette,
      attemptCount: 1,
      effectiveType: getEffectiveColorPaletteType(),
    });

    if (!candidate?.palette?.[cardIndex]) {
      continue;
    }

    const nextColor = candidate.palette[cardIndex];
    if (
      nextColor &&
      nextColor !== currentHex &&
      !existingColors.has(nextColor)
    ) {
      colorPaletteVariantIndex = candidate.variantIndex;
      syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
        scope: "color-variant",
      });
      return nextColor;
    }
  }

  return null;
}

function syncColorModeSizeSelection() {
  const allowedSizes = getAllowedPaletteSizesForCurrentMode();
  const nextSize = selectedColorPaletteType === "monochromatic"
    ? resolvePaletteSizeForType(selectedColorPaletteType, paletteSize)
    : getNearestAllowedPaletteSize(paletteSize, allowedSizes);

  if (nextSize !== paletteSize) {
    setPaletteSize(nextSize);
  }

  if (typeof updatePaletteSizeButtonsAvailability === "function") {
    updatePaletteSizeButtonsAvailability();
  }
}

function initializeColorModeControls() {
  syncColorModeBaseControls();
  syncColorModeSizeSelection();

  if (paletteColorSwatchBtn && paletteColorPicker) {
    paletteColorSwatchBtn.addEventListener("click", () => {
      if (typeof paletteColorPicker.showPicker === "function") {
        paletteColorPicker.showPicker();
        return;
      }

      paletteColorPicker.click();
    });
  }

  if (paletteColorPicker) {
    paletteColorPicker.addEventListener("input", () => {
      setSelectedPaletteBaseColor(paletteColorPicker.value, {
        syncTextInput: true,
      });
    });
  }

  if (paletteColorTextInput) {
    paletteColorTextInput.addEventListener("input", () => {
      const parsedColor = normalizePaletteBaseCssColor(paletteColorTextInput.value);
      if (!parsedColor) {
        setPaletteBaseColorFeedback(
          "No se ha detectado un color válido. Usa HEX, rgb(), hsl() o un nombre CSS reconocido.",
          true
        );
        if (typeof updatePaletteActionButtonsAvailability === "function") {
          updatePaletteActionButtonsAvailability();
        }
        return;
      }

      setSelectedPaletteBaseColor(parsedColor.inputValue, {
        syncTextInput: false,
      });
      if (typeof updatePaletteActionButtonsAvailability === "function") {
        updatePaletteActionButtonsAvailability();
      }
    });

    paletteColorTextInput.addEventListener("change", () => {
      setSelectedPaletteBaseColor(paletteColorTextInput.value, {
        syncTextInput: true,
      });
    });
  }

  if (paletteTypeOptions instanceof HTMLSelectElement) {
    paletteTypeOptions.addEventListener("change", () => {
      setSelectedColorPaletteType(paletteTypeOptions.value);
    });
  }

  if (monochromaticModeSelect) {
    monochromaticModeSelect.addEventListener("change", () => {
      setSelectedMonochromaticGenerationMode(monochromaticModeSelect.value);
    });
  }

  if (analogousSeparationSelect) {
    analogousSeparationSelect.addEventListener("change", () => {
      setSelectedAnalogousSeparationMode(analogousSeparationSelect.value);
    });
  }
}

initializeColorModeControls();
`,Il=`function setPaletteAdjustPanelOpen(shouldOpen) {
  if (!paletteAdjustPanel || !paletteAdjustBtn) {
    return;
  }

  isPaletteAdjustPanelOpen = !!shouldOpen;
  paletteAdjustPanel.classList.toggle("is-open", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.classList.toggle("is-active", isPaletteAdjustPanelOpen);
  paletteAdjustBtn.setAttribute("aria-expanded", isPaletteAdjustPanelOpen ? "true" : "false");
  paletteAdjustPanel.setAttribute("aria-hidden", isPaletteAdjustPanelOpen ? "false" : "true");
  updatePaletteStickyState();
}

function setPaletteImageExtractionFeedback(isVisible, message = IMAGE_EXTRACTION_ERROR_MESSAGE) {
  if (paletteContainer) {
    paletteContainer.hidden = isVisible;
  }

  if (addColorElement) {
    addColorElement.hidden = isVisible;
  }

  if (paletteImageExtractionAlert) {
    paletteImageExtractionAlert.hidden = !isVisible;
    paletteImageExtractionAlert.textContent = message;
  }

  if (isVisible) {
    getColorCards().forEach((card) => card.remove());
    currentPalette = [];
    syncPaletteGeneratorStoreCurrentPalette([], {
      scope: "image-extraction-feedback",
    });
    capturePaletteAdjustmentBase([]);
  }

  updatePaletteStickyState();
}

function revealPaletteImageDropzoneForRetry() {
  if (!paletteImageDropzonePanel) {
    return;
  }

  const shouldAnimate = !isPaletteImageDropzoneVisible;
  isPaletteImageDropzoneVisible = true;
  isReplaceImagePending = false;
  renderPaletteImagePreview();

  if (!shouldAnimate) {
    return;
  }

  paletteImageDropzonePanel.classList.remove("is-sliding-in");
  void paletteImageDropzonePanel.offsetWidth;
  paletteImageDropzonePanel.classList.add("is-sliding-in");
}

function ensurePaletteAdjustPanelVisible() {
  if (!isPaletteAdjustPanelOpen) {
    setPaletteAdjustPanelOpen(true);
  }
}

function updatePaletteStickyState() {
  if (!controlsPanel || !paletteSection) {
    return;
  }

  const isDesktopLayout = window.innerWidth > 680;
  const controlsHeight = controlsPanel.scrollHeight;
  const paletteHeight = paletteSection.scrollHeight;
  const shouldStick = isDesktopLayout && paletteHeight > 0 && paletteHeight < controlsHeight;

  paletteSection.classList.toggle("is-sticky", shouldStick);
}

function isTemperatureLockedBySaturation() {
  return (
    getCurrentSaturationValue() <= LOW_SATURATION_FALLBACK_THRESHOLD &&
    getCurrentBrightnessValue() <= LOW_SATURATION_TEMPERATURE_UNLOCK_BRIGHTNESS
  );
}

function renderTemperatureButtonState(button, isActive) {
  if (!button) {
    return;
  }

  const isLocked = isTemperatureLockedBySaturation();
  button.classList.toggle("active", !isLocked && isActive);
  button.classList.toggle("is-saturation-locked", isLocked);
  button.setAttribute("aria-disabled", isLocked ? "true" : "false");
}

function syncTemperatureControlsState() {
  renderTemperatureButtonState(warmBtn, temperature.warm);
  renderTemperatureButtonState(coolBtn, temperature.cool);
}

function animateSaturationControlAttention() {
  if (!saturationControlGroup) {
    return;
  }

  ensurePaletteAdjustPanelVisible();
  saturationControlGroup.classList.remove("needs-attention");
  void saturationControlGroup.offsetWidth;
  saturationControlGroup.classList.add("needs-attention");

  if (saturationAttentionTimeout) {
    clearTimeout(saturationAttentionTimeout);
  }

  saturationAttentionTimeout = setTimeout(() => {
    saturationControlGroup.classList.remove("needs-attention");
    saturationAttentionTimeout = null;
  }, 420);
}

if (brightnessInput) {
  brightnessInput.addEventListener("input", () => {
    updateBrightnessProgress();
    syncTemperatureControlsState();
    syncPaletteGeneratorStoreAdjustments({
      brightness: Number(brightnessInput.value),
    }, {
      scope: "brightness-input",
    });
    applyCurrentPaletteAdjustments();
  });
  brightnessInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateBrightnessProgress();
  syncTemperatureControlsState();
}

if (saturationInput) {
  saturationInput.addEventListener("input", () => {
    updateSaturationProgress();
    syncTemperatureControlsState();
    syncPaletteGeneratorStoreAdjustments({
      saturation: Number(saturationInput.value),
    }, {
      scope: "saturation-input",
    });
    applyCurrentPaletteAdjustments();
  });
  saturationInput.addEventListener("change", () => {
    if (currentPalette.length > 0) {
      saveHistory(currentPalette);
    }
  });
  // Apply the first visual state
  updateSaturationProgress();
  syncTemperatureControlsState();
}

if (paletteAdjustBtn) {
  paletteAdjustBtn.addEventListener("click", () => {
    setPaletteAdjustPanelOpen(!isPaletteAdjustPanelOpen);
  });
}

function updatePaletteModeActionVisibility() {
  const isImageMode = paletteBaseMode === "image";
  const isColorMode = paletteBaseMode === "color";
  const isHiddenRegenerateColorMode =
    isColorMode &&
    ["complementary", "analogous", "triad"].includes(selectedColorPaletteType);
  const isMonochromaticColorScale =
    typeof isColorModeMonochromaticScaleActive === "function" &&
    isColorModeMonochromaticScaleActive();
  const hasImageSource = !!uploadedBaseImage?.dataUrl;

  if (paletteGenerationButtons) {
    paletteGenerationButtons.hidden = isImageMode;
  }

  if (paletteRegenerateBtn) {
    const shouldShowRegenerate = isColorMode
      ? !isMonochromaticColorScale && !isHiddenRegenerateColorMode
      : (!isImageMode || hasImageSource);
    paletteRegenerateBtn.hidden = !shouldShowRegenerate;
  }

  if (surpriseBtn) {
    const shouldShowSurprise =
      !isColorMode &&
      (!isImageMode || hasImageSource);
    surpriseBtn.hidden = !shouldShowSurprise;
  }

  if (paletteInspirationBtn) {
    paletteInspirationBtn.hidden = !(isImageMode && hasImageSource);
  }

  if (paletteIntensityControlGroup) {
    paletteIntensityControlGroup.hidden = isMonochromaticColorScale;
  }
}

function setPaletteActionButtonTooltip(button, tooltipText) {
  if (typeof setActionButtonTooltipText === "function") {
    setActionButtonTooltipText(button, tooltipText);
    return;
  }

  const tooltip = button?.querySelector(".tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = tooltipText;
}

function setPaletteRegenerateButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(paletteRegenerateBtn, tooltipText);
}

function setPaletteSurpriseButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(surpriseBtn, tooltipText);
}

function setPaletteInspirationButtonTooltip(tooltipText) {
  setPaletteActionButtonTooltip(paletteInspirationBtn, tooltipText);
}

function updatePaletteActionButtonsAvailability(availableImageColors = null) {
  updatePaletteRegenerateButtonAvailability(availableImageColors);
  updatePaletteSurpriseButtonAvailability(availableImageColors);
  updatePaletteInspirationButtonAvailability(availableImageColors);
}

function updatePaletteRegenerateButtonAvailability(availableImageColors = null) {
  if (!paletteRegenerateBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);

  if (paletteBaseMode === "color") {
    if (
      typeof isColorModeMonochromaticScaleActive === "function" &&
      isColorModeMonochromaticScaleActive()
    ) {
      paletteRegenerateBtn.disabled = true;
      paletteRegenerateBtn.classList.add("is-disabled");
      paletteRegenerateBtn.setAttribute("aria-disabled", "true");
      setPaletteRegenerateButtonTooltip("Ajusta el color base o Brillo/Saturación");
      return;
    }

    const isDisabled = mutableSlotCount <= 0 || !hasValidSelectedPaletteBaseColor();
    paletteRegenerateBtn.disabled = isDisabled;
    paletteRegenerateBtn.classList.toggle("is-disabled", isDisabled);
    paletteRegenerateBtn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    setPaletteRegenerateButtonTooltip(
      !hasValidSelectedPaletteBaseColor()
        ? "Introduce un color base válido"
        : mutableSlotCount <= 0
          ? "Todos los colores están fijados"
          : "Generar paleta"
    );
    return;
  }

  if (paletteBaseMode !== "image") {
    const isDisabled = mutableSlotCount <= 0;
    paletteRegenerateBtn.disabled = isDisabled;
    paletteRegenerateBtn.classList.toggle("is-disabled", isDisabled);
    paletteRegenerateBtn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    setPaletteRegenerateButtonTooltip(
      isDisabled ? "Todos los colores están fijados" : "Regenerar paleta"
    );
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  if (!hasImageSource) {
    paletteRegenerateBtn.disabled = true;
    paletteRegenerateBtn.classList.add("is-disabled");
    paletteRegenerateBtn.setAttribute("aria-disabled", "true");
    setPaletteRegenerateButtonTooltip("Sube una imagen para regenerar la paleta");
    return;
  }

  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasLimitedExtractedColors = availableCount <= Math.max(mutableSlotCount, 0);
  const isDisabled = mutableSlotCount <= 0 || hasLimitedExtractedColors;

  paletteRegenerateBtn.disabled = isDisabled;
  paletteRegenerateBtn.classList.toggle("is-disabled", isDisabled);
  paletteRegenerateBtn.setAttribute(
    "aria-disabled",
    isDisabled ? "true" : "false"
  );
  setPaletteRegenerateButtonTooltip(
    mutableSlotCount <= 0
      ? "Todos los colores están fijados"
      : hasLimitedExtractedColors
        ? "No hay suficiente variedad de colores en la imagen de referencia"
      : "Regenerar paleta"
  );
}

function updatePaletteSurpriseButtonAvailability(availableImageColors = null) {
  if (!surpriseBtn) {
    return;
  }

  if (paletteBaseMode === "color") {
    surpriseBtn.disabled = true;
    surpriseBtn.classList.add("is-disabled");
    surpriseBtn.setAttribute("aria-disabled", "true");
    setPaletteSurpriseButtonTooltip("Modo no disponible en Color");
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);

  if (paletteBaseMode !== "image") {
    const isDisabled = mutableSlotCount <= 0;
    surpriseBtn.disabled = isDisabled;
    surpriseBtn.classList.toggle("is-disabled", isDisabled);
    surpriseBtn.setAttribute("aria-disabled", isDisabled ? "true" : "false");
    setPaletteSurpriseButtonTooltip(
      isDisabled
        ? "Todos los colores están fijados"
        : "Generar una variante más libre sin cambiar la cantidad de colores"
    );
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasExtractedColors = hasImageSource && availableCount > 0 && mutableSlotCount > 0;

  surpriseBtn.disabled = !hasExtractedColors;
  surpriseBtn.classList.toggle("is-disabled", !hasExtractedColors);
  surpriseBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteSurpriseButtonTooltip(
    hasExtractedColors
      ? "Generar una variante libre basada en la imagen original"
      : mutableSlotCount <= 0
        ? "Todos los colores están fijados"
        : "Sube una imagen válida para sorprender la paleta"
  );
}

function updatePaletteInspirationButtonAvailability(availableImageColors = null) {
  if (!paletteInspirationBtn) {
    return;
  }

  const pinnedEntries = getPinnedPaletteEntriesSnapshot();
  const mutableSlotCount = getMutablePaletteSlotCount(paletteSize, pinnedEntries);
  const requiresMoreFreeSlotsForInspiration = hasInsufficientFreeSlotsForImageInspiration(
    mutableSlotCount
  );

  if (paletteBaseMode !== "image") {
    paletteInspirationBtn.hidden = true;
    paletteInspirationBtn.disabled = true;
    paletteInspirationBtn.classList.add("is-disabled");
    paletteInspirationBtn.setAttribute("aria-disabled", "true");
    setPaletteInspirationButtonTooltip("Modo inspiración disponible solo en Imagen");
    return;
  }

  const hasImageSource = !!uploadedBaseImage?.dataUrl;
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;
  const hasExtractedColors =
    hasImageSource &&
    availableCount > 0 &&
    mutableSlotCount > 0 &&
    !requiresMoreFreeSlotsForInspiration;

  paletteInspirationBtn.hidden = !hasImageSource;
  paletteInspirationBtn.disabled = !hasExtractedColors;
  paletteInspirationBtn.classList.toggle("is-disabled", !hasExtractedColors);
  paletteInspirationBtn.setAttribute("aria-disabled", hasExtractedColors ? "false" : "true");
  setPaletteInspirationButtonTooltip(
    hasExtractedColors
      ? "Generar una paleta inspirada en la imagen"
      : mutableSlotCount <= 0
        ? "Todos los colores están fijados"
      : requiresMoreFreeSlotsForInspiration
        ? "Desfija más colores para usar Inspiración en toda la paleta"
        : "Sube una imagen válida para activar el modo inspiración"
  );
}

function hasInsufficientFreeSlotsForImageInspiration(
  mutableSlotCount = getMutablePaletteSlotCount(paletteSize, getPinnedPaletteEntriesSnapshot())
) {
  return mutableSlotCount < 2 || mutableSlotCount < Math.ceil(paletteSize / 2);
}

function regeneratePinnedPaletteSlots() {
  if (
    typeof getCurrentPaletteCardEntries !== "function" ||
    typeof getRegeneratedColorForCard !== "function"
  ) {
    return false;
  }

  const cardEntries = getCurrentPaletteCardEntries();
  const mutableEntries = cardEntries.filter((entry) => !entry.pinned);

  if (mutableEntries.length === 0) {
    return false;
  }

  const nextColors = cardEntries.map((entry) => normalizeHexColor(entry.hex));
  let hasChanged = false;

  mutableEntries.forEach((entry) => {
    let candidate = null;
    const excludedColors = new Set([normalizeHexColor(entry.hex)]);
    const maxAttempts =
      paletteBaseMode === "image" || paletteBaseMode === "color"
        ? Math.max(6, IMAGE_PALETTE_VARIANT_PROFILES.length * 2)
        : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      candidate = getRegeneratedColorForCard(entry.card, new Set(nextColors), {
        excludedColors,
        variantSeedOffset:
          paletteBaseMode === "image" || paletteBaseMode === "color"
            ? attempt * Math.max(1, IMAGE_PALETTE_VARIANT_PROFILES.length)
            : 0,
        maxVariantSweeps:
          paletteBaseMode === "image" || paletteBaseMode === "color"
            ? Math.max(12, IMAGE_PALETTE_VARIANT_PROFILES.length * 6)
            : undefined,
      });

      if (candidate && candidate !== entry.hex && !excludedColors.has(candidate)) {
        break;
      }

      if (candidate) {
        excludedColors.add(normalizeHexColor(candidate));
      }
    }

    if (!candidate || candidate === entry.hex) {
      return;
    }

    setCardColor(entry.card, candidate);
    nextColors[entry.index] = normalizeHexColor(candidate);
    hasChanged = true;
  });

  if (hasChanged) {
    persistCurrentPaletteSnapshot();
  }

  return hasChanged;
}

async function syncImagePaletteFromSource(options = {}) {
  const runSync = async () => {
    if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
      return;
    }

    if (options.resetVariant) {
      imagePaletteVariantIndex = 0;
      imageInspirationVariantIndex = 0;
      clearRecentInspiredPalettes();
    } else if (options.advanceVariant) {
      imagePaletteVariantIndex += 1;
    }

    syncPaletteGeneratorStoreState(
      {
        imagePaletteVariantIndex,
        imageInspirationVariantIndex,
      },
      {
        scope: "image-variants",
      }
    );

    await refreshImageDerivedControls();
    if (!(paletteImageExtractionAlert?.hidden ?? true)) {
      return;
    }

    await generatePalette();
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runSync);
  }

  return runSync();
}
// PALETTE BASE

function getFirstPaletteHexForColorBaseAdoption() {
  const normalizeHexColor = window.AppColorUtils?.normalizeHexColor;
  const isValidHexColor = window.AppColorUtils?.isValidHexColor;

  const paletteCandidate = Array.isArray(currentPalette) && currentPalette.length > 0
    ? normalizeHexColor?.(currentPalette[0]) || currentPalette[0]
    : "";
  if (typeof isValidHexColor === "function" && isValidHexColor(paletteCandidate)) {
    return paletteCandidate;
  }

  if (typeof getCurrentPaletteCardEntries === "function") {
    const firstEntry = getCurrentPaletteCardEntries()[0];
    const entryHex = normalizeHexColor?.(firstEntry?.hex || "") || firstEntry?.hex || "";
    if (typeof isValidHexColor === "function" && isValidHexColor(entryHex)) {
      return entryHex;
    }
  }

  return null;
}

function clearLeakedColorModeFixedPins() {
  Array.from(getColorCards()).forEach((card) => {
    card.dataset.readonlyFixedPin = "false";
    card.classList.remove("is-base-color", "is-complementary-color");

    const colorBaseIndicator = card.querySelector(".color-base-indicator");
    if (colorBaseIndicator) {
      colorBaseIndicator.hidden = true;
    }

    const complementaryIndicator = card.querySelector(".color-complementary-indicator");
    if (complementaryIndicator) {
      complementaryIndicator.hidden = true;
    }

    if (typeof setCardPinnedState === "function") {
      setCardPinnedState(card, false);
    }
  });
}

function setPaletteBaseMode(nextMode) {
  const previousBaseMode = paletteBaseMode;

  if (nextMode === "image") {
    paletteBaseMode = "image";
  } else if (nextMode === "temperature") {
    paletteBaseMode = "temperature";
  } else {
    paletteBaseMode = "color";
  }

  syncPaletteGeneratorStoreState(
    {
      paletteBaseMode,
    },
    {
      scope: "palette-base-mode",
    }
  );

  if (paletteBaseMode !== "image") {
    setPaletteImageExtractionFeedback(false);
  }

  if (paletteBaseModeSelect) {
    paletteBaseModeSelect.value = paletteBaseMode;
  }

  if (colorBasePanel) {
    const showColorPanel = paletteBaseMode === "color";
    colorBasePanel.classList.toggle("active", showColorPanel);
    colorBasePanel.hidden = !showColorPanel;
  }

  if (temperatureBasePanel) {
    const showTemperaturePanel = paletteBaseMode === "temperature";
    temperatureBasePanel.classList.toggle("active", showTemperaturePanel);
    temperatureBasePanel.hidden = !showTemperaturePanel;
  }

  if (imageBasePanel) {
    const showImagePanel = paletteBaseMode === "image";
    imageBasePanel.classList.toggle("active", showImagePanel);
    imageBasePanel.hidden = !showImagePanel;
  }

  if (previousBaseMode === "color" && paletteBaseMode !== "color") {
    clearLeakedColorModeFixedPins();
  }

  if (typeof syncCurrentPaletteFromDom === "function") {
    syncCurrentPaletteFromDom();
  }

  updatePaletteModeActionVisibility();
  updatePaletteActionButtonsAvailability();
  updatePaletteStickyState();
  updatePaletteSizeButtonsAvailability();

  if (typeof updateRegenerateButtonsAvailability === "function") {
    updateRegenerateButtonsAvailability();
  }
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  if (typeof updateAddColorButtonState === "function") {
    updateAddColorButtonState();
  }

  if (paletteBaseMode === "image" && uploadedBaseImage?.dataUrl) {
    void refreshImageDerivedControls();
    return;
  }

  if (paletteBaseMode === "color") {
    let shouldRefreshMonochromaticPalette = false;

    if (
      previousBaseMode === "image" &&
      typeof setSelectedPaletteBaseColor === "function"
    ) {
      const adoptedBaseColor = getFirstPaletteHexForColorBaseAdoption();
      if (adoptedBaseColor) {
        setSelectedPaletteBaseColor(adoptedBaseColor, {
          generate: false,
          publish: true,
          syncTextInput: true,
        });
        shouldRefreshMonochromaticPalette = true;
      }
    }

    if (
      previousBaseMode === "image" &&
      typeof setSelectedColorPaletteType === "function"
    ) {
      setSelectedColorPaletteType("monochromatic", {
        generate: false,
      });
      shouldRefreshMonochromaticPalette = true;
    }

    if (
      previousBaseMode === "image" &&
      typeof setSelectedMonochromaticGenerationMode === "function"
    ) {
      setSelectedMonochromaticGenerationMode(
        DEFAULT_MONOCHROMATIC_GENERATION_MODE,
        {
          generate: false,
        }
      );
      shouldRefreshMonochromaticPalette = true;
    }

    if (
      previousBaseMode === "image" &&
      typeof colorPaletteVariantIndex !== "undefined"
    ) {
      colorPaletteVariantIndex = 0;
      syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
        scope: "color-variant",
      });
      shouldRefreshMonochromaticPalette = true;
    }

    if (typeof clearUnavailablePinnedCards === "function") {
      clearUnavailablePinnedCards();
    }

    syncColorModeBaseControls();
    syncColorModeSizeSelection();

    if (
      shouldRefreshMonochromaticPalette &&
      typeof generatePalette === "function"
    ) {
      void generatePalette({
        recalculateFromScratch: true,
        effectiveType: "monochromatic",
      });
      return;
    }
  }
}

function isAcceptedPaletteImageFile(file) {
  if (!(file instanceof File)) {
    return false;
  }

  const normalizedName = file.name.trim().toLowerCase();
  return (
    allowedPaletteImageTypes.has(file.type) ||
    allowedPaletteImageExtensions.some((extension) => normalizedName.endsWith(extension))
  );
}

function renderPaletteImagePreview() {
  if (
    !paletteImagePreview ||
    !paletteImagePreviewImg ||
    !paletteImageName ||
    !paletteImageDropzonePanel ||
    !paletteImageReplaceBtn
  ) {
    return;
  }

  const hasPreview = !!uploadedBaseImage?.dataUrl;
  if (!hasPreview) {
    isPaletteImageDropzoneVisible = true;
  }

  setAnimatedImagePanelVisibility(
    paletteImageDropzonePanel,
    !hasPreview || isPaletteImageDropzoneVisible
  );
  setAnimatedImagePanelVisibility(paletteImagePreview, hasPreview);
  paletteImageReplaceBtn.disabled = !hasPreview || isReplaceImagePending;
  paletteImageReplaceBtn.setAttribute(
    "aria-disabled",
    !hasPreview || isReplaceImagePending ? "true" : "false"
  );

  if (!hasPreview) {
    paletteImagePreviewImg.removeAttribute("src");
    paletteImageName.textContent = "";
    updatePaletteModeActionVisibility();
    updatePaletteActionButtonsAvailability();
    return;
  }

  paletteImagePreviewImg.src = uploadedBaseImage.dataUrl;
  paletteImageName.textContent = uploadedBaseImage.name;
  updatePaletteModeActionVisibility();
  updatePaletteActionButtonsAvailability();
}

function setAnimatedImagePanelVisibility(element, shouldShow) {
  if (!element) {
    return;
  }

  if (element.__hideTimeout) {
    clearTimeout(element.__hideTimeout);
    element.__hideTimeout = null;
  }

  if (shouldShow) {
    if (element.hidden) {
      element.hidden = false;
      element.classList.add("is-collapsed");

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          element.classList.remove("is-collapsed");
        });
      });
      return;
    }

    element.classList.remove("is-collapsed");
    return;
  }

  if (element.hidden) {
    return;
  }

  element.classList.add("is-collapsed");
  element.__hideTimeout = setTimeout(() => {
    element.hidden = true;
    element.__hideTimeout = null;
  }, imagePanelTransitionMs);
}

function openPaletteImageDropzone() {
  if (!paletteImageDropzonePanel) {
    return;
  }

  isReplaceImagePending = true;
  isPaletteImageDropzoneVisible = true;
  renderPaletteImagePreview();

  paletteImageDropzonePanel.classList.remove("is-sliding-in");
  void paletteImageDropzonePanel.offsetWidth;
  paletteImageDropzonePanel.classList.add("is-sliding-in");
}

function handlePaletteImageFile(file) {
  if (!isAcceptedPaletteImageFile(file)) {
    alert("Solo se permiten imágenes JPG, PNG, SVG o WEBP.");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    uploadedBaseImage = {
      name: file.name,
      type: file.type,
      dataUrl: String(reader.result || ""),
      analysisCache: null,
    };
    syncPaletteGeneratorStoreState(
      {
        uploadedBaseImage,
      },
      {
        scope: "uploaded-image",
      }
    );
    isReplaceImagePending = false;
    isPaletteImageDropzoneVisible = false;
    setPaletteImageExtractionFeedback(false);
    setPaletteBaseMode("image");
    renderPaletteImagePreview();
    void syncImagePaletteFromSource({ resetVariant: true });
  });
  reader.readAsDataURL(file);
}

if (paletteBaseModeSelect) {
  paletteBaseModeSelect.addEventListener("change", () => {
    setPaletteBaseMode(paletteBaseModeSelect.value);
  });
}

if (paletteImageInput) {
  paletteImageInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
    paletteImageInput.value = "";
  });
}

if (paletteImageReplaceBtn) {
  paletteImageReplaceBtn.addEventListener("click", () => {
    openPaletteImageDropzone();
  });
}

if (paletteImageDominantToggle) {
  paletteImageDominantToggle.checked = prioritizeImageDominantColors;
  paletteImageDominantToggle.addEventListener("change", () => {
    prioritizeImageDominantColors = !!paletteImageDominantToggle.checked;
    syncPaletteGeneratorStoreState(
      {
        prioritizeImageDominantColors,
      },
      {
        scope: "image-dominant-toggle",
      }
    );

    if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
      return;
    }

    void syncImagePaletteFromSource({ resetVariant: true });
  });
}

if (paletteRegenerateBtn) {
  paletteRegenerateBtn.addEventListener("click", () => {
    if (paletteRegenerateBtn.disabled || paletteRegenerateBtn.classList.contains("is-disabled")) {
      return;
    }

    const hasPinnedEntries = getPinnedPaletteEntriesSnapshot().length > 0;
    if (hasPinnedEntries) {
      const hasChanged = regeneratePinnedPaletteSlots();
      if (hasChanged || paletteBaseMode === "image") {
        return;
      }
    }

    if (paletteBaseMode === "image") {
      void syncImagePaletteFromSource({ advanceVariant: true });
      return;
    }

    if (paletteBaseMode === "color") {
      void generatePalette();
      return;
    }

    void regenerateTemperaturePaletteKeepingPreferences();
  });
}

if (paletteInspirationBtn) {
  paletteInspirationBtn.addEventListener("click", () => {
    updatePaletteInspirationButtonAvailability();

    if (paletteInspirationBtn.disabled || paletteInspirationBtn.classList.contains("is-disabled")) {
      return;
    }

    if (hasInsufficientFreeSlotsForImageInspiration()) {
      updatePaletteInspirationButtonAvailability();
      return;
    }

    void applyInspiredImagePalette();
  });
}

if (paletteImageDropzone) {
  ["dragenter", "dragover"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.add("is-dragover");
    });
  });

  ["dragleave", "dragend", "drop"].forEach((eventName) => {
    paletteImageDropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      paletteImageDropzone.classList.remove("is-dragover");
    });
  });

  paletteImageDropzone.addEventListener("drop", (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      handlePaletteImageFile(file);
    }
  });
}

setPaletteBaseMode(paletteBaseMode);
renderPaletteImagePreview();
updatePaletteModeActionVisibility();
updatePaletteActionButtonsAvailability();

if (controlsPanel && paletteSection) {
  updatePaletteStickyState();

  if (typeof ResizeObserver === "function") {
    const stickyObserver = new ResizeObserver(() => {
      updatePaletteStickyState();
    });

    stickyObserver.observe(controlsPanel);
    stickyObserver.observe(paletteSection);
    stickyObserver.observe(paletteContainer);
  }

  window.addEventListener("resize", updatePaletteStickyState, { passive: true });
}
function updatePaletteSizeButtonsAvailability(availableImageColors = null) {
  const allowedColorModeSizes = getAllowedPaletteSizesForCurrentMode();
  const availableCount = Number.isFinite(availableImageColors)
    ? availableImageColors
    : getCachedImageColorClusters().length;

  sizeButtons.forEach((button) => {
    const buttonSize = Number.parseInt(button.dataset.size, 10);
    const shouldDisableByImage =
      paletteBaseMode === "image" &&
      !!uploadedBaseImage?.dataUrl &&
      Number.isFinite(buttonSize) &&
      buttonSize > availableCount;
    const shouldShowForMode =
      paletteBaseMode === "color"
        ? Number.isFinite(buttonSize) && allowedColorModeSizes.includes(buttonSize)
        : buttonSize !== 2 && buttonSize !== 4;
    const shouldDisableByColorMode =
      paletteBaseMode === "color" &&
      Number.isFinite(buttonSize) &&
      !allowedColorModeSizes.includes(buttonSize);
    const shouldDisable = shouldDisableByImage || shouldDisableByColorMode;

    button.hidden = !shouldShowForMode;

    button.classList.toggle("is-disabled", shouldDisable);
    button.setAttribute("aria-disabled", shouldDisable ? "true" : "false");
  });
}

async function refreshImageDerivedControls() {
  const runRefresh = async () => {
    if (paletteBaseMode !== "image" || !uploadedBaseImage?.dataUrl) {
      setPaletteImageExtractionFeedback(false);
      updatePaletteSizeButtonsAvailability();
      updatePaletteActionButtonsAvailability();

      if (typeof updateRegenerateButtonsAvailability === "function") {
        updateRegenerateButtonsAvailability();
      }
      if (typeof updateAddColorButtonState === "function") {
        updateAddColorButtonState();
      }
      return;
    }

    const clusters = await getImageColorClusters();
    const hasExtractedColors = clusters.length > 0;

    setPaletteImageExtractionFeedback(!hasExtractedColors);
    if (!hasExtractedColors) {
      revealPaletteImageDropzoneForRetry();
    }

    updatePaletteSizeButtonsAvailability(clusters.length);
    updatePaletteActionButtonsAvailability(clusters.length);

    if (typeof updateRegenerateButtonsAvailability === "function") {
      updateRegenerateButtonsAvailability();
    }
    if (typeof updateAddColorButtonState === "function") {
      updateAddColorButtonState();
    }
  };

  if (typeof withPaletteLoadingOverlay === "function") {
    return withPaletteLoadingOverlay(runRefresh);
  }

  return runRefresh();
}
`,Al=`// SIZE SELECTOR

function setPaletteSize(size) {
  paletteSize = size;
  syncPaletteGeneratorStoreState(
    {
      paletteSize,
    },
    {
      scope: "palette-size",
    }
  );
  sizeButtons.forEach((button) => {
    button.classList.toggle("active", Number.parseInt(button.dataset.size, 10) === size);
  });
}

function removeColorsFromPaletteEnd(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return false;
  }

  const cards = Array.from(getColorCards());
  if (cards.length === 0) {
    return false;
  }

  cards.slice(-count).forEach((card) => {
    card.remove();
  });

  refreshDeleteButtonsVisibility();
  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);
  return true;
}

function addColorsToPaletteEnd(count) {
  if (!Number.isFinite(count) || count <= 0) {
    return false;
  }

  let hasChanged = false;

  for (let index = 0; index < count; index += 1) {
    const existingColors = new Set(getCurrentPaletteHexValues());
    const { color, isFallbackWhite } = getAddedColorForCurrentMode(existingColors);

    if (!color) {
      break;
    }

    const card = createColorCard(color);
    if (!card) {
      break;
    }

    card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
    hasChanged = true;
  }

  if (!hasChanged) {
    return false;
  }

  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);
  return true;
}

async function applyPaletteSizeChange(nextSize) {
  if (paletteBaseMode === "color") {
    const allowedSizes = getAllowedPaletteSizesForCurrentMode();
    const resolvedSize = getNearestAllowedPaletteSize(nextSize, allowedSizes);
    const previousPalette = [...currentPalette];

    if (resolvedSize !== paletteSize) {
      setPaletteSize(resolvedSize);
    }

    if (typeof updatePaletteModeActionVisibility === "function") {
      updatePaletteModeActionVisibility();
    }

    if (typeof updatePaletteActionButtonsAvailability === "function") {
      updatePaletteActionButtonsAvailability();
    }

    if (typeof updateRegenerateButtonsAvailability === "function") {
      updateRegenerateButtonsAvailability();
    }

    const applyRecalculatedColorPalette = () => {
      const effectiveType = typeof getEffectiveColorPaletteType === "function"
        ? getEffectiveColorPaletteType(resolvedSize)
        : selectedColorPaletteType;
      const nextPalette =
        typeof buildColorModePaletteForSettings === "function"
          ? buildColorModePaletteForSettings(
              resolvedSize,
              getCurrentPaletteAdjustmentSnapshot(),
              {
                baseColor:
                  typeof getPaletteBaseColorSnapshot === "function"
                    ? getPaletteBaseColorSnapshot()
                    : null,
                effectiveType,
                variantIndex:
                  effectiveType === "monochromatic" || effectiveType === "complementary"
                    ? 0
                    : colorPaletteVariantIndex,
              }
            )
          : [];

      if (!Array.isArray(nextPalette) || nextPalette.length !== resolvedSize) {
        alert("No se pudo recalcular una paleta válida para esta cantidad de colores.");
        return;
      }

      if (effectiveType === "monochromatic" || effectiveType === "complementary") {
        colorPaletteVariantIndex = 0;
        syncPaletteGeneratorStoreColorVariantIndex(colorPaletteVariantIndex, {
          scope: "color-variant",
        });
      }

      if (typeof commitGeneratedPalette === "function") {
        commitGeneratedPalette(nextPalette, {
          effectiveType,
          previousPalette,
        });
      }
    };

    if (typeof withPaletteLoadingOverlay === "function") {
      await withPaletteLoadingOverlay(async () => {
        applyRecalculatedColorPalette();
      });
    } else {
      applyRecalculatedColorPalette();
    }
    return;
  }

  const currentCount = getColorCards().length;
  const difference = nextSize - currentCount;

  if (difference === 0) {
    return;
  }

  if (currentCount === 0) {
    if (paletteBaseMode === "image" && uploadedBaseImage?.dataUrl) {
      await syncImagePaletteFromSource();
    }
    return;
  }

  const hasChanged = difference < 0
    ? removeColorsFromPaletteEnd(Math.abs(difference))
    : addColorsToPaletteEnd(difference);

  if (hasChanged) {
    saveHistory(currentPalette);
  }
}

async function handlePaletteSizeButtonClick(button) {
  if (button?.classList.contains("is-disabled")) {
    return;
  }

  const nextSize = Number.parseInt(button.dataset.size, 10);
  if (!Number.isFinite(nextSize) || nextSize === paletteSize) {
    return;
  }

  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  setPaletteSize(nextSize);
  await applyPaletteSizeChange(nextSize);
}

sizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    void handlePaletteSizeButtonClick(button);
  });
  button.addEventListener("mouseleave", () => {
    button.classList.remove("suppress-hover");
  });
});

// TEMPERATURE

function setTemperatureSelection(nextSelection) {
  const warmSelected = !!nextSelection.warm;
  const coolSelected = !!nextSelection.cool;

  // Keep at least one temperature active
  if (!warmSelected && !coolSelected) {
    temperature = { warm: true, cool: false };
  } else {
    temperature = { warm: warmSelected, cool: coolSelected };
  }

  syncPaletteGeneratorStoreState(
    {
      temperature: {
        warm: !!temperature.warm,
        cool: !!temperature.cool,
      },
    },
    {
      scope: "temperature-selection",
    }
  );

  syncTemperatureControlsState();
}

function toggleTemperature(type) {
  if (isTemperatureLockedBySaturation()) {
    animateSaturationControlAttention();
    return;
  }

  const nextSelection = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  nextSelection[type] = !nextSelection[type];

  // If both become off, turn back the clicked one
  if (!nextSelection.warm && !nextSelection.cool) {
    nextSelection[type] = true;
  }

  setTemperatureSelection(nextSelection);
}

function handleTemperatureButtonClick(type, button) {
  if (button?.matches(":hover")) {
    button.classList.add("suppress-hover");
  }

  const previousTemperatureState = {
    warm: temperature.warm,
    cool: temperature.cool,
  };

  toggleTemperature(type);

  const hasTemperatureChanged =
    previousTemperatureState.warm !== temperature.warm ||
    previousTemperatureState.cool !== temperature.cool;

  if (hasTemperatureChanged && paletteBaseMode === "temperature") {
    void generatePalette();
  }
}

if (warmBtn) {
  warmBtn.addEventListener("click", () => {
    handleTemperatureButtonClick("warm", warmBtn);
  });
  warmBtn.addEventListener("mouseleave", () => {
    warmBtn.classList.remove("suppress-hover");
  });
}

if (coolBtn) {
  coolBtn.addEventListener("click", () => {
    handleTemperatureButtonClick("cool", coolBtn);
  });
  coolBtn.addEventListener("mouseleave", () => {
    coolBtn.classList.remove("suppress-hover");
  });
}

// RESET

if (resetPaletteBtn) {
  resetPaletteBtn.addEventListener("click", () => {
    // Reload page to reset app state
    window.location.reload();
  });
}

// GENERATE

if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    void generatePalette();
  });
}
`,Ml=`// Palette generator card helpers: color utilities, accessibility and shared button UI.

const {
  normalizeHexColor,
  isValidHexColor,
  hexToRgb,
  hexToHsl,
  getRelativeLuminance,
  getContrastRatio: getContrastRatioForColors,
  mixHexColors,
  getReadableTextColor,
  getRgbDistance: getRgbDistanceBetweenColors,
} = window.AppColorUtils || {};

if (
  typeof normalizeHexColor !== "function" ||
  typeof isValidHexColor !== "function" ||
  typeof hexToRgb !== "function" ||
  typeof hexToHsl !== "function" ||
  typeof getRelativeLuminance !== "function" ||
  typeof getContrastRatioForColors !== "function" ||
  typeof mixHexColors !== "function" ||
  typeof getReadableTextColor !== "function" ||
  typeof getRgbDistanceBetweenColors !== "function"
) {
  throw new Error("AppColorUtils helpers are required before palette-generator-card-helpers.js loads.");
}

const writeTextToClipboard =
  window.AppClipboard?.writeText || window.copyTextToClipboard;
const sharedColors = window.AppSharedColors || null;
const COPY_FEEDBACK_TEXT = "¡Copiado!";
const COPY_FEEDBACK_DURATION_MS = 2000;

function syncCurrentPaletteFromDom() {
  Array.from(getColorCards()).forEach((card, index) => {
    card.dataset.index = String(index);
  });

  currentPalette = getCurrentPaletteHexValues();
  syncPaletteGeneratorStoreCurrentPalette(currentPalette, {
    scope: "current-palette",
  });
  sharedColors?.setPalette(currentPalette, {
    source: "palette-generator",
  });
  refreshColorCardNames();
  if (typeof updateColorModeCardActionVisibility === "function") {
    updateColorModeCardActionVisibility();
  }
  updateRegenerateButtonsAvailability();
  if (typeof updatePaletteActionButtonsAvailability === "function") {
    updatePaletteActionButtonsAvailability();
  }
  updateAddColorButtonState();
}

function getColorCards() {
  return paletteContainer.querySelectorAll(".color-card");
}

function isExplicitMonochromaticColorModeSelected() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "monochromatic";
}

function isExplicitComplementaryColorModeSelected() {
  return paletteBaseMode === "color" && selectedColorPaletteType === "complementary";
}

function getColorModeBaseCardIndex(totalCount = getColorCards().length) {
  if (paletteBaseMode !== "color") {
    return -1;
  }

  const effectiveType =
    typeof getEffectiveColorPaletteType === "function"
      ? getEffectiveColorPaletteType(totalCount || paletteSize)
      : selectedColorPaletteType;

  if (effectiveType === "complementary" && totalCount === 6) {
    return 1;
  }

  if (effectiveType === "analogous" && totalCount === 3) {
    return 1;
  }

  if (effectiveType === "triad" && totalCount === 3) {
    return 1;
  }

  return 0;
}

function getComplementaryRoleCardIndex(totalCount = getColorCards().length) {
  if (paletteBaseMode !== "color") {
    return -1;
  }

  const effectiveType =
    typeof getEffectiveColorPaletteType === "function"
      ? getEffectiveColorPaletteType(totalCount || paletteSize)
      : selectedColorPaletteType;

  if (effectiveType === "complementary") {
    if (totalCount === 2) {
      return 1;
    }

    if (totalCount === 6) {
      return 4;
    }
  }

  return -1;
}

function isCardPinned(card) {
  return card?.dataset.pinned === "true";
}

function getCurrentPaletteCardEntries() {
  return Array.from(getColorCards())
    .map((card, index) => {
      const hex = normalizeHexColor(
        card.querySelector(".color-label")?.textContent?.trim() || "",
      );

      return {
        card,
        index,
        hex,
        pinned: isCardPinned(card),
        regenerateLocked: card.dataset.regenerateLocked === "true",
      };
    })
    .filter((entry) => isValidHexColor(entry.hex));
}

function getPinnedPaletteIndexes() {
  if (
    typeof isCardPinningAvailable === "function" &&
    !isCardPinningAvailable()
  ) {
    return [];
  }

  return getCurrentPaletteCardEntries()
    .filter((entry) => {
      if (!entry.pinned) {
        return false;
      }

      if (entry.card?.dataset.readonlyFixedPin === "true") {
        return false;
      }

      const baseCardIndex =
        typeof getColorModeBaseCardIndex === "function"
          ? getColorModeBaseCardIndex(getColorCards().length)
          : 0;
      if (paletteBaseMode === "color" && entry.index === baseCardIndex) {
        return false;
      }

      const complementaryCardIndex =
        typeof getComplementaryRoleCardIndex === "function"
          ? getComplementaryRoleCardIndex(getColorCards().length)
          : -1;
      if (
        typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected() &&
        paletteBaseMode === "color" &&
        entry.index === complementaryCardIndex
      ) {
        return false;
      }

      return true;
    })
    .map((entry) => entry.index);
}

function setCardColor(card, color) {
  const normalizedColor = normalizeHexColor(color);
  const overlayStyle = getAccessibleOverlayIconStyle(normalizedColor);
  card.style.background = normalizedColor;
  card.style.setProperty("--pin-overlay-color", overlayStyle.color);
  card.style.setProperty("--pin-overlay-shadow-color", overlayStyle.shadowColor);
  card.dataset.regenerateLocked = "false";

  const colorName = card.querySelector(".color-name");
  if (colorName) {
    applyAccessibleColorNameStyle(colorName, normalizedColor);
  }

  const label = card.querySelector(".color-label");
  if (label) {
    label.textContent = normalizedColor;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getRelativeLuminanceFromHex(hex) {
  return getRelativeLuminance(hex);
}

function getContrastRatio(hexA, hexB) {
  return getContrastRatioForColors(hexA, hexB);
}

function getAccessibleColorNameStyle(backgroundHex) {
  const normalized = normalizeHexColor(backgroundHex);
  const bgLuminance = getRelativeLuminanceFromHex(normalized);
  const needsLighterText = bgLuminance < 0.42;
  const contrastTarget = 3.2;
  const contrastFallbackTarget = 2.8;
  const extremeColor = needsLighterText ? "#FFFFFF" : "#000000";
  let mixAmount = 0.34;
  let candidate = mixHexColors(normalized, extremeColor, mixAmount);
  let contrast = getContrastRatio(candidate, normalized);

  while (contrast < contrastTarget && mixAmount < 0.92) {
    mixAmount += 0.06;
    candidate = mixHexColors(normalized, extremeColor, mixAmount);
    contrast = getContrastRatio(candidate, normalized);
  }

  if (contrast < contrastFallbackTarget) {
    candidate = extremeColor;
    contrast = getContrastRatio(candidate, normalized);
  }

  const shadowColor = needsLighterText
    ? "rgba(0, 0, 0, 0.42)"
    : "rgba(255, 255, 255, 0.45)";

  const opacity = contrast >= 4.5
    ? 0.8
    : contrast >= contrastTarget
      ? 0.88
      : 0.95;

  return {
    textColor: candidate,
    textShadow: \`0 1px 1px \${shadowColor}, 0 0 1px \${shadowColor}\`,
    opacity,
  };
}

function applyAccessibleColorNameStyle(colorNameElement, backgroundHex) {
  const style = getAccessibleColorNameStyle(backgroundHex);
  colorNameElement.style.color = style.textColor;
  colorNameElement.style.opacity = String(style.opacity);
  colorNameElement.style.textShadow = style.textShadow;
  colorNameElement.style.filter = "none";
}

function getReadableTooltipTextColor(backgroundHex) {
  return getReadableTextColor(backgroundHex);
}

function getAccessibleOverlayIconStyle(backgroundHex) {
  const normalized = normalizeHexColor(backgroundHex);
  const accessibleStyle = getAccessibleColorNameStyle(normalized);
  const bgLuminance = getRelativeLuminanceFromHex(normalized);

  return {
    color: accessibleStyle.textColor,
    shadowColor: bgLuminance < 0.42
      ? "rgba(0, 0, 0, 0.42)"
      : "rgba(255, 255, 255, 0.45)",
  };
}

function isDisallowedColor(color) {
  return DISALLOWED_COLORS.has(normalizeHexColor(color));
}

function getAdaptiveMinColorDistance(existingCount, attempt) {
  const targetCount = Math.max(paletteSize, existingCount + 1);
  let baseDistance = 46;

  if (targetCount <= 3) {
    baseDistance = 72;
  } else if (targetCount <= 6) {
    baseDistance = 58;
  }

  const relaxedDistance = baseDistance - Math.floor(attempt * 0.7);
  return Math.max(10, relaxedDistance);
}

function getRgbDistance(colorA, colorB) {
  return getRgbDistanceBetweenColors(colorA, colorB);
}

function isColorTooCloseToExisting(candidateHex, existingColors, attempt) {
  if (existingColors.size === 0) {
    return false;
  }

  const minDistance = getAdaptiveMinColorDistance(existingColors.size, attempt);

  for (const existingHex of existingColors) {
    if (getRgbDistance(candidateHex, existingHex) < minDistance) {
      return true;
    }
  }

  return false;
}

function getUniqueGeneratedColor(existingColors = new Set()) {
  for (let attempt = 0; attempt < MAX_UNIQUE_COLOR_ATTEMPTS; attempt++) {
    const candidate = normalizeHexColor(generateColor());

    if (isDisallowedColor(candidate)) {
      continue;
    }

    if (existingColors.has(candidate)) {
      continue;
    }

    if (isColorTooCloseToExisting(candidate, existingColors, attempt)) {
      continue;
    }

    return candidate;
  }

  return null;
}

function positionEditPickerAtButton(editButton, editInput) {
  const rect = editButton.getBoundingClientRect();
  const anchorX = Math.min(Math.max(rect.left + rect.width / 2, 50), window.innerWidth - 50);
  const anchorY = Math.max(8, rect.top - 8);

  editInput.style.position = "fixed";
  editInput.style.left = \`\${Math.round(anchorX)}px\`;
  editInput.style.top = \`\${Math.round(anchorY)}px\`;
}

function openNativeColorPicker(inputEl) {
  try {
    if (typeof inputEl.click === "function") {
      inputEl.click();
    } else if (typeof inputEl.showPicker === "function") {
      inputEl.showPicker();
    }
    return true;
  } catch (error) {
    try {
      if (typeof inputEl.showPicker === "function") {
        inputEl.showPicker();
        return true;
      }
    } catch (innerError) {
      // Ignore second error and report failure.
    }
    return false;
  }
}

function createCardActionButton(actionName, tooltipText) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = \`color-action-btn action-\${actionName}\`;

  const actionAriaLabelMap = {
    regenerate: "Regenerar color",
    edit: "Editar color",
    copy: "Copiar color",
    delete: "Eliminar color",
  };
  const actionIconAltMap = {
    regenerate: "icono de regenerar color",
    edit: "icono de editar color",
    copy: "icono de copiar color",
    delete: "icono de eliminar color",
  };
  button.setAttribute("aria-label", actionAriaLabelMap[actionName] || actionName);

  const actionIconSrcMap = {
    regenerate: "assets/regenerate.svg",
    edit: "assets/edit.svg",
    copy: "assets/copy.svg",
    delete: "assets/delete.svg",
  };

  const icon = document.createElement("img");
  icon.className = "action-icon";
  icon.src = actionIconSrcMap[actionName] || "assets/edit.svg";
  icon.alt = actionIconAltMap[actionName] || \`icono de \${actionName}\`;
  button.appendChild(icon);

  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = tooltipText;
  button.appendChild(tooltip);

  return button;
}

function getPinButtonIconMarkup(isPinned) {
  if (isPinned) {
    return \`
      <svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path fill="currentColor" d="M19.1835 7.80516L16.2188 4.83755C14.1921 2.8089 13.1788 1.79457 12.0904 2.03468C11.0021 2.2748 10.5086 3.62155 9.5217 6.31506L8.85373 8.1381C8.59063 8.85617 8.45908 9.2152 8.22239 9.49292C8.11619 9.61754 7.99536 9.72887 7.86251 9.82451C7.56644 10.0377 7.19811 10.1392 6.46145 10.3423C4.80107 10.8 3.97088 11.0289 3.65804 11.5721C3.5228 11.8069 3.45242 12.0735 3.45413 12.3446C3.45809 12.9715 4.06698 13.581 5.28476 14.8L6.69935 16.2163L2.22345 20.6964C1.92552 20.9946 1.92552 21.4782 2.22345 21.7764C2.52138 22.0746 3.00443 22.0746 3.30236 21.7764L7.77841 17.2961L9.24441 18.7635C10.4699 19.9902 11.0827 20.6036 11.7134 20.6045C11.9792 20.6049 12.2404 20.5358 12.4713 20.4041C13.0192 20.0914 13.2493 19.2551 13.7095 17.5825C13.9119 16.8472 14.013 16.4795 14.2254 16.1835C14.3184 16.054 14.4262 15.9358 14.5468 15.8314C14.8221 15.593 15.1788 15.459 15.8922 15.191L17.7362 14.4981C20.4 13.4973 21.7319 12.9969 21.9667 11.9115C22.2014 10.826 21.1954 9.81905 19.1835 7.80516Z"/>
      </svg>
    \`;
  }

  return \`
    <svg class="pin-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M16.4746 4.3747L19.6474 7.55072C20.6549 8.55917 21.4713 9.37641 21.9969 10.0856C22.5382 10.8161 22.8881 11.5853 22.6982 12.4634C22.5083 13.3415 21.8718 13.8972 21.0771 14.3383C20.3055 14.7665 19.2245 15.1727 17.8906 15.6738L15.9136 16.4166C15.1192 16.7151 14.9028 16.8081 14.742 16.9474C14.6611 17.0174 14.5887 17.0967 14.5263 17.1837C14.4021 17.3568 14.329 17.5812 14.1037 18.4L14.0914 18.4449C13.8627 19.2762 13.6739 19.9623 13.4671 20.4774C13.2573 21.0003 12.974 21.4955 12.465 21.786C12.1114 21.9878 11.7112 22.0936 11.3041 22.093C10.7179 22.0921 10.227 21.8014 9.78647 21.4506C9.35243 21.1049 8.8497 20.6016 8.24065 19.9919L6.65338 18.403L2.5306 22.53C2.23786 22.823 1.76298 22.8233 1.46994 22.5305C1.1769 22.2378 1.17666 21.7629 1.4694 21.4699L5.59326 17.3418L4.05842 15.8054C3.45318 15.1996 2.9536 14.6995 2.61002 14.2678C2.26127 13.8297 1.97215 13.3421 1.96848 12.7599C1.96586 12.3451 2.07354 11.9371 2.28053 11.5777C2.57116 11.0731 3.06341 10.7919 3.58296 10.5834C4.09477 10.3779 4.77597 10.1901 5.60112 9.96265L5.6457 9.95036C6.46601 9.7242 6.69053 9.65088 6.86346 9.52638C6.9526 9.4622 7.0337 9.38748 7.10499 9.30383C7.24338 9.14144 7.33502 8.92324 7.62798 8.12367L8.34447 6.16811C8.83874 4.819 9.23907 3.72629 9.66362 2.9461C10.1005 2.14324 10.654 1.49811 11.5357 1.30359C12.4175 1.10904 13.1908 1.46156 13.9246 2.0063C14.6375 2.53559 15.4597 3.35863 16.4746 4.3747ZM13.0304 3.21067C12.4277 2.76322 12.1086 2.71327 11.8588 2.76836C11.609 2.82349 11.3402 3.0033 10.9812 3.66306C10.6161 4.33394 10.2525 5.32066 9.73087 6.7443L9.03642 8.63971C9.02304 8.67621 9.00987 8.71226 8.99686 8.74786C8.76267 9.3886 8.58179 9.88351 8.24665 10.2768C8.09712 10.4522 7.92696 10.609 7.73987 10.7437C7.3205 11.0456 6.81257 11.1852 6.15537 11.3659C6.11884 11.3759 6.08184 11.3861 6.04438 11.3964C5.16337 11.6393 4.56523 11.8054 4.1418 11.9754C3.71693 12.146 3.615 12.2662 3.58038 12.3263C3.50616 12.4552 3.46751 12.6015 3.46845 12.7504C3.46889 12.8201 3.49835 12.9752 3.78366 13.3337C4.06799 13.6909 4.50615 14.1312 5.15229 14.778L9.26897 18.8989C9.91923 19.5498 10.3618 19.9912 10.721 20.2772C11.0814 20.5643 11.2369 20.5929 11.3064 20.593C11.4519 20.5933 11.595 20.5554 11.7215 20.4832C11.7821 20.4486 11.9033 20.3466 12.0751 19.9187C12.2462 19.4923 12.4133 18.8896 12.6574 18.0021C12.6677 17.9648 12.6778 17.9279 12.6878 17.8914C12.8678 17.2352 13.0069 16.7283 13.3075 16.3093C13.4384 16.1268 13.5903 15.9604 13.76 15.8134C14.15 15.4758 14.642 15.2914 15.2786 15.0527C15.314 15.0395 15.3498 15.0261 15.386 15.0124L17.3032 14.2921C18.7112 13.7631 19.6865 13.3946 20.3491 13.0268C21.0001 12.6655 21.178 12.3967 21.2321 12.1463C21.2863 11.8958 21.2353 11.5773 20.7917 10.9787C20.3403 10.3695 19.6045 9.63013 18.541 8.5656L15.4588 5.48018C14.3876 4.40792 13.6433 3.66571 13.0304 3.21067Z"/>
    </svg>
  \`;
}

function getPinOverlayIconMarkup(isPinned) {
  if (isPinned) {
    return \`
      <span class="pin-overlay-icon-state pin-overlay-icon-state-filled is-visible">
        \${getPinButtonIconMarkup(true).replace(
          'class="pin-icon"',
          'class="pin-icon pin-overlay-icon"'
        )}
      </span>
    \`;
  }

  return \`
    <span class="pin-overlay-icon-state pin-overlay-icon-state-outline is-visible">
      \${getPinButtonIconMarkup(false).replace(
        'class="pin-icon"',
        'class="pin-icon pin-overlay-icon"'
      )}
    </span>
    <span class="pin-overlay-icon-state pin-overlay-icon-state-filled">
      \${getPinButtonIconMarkup(true).replace(
        'class="pin-icon"',
        'class="pin-icon pin-overlay-icon"'
      )}
    </span>
  \`;
}

function createCardPinButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "color-pin-btn";
  button.setAttribute("aria-label", "Fijar color");

  const iconWrap = document.createElement("span");
  iconWrap.className = "pin-icon-wrap";
  button.appendChild(iconWrap);

  return button;
}

function setActionButtonTooltipText(button, tooltipText) {
  const tooltip = button?.querySelector(".tooltip");
  if (!tooltip) {
    return;
  }

  tooltip.textContent = tooltipText;
}

function showButtonCopyFeedback(
  button,
  {
    defaultTooltipText,
    feedbackBg = null,
    feedbackTextColor = null,
    durationMs = COPY_FEEDBACK_DURATION_MS,
  } = {}
) {
  const tooltip = button?.querySelector(".tooltip");
  if (!button || !tooltip) {
    return null;
  }

  if (feedbackBg) {
    tooltip.style.setProperty("--tooltip-feedback-bg", feedbackBg);
  }
  if (feedbackTextColor) {
    tooltip.style.setProperty("--tooltip-feedback-fg", feedbackTextColor);
  }

  tooltip.textContent = COPY_FEEDBACK_TEXT;
  tooltip.classList.add("is-copied-feedback");
  button.classList.add("show-feedback");

  return window.setTimeout(() => {
    tooltip.textContent = defaultTooltipText ?? CARD_COPY_TOOLTIP_DEFAULT;
    tooltip.classList.remove("is-copied-feedback");
    button.classList.remove("show-feedback");
    tooltip.style.removeProperty("--tooltip-feedback-bg");
    tooltip.style.removeProperty("--tooltip-feedback-fg");
  }, durationMs);
}
`,vl=`// Palette generator card naming and palette copy helpers.

const colorUtilsForNames = window.AppColorUtils || {};
const getColorDistanceForNames =
  typeof colorUtilsForNames.getColorDistance === "function"
    ? colorUtilsForNames.getColorDistance
    : () => Infinity;

function getNearestColorName(hex) {
  if (normalizeHexColor(hex) === "#FFFFFF") {
    return "Pure white";
  }

  let closestName = "Unknown";
  let minDistance = Infinity;

  COLOR_NAME_REFERENCES_COLOR.forEach((entry) => {
    if (!entry.color) {
      return;
    }

    const distance = getColorDistanceForNames(hex, entry.color, {
      method: "deltae2000",
    });

    if (distance < minDistance) {
      minDistance = distance;
      closestName = entry.name;
    }
  });

  return closestName;
}

function getRepetitionSuffixByIndex(index) {
  const REPETITION_SUFFIXES = ["Shade", "Tone", "Variant", "Tint", "Alt"];
  if (index < REPETITION_SUFFIXES.length) {
    return REPETITION_SUFFIXES[index];
  }

  return \`Alt \${index - REPETITION_SUFFIXES.length + 2}\`;
}

function getPaletteDisplayNames(hexValues) {
  const normalizedHexValues = hexValues.map((hex) => normalizeHexColor(hex));
  const baseNames = normalizedHexValues.map((hex) => getNearestColorName(hex));
  const displayNames = [...baseNames];
  const groups = new Map();

  baseNames.forEach((name, index) => {
    if (!groups.has(name)) {
      groups.set(name, []);
    }
    groups.get(name).push({ index, hex: normalizedHexValues[index] });
  });

  groups.forEach((entries, baseName) => {
    if (entries.length <= 1) {
      return;
    }

    displayNames[entries[0].index] = baseName;

    for (let repetitionIndex = 1; repetitionIndex < entries.length; repetitionIndex++) {
      const suffix = getRepetitionSuffixByIndex(repetitionIndex - 1);
      displayNames[entries[repetitionIndex].index] = \`\${baseName} \${suffix}\`;
    }
  });

  return displayNames;
}

function refreshColorCardNames() {
  const cards = Array.from(getColorCards());
  if (cards.length === 0) {
    return;
  }

  const hexValues = cards
    .map((card) => card.querySelector(".color-label")?.textContent?.trim() || "")
    .map((hex) => normalizeHexColor(hex))
    .filter((hex) => isValidHexColor(hex));

  if (hexValues.length !== cards.length) {
    return;
  }

  const displayNames = getPaletteDisplayNames(hexValues);

  cards.forEach((card, index) => {
    const colorName = card.querySelector(".color-name");
    const colorBaseIndicator = card.querySelector(".color-base-indicator");
    const complementaryIndicator = card.querySelector(".color-complementary-indicator");
    if (!colorName) {
      return;
    }

    const hex = hexValues[index];
    const displayName = displayNames[index] || getNearestColorName(hex);
    const baseCardIndex =
      typeof getColorModeBaseCardIndex === "function"
        ? getColorModeBaseCardIndex(cards.length)
        : 0;
    const complementaryCardIndex =
      typeof getComplementaryRoleCardIndex === "function"
        ? getComplementaryRoleCardIndex(cards.length)
        : -1;
    const isBaseColorCard = paletteBaseMode === "color" && index === baseCardIndex;
    const isComplementaryColorCard =
      (typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected()) &&
      index === complementaryCardIndex;
    const shouldShowReadonlyFixedPin =
      isBaseColorCard ||
      (
        typeof isExplicitComplementaryColorModeSelected === "function" &&
        isExplicitComplementaryColorModeSelected() &&
        (isBaseColorCard || isComplementaryColorCard)
      );
    const hadReadonlyFixedPin = card.dataset.readonlyFixedPin === "true";

    card.classList.toggle("is-base-color", isBaseColorCard);
    card.classList.toggle("is-complementary-color", isComplementaryColorCard);

    if (hadReadonlyFixedPin && !shouldShowReadonlyFixedPin && !isBaseColorCard) {
      setCardPinnedState(card, false);
    }

    card.dataset.readonlyFixedPin = shouldShowReadonlyFixedPin ? "true" : "false";

    if ((isBaseColorCard || shouldShowReadonlyFixedPin) && !isCardPinned(card)) {
      setCardPinnedState(card, true);
    }
    colorName.textContent = displayName;
    applyAccessibleColorNameStyle(colorName, hex);

    if (colorBaseIndicator) {
      colorBaseIndicator.hidden = !isBaseColorCard;
      applyAccessibleColorNameStyle(colorBaseIndicator, hex);
    }

    if (complementaryIndicator) {
      complementaryIndicator.hidden = !isComplementaryColorCard;
      applyAccessibleColorNameStyle(complementaryIndicator, hex);
    }
  });
}

function getCurrentPaletteHexValues() {
  return getCurrentPaletteCardEntries().map((entry) => entry.hex);
}

if (copyHexBtn) {
  copyHexBtn.addEventListener("click", async () => {
    const hexValues = getCurrentPaletteHexValues();

    if (hexValues.length === 0) {
      alert("No hay colores en la paleta actual.");
      return;
    }

    const paletteDisplayNames = getPaletteDisplayNames(hexValues);
    const plainText = hexValues
      .map((hex, index) => \`\${hex} - \${paletteDisplayNames[index]}\`)
      .join("\\n");

    try {
      await writeTextToClipboard(plainText);

      if (copyBtnFeedbackTimeout) {
        clearTimeout(copyBtnFeedbackTimeout);
      }

      copyBtnFeedbackTimeout = showButtonCopyFeedback(copyHexBtn, {
        defaultTooltipText: copyHexBtnDefaultTooltip,
      });
    } catch (error) {
      alert("No se han podido copiar los valores de la paleta.");
    }
  });
}

function isColorAlreadyInPalette(color, excludeCard = null) {
  const normalized = normalizeHexColor(color);
  const cards = getColorCards();

  return Array.from(cards).some((card) => {
    if (excludeCard && card === excludeCard) {
      return false;
    }

    const label = card.querySelector(".color-label");
    return label && label.textContent.trim().toUpperCase() === normalized;
  });
}
`,Bl=`// Palette generator card actions and card DOM wiring.

function persistCurrentPaletteSnapshot(saveHistoryEntry = true) {
  syncCurrentPaletteFromDom();
  capturePaletteAdjustmentBase(currentPalette);

  if (saveHistoryEntry) {
    saveHistory(currentPalette);
  }
}

function updateCardPinButtonState(card) {
  const pinBtn = card?.querySelector(".color-pin-btn");
  if (!pinBtn) {
    return;
  }

  const isPinned = isCardPinned(card);
  const nextTooltip = isPinned ? "Desfijar color" : "Fijar color";
  const iconWrap = pinBtn.querySelector(".pin-icon-wrap");
  const pinOverlayIconWrap = card?.querySelector(".color-pin-overlay-icon-wrap");

  pinBtn.classList.toggle("is-pinned", isPinned);
  pinBtn.setAttribute("aria-label", nextTooltip);
  pinBtn.setAttribute("aria-pressed", isPinned ? "true" : "false");

  if (iconWrap) {
    iconWrap.innerHTML = getPinButtonIconMarkup(isPinned);
  }

  if (pinOverlayIconWrap) {
    pinOverlayIconWrap.innerHTML = getPinOverlayIconMarkup(isPinned);
  }
}

function isLockedColorModeBaseCard(card) {
  if (paletteBaseMode !== "color") {
    return false;
  }

  const cards = Array.from(getColorCards());
  const baseCardIndex =
    typeof getColorModeBaseCardIndex === "function"
      ? getColorModeBaseCardIndex(cards.length)
      : 0;

  return cards.indexOf(card) === baseCardIndex;
}

function isCardPinningAvailable() {
  if (paletteBaseMode === "color") {
    return false;
  }

  return true;
}

function isLockedComplementaryRoleCard(card) {
  if (
    paletteBaseMode !== "color" ||
    !card ||
    (typeof isExplicitComplementaryColorModeSelected === "function" &&
      !isExplicitComplementaryColorModeSelected())
  ) {
    return false;
  }

  const cards = Array.from(getColorCards());
  const complementaryCardIndex =
    typeof getComplementaryRoleCardIndex === "function"
      ? getComplementaryRoleCardIndex(cards.length)
      : -1;

  return cards.indexOf(card) === complementaryCardIndex;
}

function shouldShowLockedColorModeBasePin(card) {
  return (
    !!card &&
    paletteBaseMode === "color" &&
    isLockedColorModeBaseCard(card)
  );
}

function shouldShowLockedComplementaryPin(card) {
  return isLockedComplementaryRoleCard(card);
}

function clearUnavailablePinnedCards() {
  if (isCardPinningAvailable()) {
    return false;
  }

  let hasChanged = false;
  Array.from(getColorCards()).forEach((card) => {
    const shouldPreserveReadonlyFixedPin =
      shouldShowLockedColorModeBasePin(card) ||
      shouldShowLockedComplementaryPin(card);

    if (shouldPreserveReadonlyFixedPin || !isCardPinned(card)) {
      return;
    }

    setCardPinnedState(card, false);
    hasChanged = true;
  });

  return hasChanged;
}

function updateColorModeCardActionVisibility() {
  Array.from(getColorCards()).forEach((card) => {
    const editBtn = card.querySelector(".action-edit");
    const pinBtn = card.querySelector(".color-pin-btn");
    const pinOverlay = card.querySelector(".color-pin-overlay");
    const shouldShowReadonlyFixedPin =
      shouldShowLockedColorModeBasePin(card) ||
      shouldShowLockedComplementaryPin(card);
    if (editBtn) {
      editBtn.classList.toggle(
        "is-hidden",
        isLockedColorModeBaseCard(card) || isLockedComplementaryRoleCard(card)
      );
    }
    if (pinBtn) {
      pinBtn.classList.toggle("is-hidden", !isCardPinningAvailable() || shouldShowReadonlyFixedPin);
    }
    if (pinOverlay) {
      pinOverlay.classList.toggle(
        "is-hidden",
        !isCardPinningAvailable() && !shouldShowReadonlyFixedPin
      );
      pinOverlay.classList.toggle("is-always-visible", shouldShowReadonlyFixedPin);
      pinOverlay.classList.toggle("is-corner", shouldShowReadonlyFixedPin);
      pinOverlay.classList.toggle("is-readonly", shouldShowReadonlyFixedPin);
      pinOverlay.classList.toggle("is-fixed-role", shouldShowReadonlyFixedPin);
    }
  });
}

function toggleCardPinnedState(card) {
  if (!card) {
    return;
  }

  if (
    isLockedColorModeBaseCard(card) ||
    isLockedComplementaryRoleCard(card) ||
    !isCardPinningAvailable()
  ) {
    return;
  }

  setCardPinnedState(card, !isCardPinned(card));
  persistCurrentPaletteSnapshot();
}

function setCardPinnedState(card, isPinned) {
  if (!card) {
    return;
  }

  const resolvedPinnedState = isLockedColorModeBaseCard(card)
    ? true
    : isLockedComplementaryRoleCard(card)
      ? true
    : (isCardPinningAvailable() && !!isPinned);
  card.dataset.pinned = resolvedPinnedState ? "true" : "false";
  card.classList.toggle("is-pinned", resolvedPinnedState);
  updateCardPinButtonState(card);
}

function setRegenerateButtonAvailability(button, isAvailable, tooltipText = null) {
  if (!button) {
    return;
  }

  button.classList.toggle("is-disabled", !isAvailable);
  button.setAttribute("aria-disabled", isAvailable ? "false" : "true");
  setActionButtonTooltipText(
    button,
    tooltipText || (
      isAvailable
        ? "Regenerar color"
        : "No hay suficiente variedad de colores en la imagen de referencia"
    )
  );
}
// Show delete while more than 1 card exists
function refreshDeleteButtonsVisibility() {
  const cards = getColorCards();
  const canDelete = cards.length > 1;

  cards.forEach((card) => {
    const deleteBtn = card.querySelector(".action-delete");
    if (!deleteBtn) {
      return;
    }
    const shouldHideDelete =
      !canDelete ||
      isLockedColorModeBaseCard(card) ||
      isLockedComplementaryRoleCard(card);
    deleteBtn.classList.toggle("is-hidden", shouldHideDelete);
  });
}
// Enable or disable add button by card limit
function updateAddColorButtonState() {
  if (!addColorBtn || !addColorLabel) {
    return;
  }

  const shouldHideAddColor = paletteBaseMode === "color";
  if (addColorElement) {
    addColorElement.hidden = shouldHideAddColor;
  }

  if (shouldHideAddColor) {
    return;
  }

  const totalCards = getColorCards().length;
  const isAtMax = totalCards >= MAX_PALETTE_COLORS;

  addColorBtn.classList.toggle("is-disabled", isAtMax);
  addColorBtn.setAttribute("aria-disabled", String(isAtMax));
  addColorLabel.textContent = isAtMax ? ADD_DISABLED_LABEL : addColorDefaultLabel;
}

function getAdjacentBaseColorNames(card) {
  const cards = Array.from(getColorCards());
  const cardIndex = cards.indexOf(card);

  if (cardIndex === -1) {
    return [];
  }

  return [cards[cardIndex - 1], cards[cardIndex + 1]]
    .filter(Boolean)
    .map((adjacentCard) => adjacentCard.querySelector(".color-label")?.textContent?.trim() || "")
    .map((hex) => normalizeHexColor(hex))
    .filter((hex) => isValidHexColor(hex))
    .map((hex) => getNearestColorName(hex));
}

function getRegeneratedColorForCard(card, existingColors, options = {}) {
  if (paletteBaseMode === "color" && typeof getColorModeRegenerationColorForCard === "function") {
    return getColorModeRegenerationColorForCard(card, existingColors, options);
  }

  if (paletteBaseMode === "image" && typeof getImageRegenerationColorForCard === "function") {
    return getImageRegenerationColorForCard(card, existingColors, options);
  }

  const maxCandidateSearches = 18;
  const seenCandidates = new Set();
  const adjacentBaseNames = getAdjacentBaseColorNames(card);
  let bestCandidate = null;
  let bestConflictCount = Infinity;

  for (let attempt = 0; attempt < maxCandidateSearches; attempt++) {
    const candidate = getUniqueGeneratedColor(existingColors);
    if (!candidate || seenCandidates.has(candidate)) {
      continue;
    }

    seenCandidates.add(candidate);

    const candidateBaseName = getNearestColorName(candidate);
    const conflictCount = adjacentBaseNames.reduce((count, adjacentBaseName) => {
      return count + (adjacentBaseName === candidateBaseName ? 1 : 0);
    }, 0);

    if (conflictCount === 0) {
      return candidate;
    }

    if (conflictCount < bestConflictCount) {
      bestCandidate = candidate;
      bestConflictCount = conflictCount;
    }
  }

  return bestCandidate || getUniqueGeneratedColor(existingColors);
}

function getAddedColorForCurrentMode(existingColors) {
  if (paletteBaseMode === "image") {
    const imageCandidate =
      typeof getImageBasedCandidateColor === "function"
        ? getImageBasedCandidateColor(existingColors, [])
        : null;

    return {
      color: imageCandidate || "#FFFFFF",
      isFallbackWhite: !imageCandidate,
    };
  }

  return {
    color: getUniqueGeneratedColor(existingColors),
    isFallbackWhite: false,
  };
}

function updateRegenerateButtonsAvailability() {
  const cards = Array.from(getColorCards());
  const shouldHideRegenerateButtons =
    (
      typeof isColorModeMonochromaticScaleActive === "function" &&
      isColorModeMonochromaticScaleActive()
    ) ||
    (
      paletteBaseMode === "color" &&
      ["complementary", "analogous", "triad"].includes(selectedColorPaletteType)
    );

  cards.forEach((card) => {
    const regenerateBtn = card.querySelector(".action-regenerate");
    if (!regenerateBtn) {
      return;
    }

    const shouldHideRegenerateButton =
      shouldHideRegenerateButtons ||
      isLockedColorModeBaseCard(card) ||
      isLockedComplementaryRoleCard(card);

    regenerateBtn.classList.toggle("is-hidden", shouldHideRegenerateButton);

    if (isLockedColorModeBaseCard(card)) {
      setRegenerateButtonAvailability(
        regenerateBtn,
        false,
        "El color base se ajusta desde el panel de controles"
      );
      return;
    }

    if (isLockedComplementaryRoleCard(card)) {
      setRegenerateButtonAvailability(
        regenerateBtn,
        false,
        "El complementario se ajusta automáticamente desde el color base"
      );
      return;
    }

    if (shouldHideRegenerateButtons) {
      setRegenerateButtonAvailability(
        regenerateBtn,
        false,
        "Ajusta el color base o Brillo/Saturación"
      );
      return;
    }

    if (isCardPinned(card)) {
      setRegenerateButtonAvailability(regenerateBtn, false, "El color está fijado");
      return;
    }

    if (paletteBaseMode !== "image") {
      setRegenerateButtonAvailability(regenerateBtn, true);
      return;
    }

    if (card.dataset.regenerateLocked === "true") {
      setRegenerateButtonAvailability(regenerateBtn, false);
      return;
    }

    const existingColors = new Set(getCurrentPaletteHexValues());

    setRegenerateButtonAvailability(
      regenerateBtn,
      !!getRegeneratedColorForCard(card, existingColors)
    );
  });
}

function attachCardActions(card) {
  // Create all action buttons for this card
  const actions = document.createElement("div");
  actions.className = "color-actions";

  const regenerateBtn = createCardActionButton(
    "regenerate",
    "Regenerar color",
  );
  const editBtn = createCardActionButton("edit", "Editar color");
  const copyBtn = createCardActionButton("copy", CARD_COPY_TOOLTIP_DEFAULT);
  const deleteBtn = createCardActionButton("delete", "Eliminar color");
  const pinBtn = createCardPinButton();
  const pinOverlay = document.createElement("div");
  pinOverlay.className = "color-pin-overlay";
  const pinOverlayContent = document.createElement("div");
  pinOverlayContent.className = "color-pin-overlay-content";
  const pinOverlayIconWrap = document.createElement("span");
  pinOverlayIconWrap.className = "color-pin-overlay-icon-wrap";
  pinOverlayContent.appendChild(pinOverlayIconWrap);
  pinOverlay.appendChild(pinOverlayContent);

  let cardCopyFeedbackTimeout = null;
  // Regenerate this card while keeping colors unique
  regenerateBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    if (isLockedColorModeBaseCard(card)) {
      return;
    }

    if (regenerateBtn.classList.contains("is-disabled")) {
      return;
    }

    const existingColors = new Set(getCurrentPaletteHexValues());

    const newColor = getRegeneratedColorForCard(card, existingColors);
    if (!newColor) {
      alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
      return;
    }

    setCardColor(card, newColor);
    persistCurrentPaletteSnapshot();
  });

  editBtn.addEventListener("click", (event) => {
    event.stopPropagation();

    if (isLockedColorModeBaseCard(card)) {
      return;
    }

    const currentHex = normalizeHexColor(
      card.querySelector(".color-label")?.textContent?.trim() || "#000000",
    );
    activeEditCard = card;
    activeEditOriginalColor = currentHex;
    globalEditPicker.value = currentHex;
    positionEditPickerAtButton(editBtn, globalEditPicker);

    // Wait one frame so fixed position is applied before opening picker
    requestAnimationFrame(() => {
      if (!openNativeColorPicker(globalEditPicker)) {
        alert("No se ha podido abrir el selector de color. Intentalo de nuevo.");
      }
    });
  });

  copyBtn.addEventListener("click", async (event) => {
    event.stopPropagation();
    const hex = card
      .querySelector(".color-label")
      ?.textContent?.trim()
      .toUpperCase();
    if (!hex || !isValidHexColor(hex)) {
      return;
    }

    const text = hex;
    try {
      await writeTextToClipboard(text);
      sharedColors?.setActiveColor(hex, {
        source: "palette-generator",
        action: "card-copy",
      });

      if (cardCopyFeedbackTimeout) {
        clearTimeout(cardCopyFeedbackTimeout);
      }

      const feedbackBg = normalizeHexColor(hex);
      const feedbackTextColor = getReadableTooltipTextColor(feedbackBg);
      cardCopyFeedbackTimeout = showButtonCopyFeedback(copyBtn, {
        defaultTooltipText: CARD_COPY_TOOLTIP_DEFAULT,
        feedbackBg,
        feedbackTextColor,
      });
    } catch (error) {
      alert("No se ha podido copiar este valor HEX.");
    }
  });

  deleteBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    if (isLockedColorModeBaseCard(card)) {
      return;
    }

    const totalCards = getColorCards().length;
    if (totalCards <= 1) {
      return;
    }

    card.remove();
    refreshDeleteButtonsVisibility();
    persistCurrentPaletteSnapshot();
  });

  pinBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleCardPinnedState(card);
  });

  card.addEventListener("click", (event) => {
    if (
      event.target.closest(".color-action-btn") ||
      event.target.closest(".color-pin-btn")
    ) {
      return;
    }

    toggleCardPinnedState(card);
  });

  actions.appendChild(regenerateBtn);
  actions.appendChild(editBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(actions);
  card.appendChild(pinBtn);
  card.appendChild(pinOverlay);
  updateCardPinButtonState(card);
}
// Live update card color while picker is open
globalEditPicker.addEventListener("input", () => {
  if (!activeEditCard) {
    return;
  }

  const candidate = normalizeHexColor(globalEditPicker.value);
  if (isColorAlreadyInPalette(candidate, activeEditCard)) {
    return;
  }

  setCardColor(activeEditCard, candidate);
  syncCurrentPaletteFromDom();
});

globalEditPicker.addEventListener("change", () => {
  if (!activeEditCard) {
    return;
  }

  // Save final color and history only if color changed
  const candidate = normalizeHexColor(globalEditPicker.value);
  const previousColor = activeEditOriginalColor;

  if (isColorAlreadyInPalette(candidate, activeEditCard)) {
    alert("El color ya esta en la paleta. No se anaden duplicados para mantener el conjunto limpio y consistente.");
    setCardColor(activeEditCard, activeEditOriginalColor);
    syncCurrentPaletteFromDom();
    return;
  }

  setCardColor(activeEditCard, candidate);
  activeEditOriginalColor = candidate;
  persistCurrentPaletteSnapshot(candidate !== previousColor);
});

globalEditPicker.addEventListener("blur", () => {
  activeEditCard = null;
});
// Close edit mode when user clicks outside cards
function closeAllCardEditors(exceptCard = null) {
  paletteContainer
    .querySelectorAll(".color-card.is-editing")
    .forEach((card) => {
      if (card !== exceptCard) {
        card.classList.remove("is-editing");
      }
    });
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".color-card")) {
    return;
  }

  closeAllCardEditors();
});

function createColorCard(color, options = {}) {
  // Build one card and insert it before add button
  const card = document.createElement("div");
  card.className = "color-card";
  card.dataset.pinned = "false";
  card.dataset.readonlyFixedPin = "false";

  const colorName = document.createElement("div");
  colorName.className = "color-name";
  const colorBaseIndicator = document.createElement("div");
  colorBaseIndicator.className = "color-base-indicator";
  colorBaseIndicator.textContent = "Color base";
  const complementaryIndicator = document.createElement("div");
  complementaryIndicator.className = "color-complementary-indicator";
  complementaryIndicator.textContent = "Complementario";

  const label = document.createElement("div");
  label.className = "color-label";

  attachCardActions(card);
  card.appendChild(colorBaseIndicator);
  card.appendChild(complementaryIndicator);
  card.appendChild(colorName);
  card.appendChild(label);
  setCardColor(card, color);
  setCardPinnedState(card, !!options.pinned);
  updateColorModeCardActionVisibility();

  if (addColorElement) {
    paletteContainer.insertBefore(card, addColorElement);
  } else {
    paletteContainer.appendChild(card);
  }

  refreshDeleteButtonsVisibility();
  updateAddColorButtonState();

  return card;
}

// Add a new unique color card when add button is enabled
if (addColorBtn) {
  addColorBtn.addEventListener("click", (event) => {
    event.preventDefault();

    updateAddColorButtonState();
    if (addColorBtn.classList.contains("is-disabled")) {
      return;
    }
    // Keep uniqueness against current palette colors
    const existingColors = new Set(getCurrentPaletteHexValues());
    const { color, isFallbackWhite } = getAddedColorForCurrentMode(existingColors);
    if (!color) {
      alert("No se ha podido encontrar un color unico. Intentalo de nuevo.");
      return;
    }

    const card = createColorCard(color);

    if (card) {
      card.dataset.regenerateLocked = isFallbackWhite ? "true" : "false";
    }

    persistCurrentPaletteSnapshot();
  });
}
`,Tl=`\uFEFF// PALETTES HISTORY

function captureCurrentGeneratorSettings() {
  // Save current controls with colors
  return {
    paletteSize,
    baseMode: paletteBaseMode,
    baseColor: selectedPaletteBaseColor,
    colorPaletteType: selectedColorPaletteType,
    monochromaticGenerationMode: selectedMonochromaticGenerationMode,
    analogousSeparationMode: selectedAnalogousSeparationMode,
    prioritizeImageDominantColors,
    temperature: {
      warm: !!temperature.warm,
      cool: !!temperature.cool,
    },
    brightness: brightnessInput ? Number(brightnessInput.value) : DEFAULT_BRIGHTNESS,
    saturation: saturationInput ? Number(saturationInput.value) : DEFAULT_SATURATION,
  };
}

function updateHistoryNavigationButtons() {
  const canUndo = paletteHistoryIndex > 0;
  const canRedo =
    paletteHistoryIndex >= 0 && paletteHistoryIndex < paletteHistory.length - 1;

  if (paletteUndoBtn) {
    paletteUndoBtn.disabled = !canUndo;
    paletteUndoBtn.setAttribute("aria-disabled", canUndo ? "false" : "true");
  }

  if (paletteRedoBtn) {
    paletteRedoBtn.disabled = !canRedo;
    paletteRedoBtn.setAttribute("aria-disabled", canRedo ? "false" : "true");
  }
}

function applyGeneratorSettings(settings, fallbackSize) {
  // Old history entries may miss settings
  const nextSize = Number.isFinite(settings?.paletteSize)
    ? settings.paletteSize
    : fallbackSize;
  setPaletteSize(nextSize);

  if (typeof setPaletteBaseMode === "function" && settings?.baseMode) {
    setPaletteBaseMode(settings.baseMode);
  }

  if (typeof settings?.prioritizeImageDominantColors === "boolean") {
    prioritizeImageDominantColors = settings.prioritizeImageDominantColors;
    if (paletteImageDominantToggle) {
      paletteImageDominantToggle.checked = prioritizeImageDominantColors;
    }
  }

  if (settings?.temperature) {
    setTemperatureSelection(settings.temperature);
  }

  if (typeof settings?.baseColor === "string") {
    setSelectedPaletteBaseColor(settings.baseColor, {
      syncTextInput: true,
      generate: false,
      publish: false,
    });
  }

  if (typeof settings?.colorPaletteType === "string") {
    setSelectedColorPaletteType(settings.colorPaletteType, {
      generate: false,
    });
  }

  if (typeof settings?.monochromaticGenerationMode === "string") {
    setSelectedMonochromaticGenerationMode(settings.monochromaticGenerationMode, {
      generate: false,
    });
  }

  if (typeof settings?.analogousSeparationMode === "string") {
    setSelectedAnalogousSeparationMode(settings.analogousSeparationMode, {
      generate: false,
    });
  }

  if (brightnessInput && Number.isFinite(settings?.brightness)) {
    brightnessInput.value = settings.brightness;
    updateBrightnessProgress();
    syncTemperatureControlsState();
  }

  if (saturationInput && Number.isFinite(settings?.saturation)) {
    saturationInput.value = settings.saturation;
    updateSaturationProgress();
    syncTemperatureControlsState();
  }

  syncPaletteGeneratorStoreWithLegacyState({}, {
    scope: "history-apply-settings",
  });
}

function saveHistory(colors, metadata = {}) {
  if (paletteHistoryIndex < paletteHistory.length - 1) {
    paletteHistory = paletteHistory.slice(0, paletteHistoryIndex + 1);
  }

  const pinnedIndexes = Array.isArray(metadata.pinnedIndexes)
    ? metadata.pinnedIndexes
    : (
      typeof getPinnedPaletteIndexes === "function"
        ? getPinnedPaletteIndexes()
        : []
    );

  // Save a copy so later edits do not change history
  paletteHistory.push({
    colors: [...colors],
    createdAt: new Date(),
    isAlternative: !!metadata.isAlternative,
    pinnedIndexes: [...pinnedIndexes],
    settings: captureCurrentGeneratorSettings(),
  });
  paletteHistoryIndex = paletteHistory.length - 1;
  syncPaletteGeneratorStoreHistoryState({
    scope: "history-save",
  });

  renderHistory();
  updateHistoryNavigationButtons();
}

function formatHistoryTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return \`\${hours}:\${minutes}:\${seconds}\`;
}

function renderHistory() {
  historyContainer.replaceChildren();

  const historyEntries = paletteHistory
    .map((entry, index) => ({
      entry,
      historyIndex: index,
    }))
    .reverse();

  historyEntries.forEach(({ entry, historyIndex }) => {
    // Support both old and new history formats
    const palette = Array.isArray(entry) ? entry : entry.colors;
    const createdAt = Array.isArray(entry) ? null : entry.createdAt;
    const isAlternative = Array.isArray(entry) ? false : !!entry.isAlternative;

    const historyItem = document.createElement("div");
    historyItem.className = "history-palette";

    const header = document.createElement("div");
    header.className = "history-header";

    const titleGroup = document.createElement("div");
    titleGroup.className = "history-title-group";

    const title = document.createElement("h3");
    title.className = "history-title";
    title.textContent = isAlternative
      ? \`Paleta Alternativa \${historyIndex + 1}\`
      : \`Paleta \${historyIndex + 1}\`;

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = createdAt
      ? formatHistoryTime(createdAt)
      : "--:--:--";

    titleGroup.appendChild(title);
    titleGroup.appendChild(time);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const editHistoryBtn = createCardActionButton("edit", "Abrir en el generador");
    const editHistoryIcon = editHistoryBtn.querySelector(".action-icon");
    if (editHistoryIcon) {
      editHistoryIcon.src = "assets/magic-wand.svg";
      editHistoryIcon.alt = "icono de abrir en el generador";
    }
    const copyHistoryBtn = createCardActionButton("copy", HISTORY_COPY_TOOLTIP_DEFAULT);
    let historyCopyFeedbackTimeout = null;

    editHistoryBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      loadPaletteVersionInGenerator(entry, { historyIndex });
    });

    copyHistoryBtn.addEventListener("click", async (event) => {
      event.stopPropagation();

      const plainText = palette
        .map((hex) => \`\${normalizeHexColor(hex)} - \${getNearestColorName(hex)}\`)
        .join("\\n");

      try {
        await copyTextToClipboard(plainText);

        if (historyCopyFeedbackTimeout) {
          clearTimeout(historyCopyFeedbackTimeout);
        }

        historyCopyFeedbackTimeout = showButtonCopyFeedback(copyHistoryBtn, {
          defaultTooltipText: HISTORY_COPY_TOOLTIP_DEFAULT,
        });
      } catch (error) {
        alert("No se han podido copiar los valores de la paleta.");
      }
    });

    actions.appendChild(editHistoryBtn);
    actions.appendChild(copyHistoryBtn);

    header.appendChild(titleGroup);
    header.appendChild(actions);

    const row = document.createElement("div");
    row.className = "history-row";

    palette.forEach((color) => {
      const hex = normalizeHexColor(color);
      let historyColorCopyFeedbackTimeout = null;

      const box = document.createElement("button");
      box.type = "button";
      box.className = "history-color";
      box.style.background = hex;
      box.setAttribute("aria-label", \`Copiar \${hex}\`);

      const tooltip = document.createElement("div");
      tooltip.className = "tooltip";
      tooltip.textContent = "Copiar HEX";
      box.appendChild(tooltip);

      box.addEventListener("click", async () => {
        try {
          await copyTextToClipboard(hex);

          if (historyColorCopyFeedbackTimeout) {
            clearTimeout(historyColorCopyFeedbackTimeout);
          }

          historyColorCopyFeedbackTimeout = showButtonCopyFeedback(box, {
            defaultTooltipText: "Copiar HEX",
          });
        } catch (error) {
          alert("No se pudo copiar este valor HEX.");
        }
      });

      row.appendChild(box);
    });

    historyItem.appendChild(header);
    historyItem.appendChild(row);
    historyContainer.appendChild(historyItem);
  });

  updateHistoryNavigationButtons();
}

function loadPaletteVersionInGenerator(historyEntry, options = {}) {
  const colors = Array.isArray(historyEntry)
    ? historyEntry
    : historyEntry?.colors;

  if (!Array.isArray(colors)) {
    return;
  }

  // Normalize and keep only valid HEX colors
  const validColors = colors
    .map((color) => normalizeHexColor(color))
    .filter((hex) => isValidHexColor(hex));

  if (validColors.length === 0) {
    return;
  }

  const fallbackSize = validColors.length;
  const settings = Array.isArray(historyEntry)
    ? null
    : historyEntry?.settings;
  const pinnedIndexes = Array.isArray(historyEntry?.pinnedIndexes)
    ? historyEntry.pinnedIndexes
    : [];
  applyGeneratorSettings(settings, fallbackSize);

  getColorCards().forEach((card) => card.remove());

  currentPalette = [];

  validColors.forEach((color, index) => {
    createColorCard(color, {
      pinned: pinnedIndexes.includes(index),
    });
    currentPalette.push(color);
  });

  capturePaletteAdjustmentBase(currentPalette, {
    brightness: brightnessInput ? Number(brightnessInput.value) : DEFAULT_BRIGHTNESS,
    saturation: saturationInput ? Number(saturationInput.value) : DEFAULT_SATURATION,
  });
  syncCurrentPaletteFromDom();
  if (Number.isFinite(options.historyIndex)) {
    paletteHistoryIndex = options.historyIndex;
  }
  syncPaletteGeneratorStoreHistoryState({
    scope: "history-load",
  });
  updateHistoryNavigationButtons();
  // Scroll up so user can see the loaded palette
  if (options.shouldScroll !== false) {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
}

function navigatePaletteHistory(direction) {
  if (!Array.isArray(paletteHistory) || paletteHistory.length === 0) {
    updateHistoryNavigationButtons();
    return;
  }

  const targetIndex = paletteHistoryIndex + direction;
  if (targetIndex < 0 || targetIndex >= paletteHistory.length) {
    updateHistoryNavigationButtons();
    return;
  }

  loadPaletteVersionInGenerator(paletteHistory[targetIndex], {
    historyIndex: targetIndex,
    shouldScroll: false,
  });
}

if (paletteUndoBtn) {
  paletteUndoBtn.addEventListener("click", () => {
    navigatePaletteHistory(-1);
  });
}

if (paletteRedoBtn) {
  paletteRedoBtn.addEventListener("click", () => {
    navigatePaletteHistory(1);
  });
}

updateHistoryNavigationButtons();
`,El=`// Public API for the palette generator mini-app.
(function initializePaletteGeneratorAppRegistration() {
  let hasInitialized = false;

  function initialize() {
    if (hasInitialized) {
      return;
    }

    if (
      typeof setPaletteSize !== "function" ||
      typeof setTemperatureSelection !== "function" ||
      typeof generatePalette !== "function" ||
      typeof updateAddColorButtonState !== "function"
    ) {
      console.error("Palette generator initialization failed: required startup functions are missing.");
      return;
    }

    hasInitialized = true;

    if (typeof setupSurpriseButton === "function") {
      setupSurpriseButton();
    }

    setPaletteSize(paletteSize);
    setTemperatureSelection(temperature);
    if (typeof syncColorModeBaseControls === "function") {
      syncColorModeBaseControls();
    }
    void generatePalette();
    updateAddColorButtonState();
  }

  const paletteGeneratorApp = {
    initialize,
    getState() {
      return {
        palette: [...currentPalette],
        paletteSize,
        baseMode: paletteBaseMode,
        baseColor: selectedPaletteBaseColor,
        colorPaletteType: selectedColorPaletteType,
        monochromaticGenerationMode: selectedMonochromaticGenerationMode,
        analogousSeparationMode: selectedAnalogousSeparationMode,
        temperature: { ...temperature },
      };
    },
  };

  window.PaletteGeneratorApp = paletteGeneratorApp;
  window.AppRegistry?.register("palette-generator", paletteGeneratorApp);
})();
`,wl=[{id:"shared-color-names.js",code:fl},{id:"palette-generator-state.js",code:Cl},{id:"palette-generator-core.js",code:xl},{id:"palette-generator-image-analysis.js",code:bl},{id:"palette-generator-image-palette.js",code:yl},{id:"palette-generator-temperature.js",code:Pl},{id:"palette-generator-color-mode.js",code:Sl},{id:"palette-generator-image-ui.js",code:Il},{id:"palette-generator-controls.js",code:Al},{id:"palette-generator-card-helpers.js",code:Ml},{id:"palette-generator-card-names.js",code:vl},{id:"palette-generator-cards.js",code:Bl},{id:"palette-generator-history.js",code:Tl},{id:"palette-generator-app.js",code:El}];function Ll(){const e=document.getElementById("footerYear");if(!e)return;const t=new Date().getFullYear();e.textContent=t===2026?String(2026):`2026–${t}`}async function Rl(){ll(),cl(),pl(),gl(wl),dl()}function Fa(){Ll(),Rl()}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Fa,{once:!0}):Fa();
