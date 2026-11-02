import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{n as t,t as n}from"./preload-helper-BmwKLDNu.js";import{t as r}from"./jsx-runtime-BxZPLZy3.js";import{n as i,t as a}from"./react-Cd8OJmTE.js";import{n as o,t as s}from"./create-interpolate-element-Dn8dC6qL.js";import{$n as c,Dr as l,Fr as u,Gn as d,Lt as f,Sr as p,Tr as ee,Tt as te,Zn as m,_r as ne,ar as re,br as ie,dr as h,lr as ae,n as oe,pr as se,qn as g,rr as _,sr as ce,tr as v}from"./store-CqttlGuP.js";import{$n as le,Cn as ue,En as de,Et as fe,On as pe,Q as me,Sn as he,Tn as ge,bn as _e,bt as ve,cn as ye,er as be,gn as xe,kn as Se,ln as Ce,ut as we,vn as Te,wn as Ee,wt as De,x as y}from"./build-module-DcXuoy9a.js";import{n as Oe,t as ke}from"./implementation-B8Pk9ni4.js";import{g as Ae,m as je,n as Me}from"./build-module-CRw_t1T3.js";import{n as Ne,t as Pe}from"./use-instance-id-DuzD68j8.js";import{at as Fe,kt as Ie,nt as Le,y as Re}from"./utils-D9p7k-Cw.js";import{c as ze,n as b,t as x}from"./build-module-CqL0UdL5.js";import{a as Be,o as Ve,r as He}from"./svg-0tzizuBa.js";import{n as Ue,r as We,t as Ge}from"./build-module-CPfkM_W9.js";import{r as Ke,t as qe}from"./build-module-BvdTt2vY.js";import{Ai as Je,Bn as Ye,Et as Xe,Go as Ze,Ki as Qe,La as $e,Ll as et,Lo as tt,Oa as nt,R as rt,Yc as it,b as at,ia as ot,lc as st,n as S,pc as ct,wt as lt,yo as ut}from"./build-module-CPA2Y5FH.js";import{n as dt,t as ft}from"./visually-hidden-Bafg0_Jr.js";import{n as pt,t as mt}from"./link-OVAdAvRI.js";import{n as ht,t as C}from"./stack-yNRxuGKo.js";import{a as gt,c as _t,i as vt,n as yt,o as bt,r as xt,s as St,t as Ct}from"./tab-BEpl2etQ.js";import{c as wt,m as Tt,p as Et,s as Dt}from"./radio-control-BvU5iub_.js";import{n as Ot,t as kt}from"./select-control-DcLyiK47.js";import{n as At,t as jt}from"./input-control-B24tkd9I.js";import{i as Mt,r as Nt}from"./private-apis-CatBCZ8C.js";import{n as Pt,t as Ft}from"./button-CwFwETKD.js";import{n as It,t as Lt}from"./number-control-B2XXhEbP.js";import{a as w,i as Rt,s as T}from"./plain-text-V0nzNipz.js";import{n as E,t as D}from"./popover-CHO-krnR.js";import{n as zt,t as Bt}from"./build-module-tQmaFdfy.js";import{f as Vt,h as Ht,m as Ut}from"./block-edit-BFw35-l8.js";import{n as Wt}from"./is-url-DM6xn1XU.js";import{n as Gt}from"./use-settings-BdzsVtpJ.js";import{n as Kt,t as qt}from"./style-C__yl0Q7.js";function undoRedoReducer(e,t){switch(t.type){case`UNDO`:{let t=e.manager.undo();return t?{...e,value:t[0].changes.prop.from}:e}case`REDO`:{let t=e.manager.redo();return t?{...e,value:t[0].changes.prop.to}:e}case`RECORD`:return e.manager.addRecord([{id:`object`,changes:{prop:{from:e.value,to:t.value}}}],t.isStaged),{...e,value:t.value}}return e}function initReducer(e){return{manager:le(),value:e}}function useStateWithHistory(e){let[t,n]=(0,a.useReducer)(undoRedoReducer,e,initReducer);return{value:t.value,setValue:(0,a.useCallback)((e,t)=>{n({type:`RECORD`,value:e,isStaged:t})},[]),hasUndo:t.manager.hasUndo(),hasRedo:t.manager.hasRedo(),undo:(0,a.useCallback)(()=>{n({type:`UNDO`})},[]),redo:(0,a.useCallback)(()=>{n({type:`REDO`})},[])}}function init_use_state_with_history(){return(init_use_state_with_history=e((()=>{be(),i()})))()}function isPhoneNumber(e){return e=e.replace(/[-.() ]/g,``),Jt.test(e)}var Jt;function init_is_phone_number(){return(init_is_phone_number=e((()=>{Jt=/^(tel:)?(\+)?\d{6,15}$/})))()}function isValidAuthority(e){return e?/^[^\s#?]+$/.test(e):!1}function isValidPath(e){return e?/^[^\s#?]+$/.test(e):!1}function isValidQueryString(e){return e?/^[^\s#?\/]+$/.test(e):!1}var O,Yt,k,Xt;function init_bold(){return(init_bold=e((()=>{x(),d(),y(),S(),O=r(),Yt=`core/bold`,k=b(`Bold`),Xt={name:Yt,title:k,tagName:`strong`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r,isVisible:i=!0}){function onToggle(){n(m(t,{type:Yt,title:k}))}function onClick(){n(m(t,{type:Yt,title:k})),r()}return(0,O.jsxs)(O.Fragment,{children:[(0,O.jsx)(w,{type:`primary`,character:`b`,onUse:onToggle}),i&&(0,O.jsx)(T,{name:`bold`,icon:Ze,title:k,onClick,isActive:e,shortcutType:`primary`,shortcutCharacter:`b`}),(0,O.jsx)(Rt,{inputType:`formatBold`,onInput:onToggle})]})}}})))()}var A,Zt,Qt,$t;function init_code(){return(init_code=e((()=>{x(),d(),y(),S(),A=r(),Zt=`core/code`,Qt=b(`Inline code`),$t={name:Zt,title:Qt,tagName:`code`,className:null,__unstableInputRule(e){let{start:t,text:n}=e;if(t===void 0||n[t-1]!=="`"||t-2<0)return e;let r=n.lastIndexOf("`",t-2);if(r===-1)return e;let i=r,a=t-2;return i===a||(e=ce(e,i,i+1),e=ce(e,a,a+1),e=u(e,{type:Zt},i,a)),e},edit({value:e,onChange:t,onFocus:n,isActive:r}){function onClick(){t(m(e,{type:Zt,title:Qt})),n()}return(0,A.jsxs)(A.Fragment,{children:[(0,A.jsx)(w,{type:`access`,character:`x`,onUse:onClick}),(0,A.jsx)(T,{name:`code`,icon:ct,title:Qt,onClick,isActive:r,role:`menuitemcheckbox`})]})}}})))()}function getCurrentImageId(e){if(!e.className)return;let[,t]=e.className.match(/wp-image-(\d+)/)??[];return t?parseInt(t,10):void 0}function InlineUI$1({value:e,onChange:t,activeObjectAttributes:n,contentRef:r}){let i=n.style,o=n.alt,s=i?.replace(/\D/g,``),[c,l]=(0,a.useState)(s),[u,d]=(0,a.useState)(o),f=c!==s||u!==o,p=g({editableContentElement:r.current,settings:rn});return(0,j.jsx)(D,{focusOnMount:!1,anchor:p,className:`block-editor-format-toolbar__image-popover`,children:(0,j.jsx)(`form`,{className:`block-editor-format-toolbar__image-container-content`,onSubmit:r=>{if(r.preventDefault(),e.start===void 0)return;let i=e.replacements.slice();i[e.start]={type:tn,attributes:{...n,style:c?`width: ${c}px;`:``,alt:u??``}},t({...e,replacements:i})},children:(0,j.jsxs)(C,{direction:`column`,gap:`lg`,children:[(0,j.jsx)(Lt,{label:b(`Width`),value:c,min:1,onChange:e=>{l(e)}}),(0,j.jsx)(Nt,{label:b(`Alternative text`),value:u??``,onChange:e=>{d(e)},help:(0,j.jsxs)(j.Fragment,{children:[(0,j.jsx)(mt,{openInNewTab:!0,href:b(`https://www.w3.org/WAI/tutorials/images/decision-tree/`),children:b(`Describe the purpose of the image.`)}),(0,j.jsx)(`br`,{}),b(`Leave empty if decorative.`)]})}),(0,j.jsx)(C,{justify:`right`,children:(0,j.jsx)(Ft,{disabled:!f,accessibleWhenDisabled:!0,variant:`primary`,type:`submit`,size:`compact`,children:b(`Apply`)})})]})})})}function Edit$3({value:e,onChange:t,onFocus:n,isObjectActive:r,activeObjectAttributes:i,contentRef:a}){return(0,j.jsxs)(Le,{children:[(0,j.jsx)(Fe,{allowedTypes:en,value:getCurrentImageId(i),onSelect:({id:r,url:i,alt:a,width:o})=>{t(_(e,{type:tn,attributes:{className:`wp-image-${r}`,style:`width: ${Math.min(o,150)}px;`,url:i,alt:a}})),n()},render:({open:e})=>(0,j.jsx)(T,{name:`image`,icon:nt,title:r?b(`Replace image`):nn,onClick:e,isActive:r})}),r&&(0,j.jsx)(InlineUI$1,{value:e,onChange:t,activeObjectAttributes:i,contentRef:a})]})}var j,en,tn,nn,rn;function init_image(){return(init_image=e((()=>{Pt(),E(),Mt(),It(),S(),pt(),ht(),x(),i(),d(),y(),j=r(),en=[`image`],tn=`core/image`,nn=b(`Inline image`),rn={name:tn,title:nn,keywords:[b(`photo`),b(`media`)],object:!0,tagName:`img`,className:null,attributes:{className:`class`,style:`style`,url:`src`,alt:`alt`},edit:Edit$3}})))()}var M,an,N,on;function init_italic(){return(init_italic=e((()=>{x(),d(),y(),S(),M=r(),an=`core/italic`,N=b(`Italic`),on={name:an,title:N,tagName:`em`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r,isVisible:i=!0}){function onToggle(){n(m(t,{type:an,title:N}))}function onClick(){n(m(t,{type:an,title:N})),r()}return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(w,{type:`primary`,character:`i`,onUse:onToggle}),i&&(0,M.jsx)(T,{name:`italic`,icon:tt,title:N,onClick,isActive:e,shortcutType:`primary`,shortcutCharacter:`i`}),(0,M.jsx)(Rt,{inputType:`formatItalic`,onInput:onToggle})]})}}})))()}function isValidHref(e){if(!e)return!1;let t=e.trim();if(!t)return!1;if(/^\S+:/.test(t)){let e=Ht(t);if(!e||!Ut(e)||e.startsWith(`http`)&&!/^https?:\/\/[^\/\s]/i.test(t))return!1;let n=We(t);if(!n||!isValidAuthority(n))return!1;let r=_e(t);if(r&&!isValidPath(r))return!1;let i=Te(t);if(i&&!isValidQueryString(i))return!1;let a=xe(t);if(a&&!Vt(a))return!1}return!(t.startsWith(`#`)&&!Vt(t))}function createLinkFormat({url:e,type:t,id:n,opensInNewWindow:r,nofollow:i,cssClasses:a}){let o={type:`core/link`,attributes:{url:e}};t&&(o.attributes.type=t),n&&(o.attributes.id=n),r&&(o.attributes.target=`_blank`,o.attributes.rel=o.attributes.rel?o.attributes.rel+` noopener`:`noopener`),i&&(o.attributes.rel=o.attributes.rel?o.attributes.rel+` nofollow`:`nofollow`);let s=a?.trim();return s?.length&&(o.attributes.class=s),o}function getFormatBoundary(e,t,n=e.start,r=e.end){let i={start:void 0,end:void 0},{formats:a}=e,o,s;if(!a?.length||n===void 0||r===void 0)return i;let c=a.slice(),l=c[n]?.find(({type:e})=>e===t.type),u=c[r]?.find(({type:e})=>e===t.type),d=c[r-1]?.find(({type:e})=>e===t.type);if(l)o=l,s=n;else if(u)o=u,s=r;else if(d)o=d,s=r-1;else return i;let f=c[s].indexOf(o);return n=walkToStart(c,s,o,f),r=walkToEnd(c,s,o,f),n=n<0?0:n,{start:n,end:r+1}}function walkToBoundary(e,t,n,r,i){let a=t,o={forwards:1,backwards:-1}[i]||1,s=o*-1;for(;e[a]&&e[a][r]===n;)a+=o;return a+=s,a}var walkToStart,walkToEnd;function init_utils(){return(init_utils=e((()=>{walkToStart=(...e)=>walkToBoundary(...e,`backwards`),walkToEnd=(...e)=>walkToBoundary(...e,`forwards`)})))()}var P,CSSClassesSettingComponent;function init_css_classes_setting(){return(init_css_classes_setting=e((()=>{i(),Pe(),x(),wt(),At(),ht(),dt(),P=r(),CSSClassesSettingComponent=({setting:e,value:t,onChange:n})=>{let r=!!t?.cssClasses?.length,[i,o]=(0,a.useState)(r),s=`css-classes-setting-${Ne(CSSClassesSettingComponent)}`,handleSettingChange=r=>{let i=typeof r==`string`?r.replace(/,/g,` `).replace(/\s+/g,` `).trim():r;n({...t,[e.id]:i})},handleCheckboxChange=()=>{i?(r&&handleSettingChange(``),o(!1)):o(!0)};return(0,P.jsxs)(`fieldset`,{children:[(0,P.jsx)(ft,{render:(0,P.jsx)(`legend`,{}),children:e.title}),(0,P.jsxs)(C,{direction:`column`,gap:`md`,children:[(0,P.jsx)(Dt,{label:e.title,onChange:handleCheckboxChange,checked:i||r,"aria-expanded":i,"aria-controls":i?s:void 0}),i&&(0,P.jsx)(`div`,{id:s,children:(0,P.jsx)(jt,{label:b(`CSS classes`),value:t?.cssClasses,onChange:handleSettingChange,help:b(`Separate multiple classes with spaces.`),__unstableInputWidth:`100%`})})]})]})}})))()}function InlineLinkUI({isActive:e,activeAttributes:t,value:n,onChange:r,onFocusOutside:i,stopAddingLink:o,contentRef:l,focusOnMount:d}){let f=getRichTextValueFromSelection(n,e).text,{selectionChange:te}=je(oe),{createPageEntity:m,userCanCreatePages:ie,selectionStart:se}=Ae(e=>{let{getSettings:t,getSelectionStart:n}=e(oe),r=t();return{createPageEntity:r.__experimentalCreatePageEntity,userCanCreatePages:r.__experimentalUserCanCreatePages,selectionStart:n()}},[]),_=(0,a.useMemo)(()=>({url:t.url,type:t.type,id:t.id,opensInNewTab:t.target===`_blank`,nofollow:t.rel?.includes(`nofollow`),title:f,cssClasses:t.class}),[t.class,t.id,t.rel,t.target,t.type,t.url,f]);function removeLink(){r(h(n,`core/link`)),o(),Ke(b(`Link removed.`),`assertive`)}function onChangeLink(t){let i=!_?.url;t={..._,...t};let a=Ce(t?.url??``),s=createLinkFormat({url:a,type:t.type,id:t.id!==void 0&&t.id!==null?String(t.id):void 0,opensInNewWindow:t.opensInNewTab,nofollow:t.nofollow,cssClasses:t.cssClasses}),l=t.title||a,d;if(ne(n)&&n.start!==void 0&&!e){let e=ae(n,l);d=u(e,s,n.start,n.start+l.length),r(d),o(),te({clientId:se.clientId,identifier:se.attributeKey,start:n.start+l.length+1})}else{if(l===f){let e=getFormatBoundary(n,{type:`core/link`});d=u(n,s,e.start,e.end)}else{d=ee({text:l}),d=u(d,s,0,l.length);let e=getFormatBoundary(n,{type:`core/link`}),t=c(n,e.start,e.start);if(!t)return;let[r,i]=t,a=re(i,f,d);d=p(r,a)}r(d),i||o(),isValidHref(a)?Ke(b(e?`Link edited.`:`Link inserted.`),`assertive`):Ke(b(`Warning: the link has been inserted but may have errors. Please test it.`),`assertive`)}}let ce={...ln,isActive:e},v=g({editableContentElement:l.current,settings:ce});async function handleCreate(e){let t=await m({title:e,status:`draft`});return{id:t.id,type:t.type,title:t.title.rendered,url:t.link,kind:`post-type`}}function createButtonText(e){return s(ze(b(`Create page: <mark>%s</mark>`),e),{mark:(0,F.jsx)(`mark`,{})})}return(0,F.jsx)(D,{anchor:v,animate:!1,onClose:o,onFocusOutside:i,placement:`bottom`,offset:8,shift:!0,focusOnMount:d,constrainTabbing:!0,children:(0,F.jsx)(we,{value:_,onChange:onChangeLink,onRemove:removeLink,hasRichPreviews:!0,createSuggestion:m&&handleCreate,withCreateSuggestion:ie,createSuggestionButtonText:createButtonText,hasTextControl:!0,settings:sn,showInitialSuggestions:!0,suggestionsQuery:{initialSuggestionsSearchOptions:{type:`post`,subtype:`page`,perPage:20}}})})}function getRichTextValueFromSelection(e,t){let n=e.start,r=e.end;if(t){let t=getFormatBoundary(e,{type:`core/link`});n=t.start??e.start,r=t.end??e.end}return v(e,n,r)}var F,sn;function init_inline(){return(init_inline=e((()=>{o(),i(),x(),qe(),E(),ye(),d(),y(),Me(),init_utils(),init_link(),init_css_classes_setting(),F=r(),sn=[...we.DEFAULT_LINK_SETTINGS,{id:`nofollow`,title:b(`Mark as nofollow`)},{id:`cssClasses`,title:b(`Additional CSS class(es)`),render:(e,t,n)=>(0,F.jsx)(CSSClassesSettingComponent,{setting:e,value:t,onChange:n})}]})))()}function Edit$2({isActive:e,activeAttributes:t,value:n,onChange:r,onFocus:i,contentRef:o,isVisible:s=!0}){let[c,d]=(0,a.useState)(!1),[f,p]=(0,a.useState)(null);(0,a.useEffect)(()=>{e||d(!1)},[e]),(0,a.useLayoutEffect)(()=>{let t=o.current;if(!t)return;function handleClick(t){let n=t.target.closest(`[contenteditable] a`);n&&e&&(d(!0),p({el:n,action:`click`}))}return t.addEventListener(`click`,handleClick),()=>{t.removeEventListener(`click`,handleClick)}},[o,e]);function addLink(t){let i=l(v(n));!e&&i&&Wt(i)&&isValidHref(i)?r(u(n,{type:L,attributes:{url:i}})):!e&&i&&ue(i)?r(u(n,{type:L,attributes:{url:`mailto:${i}`}})):!e&&i&&isPhoneNumber(i)?r(u(n,{type:L,attributes:{url:`tel:${i.replace(/\D/g,``)}`}})):(t&&p({el:t,action:null}),d(!0))}function stopAddingLink(){d(!1),f?.el?.tagName===`BUTTON`?f.el.focus():i(),p(null)}function onFocusOutside(){d(!1),p(null)}function onRemoveFormat(){r(h(n,L)),Ke(b(`Link removed.`),`assertive`)}let ee=f?.el?.tagName!==`A`||f?.action!==`click`,te=!ne(n);return(0,I.jsxs)(I.Fragment,{children:[te&&(0,I.jsx)(w,{type:`primary`,character:`k`,onUse:addLink}),(0,I.jsx)(w,{type:`primaryShift`,character:`k`,onUse:onRemoveFormat}),s&&(0,I.jsx)(T,{name:`link`,icon:Qe,title:e?b(`Link`):cn,onClick:e=>{addLink(e.currentTarget)},isActive:e||c,shortcutType:`primary`,shortcutCharacter:`k`,"aria-haspopup":`true`,"aria-expanded":c}),s&&c&&(0,I.jsx)(InlineLinkUI,{stopAddingLink,onFocusOutside,isActive:e,activeAttributes:t,value:n,onChange:r,contentRef:o,focusOnMount:ee?`firstElement`:!1})]})}var I,L,cn,ln;function init_link(){return(init_link=e((()=>{x(),i(),d(),he(),init_is_phone_number(),y(),zt(),S(),qe(),init_inline(),init_utils(),I=r(),L=`core/link`,cn=b(`Link`),ln={name:L,title:cn,tagName:`a`,className:null,attributes:{url:`href`,type:`data-type`,id:`data-id`,_id:`id`,target:`target`,rel:`rel`,class:`class`},__unstablePasteRule(e,{html:t,plainText:n}){let r=(t||n).replace(/<[^>]+>/g,``).trim();if(!Wt(r)||!/^https?:/.test(r))return e;window.console.log(`Created link:

`,r);let i={type:L,attributes:{url:Bt(r)}};return ne(e)?ae(e,u(ee({text:n}),i,0,n.length)):u(e,i)},edit:Edit$2}})))()}var R,un,dn,fn;function init_strikethrough(){return(init_strikethrough=e((()=>{x(),d(),y(),S(),R=r(),un=`core/strikethrough`,dn=b(`Strikethrough`),fn={name:un,title:dn,tagName:`s`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r}){function onClick(){n(m(t,{type:un,title:dn})),r()}return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(w,{type:`access`,character:`d`,onUse:onClick}),(0,R.jsx)(T,{name:`strikethrough`,icon:ut,title:dn,onClick,isActive:e,role:`menuitemcheckbox`})]})}}})))()}var z,pn,mn,hn;function init_underline(){return(init_underline=e((()=>{x(),d(),y(),z=r(),pn=`core/underline`,mn=b(`Underline`),hn={name:pn,title:mn,tagName:`span`,className:null,attributes:{style:`style`},edit({value:e,onChange:t}){let onToggle=()=>{t(m(e,{type:pn,attributes:{style:`text-decoration: underline;`},title:mn}))};return(0,z.jsxs)(z.Fragment,{children:[(0,z.jsx)(w,{type:`primary`,character:`u`,onUse:onToggle}),(0,z.jsx)(Rt,{inputType:`formatUnderline`,onInput:onToggle})]})}}})))()}function parseCSS(e=``){return e.split(`;`).reduce((e,t)=>{if(t){let[n,r]=t.split(`:`);n===`color`&&(e.color=r),n===`background-color`&&r!==`rgba(0, 0, 0, 0)`&&(e.backgroundColor=r)}return e},{})}function parseClassName(e=``,t){return e.split(` `).reduce((e,n)=>{if(n.startsWith(`has-`)&&n.endsWith(`-color`)){let r=n.replace(/^has-/,``).replace(/-color$/,``);e.color=ge(t,r).color}return e},{})}function getActiveColors(e,t,n){let r=ie(e,t);return r?{...parseCSS(r.attributes?.style),...parseClassName(r.attributes?.class,n)}:{}}function setColors(e,t,n,r){let{color:i,backgroundColor:a}={...getActiveColors(e,t,n),...r};if(!i&&!a)return h(e,t);let o=[],s=[],c={};if(a?o.push([`background-color`,a].join(`:`)):o.push([`background-color`,_n].join(`:`)),i){let e=de(n,i);if(e&&e.slug){let t=Ee(`color`,e.slug);t&&s.push(t)}else o.push([`color`,i].join(`:`))}return o.length&&(c.style=o.join(`;`)),s.length&&(c.class=s.join(` `)),u(e,{type:t,attributes:c})}function ColorPicker({name:e,property:t,value:n,onChange:r}){let i=Ae(e=>{let{getSettings:t}=e(oe);return t().colors??[]},[]),o=(0,a.useMemo)(()=>getActiveColors(n,e,i),[e,n,i]);return(0,B.jsx)(ve,{value:o[t],onChange:a=>{r(setColors(n,e,i,{[t]:a}))},enableAlpha:!0,__experimentalIsRenderedInSidebar:!0})}function InlineColorUI({name:e,value:t,onChange:n,onClose:r,contentRef:i,isActive:a}){let o={...bn,isActive:a},s=g({editableContentElement:i.current,settings:o});return(0,B.jsx)(D,{onClose:r,className:`format-library__inline-color-popover`,anchor:s,children:(0,B.jsxs)(xt,{defaultValue:gn[0].name,children:[(0,B.jsx)(St,{children:gn.map(e=>(0,B.jsx)(Ct,{value:e.name,children:e.title},e.name))}),gn.map(r=>(0,B.jsx)(gt,{value:r.name,tabIndex:-1,children:(0,B.jsx)(ColorPicker,{name:e,property:r.name,value:t,onChange:n})},r.name))]})})}var B,gn;function init_inline$1(){return(init_inline$1=e((()=>{i(),Me(),d(),y(),E(),vt(),_t(),yt(),bt(),x(),init_text_color(),B=r(),gn=[{name:`color`,title:b(`Text`)},{name:`backgroundColor`,title:b(`Background`)}]})))()}function getComputedStyleProperty(e,t){let{ownerDocument:n}=e,{defaultView:r}=n,i=(r?.getComputedStyle(e))?.getPropertyValue(t);return t===`background-color`&&i===`rgba(0, 0, 0, 0)`&&e.parentElement?getComputedStyleProperty(e.parentElement,t):i}function fillComputedColors(e,{color:t,backgroundColor:n}){if(e&&(t||n))return{color:t||getComputedStyleProperty(e,`color`),backgroundColor:n===`rgba(0, 0, 0, 0)`?getComputedStyleProperty(e,`background-color`):n}}function TextColorEdit({value:e,onChange:t,isActive:n,activeAttributes:r,contentRef:i}){let[o,s=yn]=Gt(`color.custom`,`color.palette`),[c,l]=(0,a.useState)(!1),u=(0,a.useMemo)(()=>fillComputedColors(i.current,getActiveColors(e,H,s)),[i,e,s]),d=!!s.length||o;return!d&&!n?null:(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)(T,{name:`text-color`,className:`format-library-text-color-button`,isActive:n,icon:(0,V.jsx)(et,{icon:Object.keys(r).length?rt:st,style:u}),title:vn,onClick:d?()=>l(!0):()=>t(h(e,H)),role:`menuitemcheckbox`}),c&&(0,V.jsx)(InlineColorUI,{name:H,onClose:()=>l(!1),value:e,onChange:t,contentRef:i,isActive:n})]})}var V,_n,H,vn,yn,bn;function init_text_color(){return(init_text_color=e((()=>{x(),i(),y(),S(),d(),init_inline$1(),V=r(),_n=`rgba(0, 0, 0, 0)`,H=`core/text-color`,vn=b(`Highlight`),yn=[],bn={name:H,title:vn,tagName:`mark`,className:`has-inline-color`,attributes:{style:`style`,class:`class`},edit:TextColorEdit}})))()}var xn,Sn,Cn,wn;function init_subscript(){return(init_subscript=e((()=>{x(),d(),y(),S(),xn=r(),Sn=`core/subscript`,Cn=b(`Subscript`),wn={name:Sn,title:Cn,tagName:`sub`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r}){function onToggle(){n(m(t,{type:Sn,title:Cn}))}function onClick(){onToggle(),r()}return(0,xn.jsx)(T,{name:`subscript`,icon:Xe,title:Cn,onClick,isActive:e,role:`menuitemcheckbox`})}}})))()}var Tn,En,Dn,On;function init_superscript(){return(init_superscript=e((()=>{x(),d(),y(),S(),Tn=r(),En=`core/superscript`,Dn=b(`Superscript`),On={name:En,title:Dn,tagName:`sup`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r}){function onToggle(){n(m(t,{type:En,title:Dn}))}function onClick(){onToggle(),r()}return(0,Tn.jsx)(T,{name:`superscript`,icon:lt,title:Dn,onClick,isActive:e,role:`menuitemcheckbox`})}}})))()}var kn,An,jn,Mn;function init_keyboard(){return(init_keyboard=e((()=>{x(),d(),y(),S(),kn=r(),An=`core/keyboard`,jn=b(`Keyboard input`),Mn={name:An,title:jn,tagName:`kbd`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r}){function onToggle(){n(m(t,{type:An,title:jn}))}function onClick(){onToggle(),r()}return(0,kn.jsx)(T,{name:`keyboard`,icon:it,title:jn,onClick,isActive:e,role:`menuitemcheckbox`})}}})))()}function selectionContainsUnknownFormats(e){return!ne(e)&&v(e).formats.some(e=>e.some(e=>e.type===Pn))}var Nn,Pn,Fn,In;function init_unknown(){return(init_unknown=e((()=>{x(),d(),y(),S(),Nn=r(),Pn=`core/unknown`,Fn=b(`Clear Unknown Formatting`),In={name:Pn,title:Fn,tagName:`*`,className:null,edit({isActive:e,value:t,onChange:n,onFocus:r}){if(!e&&!selectionContainsUnknownFormats(t))return null;function onClick(){n(h(t,Pn)),r()}return(0,Nn.jsx)(T,{name:`unknown`,icon:$e,title:Fn,onClick,isActive:!0})}}})))()}function Edit$1({isActive:e,value:t,onChange:n,contentRef:r}){let[i,o]=(0,a.useState)(!1),togglePopover=()=>{o(e=>!e)};return(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)(T,{name:`language`,icon:ot,label:W,title:W,onClick:()=>{e?n(h(t,Ln)):togglePopover()},isActive:e,role:`menuitemcheckbox`}),i&&(0,U.jsx)(InlineLanguageUI,{value:t,onChange:n,onClose:togglePopover,contentRef:r})]})}function InlineLanguageUI({value:e,contentRef:t,onChange:n,onClose:r}){let i=g({editableContentElement:t.current,settings:Rn}),[o,s]=(0,a.useState)(``),[c,l]=(0,a.useState)(`ltr`),d=[{label:b(`Left to right`),value:`ltr`},{label:b(`Right to left`),value:`rtl`}];return(0,U.jsx)(D,{className:`block-editor-format-toolbar__language-popover`,anchor:i,onClose:r,children:(0,U.jsxs)(C,{render:(0,U.jsx)(`form`,{}),direction:`column`,gap:`lg`,className:`block-editor-format-toolbar__language-container-content`,onSubmit:t=>{t.preventDefault(),n(u(e,{type:Ln,attributes:{lang:o,dir:c}})),r()},children:[(0,U.jsx)(pe,{label:W,value:o,onChange:e=>s(e),help:b(`A valid language attribute, like "en" or "fr".`)}),(0,U.jsx)(kt,{label:b(`Text direction`),value:d.find(e=>e.value===c)??null,items:d,onValueChange:e=>{(e?.value===`ltr`||e?.value===`rtl`)&&l(e.value)}}),(0,U.jsx)(C,{justify:`right`,children:(0,U.jsx)(Ft,{__next40pxDefaultSize:!0,variant:`primary`,type:`submit`,text:b(`Apply`)})})]})})}var U,Ln,W,Rn;function init_language(){return(init_language=e((()=>{x(),y(),Pt(),E(),Se(),Ot(),ht(),i(),d(),S(),U=r(),Ln=`core/language`,W=b(`Language`),Rn={name:Ln,title:W,tagName:`bdo`,className:null,attributes:{lang:`lang`,dir:`dir`},edit:Edit$1}})))()}function InlineUI({value:e,onChange:t,activeObjectAttributes:n,contentRef:r,latexToMathML:i}){let[o,s]=(0,a.useState)(n[`data-latex`]||``),[c,l]=(0,a.useState)(null),u=g({editableContentElement:r.current,settings:Vn}),handleLatexChange=n=>{s(n);let r=``;if(n&&i)try{r=i(n,{displayMode:!1}),l(null)}catch(e){l(e instanceof Error?e.message:b(`Could not parse the LaTeX math syntax.`))}else l(null);if(e.start===void 0)return;let a=e.replacements.slice();a[e.start]={type:zn,attributes:{"data-latex":n},innerHTML:r},t({...e,replacements:a})};return(0,G.jsx)(D,{placement:`bottom-start`,offset:8,focusOnMount:!1,anchor:u,className:`block-editor-format-toolbar__math-popover`,children:(0,G.jsxs)(`form`,{style:{minWidth:`300px`,padding:`16px`},onSubmit:e=>e.preventDefault(),children:[(0,G.jsx)(Et,{label:b(`LaTeX math syntax`),value:o,customValidity:c?{type:`invalid`,message:c}:void 0,onValueChange:handleLatexChange,placeholder:b(`e.g., x^2, \\frac{a}{b}, \\sqrt{x}`),autoComplete:`off`,className:`block-editor-format-toolbar__math-input`}),(0,G.jsx)(mt,{openInNewTab:!0,className:`block-editor-format-toolbar__math-learn-more`,href:b(`https://wordpress.org/documentation/article/math-block/`),children:b(`Learn more about LaTeX syntax`)})]})})}function Edit({value:e,onChange:t,onFocus:r,isObjectActive:i,activeObjectAttributes:o,contentRef:s}){let[c,u]=(0,a.useState)();(0,a.useEffect)(()=>{n(()=>import(`./build-module-B4zMkCzl.js`).then(e=>{u(()=>e.default)}),[],import.meta.url)},[]);function onClick(){let n;if(i){let t=o[`data-latex`]||``;n=ae(e,t),n.start=n.end-t.length}else{let t=l(v(e)),r=``;if(t&&c)try{r=c(t,{displayMode:!1})}catch{}n=_(e,{type:zn,attributes:{"data-latex":t},innerHTML:r}),n.start=n.end-1}t(n),r()}return(0,G.jsxs)(G.Fragment,{children:[(0,G.jsx)(T,{name:`math`,icon:Je,title:Bn,onClick,isActive:i}),i&&(0,G.jsx)(InlineUI,{value:e,onChange:t,activeObjectAttributes:o,contentRef:s,latexToMathML:c})]})}var G,zn,Bn,Vn;function init_math(){return(init_math=e((()=>{x(),i(),d(),y(),E(),pt(),Tt(),S(),G=r(),t(),zn=`core/math`,Bn=b(`Math`),Vn={name:zn,title:Bn,tagName:`math`,className:null,attributes:{"data-latex":`data-latex`},contentEditable:!1,edit:Edit}})))()}function getNonBreakingSpaceRange({text:e,start:t,end:n}){if(t===void 0||n===void 0)return null;let r=t===n?Math.max(t-1,0):t,i=t===n?n+1:n;return e.slice(r,i).includes(q)?[r,i]:null}function PopoverAnchor({contentRef:e}){let t=g({editableContentElement:e.current,settings:Gn});return(0,K.jsx)(D,{anchor:t,children:(0,K.jsx)(`div`,{style:{whiteSpace:`nowrap`,padding:`4px`},children:b(`Non-breaking space`)})})}var K,Hn,Un,q,Wn,Gn;function init_non_breaking_space(){return(init_non_breaking_space=e((()=>{x(),d(),y(),Ve(),E(),K=r(),Hn=`core/non-breaking-space`,Un=b(`Non breaking space`),q=`\xA0`,Wn=(0,K.jsx)(Be,{xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 24 24`,children:(0,K.jsx)(He,{d:`M4.5 9.5H6V14h12V9.5h1.5v6h-15z`})}),Gn={name:Hn,title:Un,tagName:`span`,className:`non-breaking-space`,edit({value:e,onChange:t,onFocus:n,contentRef:r}){function addNonBreakingSpace(){t(ae(e,q))}let i=getNonBreakingSpaceRange(e),a=(i?e.text.slice(i[0],i[1]):``).split(q).length-1;function replaceNonBreakingSpaces(){if(!i)return;let[r,a]=i,{text:o}=e;t({...e,text:o.slice(0,r)+o.slice(r,a).replaceAll(q,` `)+o.slice(a)}),n()}let o=e.start&&e.end?e.text.slice(e.start,e.end):null;return(0,K.jsxs)(K.Fragment,{children:[(0,K.jsx)(w,{type:`primaryShift`,character:` `,onUse:addNonBreakingSpace}),i&&(0,K.jsx)(T,{name:`non-breaking-space`,icon:Wn,title:b(a===1?`Replace non-breaking space`:`Replace non-breaking spaces`),onClick:replaceNonBreakingSpaces,isActive:!0}),o===q&&(0,K.jsx)(PopoverAnchor,{contentRef:r})]})},__experimentalCreatePrepareEditableTree(){return(e,t)=>{let n={formats:e,text:t},r=-1;do r=t.indexOf(q,r+1),r!==-1&&(n=u(n,{type:Hn},r,r+1));while(r!==-1);return n.formats}}}})))()}var Kn;function init_default_formats(){return(init_default_formats=e((()=>{init_bold(),init_code(),init_image(),init_italic(),init_link(),init_strikethrough(),init_underline(),init_text_color(),init_subscript(),init_superscript(),init_keyboard(),init_unknown(),init_language(),init_math(),init_non_breaking_space(),Kn=[Xt,$t,rn,on,ln,fn,hn,bn,wn,On,Mn,In,Rn,Vn,Gn]})))()}function init_build_module(){return(init_build_module=e((()=>{d(),init_default_formats(),Kn.forEach(({name:e,...t})=>se(e,t))})))()}var qn;function init_style_lazy(){return(init_style_lazy=e((()=>{qn=`:root{box-sizing:border-box}:root *,:root :before,:root :after{box-sizing:inherit}html,body{margin:0;padding:0;font-family:-apple-system,system-ui,Segoe UI,Roboto,Oxygen-Sans,Ubuntu,Cantarell,Helvetica Neue,sans-serif;font-size:13px}a,div{outline:0}.playground img{max-width:100%;height:auto}.playground iframe{width:100%}.playground__content{position:fixed;inset:0}@media (width>=600px){.playground__content{right:280px}}.playground__sidebar{-webkit-overflow-scrolling:touch;border-left:1px solid #ddd;width:280px;height:auto;display:none;position:fixed;top:0;bottom:0;right:0;overflow:auto}@media (width>=600px){.playground__sidebar{display:block}}`})))()}var Jn;function init_style(){return(init_style=e((()=>{Jn=`@charset "UTF-8";
/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
@media not (prefers-reduced-motion) {
  .components-animate__appear {
    animation: components-animate__appear-animation 0.1s cubic-bezier(0, 0, 0.2, 1) 0s;
    animation-fill-mode: forwards;
  }
}
.components-animate__appear.is-from-top, .components-animate__appear.is-from-top.is-from-left {
  transform-origin: top left;
}
.components-animate__appear.is-from-top.is-from-right {
  transform-origin: top right;
}
.components-animate__appear.is-from-bottom, .components-animate__appear.is-from-bottom.is-from-left {
  transform-origin: bottom left;
}
.components-animate__appear.is-from-bottom.is-from-right {
  transform-origin: bottom right;
}

@keyframes components-animate__appear-animation {
  from {
    transform: translateY(-2em) scaleY(0) scaleX(0);
  }
  to {
    transform: translateY(0%) scaleY(1) scaleX(1);
  }
}
@media not (prefers-reduced-motion) {
  .components-animate__slide-in {
    animation: components-animate__slide-in-animation 0.1s cubic-bezier(0, 0, 0.2, 1);
    animation-fill-mode: forwards;
  }
  .components-animate__slide-in.is-from-left {
    transform: translateX(100%);
  }
  .components-animate__slide-in.is-from-right {
    transform: translateX(-100%);
  }
}

@keyframes components-animate__slide-in-animation {
  100% {
    transform: translateX(0%);
  }
}
@media not (prefers-reduced-motion) {
  .components-animate__loading {
    animation: components-animate__loading 1.6s ease-in-out infinite;
  }
}

@keyframes components-animate__loading {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
.components-autocomplete__popover .components-popover__content {
  padding: 8px;
  min-width: 200px;
}

.components-autocomplete__result.components-button {
  display: flex;
  height: auto;
  min-height: 36px;
  text-align: left;
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-default, 400);
  position: relative;
}
.components-autocomplete__result.components-button:is(:focus, .is-selected):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black));
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff);
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-autocomplete__result.components-button:is(:focus, .is-selected):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
.components-autocomplete__result.components-button[aria-disabled=true]:is(:focus, .is-selected) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}

.components-badge {
  box-sizing: border-box;
}
.components-badge *,
.components-badge *::before,
.components-badge *::after {
  box-sizing: inherit;
}
.components-badge {
  background-color: color-mix(in srgb, #fff 90%, var(--base-color));
  color: color-mix(in srgb, #000 50%, var(--base-color));
  padding: 2px 8px;
  min-height: 24px;
  border-radius: 2px;
  line-height: 0;
  max-width: 100%;
  display: inline-block;
}
.components-badge:where(.is-default) {
  background-color: #f0f0f0;
  color: #2f2f2f;
}
.components-badge.has-icon {
  padding-inline-start: 4px;
}
.components-badge.is-info {
  --base-color: #3858e9;
}
.components-badge.is-warning {
  --base-color: #f0b849;
}
.components-badge.is-error {
  --base-color: #cc1818;
}
.components-badge.is-success {
  --base-color: #4ab866;
}

.components-badge__flex-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
}

.components-badge__icon {
  flex-shrink: 0;
}

.components-badge__content {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.components-button-group {
  display: inline-block;
}
.components-button-group .components-button {
  border-radius: 0;
  display: inline-flex;
  color: #1e1e1e;
  border-color: #1e1e1e;
}
.components-button-group .components-button + .components-button {
  margin-left: -1px;
}
.components-button-group .components-button:first-child {
  border-radius: 2px 0 0 2px;
}
.components-button-group .components-button:last-child {
  border-radius: 0 2px 2px 0;
}
.components-button-group .components-button:focus, .components-button-group .components-button.is-primary {
  position: relative;
  z-index: 1;
}

/**
 * For easier testing of potential regressions, you can use a Button variant matrix
 * available in a special Storybook instance by running \`npm run storybook:e2e:dev\`.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/test/storybook-playwright/README.md
 */
.components-button:focus:is(a) {
  box-shadow: none;
}
.components-button:focus {
  outline: none;
}
.components-button:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-button {
  display: inline-flex;
  text-decoration: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  margin: 0;
  cursor: var(--wpds-cursor-control, pointer);
  appearance: none;
  background: none;
  height: 36px;
  align-items: center;
  box-sizing: border-box;
  padding: 4px 12px;
  border-radius: 2px;
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  border: 1px solid transparent;
}
.components-button.is-next-40px-default-size {
  height: 40px;
}
.components-button[aria-expanded=true], .components-button:hover:not(:disabled, [aria-disabled=true], [role^=menuitem], [role=option]) {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button {
  /**
   * Primary button style.
   */
}
.components-button.is-primary {
  white-space: nowrap;
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
  text-decoration: none;
  text-shadow: none;
}
.components-button.is-primary:hover:not(:disabled) {
  background: var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #2145e6));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
}
.components-button.is-primary:active:not(:disabled) {
  background: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
}
.components-button.is-primary:disabled, .components-button.is-primary:disabled:active:enabled, .components-button.is-primary[aria-disabled=true], .components-button.is-primary[aria-disabled=true]:enabled, .components-button.is-primary[aria-disabled=true]:active:enabled {
  color: rgba(255, 255, 255, 0.4);
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button.is-primary.is-busy, .components-button.is-primary.is-busy:disabled, .components-button.is-primary.is-busy[aria-disabled=true] {
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
  background-size: 100px 100%;
  /* stylelint-disable -- Disable reason: This function call looks nicer when each argument is on its own line. */
  background-image: linear-gradient(-45deg, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 33%, var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6)) 33%, var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6)) 70%, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 70%);
  /* stylelint-enable */
}
.components-button {
  /**
   * Secondary and tertiary buttons.
   */
}
.components-button.is-secondary:disabled, .components-button.is-secondary[aria-disabled=true], .components-button.is-secondary[aria-disabled=true]:hover, .components-button.is-tertiary:disabled, .components-button.is-tertiary[aria-disabled=true], .components-button.is-tertiary[aria-disabled=true]:hover {
  color: #949494;
  background: transparent;
  transform: none;
}
.components-button {
  /**
   * Secondary button style.
   */
}
@media not (prefers-reduced-motion) {
  .components-button.is-secondary {
    transition: border-color 0.1s linear;
  }
}
.components-button.is-secondary {
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  white-space: nowrap;
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  background: transparent;
}
.components-button.is-secondary:active:not(:disabled) {
  border-color: transparent;
}
.components-button.is-secondary:hover:not(:disabled, [aria-disabled=true], .is-pressed) {
  border-color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent);
}
.components-button.is-secondary:focus:not(:active) {
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button.is-secondary:disabled:not(:focus), .components-button.is-secondary[aria-disabled=true]:not(:focus), .components-button.is-secondary[aria-disabled=true]:hover:not(:focus) {
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
}
.components-button {
  /**
   * Tertiary buttons.
   */
}
.components-button.is-tertiary {
  white-space: nowrap;
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  background: transparent;
}
.components-button.is-tertiary:hover:not(:disabled, [aria-disabled=true], .is-pressed) {
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent);
  color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
}
.components-button.is-tertiary:active:not(:disabled, [aria-disabled=true]) {
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 8%, transparent);
}
p + .components-button.is-tertiary {
  margin-left: -6px;
}
.components-button {
  /**
   * Destructive buttons.
   */
}
.components-button.is-destructive {
  --wp-components-color-accent: #cc1818;
  --wp-components-color-accent-darker-10: rgb(158.3684210526, 18.6315789474, 18.6315789474);
  --wp-components-color-accent-darker-20: rgb(112.7368421053, 13.2631578947, 13.2631578947);
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link) {
  color: #cc1818;
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):hover:not(:disabled, [aria-disabled=true]) {
  color: rgb(112.7368421053, 13.2631578947, 13.2631578947);
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):active:not(:disabled, [aria-disabled=true]) {
  background: #ccc;
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):disabled, .components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link)[aria-disabled=true] {
  color: #949494;
}
.components-button.is-destructive.is-tertiary:hover:not(:disabled, [aria-disabled=true]), .components-button.is-destructive.is-secondary:hover:not(:disabled, [aria-disabled=true]) {
  background: rgba(204, 24, 24, 0.04);
}
.components-button.is-destructive.is-tertiary:active:not(:disabled, [aria-disabled=true]), .components-button.is-destructive.is-secondary:active:not(:disabled, [aria-disabled=true]) {
  background: rgba(204, 24, 24, 0.08);
}
.components-button {
  /**
   * Link buttons.
   */
}
.components-button.is-link {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  outline: none;
  text-align: left;
  font-weight: var(--wpds-typography-font-weight-default, 400);
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: from-font;
}
@media not (prefers-reduced-motion) {
  .components-button.is-link {
    transition-property: border, background, color;
    transition-duration: 0.05s;
    transition-timing-function: ease-in-out;
  }
}
.components-button.is-link {
  height: auto;
}
.components-button.is-link:focus:not(:active) {
  border-radius: 2px;
  text-decoration: none;
}
.components-button.is-link:disabled, .components-button.is-link[aria-disabled=true] {
  color: #949494;
}
.components-button:not(:disabled, [aria-disabled=true]):active {
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-button:disabled, .components-button[aria-disabled=true] {
  cursor: default;
  color: #949494;
}
@media not (prefers-reduced-motion) {
  .components-button.is-busy, .components-button.is-secondary.is-busy, .components-button.is-secondary.is-busy:disabled, .components-button.is-secondary.is-busy[aria-disabled=true] {
    animation: components-button__busy-animation 2500ms infinite linear;
  }
}
.components-button.is-busy, .components-button.is-secondary.is-busy, .components-button.is-secondary.is-busy:disabled, .components-button.is-secondary.is-busy[aria-disabled=true] {
  background-size: 100px 100%;
  /* stylelint-disable -- Disable reason: This function call looks nicer when each argument is on its own line. */
  background-image: linear-gradient(-45deg, rgb(249.9, 249.9, 249.9) 33%, rgb(224.4, 224.4, 224.4) 33%, rgb(224.4, 224.4, 224.4) 70%, rgb(249.9, 249.9, 249.9) 70%);
  /* stylelint-enable */
}
.components-button.is-compact {
  height: 32px;
}
.components-button.is-compact.has-icon:not(.has-text) {
  padding: 0;
  min-width: 32px;
}
.components-button.is-small {
  height: var(--wpds-dimension-size-sm, 24px);
  line-height: 22px;
  padding: 0 8px;
  font-size: 11px;
}
.components-button.is-small.has-icon:not(.has-text) {
  padding: 0;
  min-width: var(--wpds-dimension-size-sm, 24px);
}
.components-button.has-icon {
  padding: 6px;
  min-width: 36px;
  justify-content: center;
}
.components-button.has-icon.is-next-40px-default-size {
  min-width: 40px;
}
.components-button.has-icon .dashicon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  box-sizing: content-box;
}
.components-button.has-icon.has-text {
  justify-content: start;
  padding-right: 12px;
  padding-left: 8px;
  gap: 4px;
}
.components-button.has-icon.has-text.has-icon-right {
  padding-right: 8px;
  padding-left: 12px;
}
.components-button.has-icon:not(.has-text) svg,
.components-button.has-icon:not(.has-text) .dashicon {
  margin-inline: -1px;
}
.components-button.is-pressed, .components-button.is-pressed:hover {
  color: var(--wp-components-color-foreground-inverted, var(--wpds-color-background-surface-neutral, #fcfcfc));
}
.components-button.is-pressed:not(:disabled, [aria-disabled=true]), .components-button.is-pressed:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-button.is-pressed:disabled, .components-button.is-pressed[aria-disabled=true] {
  color: #949494;
}
.components-button.is-pressed:disabled:not(.is-primary):not(.is-secondary):not(.is-tertiary), .components-button.is-pressed[aria-disabled=true]:not(.is-primary):not(.is-secondary):not(.is-tertiary) {
  color: var(--wp-components-color-foreground-inverted, var(--wpds-color-background-surface-neutral, #fcfcfc));
  background: #949494;
}
.components-button svg {
  fill: currentColor;
  outline: none;
  flex-shrink: 0;
}

@keyframes components-button__busy-animation {
  0% {
    background-position: 200px 0;
  }
}
.components-checkbox-control {
  --checkbox-input-size: 16px;
  --checkbox-input-margin: 8px;
}

.components-checkbox-control__label {
  line-height: var(--checkbox-input-size);
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-checkbox-control:not(:has(:disabled)) .components-checkbox-control__label {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-checkbox-control__input[type=checkbox] {
  transition: none;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-checkbox-control__input[type=checkbox] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-checkbox-control__input[type=checkbox]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-checkbox-control__input[type=checkbox]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-checkbox-control__input[type=checkbox]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-checkbox-control__input[type=checkbox]:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--wpds-color-background-interactive-neutral-active, #fff);
}
.components-checkbox-control__input[type=checkbox]:checked::before, .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
  margin: -3px -5px;
  color: #fff;
}
@media (min-width: 782px) {
  .components-checkbox-control__input[type=checkbox]:checked::before, .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
    margin: -4px 0 0 -5px;
  }
}
.components-checkbox-control__input[type=checkbox][aria-checked=mixed] {
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
  content: "\\f460";
  float: left;
  display: inline-block;
  vertical-align: middle;
  width: 16px;
  /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword -- dashicons don't need a generic family keyword. */
  font: 400 30px/1 dashicons;
  speak: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@media (min-width: 782px) {
  .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
    float: none;
    font-size: 21px;
  }
}
.components-checkbox-control__input[type=checkbox][aria-disabled=true], .components-checkbox-control__input[type=checkbox]:disabled {
  background: var(--wpds-color-background-interactive-neutral-disabled, #fff);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  cursor: default;
  opacity: 1;
}
.components-checkbox-control__input[type=checkbox][aria-disabled=true]:checked::before, .components-checkbox-control__input[type=checkbox][aria-disabled=true][aria-checked=mixed]::before, .components-checkbox-control__input[type=checkbox]:disabled:checked::before, .components-checkbox-control__input[type=checkbox]:disabled[aria-checked=mixed]::before {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-checkbox-control__input[type=checkbox] {
  background: #fff;
  color: #1e1e1e;
  clear: none;
  display: inline-block;
  line-height: 0;
  margin: 0 4px 0 0;
  outline: 0;
  padding: 0 !important;
  text-align: center;
  vertical-align: top;
  position: relative;
  width: var(--checkbox-input-size);
  height: var(--checkbox-input-size);
  appearance: none;
}
@media not (prefers-reduced-motion) {
  .components-checkbox-control__input[type=checkbox] {
    transition: 0.1s border-color ease-in-out;
  }
}
.components-checkbox-control__input[type=checkbox]:not(:disabled):is(:checked, :indeterminate) {
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-checkbox-control__input[type=checkbox]:not(:disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-checkbox-control__input[type=checkbox]:checked::before {
  content: none;
}
.components-checkbox-control__input[type=checkbox]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: max(var(--checkbox-input-size), 24px);
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

.components-checkbox-control__input-container {
  position: relative;
  display: inline-block;
  margin-right: var(--checkbox-input-margin);
  vertical-align: middle;
  width: var(--checkbox-input-size);
  aspect-ratio: 1;
  line-height: 1;
  flex-shrink: 0;
}

svg.components-checkbox-control__checked,
svg.components-checkbox-control__indeterminate {
  color: #fff;
  cursor: var(--wpds-cursor-control, pointer);
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: var(--checkbox-input-size);
  height: var(--checkbox-input-size);
  -webkit-user-select: none;
          user-select: none;
  pointer-events: none;
}

.components-checkbox-control:has(:disabled) svg.components-checkbox-control__checked,
.components-checkbox-control:has(:disabled) svg.components-checkbox-control__indeterminate {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}

.components-checkbox-control__help {
  display: inline-block;
  margin-inline-start: calc(var(--checkbox-input-size) + var(--checkbox-input-margin));
}

.components-circular-option-picker {
  display: inline-block;
  width: 100%;
  min-width: 188px;
  isolation: isolate;
}
.components-circular-option-picker .components-circular-option-picker__custom-clear-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.components-circular-option-picker .components-circular-option-picker__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.components-circular-option-picker > *:not(.components-circular-option-picker__swatches) {
  position: relative;
  z-index: 0;
}

.components-circular-option-picker__option-wrapper {
  display: inline-block;
  height: 28px;
  width: 28px;
  vertical-align: top;
  transform: scale(1);
}
@media not (prefers-reduced-motion) {
  .components-circular-option-picker__option-wrapper {
    transition: 100ms transform ease-out;
    will-change: transform;
  }
}
.components-circular-option-picker__option-wrapper:hover {
  transform: scale(1.1);
}
.components-circular-option-picker__option-wrapper > div {
  height: 100%;
  width: 100%;
}

.components-circular-option-picker__option-wrapper::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 50%;
  z-index: -1;
  background: url('data:image/svg+xml,%3Csvg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M6 8V6H4v2h2zM8 8V6h2v2H8zM10 16H8v-2h2v2zM12 16v-2h2v2h-2zM12 18v-2h-2v2H8v2h2v-2h2zM14 18v2h-2v-2h2zM16 18h-2v-2h2v2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M18 18h2v-2h-2v-2h2v-2h-2v-2h2V8h-2v2h-2V8h-2v2h2v2h-2v2h2v2h2v2zm-2-4v-2h2v2h-2z" fill="%23555D65"/%3E%3Cpath d="M18 18v2h-2v-2h2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M8 10V8H6v2H4v2h2v2H4v2h2v2H4v2h2v2H4v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2v2h-2V4h-2v2h-2V4h-2v2h-2V4h-2v2h2v2h-2v2H8zm0 2v-2H6v2h2zm2 0v-2h2v2h-2zm0 2v-2H8v2H6v2h2v2H6v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h-2v2h-2V6h-2v2h-2v2h2v2h-2v2h-2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M4 0H2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h2V0h-2v2h-2V0h-2v2h-2V0h-2v2h-2V0h-2v2h-2V0h-2v2H8V0H6v2H4V0zm0 4V2H2v2h2zm2 0V2h2v2H6zm0 2V4H4v2H2v2h2v2H2v2h2v2H2v2h2v2H2v2h2v2H2v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h-2v2h-2V2h-2v2h-2V2h-2v2h-2V2h-2v2H8v2H6z" fill="%23555D65"/%3E%3C/svg%3E');
}

.components-circular-option-picker__option {
  display: inline-block;
  vertical-align: top;
  height: 100% !important;
  aspect-ratio: 1;
  border: none;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset 0 0 0 14px;
}
@media not (prefers-reduced-motion) {
  .components-circular-option-picker__option {
    transition: 100ms box-shadow ease;
  }
}
.components-circular-option-picker__option {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-circular-option-picker__option[aria-pressed=true], .components-circular-option-picker__option[aria-selected=true] {
  position: relative;
  z-index: 1;
  overflow: visible;
}
.components-circular-option-picker__option[aria-pressed=true] + svg, .components-circular-option-picker__option[aria-selected=true] + svg {
  position: absolute;
  left: 2px;
  top: 2px;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none;
}
.components-circular-option-picker__option::after {
  content: "";
  position: absolute;
  inset: -1px;
  border: 1px solid transparent;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.components-circular-option-picker__button-action .components-circular-option-picker__option {
  color: #fff;
  background: #fff;
}

.components-circular-option-picker__dropdown-link-action {
  margin-right: 16px;
}
.components-circular-option-picker__dropdown-link-action .components-button {
  line-height: 22px;
}

.components-palette-edit__popover-gradient-picker,
.components-palette-edit__popover-duotone-picker {
  width: 260px;
  padding: 8px;
}

.component-color-indicator {
  width: 20px;
  height: 20px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: inline-block;
  padding: 0;
  background: #fff linear-gradient(-45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
}

.components-combobox-control {
  width: 100%;
}

input.components-combobox-control__input[type=text] {
  width: 100%;
  border: none;
  box-shadow: none;
  font-family: inherit;
  font-size: 16px;
  padding: 2px;
  margin: 0;
  line-height: inherit;
  min-height: auto;
  background: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
@media (min-width: 600px) {
  input.components-combobox-control__input[type=text] {
    font-size: 13px;
  }
}
input.components-combobox-control__input[type=text]:focus {
  outline: none;
  box-shadow: none;
}

.components-combobox-control__suggestions-container {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-combobox-control__suggestions-container {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-combobox-control__suggestions-container:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-combobox-control__suggestions-container:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-combobox-control__suggestions-container::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-combobox-control__suggestions-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
  padding: 0;
}
.components-combobox-control__suggestions-container:focus-within {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-combobox-control__suggestions-container .components-spinner {
  margin: 0;
}

.components-color-palette__custom-color-wrapper {
  position: relative;
  z-index: 0;
}

.components-color-palette__custom-color-button {
  position: relative;
  border: none;
  background: none;
  height: 64px;
  width: 100%;
  box-sizing: border-box;
  cursor: var(--wpds-cursor-control, pointer);
  outline: 1px solid transparent;
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}
.components-color-palette__custom-color-button:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-color-palette__custom-color-button::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: 3px 3px 0 0;
  /*rtl:begin:ignore*/
  background-image: repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
  background-position: 0 0, 24px 24px;
  /*rtl:end:ignore*/
  background-size: 48px 48px;
}

.components-color-palette__custom-color-text-wrapper {
  padding: 12px 16px;
  border-radius: 0 0 4px 4px;
  position: relative;
  font-size: 13px;
  box-shadow: inset 0 -1px 0 0 rgba(0, 0, 0, 0.2), inset 1px 0 0 0 rgba(0, 0, 0, 0.2), inset -1px 0 0 0 rgba(0, 0, 0, 0.2);
}

.components-color-palette__custom-color-name {
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  margin: 0 1px;
}

.components-color-palette__custom-color-value {
  color: #757575;
}
.components-color-palette__custom-color-value--is-hex {
  text-transform: uppercase;
}
.components-color-palette__custom-color-value:empty::after {
  content: "​";
  visibility: hidden;
}

.components-custom-gradient-picker__gradient-bar {
  border-radius: 2px;
  width: 100%;
  height: 48px;
  position: relative;
  z-index: 1;
}
.components-custom-gradient-picker__gradient-bar.has-gradient {
  /*rtl:begin:ignore*/
  background-image: repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
  background-position: 0 0, 12px 12px;
  /*rtl:end:ignore*/
  background-size: 24px 24px;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__gradient-bar-background {
  position: absolute;
  inset: 0;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__markers-container {
  position: relative;
  width: calc(100% - 48px);
  margin-left: auto;
  margin-right: auto;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-dropdown {
  position: absolute;
  height: 16px;
  width: 16px;
  top: 16px;
  display: flex;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown::before,
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button::before {
  content: "";
  position: absolute;
  inset: -16px 0;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown {
  height: inherit;
  width: inherit;
  min-width: 16px !important;
  border-radius: 50%;
  background: #fff;
  padding: 2px;
  color: #1e1e1e;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown svg {
  height: 100%;
  width: 100%;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button {
  height: inherit;
  width: inherit;
  border-radius: 50%;
  padding: 0;
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button.is-active {
  box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus) * 2) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button:focus:not(:active) {
  outline-offset: 1px;
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25), 0 0 0 calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) + 2px) var(--wpds-color-background-surface-neutral-strong, #fff);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button:focus:not(:active).is-active {
  box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus) * 2) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25), 0 0 0 calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) + 2px) var(--wpds-color-background-surface-neutral-strong, #fff);
}

.components-custom-gradient-picker__remove-control-point-wrapper {
  padding-bottom: 8px;
}

.components-custom-gradient-picker__inserter {
  /*rtl:ignore*/
  direction: ltr;
}

.components-custom-gradient-picker__liner-gradient-indicator {
  display: inline-block;
  flex: 0 auto;
  width: 20px;
  height: 20px;
}

.components-custom-gradient-picker__ui-line {
  position: relative;
  z-index: 0;
}

.components-drop-zone {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 40;
  visibility: hidden;
  opacity: 0;
  border-radius: 2px;
}
.components-drop-zone.is-active {
  opacity: 1;
  visibility: visible;
}
.components-drop-zone .components-drop-zone__content {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  width: 100%;
  display: flex;
  background-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  align-items: center;
  justify-content: center;
  z-index: 50;
  text-align: center;
  color: #fff;
  opacity: 0;
  pointer-events: none;
}
.components-drop-zone .components-drop-zone__content-inner {
  opacity: 0;
  transform: scale(0.9);
}
.components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content {
  opacity: 1;
}
@media not (prefers-reduced-motion) {
  .components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content {
    transition: opacity 0.2s ease-in-out;
  }
}
.components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content-inner {
  opacity: 1;
  transform: scale(1);
}
@media not (prefers-reduced-motion) {
  .components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content-inner {
    transition: opacity 0.1s ease-in-out 0.1s, transform 0.1s ease-in-out 0.1s;
  }
}

.components-drop-zone__content-icon,
.components-drop-zone__content-text {
  display: block;
}

.components-drop-zone__content-icon {
  margin: 0 auto 8px;
  line-height: 0;
  fill: currentColor;
  pointer-events: none;
}

.components-drop-zone__content-text {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-dropdown {
  display: inline-block;
}

.components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black)) !important;
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight !important;
    color: HighlightText !important;
  }
}
.components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed) !important;
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
    outline: var(--wpds-border-width-xs, 1px) solid GrayText;
    outline-offset: 0;
  }
}
.components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-dropdown__content .components-popover__content {
  padding: 8px;
}
.components-dropdown__content .components-popover__content:has(.components-menu-group) {
  padding: 0;
}
.components-dropdown__content .components-popover__content:has(.components-menu-group) .components-dropdown-menu__menu > .components-menu-item__button,
.components-dropdown__content .components-popover__content:has(.components-menu-group) > .components-menu-item__button {
  margin: 8px;
  width: auto;
}
.components-dropdown__content [role=menuitem] {
  white-space: nowrap;
}
.components-dropdown__content .components-menu-group {
  padding: 8px;
}
.components-dropdown__content .components-menu-group + .components-menu-group {
  border-top: 1px solid #ccc;
  padding: 8px;
}
.components-dropdown__content.is-alternate .components-menu-group + .components-menu-group {
  border-color: #1e1e1e;
}

.components-dropdown-menu__toggle {
  vertical-align: top;
}

.components-dropdown-menu__menu {
  width: 100%;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  line-height: 1.4;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item,
.components-dropdown-menu__menu .components-menu-item {
  width: 100%;
  padding: 6px;
  outline: none;
  cursor: var(--wpds-cursor-control, pointer);
  white-space: nowrap;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.has-separator,
.components-dropdown-menu__menu .components-menu-item.has-separator {
  margin-top: 6px;
  position: relative;
  overflow: visible;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.has-separator::before,
.components-dropdown-menu__menu .components-menu-item.has-separator::before {
  display: block;
  content: "";
  box-sizing: content-box;
  background-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  position: absolute;
  top: -3px;
  left: 0;
  right: 0;
  height: 1px;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-active svg,
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-active .dashicon,
.components-dropdown-menu__menu .components-menu-item.is-active svg,
.components-dropdown-menu__menu .components-menu-item.is-active .dashicon {
  color: #fff;
  background: #1e1e1e;
  box-shadow: 0 0 0 1px #1e1e1e;
  border-radius: 1px;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-icon-only,
.components-dropdown-menu__menu .components-menu-item.is-icon-only {
  width: auto;
}
.components-dropdown-menu__menu .components-menu-item__button,
.components-dropdown-menu__menu .components-menu-item__button.components-button {
  min-height: 32px;
  height: auto;
  text-align: left;
  padding-left: 8px;
  padding-right: 8px;
  padding-top: 3px;
  padding-bottom: 3px;
}
.components-dropdown-menu__menu .components-menu-item__button.has-icon,
.components-dropdown-menu__menu .components-menu-item__button.components-button.has-icon {
  padding-top: 5px;
  padding-bottom: 5px;
}

.components-duotone-picker__color-indicator::before {
  background: transparent;
}

.components-duotone-picker__color-indicator > .components-button {
  background: linear-gradient(-45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button.is-pressed:hover:not(:disabled) {
  background: linear-gradient(-45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button:hover:not(:disabled):not([aria-disabled=true]) {
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button:not([aria-disabled=true]):active {
  color: transparent;
}

.components-color-list-picker,
.components-color-list-picker__swatch-button {
  width: 100%;
}

.components-color-list-picker__color-picker {
  margin: 8px 0;
}

.components-color-list-picker__swatch-color {
  margin: 2px;
}

.components-external-link {
  border-radius: var(--wpds-border-radius-sm, 2px);
  color: var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9));
  text-decoration: none;
}
.components-external-link:visited {
  color: var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9));
}
.components-external-link:hover, .components-external-link:active {
  color: var(--wpds-color-foreground-interactive-brand-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 52%, black));
}
.components-external-link:focus {
  box-shadow: none;
  border-radius: var(--wpds-border-radius-sm, 2px);
}
.components-external-link:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}

.components-external-link__contents {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: from-font;
}

.components-external-link__icon {
  line-height: 1;
  display: inline-block;
  margin-inline-start: var(--wpds-dimension-padding-xs, 4px);
  font-weight: var(--wpds-typography-font-weight-default, 400);
}

.components-form-toggle {
  position: relative;
  isolation: isolate;
  display: inline-block;
  height: 16px;
}
.components-form-toggle .components-form-toggle__track {
  content: "";
  display: inline-block;
  box-sizing: border-box;
  vertical-align: top;
  background-color: var(--wpds-color-background-interactive-neutral-weak, #0000);
  border: 1px solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  width: 32px;
  height: 16px;
  border-radius: 8px;
}
@media not (prefers-reduced-motion) {
  .components-form-toggle .components-form-toggle__track {
    transition: 0.2s background-color ease, 0.2s border-color ease;
  }
}
.components-form-toggle .components-form-toggle__thumb {
  display: block;
  position: absolute;
  box-sizing: border-box;
  top: 2px;
  left: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
@media not (prefers-reduced-motion) {
  .components-form-toggle .components-form-toggle__thumb {
    transition: 0.2s transform ease, 0.2s background-color ease-out;
  }
}
.components-form-toggle .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02), 0 3px 3px rgba(0, 0, 0, 0.02), 0 4px 4px rgba(0, 0, 0, 0.01);
  border: 6px solid transparent;
}
@media (forced-colors: active) {
  .components-form-toggle .components-form-toggle__thumb {
    background-color: ButtonText;
  }
}
.components-form-toggle:not(.is-checked, .is-disabled):hover .components-form-toggle__track {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-form-toggle.is-checked .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9));
  border-color: transparent;
}
@media (forced-colors: active) {
  .components-form-toggle.is-checked .components-form-toggle__track {
    background-color: Highlight;
  }
}
.components-form-toggle .components-form-toggle__input:focus + .components-form-toggle__track {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-form-toggle.is-checked .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-brand-strong, #fff);
  border-width: 0;
  transform: translateX(16px);
}
@media (forced-colors: active) {
  .components-form-toggle.is-checked .components-form-toggle__thumb {
    background-color: HighlightText;
  }
}
.components-form-toggle.is-disabled .components-form-toggle__track, [inert] .components-form-toggle .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled .components-form-toggle__track, [inert] .components-form-toggle .components-form-toggle__track {
    border-color: GrayText;
  }
}
.components-form-toggle.is-disabled .components-form-toggle__thumb, [inert] .components-form-toggle .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled .components-form-toggle__thumb, [inert] .components-form-toggle .components-form-toggle__thumb {
    background-color: GrayText;
    border-color: GrayText;
  }
}
.components-form-toggle.is-disabled.is-checked .components-form-toggle__track, [inert] .components-form-toggle.is-checked .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-brand-strong-disabled, #e6e6e6);
  border-color: transparent;
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled.is-checked .components-form-toggle__track, [inert] .components-form-toggle.is-checked .components-form-toggle__track {
    background-color: GrayText;
  }
}
.components-form-toggle.is-disabled.is-checked .components-form-toggle__thumb, [inert] .components-form-toggle.is-checked .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-brand-strong-disabled, #8d8d8d);
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled.is-checked .components-form-toggle__thumb, [inert] .components-form-toggle.is-checked .components-form-toggle__thumb {
    background-color: Canvas;
  }
}

.components-form-toggle input.components-form-toggle__input[type=checkbox] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  margin: 0;
  padding: 0;
  z-index: 1;
  border: none;
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]:checked {
  background: none;
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]::before {
  content: "";
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]:not(:disabled, [aria-disabled=true]) {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-form-token-field__input-container {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-form-token-field__input-container {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-form-token-field__input-container:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-form-token-field__input-container:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-form-token-field__input-container::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-form-token-field__input-container {
  width: 100%;
  padding: 0;
  cursor: text;
}
.components-form-token-field__input-container.is-disabled {
  background: var(--wp-components-color-gray-100, var(--wpds-color-background-surface-neutral, #fcfcfc));
  border-color: var(--wp-components-color-gray-400, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
  cursor: default;
}
.components-form-token-field__input-container.is-disabled:hover {
  border-color: var(--wp-components-color-gray-400, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
}
.components-form-token-field__input-container.is-active {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-form-token-field__input-container input[type=text].components-form-token-field__input {
  display: inline-block;
  flex: 1;
  font-family: inherit;
  font-size: 16px;
  line-height: 1;
  width: 100%;
  max-width: 100%;
  margin-left: 4px;
  padding: 0;
  min-height: 24px;
  min-width: 50px;
  background: inherit;
  border: 0;
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  box-shadow: none;
}
@media (min-width: 600px) {
  .components-form-token-field__input-container input[type=text].components-form-token-field__input {
    font-size: 13px;
  }
}
.components-form-token-field__input-container input[type=text].components-form-token-field__input:focus, .components-form-token-field.is-active .components-form-token-field__input-container input[type=text].components-form-token-field__input {
  outline: none;
  box-shadow: none;
}
.components-form-token-field__input-container .components-form-token-field__token + input[type=text].components-form-token-field__input {
  width: auto;
}

.components-form-token-field__token {
  font-size: 13px;
  display: flex;
  color: #1e1e1e;
  max-width: 100%;
}
.components-form-token-field__token.is-success .components-form-token-field__token-text,
.components-form-token-field__token.is-success .components-form-token-field__remove-token {
  background: #4ab866;
}
.components-form-token-field__token.is-error .components-form-token-field__token-text,
.components-form-token-field__token.is-error .components-form-token-field__remove-token {
  background: #cc1818;
}
.components-form-token-field__token.is-validating .components-form-token-field__token-text,
.components-form-token-field__token.is-validating .components-form-token-field__remove-token {
  color: #757575;
}
.components-form-token-field__token.is-disabled .components-form-token-field__token-text,
.components-form-token-field__token.is-disabled .components-form-token-field__remove-token.components-button {
  background: var(--wp-components-color-gray-100, var(--wpds-color-background-surface-neutral, #fcfcfc));
  color: var(--wp-components-color-gray-600, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
}
.components-form-token-field__token.is-borderless {
  position: relative;
  padding: 0 24px 0 0;
}
.components-form-token-field__token.is-borderless .components-form-token-field__token-text {
  background: transparent;
}
.components-form-token-field__token.is-borderless:not(.is-disabled) .components-form-token-field__token-text {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-form-token-field__token.is-borderless .components-form-token-field__remove-token {
  background: transparent;
  color: #757575;
  position: absolute;
  top: 1px;
  right: 0;
}
.components-form-token-field__token.is-borderless.is-success .components-form-token-field__token-text {
  color: #4ab866;
}
.components-form-token-field__token.is-borderless.is-error .components-form-token-field__token-text {
  color: #cc1818;
  padding: 0 4px 0 6px;
}
.components-form-token-field__token.is-borderless.is-validating .components-form-token-field__token-text {
  color: #1e1e1e;
}

.components-form-token-field__token-text,
.components-form-token-field__remove-token.components-button {
  display: inline-block;
  height: auto;
  background: #ddd;
  min-width: unset;
}
@media not (prefers-reduced-motion) {
  .components-form-token-field__token-text,
  .components-form-token-field__remove-token.components-button {
    transition: all 0.2s cubic-bezier(0.4, 1, 0.4, 1);
  }
}

.components-form-token-field__token-text {
  border-radius: 1px 0 0 1px;
  padding: 0 0 0 8px;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.components-form-token-field__remove-token.components-button {
  border-radius: 0 1px 1px 0;
  color: #1e1e1e;
  line-height: 10px;
  overflow: initial;
}
.components-form-token-field__remove-token.components-button:hover:not(:disabled) {
  color: #1e1e1e;
}

.components-form-token-field__suggestions-list {
  flex: 1 0 100%;
  min-width: 100%;
  max-height: 128px;
  overflow-y: auto;
}
@media not (prefers-reduced-motion) {
  .components-form-token-field__suggestions-list {
    transition: all 0.15s ease-in-out;
  }
}
.components-form-token-field__suggestions-list {
  list-style: none;
  box-shadow: inset 0 1px 0 0 #949494;
  margin: 0;
  padding: 0;
}

.components-form-token-field__suggestion {
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  display: block;
  font-size: 13px;
  padding: 8px 12px;
  min-height: 32px;
  margin: 0;
  box-sizing: border-box;
}
.components-form-token-field__suggestion.is-selected:not([aria-disabled=true], .is-empty) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black));
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff);
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-form-token-field__suggestion.is-selected:not([aria-disabled=true], .is-empty) {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
.components-form-token-field__suggestion[aria-disabled=true] {
  pointer-events: none;
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-form-token-field__suggestion[aria-disabled=true].is-selected {
  background: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}
.components-form-token-field__suggestion:not(.is-empty) {
  cursor: var(--wpds-cursor-control, pointer);
}

@media (min-width: 600px) {
  .components-guide {
    width: 600px;
  }
}
.components-guide .components-modal__content {
  padding: 0;
  margin-top: 0;
}
.components-guide .components-modal__content::before {
  content: none;
}
.components-guide .components-modal__header {
  border-bottom: none;
  padding: 0;
  position: sticky;
  height: 64px;
}
.components-guide .components-modal__header .components-button {
  align-self: flex-start;
  margin: 8px 8px 0 0;
  position: static;
}
.components-guide .components-guide__container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: -64px;
  min-height: 100%;
}
.components-guide .components-guide__page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
@media (min-width: 600px) {
  .components-guide .components-guide__page {
    min-height: 300px;
  }
}
.components-guide .components-guide__footer {
  align-content: center;
  display: flex;
  height: 36px;
  justify-content: center;
  margin: 0 0 24px 0;
  padding: 0 24px;
  position: relative;
  width: 100%;
}
.components-guide .components-guide__page-control {
  margin: 0;
  text-align: center;
}
.components-guide .components-guide__page-control li {
  display: inline-block;
  margin: 0;
}
.components-guide .components-guide__page-control .components-button {
  margin: -6px 0;
  color: #e0e0e0;
}
.components-guide .components-guide__page-control li[aria-current=step] .components-button {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}

.components-modal__frame.components-guide {
  border: none;
  min-width: 312px;
  max-height: 575px;
}
@media (max-width: 600px) {
  .components-modal__frame.components-guide {
    margin: auto;
    max-width: calc(100vw - 16px * 2);
  }
}

.components-button.components-guide__back-button, .components-button.components-guide__forward-button, .components-button.components-guide__finish-button {
  position: absolute;
}
.components-button.components-guide__back-button {
  left: 24px;
}
.components-button.components-guide__forward-button, .components-button.components-guide__finish-button {
  right: 24px;
}

[role=region] {
  position: relative;
}
[role=region].interface-interface-skeleton__content:focus-visible::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1000000;
}

.is-focusing-regions [role=region]:focus::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1000000;
}
.is-focusing-regions.is-distraction-free .interface-interface-skeleton__header .edit-post-header,
.is-focusing-regions .interface-interface-skeleton__sidebar .editor-layout__toggle-sidebar-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-layout__toggle-publish-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-layout__toggle-entities-saved-states-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-post-publish-panel {
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
}

.components-input-control__container:focus-within:not(:has(:is(.components-input-control__prefix, .components-input-control__suffix):focus-within)) .components-input-control__backdrop {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}

.components-menu-group + .components-menu-group {
  padding-top: 8px;
  border-top: 1px solid #1e1e1e;
}
.components-menu-group + .components-menu-group.has-hidden-separator {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

.components-menu-group:has(> div:empty) {
  display: none;
}

.components-menu-group__label {
  padding: 0 8px;
  margin-top: 4px;
  margin-bottom: 12px;
  color: #757575;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  white-space: nowrap;
}

.components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]),
.components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black)) !important;
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]),
  .components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight !important;
    color: HighlightText !important;
  }
}
.components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info,
.components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]),
.components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed) !important;
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]),
  .components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
    outline: var(--wpds-border-width-xs, 1px) solid GrayText;
    outline-offset: 0;
  }
}
.components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info,
.components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-menu-item__button,
.components-menu-item__button.components-button {
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-menu-item__button[role=menuitemradio] .components-menu-item__item:only-child, .components-menu-item__button[role=menuitemcheckbox] .components-menu-item__item:only-child,
.components-menu-item__button.components-button[role=menuitemradio] .components-menu-item__item:only-child,
.components-menu-item__button.components-button[role=menuitemcheckbox] .components-menu-item__item:only-child {
  padding-right: 46px;
  box-sizing: initial;
}
.components-menu-item__button .components-menu-items__item-icon,
.components-menu-item__button.components-button .components-menu-items__item-icon {
  display: inline-block;
  flex: 0 0 auto;
}
.components-menu-item__button .components-menu-items__item-icon.has-icon-right,
.components-menu-item__button.components-button .components-menu-items__item-icon.has-icon-right {
  margin-right: -2px;
  margin-left: 24px;
}
.components-menu-item__button .components-menu-item__shortcut + .components-menu-items__item-icon.has-icon-right,
.components-menu-item__button.components-button .components-menu-item__shortcut + .components-menu-items__item-icon.has-icon-right {
  margin-left: 8px;
}
.components-menu-item__button .block-editor-block-icon,
.components-menu-item__button.components-button .block-editor-block-icon {
  margin-left: -2px;
  margin-right: 8px;
}
.components-menu-item__button.is-primary,
.components-menu-item__button.components-button.is-primary {
  justify-content: center;
}
.components-menu-item__button.is-primary .components-menu-item__item,
.components-menu-item__button.components-button.is-primary .components-menu-item__item {
  margin-right: 0;
}
.components-menu-item__button:disabled.is-tertiary, .components-menu-item__button[aria-disabled=true].is-tertiary,
.components-menu-item__button.components-button:disabled.is-tertiary,
.components-menu-item__button.components-button[aria-disabled=true].is-tertiary {
  background: none;
  color: var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #2145e6));
  opacity: 0.3;
}

.components-menu-item__info-wrapper {
  display: flex;
  flex-direction: column;
  margin-right: auto;
}

.components-menu-item__info {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
  white-space: normal;
}

.components-menu-item__item {
  white-space: nowrap;
  min-width: 160px;
  margin-right: auto;
  display: inline-flex;
  align-items: center;
}

.components-menu-item__shortcut {
  align-self: center;
  margin-right: 0;
  margin-left: auto;
  padding-left: 24px;
  color: currentColor;
  display: none;
}
@media (min-width: 480px) {
  .components-menu-item__shortcut {
    display: inline;
  }
}

.components-menu-items-choice,
.components-menu-items-choice.components-button {
  min-height: 40px;
  height: auto;
}
.components-menu-items-choice svg,
.components-menu-items-choice.components-button svg {
  margin-right: 12px;
}
.components-menu-items-choice.has-icon,
.components-menu-items-choice.components-button.has-icon {
  padding-left: 12px;
}

body.modal-open {
  overflow: hidden;
}

.components-modal__screen-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 100000;
  display: flex;
}
@keyframes __wp-base-styles-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media not (prefers-reduced-motion) {
  .components-modal__screen-overlay {
    animation: __wp-base-styles-fade-in var(--wpds-motion-duration-sm, 100ms) var(--wpds-motion-easing-subtle, cubic-bezier(0.15, 0, 0.15, 1)) 0s;
    animation-fill-mode: forwards;
  }
}
@keyframes __wp-base-styles-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media not (prefers-reduced-motion) {
  .components-modal__screen-overlay.is-animating-out {
    animation: __wp-base-styles-fade-out var(--wpds-motion-duration-sm, 100ms) var(--wpds-motion-easing-subtle, cubic-bezier(0.15, 0, 0.15, 1)) var(--wpds-motion-duration-xs, 50ms);
    animation-fill-mode: forwards;
  }
}

.components-modal__frame {
  box-sizing: border-box;
}
.components-modal__frame *,
.components-modal__frame *::before,
.components-modal__frame *::after {
  box-sizing: inherit;
}
.components-modal__frame {
  align-self: flex-end;
  margin: 0;
  width: 100%;
  max-height: calc(100% - var(--wpds-dimension-gap-3xl, 40px));
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08), 0 15px 27px rgba(0, 0, 0, 0.07), 0 30px 36px rgba(0, 0, 0, 0.04), 0 50px 43px rgba(0, 0, 0, 0.02);
}
@media (forced-colors: active) {
  .components-modal__frame {
    outline: var(--wpds-border-width-xs, 1px) solid CanvasText;
  }
}
.components-modal__frame {
  border-radius: var(--wpds-border-radius-lg, 8px) var(--wpds-border-radius-lg, 8px) 0 0;
  overflow: hidden;
  display: flex;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
  animation-name: components-modal__appear-animation;
  animation-fill-mode: forwards;
  animation-timing-function: var(--wpds-motion-easing-expressive, cubic-bezier(0.25, 0, 0, 1));
}
.components-modal__frame h1,
.components-modal__frame h2,
.components-modal__frame h3 {
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
@media not (prefers-reduced-motion) {
  .components-modal__frame {
    animation-duration: var(--wpds-motion-duration-md, 200ms);
  }
}
.components-modal__screen-overlay.is-animating-out .components-modal__frame {
  animation-name: components-modal__disappear-animation;
  animation-timing-function: var(--wpds-motion-easing-expressive, cubic-bezier(0.25, 0, 0, 1));
}
@media (min-width: 600px) {
  .components-modal__frame {
    align-self: auto;
    border-radius: var(--wpds-border-radius-lg, 8px);
    margin: auto;
    width: auto;
    min-width: var(--wpds-dimension-surface-width-sm, 320px);
    max-width: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
    max-height: calc(100% - 128px);
  }
  .components-modal__frame.has-size-small, .components-modal__frame.has-size-medium, .components-modal__frame.has-size-large {
    width: 100%;
  }
  .components-modal__frame.has-size-small {
    max-width: var(--wpds-dimension-surface-width-md, 400px);
  }
  .components-modal__frame.has-size-medium {
    max-width: var(--wpds-dimension-surface-width-lg, 560px);
  }
  .components-modal__frame.has-size-large {
    max-width: var(--wpds-dimension-surface-width-2xl, 960px);
  }
}
@media (min-width: 960px) {
  .components-modal__frame {
    max-height: 70%;
  }
}
.components-modal__frame.is-full-screen {
  margin: 0;
  width: 100%;
  height: 100%;
  max-height: none;
  border-radius: 0;
}
.components-modal__frame.is-full-screen :where(.components-modal__content) {
  display: flex;
  margin-bottom: var(--wpds-dimension-gap-xl, 24px);
  padding-bottom: 0;
}
.components-modal__frame.is-full-screen :where(.components-modal__content) > :last-child {
  flex: 1;
}
@media (min-width: 600px) {
  .components-modal__frame.is-full-screen {
    margin: auto;
    border-radius: var(--wpds-border-radius-lg, 8px);
    width: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
    height: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
  }
}
@media (min-width: 782px) {
  .components-modal__frame.is-full-screen {
    width: calc(100% - var(--wpds-dimension-gap-3xl, 40px) * 2);
    height: calc(100% - var(--wpds-dimension-gap-3xl, 40px) * 2);
    max-width: none;
  }
}

@keyframes components-modal__appear-animation {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes components-modal__disappear-animation {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}
@media (min-width: 600px) {
  @keyframes components-modal__appear-animation {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes components-modal__disappear-animation {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }
}
.components-modal__header {
  box-sizing: border-box;
  border-bottom: var(--wpds-border-width-xs, 1px) solid transparent;
  padding: var(--wpds-dimension-padding-2xl, 24px);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: calc(64px + var(--wpds-dimension-padding-sm, 8px));
  width: 100%;
  z-index: 10;
  position: absolute;
  top: 0;
  left: 0;
}
.components-modal__header .components-modal__header-heading {
  font-size: var(--wpds-typography-font-size-xl, 20px);
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
}
.components-modal__header h1 {
  line-height: 1;
  margin: 0;
}
.components-modal__content.has-scrolled-content:not(.hide-header) .components-modal__header {
  border-bottom-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.components-modal__header + p {
  margin-top: 0;
}

.components-modal__header-heading-container {
  align-items: center;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

.components-modal__header-icon-container {
  display: inline-block;
}
.components-modal__header-icon-container svg {
  max-width: 36px;
  max-height: 36px;
  padding: var(--wpds-dimension-padding-sm, 8px);
}

.components-modal__content {
  flex: 1;
  margin-top: calc(64px + var(--wpds-dimension-padding-sm, 8px));
  padding: var(--wpds-dimension-padding-xs, 4px) var(--wpds-dimension-padding-2xl, 24px) var(--wpds-dimension-padding-2xl, 24px);
  overflow: auto;
}
.components-modal__content.hide-header {
  margin-top: 0;
  padding-top: var(--wpds-dimension-padding-2xl, 24px);
}
.components-modal__content.is-scrollable:focus-visible {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}

.components-notice {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-info-weak, #f3f9ff);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-info, #adc6e2);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-info, #001b4f);
  box-sizing: border-box;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  padding: var(--wpds-dimension-padding-md, 12px);
  border: var(--wpds-border-width-xs, 1px) solid var(--wp-components-notice-border-color);
  border-radius: var(--wpds-border-radius-lg, 8px);
  background-color: var(--wp-components-notice-background-color);
  color: var(--wp-components-notice-text-color);
  font-family: var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif);
  font-size: var(--wpds-typography-font-size-md, 13px);
  line-height: var(--wpds-typography-line-height-sm, 20px);
}
.components-notice.is-success {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-success-weak, #ebffed);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-success, #92d39d);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-success, #002900);
}
.components-notice.is-warning {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-warning-weak, #fff7e1);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-warning, #e1bd7c);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-warning, #2e1900);
}
.components-notice.is-error {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-error-weak, #fff6f5);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-error, #e0afa7);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-error, #470000);
}

.components-notice__content {
  grid-column: 1;
  grid-row: 1;
  padding-block: calc((var(--wpds-dimension-size-sm, 24px) - 1lh) / 2);
}

.components-notice__actions {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wpds-dimension-gap-md, 12px);
  margin-top: var(--wpds-dimension-gap-sm, 8px);
}

.components-notice__dismiss {
  grid-column: 2;
  grid-row: 1;
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  margin-inline-start: var(--wpds-dimension-gap-xs, 4px);
  mix-blend-mode: luminosity;
}
.components-notice__dismiss:not(:disabled):not([aria-disabled=true]):not(.is-secondary):hover, .components-notice__dismiss:not(:disabled):not([aria-disabled=true]):not(.is-secondary):active, .components-notice__dismiss:not(:disabled):not([aria-disabled=true]):focus {
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e);
}
@media (forced-colors: active) {
  .components-notice__dismiss {
    mix-blend-mode: normal;
  }
}

.components-notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--wpds-dimension-gap-md, 12px);
  max-width: 100vw;
  box-sizing: border-box;
}

.components-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
}
.components-panel > .components-panel__header:first-child,
.components-panel > .components-panel__body:first-child {
  margin-top: -1px;
}
.components-panel > .components-panel__header:last-child,
.components-panel > .components-panel__body:last-child {
  border-bottom-width: 0;
}

.components-panel + .components-panel {
  margin-top: -1px;
}

.components-panel__body {
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}
.components-panel__body h3 {
  margin: 0 0 0.5em;
}
.components-panel__body.is-opened {
  padding: 16px;
}

.components-panel__header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  box-sizing: content-box;
  height: 47px;
}
.components-panel__header h2 {
  margin: 0;
  font-size: inherit;
  color: inherit;
}

.components-panel__body + .components-panel__body,
.components-panel__body + .components-panel__header,
.components-panel__header + .components-panel__body,
.components-panel__header + .components-panel__header {
  margin-top: -1px;
}

.components-panel__body > .components-panel__body-title {
  display: block;
  padding: 0;
  font-size: inherit;
  margin-top: 0;
  margin-bottom: 0;
}
@media not (prefers-reduced-motion) {
  .components-panel__body > .components-panel__body-title {
    transition: 0.1s background ease-in-out;
  }
}

.components-panel__body.is-opened > .components-panel__body-title {
  margin: -16px;
  margin-bottom: 5px;
}

.components-panel__body > .components-panel__body-title:hover {
  background: #f0f0f0;
  border: none;
}

.components-panel__body-toggle.components-button {
  position: relative;
  padding: 16px 48px 16px 16px;
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  text-align: left;
  color: #1e1e1e;
}
@media not (prefers-reduced-motion) {
  .components-panel__body-toggle.components-button {
    transition: 0.1s background ease-in-out;
  }
}
.components-panel__body-toggle.components-button {
  height: auto;
}
.components-panel__body-toggle.components-button:focus {
  outline-offset: calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) * -1);
  border-radius: 0;
}
.components-panel__body-toggle.components-button .components-panel__arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #1e1e1e;
  fill: currentColor;
}
@media not (prefers-reduced-motion) {
  .components-panel__body-toggle.components-button .components-panel__arrow {
    transition: 0.1s color ease-in-out;
  }
}
.components-panel__body-toggle.components-button {
  /* rtl:begin:ignore */
}
body.rtl .components-panel__body-toggle.components-button .dashicons-arrow-right {
  transform: scaleX(-1);
  margin-top: -10px;
}
.components-panel__body-toggle.components-button {
  /* rtl:end:ignore */
}

.components-panel__icon {
  color: #757575;
  margin: -2px 0 -2px 6px;
}

.components-panel__body-toggle-icon {
  margin-right: -5px;
}

.components-panel__color-title {
  float: left;
  height: 19px;
}

.components-panel__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  min-height: 36px;
}
.components-panel__row select {
  min-width: 0;
}
.components-panel__row label {
  margin-right: 12px;
  flex-shrink: 0;
  max-width: 75%;
}
.components-panel__row:empty, .components-panel__row:first-of-type {
  margin-top: 0;
}

.components-panel .circle-picker {
  padding-bottom: 20px;
}

.components-placeholder.components-placeholder {
  font-size: 13px;
  box-sizing: border-box;
  position: relative;
  padding: 24px;
  width: 100%;
  text-align: left;
  margin: 0;
  color: #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  -webkit-font-smoothing: subpixel-antialiased;
  border-radius: 2px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  outline: 1px solid transparent;
}

.components-placeholder__error,
.components-placeholder__instructions,
.components-placeholder__label,
.components-placeholder__fieldset {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  letter-spacing: initial;
  line-height: initial;
  text-transform: none;
  font-weight: 400;
}

.components-placeholder__label {
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  align-items: center;
  display: flex;
}
.components-placeholder__label > svg,
.components-placeholder__label .dashicon,
.components-placeholder__label .block-editor-block-icon {
  margin-right: 4px;
  fill: currentColor;
}
.components-placeholder__label:empty {
  display: none;
}

.components-placeholder__fieldset,
.components-placeholder__fieldset form {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}
.components-placeholder__fieldset p,
.components-placeholder__fieldset form p {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-placeholder__fieldset.is-column-layout,
.components-placeholder__fieldset.is-column-layout form {
  flex-direction: column;
}

.components-placeholder__input[type=url] {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-placeholder__input[type=url] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-placeholder__input[type=url]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-placeholder__input[type=url]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-placeholder__input[type=url]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-placeholder__input[type=url] {
  flex: 1 1 auto;
}

.components-placeholder__error {
  width: 100%;
  gap: 8px;
}

.components-placeholder__fieldset .components-button:not(.is-link) ~ .components-button.is-link {
  margin-left: 10px;
  margin-right: 10px;
}
.components-placeholder__fieldset .components-button:not(.is-link) ~ .components-button.is-link:last-child {
  margin-right: 0;
}

.components-placeholder.is-medium .components-placeholder__instructions, .components-placeholder.is-small .components-placeholder__instructions {
  display: none;
}
.components-placeholder.is-medium .components-placeholder__fieldset,
.components-placeholder.is-medium .components-placeholder__fieldset form, .components-placeholder.is-small .components-placeholder__fieldset,
.components-placeholder.is-small .components-placeholder__fieldset form {
  flex-direction: column;
}
.components-placeholder.is-medium .components-placeholder__fieldset > *,
.components-placeholder.is-medium .components-button, .components-placeholder.is-small .components-placeholder__fieldset > *,
.components-placeholder.is-small .components-button {
  width: 100%;
  justify-content: center;
}
.components-placeholder.is-small {
  padding: 16px;
}

/**
 * Dashed style placeholders
 */
.components-placeholder.has-illustration {
  color: inherit;
  display: flex;
  box-shadow: none;
  border-radius: 0;
  backdrop-filter: blur(100px);
  background-color: transparent;
  backface-visibility: hidden;
}
.is-dark-theme .components-placeholder.has-illustration {
  background-color: rgba(0, 0, 0, 0.1);
}
.components-placeholder.has-illustration .components-placeholder__fieldset {
  margin-left: 0;
  margin-right: 0;
}
.components-placeholder.has-illustration .components-placeholder__label,
.components-placeholder.has-illustration .components-placeholder__instructions,
.components-placeholder.has-illustration .components-button {
  opacity: 0;
  pointer-events: none;
}
@media not (prefers-reduced-motion) {
  .components-placeholder.has-illustration .components-placeholder__label,
  .components-placeholder.has-illustration .components-placeholder__instructions,
  .components-placeholder.has-illustration .components-button {
    transition: opacity 0.1s linear;
  }
}
.is-selected > .components-placeholder.has-illustration .components-placeholder__label,
.is-selected > .components-placeholder.has-illustration .components-placeholder__instructions,
.is-selected > .components-placeholder.has-illustration .components-button {
  opacity: 1;
  pointer-events: auto;
}
.components-placeholder.has-illustration::before {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  background: currentColor;
  opacity: 0.1;
}
.components-placeholder.has-illustration {
  overflow: hidden;
}
.is-selected .components-placeholder.has-illustration {
  overflow: auto;
}

.components-placeholder__preview {
  display: flex;
  justify-content: center;
}

.components-placeholder__illustration {
  box-sizing: content-box;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  stroke: currentColor;
  opacity: 0.25;
}

.components-popover {
  box-sizing: border-box;
}
.components-popover *,
.components-popover *::before,
.components-popover *::after {
  box-sizing: inherit;
}
.components-popover {
  z-index: 1000000;
}
.components-popover.is-expanded {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000000 !important;
}

.components-popover__content {
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  box-shadow: 0 0 0 var(--wpds-border-width-xs, 1px) var(--wpds-color-stroke-surface-neutral, #dbdbdb), 0 2px 3px rgba(0, 0, 0, 0.05), 0 4px 5px rgba(0, 0, 0, 0.04), 0 12px 12px rgba(0, 0, 0, 0.03), 0 16px 16px rgba(0, 0, 0, 0.02);
  border-radius: var(--wpds-border-radius-md, 4px);
  box-sizing: border-box;
  width: min-content;
}
.is-alternate .components-popover__content {
  box-shadow: 0 0 0 1px #1e1e1e;
  border-radius: 2px;
}
.is-unstyled .components-popover__content {
  background: none;
  border-radius: 0;
  box-shadow: none;
}
.components-popover.is-expanded .components-popover__content {
  position: static;
  height: calc(100% - 48px);
  overflow-y: visible;
  width: auto;
  box-shadow: 0 calc(var(--wpds-border-width-xs, 1px) * -1) 0 0 var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.components-popover.is-expanded.is-alternate .components-popover__content {
  box-shadow: 0 -1px 0 #1e1e1e;
}
@media (forced-colors: active) {
  .components-popover:where(:not(.is-unstyled):not(.is-expanded)) .components-popover__content {
    outline: var(--wpds-border-width-xs, 1px) solid transparent;
  }
}

.components-popover__header {
  align-items: center;
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 0 8px 0 16px;
}

.components-popover__header-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.components-popover__arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  display: flex;
}
.components-popover__arrow::before {
  content: "";
  position: absolute;
  top: calc(var(--wpds-border-width-xs, 1px) * -1);
  left: 1px;
  height: calc(var(--wpds-border-width-xs, 1px) * 2);
  right: 1px;
  background-color: var(--wpds-color-background-surface-neutral-strong, #fff);
}
@media (forced-colors: active) {
  .components-popover__arrow::before {
    background-color: Canvas;
  }
}
.components-popover__arrow.is-top {
  bottom: -14px !important;
  transform: rotate(0);
}
.components-popover__arrow.is-right {
  /*rtl:begin:ignore*/
  left: -14px !important;
  transform: rotate(90deg);
}
.components-popover__arrow.is-bottom {
  top: -14px !important;
  transform: rotate(180deg);
}
.components-popover__arrow.is-left {
  /*rtl:begin:ignore*/
  right: -14px !important;
  transform: rotate(-90deg);
  /*rtl:end:ignore*/
}

.components-popover__triangle {
  display: block;
  flex: 1;
}

.components-popover__triangle-bg {
  fill: var(--wpds-color-background-surface-neutral-strong, #fff);
}
@media (forced-colors: active) {
  .components-popover__triangle-bg {
    fill: Canvas;
  }
}

.components-popover__triangle-border {
  fill: transparent;
  stroke-width: var(--wpds-border-width-xs, 1px);
  stroke: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.is-alternate .components-popover__triangle-border {
  stroke: #1e1e1e;
}
@media (forced-colors: active) {
  .components-popover:not(.is-unstyled) .components-popover__triangle-border {
    stroke: CanvasText;
  }
}

.components-radio-control {
  border: 0;
  margin: 0;
  padding: 0;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-radio-control__help {
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
}

.components-radio-control__option {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto minmax(0, max-content);
  column-gap: 8px;
  align-items: center;
}

.components-radio-control__input[type=radio] {
  grid-column: 1;
  grid-row: 1;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  background: var(--wpds-color-background-interactive-neutral-weak, #0000);
  transition: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  min-width: 16px;
  max-width: 16px;
  position: relative;
}
.components-radio-control__input[type=radio]::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 24px;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}
.components-radio-control__input[type=radio]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-radio-control__input[type=radio]:hover {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-radio-control__input[type=radio]:checked::before {
  box-sizing: inherit;
  width: 8px;
  height: 8px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  background-color: currentColor;
  border: 4px solid currentColor;
}
.components-radio-control__input[type=radio]:checked {
  background: var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9));
  border-color: transparent;
  color: var(--wpds-color-foreground-interactive-brand-strong, #fff);
}
.components-radio-control__input[type=radio][aria-disabled=true], .components-radio-control__input[type=radio]:disabled {
  background: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  cursor: default;
  opacity: 1;
}
@media (forced-colors: active) {
  .components-radio-control__input[type=radio][aria-disabled=true], .components-radio-control__input[type=radio]:disabled {
    color: GrayText;
    border-color: GrayText;
  }
}
.components-radio-control__input[type=radio] {
  display: inline-flex;
  margin: 0;
  padding: 0;
  appearance: none;
}
.components-radio-control__input[type=radio]:not(:disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-radio-control__input[type=radio]:checked::before {
  content: "";
  border-radius: 50%;
}
.components-radio-control__input[type=radio]:disabled:checked::before {
  opacity: 1;
}

.components-radio-control__label {
  grid-column: 2;
  grid-row: 1;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-radio-control__input:not(:disabled) + .components-radio-control__label {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-radio-control__label {
  line-height: 16px;
}

.components-radio-control__option-description {
  grid-column: 2;
  grid-row: 2;
  padding-block-start: 4px;
}
.components-radio-control__option-description.components-radio-control__option-description {
  margin-top: 0;
}

.components-resizable-box__handle {
  display: none;
  width: 23px;
  height: 23px;
  z-index: 2;
}
.components-resizable-box__container.has-show-handle .components-resizable-box__handle {
  display: block;
}
.components-resizable-box__handle > div {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
  outline: none;
}

.components-resizable-box__container > img {
  width: inherit;
}

.components-resizable-box__handle::after {
  display: block;
  content: "";
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  cursor: inherit;
  position: absolute;
  top: calc(50% - 8px);
  right: calc(50% - 8px);
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)), 0 1px 1px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02), 0 3px 3px rgba(0, 0, 0, 0.02), 0 4px 4px rgba(0, 0, 0, 0.01);
  outline: 2px solid transparent;
}

.components-resizable-box__side-handle::before {
  display: block;
  border-radius: 9999px;
  content: "";
  width: 3px;
  height: 3px;
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  cursor: inherit;
  position: absolute;
  top: calc(50% - 1px);
  right: calc(50% - 1px);
}
@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle::before {
    transition: transform 0.1s ease-in;
    will-change: transform;
  }
}
.components-resizable-box__side-handle::before {
  opacity: 0;
}

.components-resizable-box__side-handle {
  z-index: 2;
}

.components-resizable-box__corner-handle {
  z-index: 2;
}

.components-resizable-box__side-handle.components-resizable-box__handle-top,
.components-resizable-box__side-handle.components-resizable-box__handle-bottom,
.components-resizable-box__side-handle.components-resizable-box__handle-top::before,
.components-resizable-box__side-handle.components-resizable-box__handle-bottom::before {
  width: 100%;
  left: 0;
  border-left: 0;
  border-right: 0;
}

.components-resizable-box__side-handle.components-resizable-box__handle-left,
.components-resizable-box__side-handle.components-resizable-box__handle-right,
.components-resizable-box__side-handle.components-resizable-box__handle-left::before,
.components-resizable-box__side-handle.components-resizable-box__handle-right::before {
  height: 100%;
  top: 0;
  border-top: 0;
  border-bottom: 0;
}

@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle.components-resizable-box__handle-top:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-bottom:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-top:active::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-bottom:active::before {
    animation: components-resizable-box__top-bottom-animation 0.1s ease-out 0s;
    animation-fill-mode: forwards;
  }
}

@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle.components-resizable-box__handle-left:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-right:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-left:active::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-right:active::before {
    animation: components-resizable-box__left-right-animation 0.1s ease-out 0s;
    animation-fill-mode: forwards;
  }
}

/* This CSS is shown only to Safari, which has a bug with table-caption making it jumpy.
See https://bugs.webkit.org/show_bug.cgi?id=187903. */
@media not all and (min-resolution: 0.001dpcm) {
  @supports (-webkit-appearance: none) {
    .components-resizable-box__side-handle.components-resizable-box__handle-top:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-bottom:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-top:active::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-bottom:active::before {
      animation: none;
    }
    .components-resizable-box__side-handle.components-resizable-box__handle-left:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-right:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-left:active::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-right:active::before {
      animation: none;
    }
  }
}
@keyframes components-resizable-box__top-bottom-animation {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}
@keyframes components-resizable-box__left-right-animation {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
/*!rtl:begin:ignore*/
.components-resizable-box__handle-right {
  right: calc(11.5px * -1);
}

.components-resizable-box__handle-left {
  left: calc(11.5px * -1);
}

.components-resizable-box__handle-top {
  top: calc(11.5px * -1);
}

.components-resizable-box__handle-bottom {
  bottom: calc(11.5px * -1);
}

/*!rtl:end:ignore*/
.components-responsive-wrapper {
  position: relative;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.components-responsive-wrapper__content {
  display: block;
  max-width: 100%;
  width: 100%;
}

.components-sandbox {
  overflow: hidden;
}

iframe.components-sandbox {
  width: 100%;
}

html.lockscroll,
body.lockscroll {
  overflow: hidden;
}

.components-select-control__input {
  outline: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
}

.components-snackbar {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 3px rgba(0, 0, 0, 0.04), 0 6px 6px rgba(0, 0, 0, 0.03), 0 8px 8px rgba(0, 0, 0, 0.02);
  color: #fff;
  padding: 12px 20px;
  width: 100%;
  max-width: var(--wpds-dimension-surface-width-lg, 560px);
  box-sizing: border-box;
  cursor: var(--wpds-cursor-control, pointer);
  pointer-events: auto;
}
@media (min-width: 600px) {
  .components-snackbar {
    width: fit-content;
  }
}
.components-snackbar:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-snackbar.components-snackbar-explicit-dismiss {
  cursor: default;
}
.components-snackbar .components-snackbar__content-with-icon {
  position: relative;
  padding-left: 24px;
}
.components-snackbar .components-snackbar__icon {
  position: absolute;
  left: -8px;
  top: calc((5.8px) / -2);
}
.components-snackbar .components-snackbar__dismiss-button {
  margin-left: 24px;
  cursor: var(--wpds-cursor-control, pointer);
}

.components-snackbar__action.components-button,
.components-snackbar__action.components-external-link {
  margin-left: 32px;
  color: #fff;
  flex-shrink: 0;
  --focus-color: #fff;
}
.components-snackbar__action.components-button:hover,
.components-snackbar__action.components-external-link:hover {
  text-decoration: none;
  color: currentColor;
}

.components-snackbar__content {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  line-height: 1.4;
}

.components-snackbar-list {
  position: absolute;
  z-index: 100000;
  width: 100%;
  box-sizing: border-box;
  pointer-events: none;
}

.components-snackbar-list__notice-container {
  position: relative;
  padding-top: 8px;
}

.components-tab-panel__tabs {
  display: flex;
  align-items: stretch;
  flex-direction: row;
}
.components-tab-panel__tabs[aria-orientation=vertical] {
  flex-direction: column;
}

.components-tab-panel__tabs-item {
  position: relative;
  isolation: isolate;
  border-radius: 0;
  height: 48px !important;
  background: transparent;
  border: none;
  cursor: var(--wpds-cursor-control, pointer);
  padding: 3px var(--wpds-dimension-padding-lg, 16px);
  margin-left: 0;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-tab-panel__tabs-item[aria-selected=true] {
  cursor: default;
}
.components-tab-panel__tabs-item:disabled, .components-tab-panel__tabs-item[aria-disabled=true] {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]) {
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):is(:hover, :active):not([aria-selected=true]), .components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):focus-visible {
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):is(:hover, :active):not([aria-selected=true])::before, .components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):focus-visible::before {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed);
}
.components-tab-panel__tabs-item:focus:not(:disabled) {
  position: relative;
  outline: none;
}
.components-tab-panel__tabs-item::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  background: currentColor;
  height: calc(0 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
  border-radius: 0;
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs-item::after {
    transition: height 0.1s linear;
  }
}
.components-tab-panel__tabs-item.is-active::after {
  height: calc(1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
  outline: 2px solid transparent;
  outline-offset: -1px;
}
.components-tab-panel__tabs-item::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: var(--wpds-dimension-padding-md, 12px);
  pointer-events: none;
  border-radius: var(--wpds-border-radius-sm, 2px);
}
.components-tab-panel__tabs-item:focus-visible::before {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::before {
  inset: 0;
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label {
  position: relative;
  display: inline-flex;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::after {
  inset-block-start: 50%;
  inset-block-end: auto;
  inset-inline: 0 auto;
  width: 0;
  height: var(--wpds-dimension-size-sm, 24px);
  transform: translateY(-50%);
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::after {
    transition-property: width;
  }
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item:not(.has-icon)::after {
  content: none;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(-1 * var(--wpds-dimension-padding-lg, 16px));
  width: 0;
  background: currentColor;
  pointer-events: none;
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label::after {
    transition: width 0.1s linear;
  }
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item.is-active::after, .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item.is-active .components-tab-panel__tabs-item-label::after {
  width: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline: 2px solid transparent;
  outline-offset: -1px;
}

.components-tab-panel__tab-content:focus {
  outline: none;
}
.components-tab-panel__tab-content:focus-visible {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}

.components-text-control__input,
.components-text-control__input[type=text],
.components-text-control__input[type=tel],
.components-text-control__input[type=time],
.components-text-control__input[type=url],
.components-text-control__input[type=week],
.components-text-control__input[type=password],
.components-text-control__input[type=color],
.components-text-control__input[type=date],
.components-text-control__input[type=datetime],
.components-text-control__input[type=datetime-local],
.components-text-control__input[type=email],
.components-text-control__input[type=month],
.components-text-control__input[type=number] {
  width: 100%;
  height: 40px;
  margin: 0;
  background: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-text-control__input,
  .components-text-control__input[type=text],
  .components-text-control__input[type=tel],
  .components-text-control__input[type=time],
  .components-text-control__input[type=url],
  .components-text-control__input[type=week],
  .components-text-control__input[type=password],
  .components-text-control__input[type=color],
  .components-text-control__input[type=date],
  .components-text-control__input[type=datetime],
  .components-text-control__input[type=datetime-local],
  .components-text-control__input[type=email],
  .components-text-control__input[type=month],
  .components-text-control__input[type=number] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-text-control__input:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=text]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=tel]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=time]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=url]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=week]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=password]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=color]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=date]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=datetime]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=datetime-local]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=email]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=month]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=number]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-text-control__input:focus,
.components-text-control__input[type=text]:focus,
.components-text-control__input[type=tel]:focus,
.components-text-control__input[type=time]:focus,
.components-text-control__input[type=url]:focus,
.components-text-control__input[type=week]:focus,
.components-text-control__input[type=password]:focus,
.components-text-control__input[type=color]:focus,
.components-text-control__input[type=date]:focus,
.components-text-control__input[type=datetime]:focus,
.components-text-control__input[type=datetime-local]:focus,
.components-text-control__input[type=email]:focus,
.components-text-control__input[type=month]:focus,
.components-text-control__input[type=number]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-text-control__input::placeholder,
.components-text-control__input[type=text]::placeholder,
.components-text-control__input[type=tel]::placeholder,
.components-text-control__input[type=time]::placeholder,
.components-text-control__input[type=url]::placeholder,
.components-text-control__input[type=week]::placeholder,
.components-text-control__input[type=password]::placeholder,
.components-text-control__input[type=color]::placeholder,
.components-text-control__input[type=date]::placeholder,
.components-text-control__input[type=datetime]::placeholder,
.components-text-control__input[type=datetime-local]::placeholder,
.components-text-control__input[type=email]::placeholder,
.components-text-control__input[type=month]::placeholder,
.components-text-control__input[type=number]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-text-control__input,
.components-text-control__input[type=text],
.components-text-control__input[type=tel],
.components-text-control__input[type=time],
.components-text-control__input[type=url],
.components-text-control__input[type=week],
.components-text-control__input[type=password],
.components-text-control__input[type=color],
.components-text-control__input[type=date],
.components-text-control__input[type=datetime],
.components-text-control__input[type=datetime-local],
.components-text-control__input[type=email],
.components-text-control__input[type=month],
.components-text-control__input[type=number] {
  padding-left: 12px;
  padding-right: 12px;
}
.components-text-control__input::placeholder,
.components-text-control__input[type=text]::placeholder,
.components-text-control__input[type=tel]::placeholder,
.components-text-control__input[type=time]::placeholder,
.components-text-control__input[type=url]::placeholder,
.components-text-control__input[type=week]::placeholder,
.components-text-control__input[type=password]::placeholder,
.components-text-control__input[type=color]::placeholder,
.components-text-control__input[type=date]::placeholder,
.components-text-control__input[type=datetime]::placeholder,
.components-text-control__input[type=datetime-local]::placeholder,
.components-text-control__input[type=email]::placeholder,
.components-text-control__input[type=month]::placeholder,
.components-text-control__input[type=number]::placeholder {
  color: color-mix(in srgb, var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e)), transparent 38%);
}
.components-text-control__input:disabled, .components-text-control__input[aria-disabled=true],
.components-text-control__input[type=text]:disabled,
.components-text-control__input[type=text][aria-disabled=true],
.components-text-control__input[type=tel]:disabled,
.components-text-control__input[type=tel][aria-disabled=true],
.components-text-control__input[type=time]:disabled,
.components-text-control__input[type=time][aria-disabled=true],
.components-text-control__input[type=url]:disabled,
.components-text-control__input[type=url][aria-disabled=true],
.components-text-control__input[type=week]:disabled,
.components-text-control__input[type=week][aria-disabled=true],
.components-text-control__input[type=password]:disabled,
.components-text-control__input[type=password][aria-disabled=true],
.components-text-control__input[type=color]:disabled,
.components-text-control__input[type=color][aria-disabled=true],
.components-text-control__input[type=date]:disabled,
.components-text-control__input[type=date][aria-disabled=true],
.components-text-control__input[type=datetime]:disabled,
.components-text-control__input[type=datetime][aria-disabled=true],
.components-text-control__input[type=datetime-local]:disabled,
.components-text-control__input[type=datetime-local][aria-disabled=true],
.components-text-control__input[type=email]:disabled,
.components-text-control__input[type=email][aria-disabled=true],
.components-text-control__input[type=month]:disabled,
.components-text-control__input[type=month][aria-disabled=true],
.components-text-control__input[type=number]:disabled,
.components-text-control__input[type=number][aria-disabled=true] {
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  background: var(--wpds-color-background-interactive-neutral-disabled, #fff);
}
@media (forced-colors: active) {
  .components-text-control__input:disabled, .components-text-control__input[aria-disabled=true],
  .components-text-control__input[type=text]:disabled,
  .components-text-control__input[type=text][aria-disabled=true],
  .components-text-control__input[type=tel]:disabled,
  .components-text-control__input[type=tel][aria-disabled=true],
  .components-text-control__input[type=time]:disabled,
  .components-text-control__input[type=time][aria-disabled=true],
  .components-text-control__input[type=url]:disabled,
  .components-text-control__input[type=url][aria-disabled=true],
  .components-text-control__input[type=week]:disabled,
  .components-text-control__input[type=week][aria-disabled=true],
  .components-text-control__input[type=password]:disabled,
  .components-text-control__input[type=password][aria-disabled=true],
  .components-text-control__input[type=color]:disabled,
  .components-text-control__input[type=color][aria-disabled=true],
  .components-text-control__input[type=date]:disabled,
  .components-text-control__input[type=date][aria-disabled=true],
  .components-text-control__input[type=datetime]:disabled,
  .components-text-control__input[type=datetime][aria-disabled=true],
  .components-text-control__input[type=datetime-local]:disabled,
  .components-text-control__input[type=datetime-local][aria-disabled=true],
  .components-text-control__input[type=email]:disabled,
  .components-text-control__input[type=email][aria-disabled=true],
  .components-text-control__input[type=month]:disabled,
  .components-text-control__input[type=month][aria-disabled=true],
  .components-text-control__input[type=number]:disabled,
  .components-text-control__input[type=number][aria-disabled=true] {
    border-color: GrayText;
    color: GrayText;
  }
}
.components-text-control__input:disabled::placeholder, .components-text-control__input[aria-disabled=true]::placeholder,
.components-text-control__input[type=text]:disabled::placeholder,
.components-text-control__input[type=text][aria-disabled=true]::placeholder,
.components-text-control__input[type=tel]:disabled::placeholder,
.components-text-control__input[type=tel][aria-disabled=true]::placeholder,
.components-text-control__input[type=time]:disabled::placeholder,
.components-text-control__input[type=time][aria-disabled=true]::placeholder,
.components-text-control__input[type=url]:disabled::placeholder,
.components-text-control__input[type=url][aria-disabled=true]::placeholder,
.components-text-control__input[type=week]:disabled::placeholder,
.components-text-control__input[type=week][aria-disabled=true]::placeholder,
.components-text-control__input[type=password]:disabled::placeholder,
.components-text-control__input[type=password][aria-disabled=true]::placeholder,
.components-text-control__input[type=color]:disabled::placeholder,
.components-text-control__input[type=color][aria-disabled=true]::placeholder,
.components-text-control__input[type=date]:disabled::placeholder,
.components-text-control__input[type=date][aria-disabled=true]::placeholder,
.components-text-control__input[type=datetime]:disabled::placeholder,
.components-text-control__input[type=datetime][aria-disabled=true]::placeholder,
.components-text-control__input[type=datetime-local]:disabled::placeholder,
.components-text-control__input[type=datetime-local][aria-disabled=true]::placeholder,
.components-text-control__input[type=email]:disabled::placeholder,
.components-text-control__input[type=email][aria-disabled=true]::placeholder,
.components-text-control__input[type=month]:disabled::placeholder,
.components-text-control__input[type=month][aria-disabled=true]::placeholder,
.components-text-control__input[type=number]:disabled::placeholder,
.components-text-control__input[type=number][aria-disabled=true]::placeholder {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}

.components-text-control__input[type=email],
.components-text-control__input[type=url] {
  /* rtl:ignore */
  direction: ltr;
}

.components-tip {
  display: flex;
  color: #757575;
}
.components-tip svg {
  align-self: center;
  color: #f0b849;
  flex-shrink: 0;
  margin-right: 16px;
}
.components-tip p {
  margin: 0;
}

.components-toggle-control__label {
  line-height: 16px;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-toggle-control__label:not(.is-disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-toggle-control__help {
  display: inline-block;
  margin-inline-start: 40px;
}

.components-accessible-toolbar {
  display: inline-flex;
  border: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  border-radius: 2px;
  flex-shrink: 0;
}
.components-accessible-toolbar > .components-toolbar-group:last-child {
  border-right: none;
}
.components-accessible-toolbar.is-unstyled {
  border: none;
}
.components-accessible-toolbar.is-unstyled > .components-toolbar-group {
  border-right: none;
}

.components-accessible-toolbar[aria-orientation=vertical],
.components-toolbar[aria-orientation=vertical] {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.components-accessible-toolbar .components-button,
.components-toolbar .components-button {
  position: relative;
  height: 48px;
  z-index: 1;
  padding-left: 16px;
  padding-right: 16px;
}
.components-accessible-toolbar .components-button:focus:not(:disabled),
.components-toolbar .components-button:focus:not(:disabled) {
  box-shadow: none;
  outline: none;
}
.components-accessible-toolbar .components-button::before,
.components-toolbar .components-button::before {
  content: "";
  position: absolute;
  display: block;
  border-radius: 2px;
  height: 32px;
  left: 8px;
  right: 8px;
  z-index: -1;
}
@media not (prefers-reduced-motion) {
  .components-accessible-toolbar .components-button::before,
  .components-toolbar .components-button::before {
    animation: components-button__appear-animation 0.1s ease;
    animation-fill-mode: forwards;
  }
}
.components-accessible-toolbar .components-button svg,
.components-toolbar .components-button svg {
  position: relative;
  margin-left: auto;
  margin-right: auto;
}
.components-accessible-toolbar .components-button.is-pressed,
.components-toolbar .components-button.is-pressed {
  background: transparent;
}
.components-accessible-toolbar .components-button.is-pressed:hover,
.components-toolbar .components-button.is-pressed:hover {
  background: transparent;
}
.components-accessible-toolbar .components-button.is-pressed::before,
.components-toolbar .components-button.is-pressed::before {
  background: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-accessible-toolbar .components-button:focus::before,
.components-toolbar .components-button:focus::before {
  box-shadow: inset 0 0 0 1px #fff, 0 0 0 var(--wp-admin-border-width-focus) var(--wp-admin-theme-color);
  outline: 2px solid transparent;
}
.components-accessible-toolbar .components-button.has-icon.has-icon,
.components-toolbar .components-button.has-icon.has-icon {
  padding-left: 8px;
  padding-right: 8px;
  min-width: 48px;
}

@keyframes components-button__appear-animation {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
.components-toolbar__control.components-button {
  position: relative;
}
.components-toolbar__control.components-button[data-subscript] svg {
  padding: 5px 10px 5px 0;
}
.components-toolbar__control.components-button[data-subscript]::after {
  content: attr(data-subscript);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  line-height: 12px;
  position: absolute;
  right: 8px;
  bottom: 10px;
}
.components-toolbar__control.components-button:not(:disabled).is-pressed[data-subscript]::after {
  color: #fff;
}

.components-toolbar-group {
  min-height: 48px;
  border-right: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  background-color: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  display: inline-flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding-left: 6px;
  padding-right: 6px;
}
.components-toolbar-group .components-toolbar-group.components-toolbar-group {
  border-width: 0;
  margin: 0;
}
.components-toolbar-group {
  line-height: 0;
}
.components-toolbar-group .components-button.components-button,
.components-toolbar-group .components-button.has-icon.has-icon {
  justify-content: center;
  min-width: 36px;
  padding-left: 6px;
  padding-right: 6px;
}
.components-toolbar-group .components-button.components-button svg,
.components-toolbar-group .components-button.has-icon.has-icon svg {
  min-width: var(--wpds-dimension-size-sm, 24px);
}
.components-toolbar-group .components-button.components-button::before,
.components-toolbar-group .components-button.has-icon.has-icon::before {
  left: 2px;
  right: 2px;
}

.components-toolbar {
  min-height: 48px;
  margin: 0;
  border: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  background-color: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  display: inline-flex;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.components-toolbar .components-toolbar.components-toolbar {
  border-width: 0;
  margin: 0;
}

div.components-toolbar > div {
  display: flex;
  margin: 0;
}
div.components-toolbar > div + div.has-left-divider {
  margin-left: 6px;
  position: relative;
  overflow: visible;
}
div.components-toolbar > div + div.has-left-divider::before {
  display: inline-block;
  content: "";
  box-sizing: content-box;
  background-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  position: absolute;
  top: 8px;
  left: -3px;
  width: 1px;
  height: 20px;
}

.components-tooltip {
  background: #1e1e1e;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  border-radius: var(--wpds-border-radius-md, 4px);
  color: #f0f0f0;
  text-align: center;
  line-height: 1.4;
  font-size: 12px;
  padding: 4px 8px;
  z-index: 1000002;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 3px rgba(0, 0, 0, 0.04), 0 6px 6px rgba(0, 0, 0, 0.03), 0 8px 8px rgba(0, 0, 0, 0.02);
}

.components-tooltip__shortcut {
  margin-left: 8px;
}

.components-validated-control__wrapper-with-error-delegate:has(input:invalid[data-validity-visible]) .components-validated-control__content-editable [role=textbox], .components-validated-control__wrapper-with-error-delegate:has(select:invalid[data-validity-visible]) .components-input-control__backdrop, .components-validated-control textarea:invalid[data-validity-visible], .components-validated-control:has(:is(input, select):invalid[data-validity-visible]) .components-input-control__backdrop {
  --focus-color: var(--wpds-color-stroke-interactive-error, #cc1818);
}

.components-validated-control__wrapper-with-error-delegate:has(input:invalid[data-validity-visible]) .components-validated-control__content-editable [role=textbox], .components-validated-control__wrapper-with-error-delegate:has(select:invalid[data-validity-visible]) .components-input-control__backdrop, .components-validated-control textarea:invalid[data-validity-visible], .components-validated-control:has(:is(input, select):invalid[data-validity-visible]) .components-input-control__backdrop {
  border-color: var(--wpds-color-stroke-interactive-error, #cc1818);
}

.components-validated-control__wrapper-with-error-delegate {
  position: relative;
}
.components-validated-control__error-delegate {
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
  opacity: 0;
  pointer-events: none;
}

:root {
  --wp-admin-theme-color: #3858e9;
  --wp-admin-theme-color--rgb: 56, 88, 233;
  --wp-admin-theme-color-darker-10: rgb(33.0384615385, 68.7307692308, 230.4615384615);
  --wp-admin-theme-color-darker-10--rgb: 33.0384615385, 68.7307692308, 230.4615384615;
  --wp-admin-theme-color-darker-20: rgb(23.6923076923, 58.1538461538, 214.3076923077);
  --wp-admin-theme-color-darker-20--rgb: 23.6923076923, 58.1538461538, 214.3076923077;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  :root {
    --wp-admin-border-width-focus: 1.5px;
  }
}`})))()}var Yn;function init_style_rtl(){return(init_style_rtl=e((()=>{Yn=`@charset "UTF-8";
/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
@media not (prefers-reduced-motion) {
  .components-animate__appear {
    animation: components-animate__appear-animation 0.1s cubic-bezier(0, 0, 0.2, 1) 0s;
    animation-fill-mode: forwards;
  }
}
.components-animate__appear.is-from-top, .components-animate__appear.is-from-top.is-from-left {
  transform-origin: top right;
}
.components-animate__appear.is-from-top.is-from-right {
  transform-origin: top left;
}
.components-animate__appear.is-from-bottom, .components-animate__appear.is-from-bottom.is-from-left {
  transform-origin: bottom right;
}
.components-animate__appear.is-from-bottom.is-from-right {
  transform-origin: bottom left;
}

@keyframes components-animate__appear-animation {
  from {
    transform: translateY(-2em) scaleY(0) scaleX(0);
  }
  to {
    transform: translateY(0%) scaleY(1) scaleX(1);
  }
}
@media not (prefers-reduced-motion) {
  .components-animate__slide-in {
    animation: components-animate__slide-in-animation 0.1s cubic-bezier(0, 0, 0.2, 1);
    animation-fill-mode: forwards;
  }
  .components-animate__slide-in.is-from-left {
    transform: translateX(-100%);
  }
  .components-animate__slide-in.is-from-right {
    transform: translateX(100%);
  }
}

@keyframes components-animate__slide-in-animation {
  100% {
    transform: translateX(0%);
  }
}
@media not (prefers-reduced-motion) {
  .components-animate__loading {
    animation: components-animate__loading 1.6s ease-in-out infinite;
  }
}

@keyframes components-animate__loading {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
.components-autocomplete__popover .components-popover__content {
  padding: 8px;
  min-width: 200px;
}

.components-autocomplete__result.components-button {
  display: flex;
  height: auto;
  min-height: 36px;
  text-align: right;
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-default, 400);
  position: relative;
}
.components-autocomplete__result.components-button:is(:focus, .is-selected):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black));
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff);
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-autocomplete__result.components-button:is(:focus, .is-selected):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
.components-autocomplete__result.components-button[aria-disabled=true]:is(:focus, .is-selected) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}

.components-badge {
  box-sizing: border-box;
}
.components-badge *,
.components-badge *::before,
.components-badge *::after {
  box-sizing: inherit;
}
.components-badge {
  background-color: color-mix(in srgb, #fff 90%, var(--base-color));
  color: color-mix(in srgb, #000 50%, var(--base-color));
  padding: 2px 8px;
  min-height: 24px;
  border-radius: 2px;
  line-height: 0;
  max-width: 100%;
  display: inline-block;
}
.components-badge:where(.is-default) {
  background-color: #f0f0f0;
  color: #2f2f2f;
}
.components-badge.has-icon {
  padding-inline-start: 4px;
}
.components-badge.is-info {
  --base-color: #3858e9;
}
.components-badge.is-warning {
  --base-color: #f0b849;
}
.components-badge.is-error {
  --base-color: #cc1818;
}
.components-badge.is-success {
  --base-color: #4ab866;
}

.components-badge__flex-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
}

.components-badge__icon {
  flex-shrink: 0;
}

.components-badge__content {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.components-button-group {
  display: inline-block;
}
.components-button-group .components-button {
  border-radius: 0;
  display: inline-flex;
  color: #1e1e1e;
  border-color: #1e1e1e;
}
.components-button-group .components-button + .components-button {
  margin-right: -1px;
}
.components-button-group .components-button:first-child {
  border-radius: 0 2px 2px 0;
}
.components-button-group .components-button:last-child {
  border-radius: 2px 0 0 2px;
}
.components-button-group .components-button:focus, .components-button-group .components-button.is-primary {
  position: relative;
  z-index: 1;
}

/**
 * For easier testing of potential regressions, you can use a Button variant matrix
 * available in a special Storybook instance by running \`npm run storybook:e2e:dev\`.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/test/storybook-playwright/README.md
 */
.components-button:focus:is(a) {
  box-shadow: none;
}
.components-button:focus {
  outline: none;
}
.components-button:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-button {
  display: inline-flex;
  text-decoration: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  margin: 0;
  cursor: var(--wpds-cursor-control, pointer);
  appearance: none;
  background: none;
  height: 36px;
  align-items: center;
  box-sizing: border-box;
  padding: 4px 12px;
  border-radius: 2px;
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  border: 1px solid transparent;
}
.components-button.is-next-40px-default-size {
  height: 40px;
}
.components-button[aria-expanded=true], .components-button:hover:not(:disabled, [aria-disabled=true], [role^=menuitem], [role=option]) {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button {
  /**
   * Primary button style.
   */
}
.components-button.is-primary {
  white-space: nowrap;
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
  text-decoration: none;
  text-shadow: none;
}
.components-button.is-primary:hover:not(:disabled) {
  background: var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #2145e6));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
}
.components-button.is-primary:active:not(:disabled) {
  background: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
}
.components-button.is-primary:disabled, .components-button.is-primary:disabled:active:enabled, .components-button.is-primary[aria-disabled=true], .components-button.is-primary[aria-disabled=true]:enabled, .components-button.is-primary[aria-disabled=true]:active:enabled {
  color: rgba(255, 255, 255, 0.4);
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button.is-primary.is-busy, .components-button.is-primary.is-busy:disabled, .components-button.is-primary.is-busy[aria-disabled=true] {
  color: var(--wp-components-color-accent-inverted, var(--wpds-color-foreground-interactive-brand-strong, #fff));
  background-size: 100px 100%;
  /* stylelint-disable -- Disable reason: This function call looks nicer when each argument is on its own line. */
  background-image: linear-gradient(45deg, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 33%, var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6)) 33%, var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6)) 70%, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 70%);
  /* stylelint-enable */
}
.components-button {
  /**
   * Secondary and tertiary buttons.
   */
}
.components-button.is-secondary:disabled, .components-button.is-secondary[aria-disabled=true], .components-button.is-secondary[aria-disabled=true]:hover, .components-button.is-tertiary:disabled, .components-button.is-tertiary[aria-disabled=true], .components-button.is-tertiary[aria-disabled=true]:hover {
  color: #949494;
  background: transparent;
  transform: none;
}
.components-button {
  /**
   * Secondary button style.
   */
}
@media not (prefers-reduced-motion) {
  .components-button.is-secondary {
    transition: border-color 0.1s linear;
  }
}
.components-button.is-secondary {
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  white-space: nowrap;
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  background: transparent;
}
.components-button.is-secondary:active:not(:disabled) {
  border-color: transparent;
}
.components-button.is-secondary:hover:not(:disabled, [aria-disabled=true], .is-pressed) {
  border-color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent);
}
.components-button.is-secondary:focus:not(:active) {
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-button.is-secondary:disabled:not(:focus), .components-button.is-secondary[aria-disabled=true]:not(:focus), .components-button.is-secondary[aria-disabled=true]:hover:not(:focus) {
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
}
.components-button {
  /**
   * Tertiary buttons.
   */
}
.components-button.is-tertiary {
  white-space: nowrap;
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  background: transparent;
}
.components-button.is-tertiary:hover:not(:disabled, [aria-disabled=true], .is-pressed) {
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 4%, transparent);
  color: var(--wp-components-color-accent-darker-20, var(--wp-admin-theme-color-darker-20, #183ad6));
}
.components-button.is-tertiary:active:not(:disabled, [aria-disabled=true]) {
  background: color-mix(in srgb, var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)) 8%, transparent);
}
p + .components-button.is-tertiary {
  margin-right: -6px;
}
.components-button {
  /**
   * Destructive buttons.
   */
}
.components-button.is-destructive {
  --wp-components-color-accent: #cc1818;
  --wp-components-color-accent-darker-10: rgb(158.3684210526, 18.6315789474, 18.6315789474);
  --wp-components-color-accent-darker-20: rgb(112.7368421053, 13.2631578947, 13.2631578947);
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link) {
  color: #cc1818;
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):hover:not(:disabled, [aria-disabled=true]) {
  color: rgb(112.7368421053, 13.2631578947, 13.2631578947);
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):active:not(:disabled, [aria-disabled=true]) {
  background: #ccc;
}
.components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link):disabled, .components-button.is-destructive:not(.is-primary):not(.is-secondary):not(.is-tertiary):not(.is-link)[aria-disabled=true] {
  color: #949494;
}
.components-button.is-destructive.is-tertiary:hover:not(:disabled, [aria-disabled=true]), .components-button.is-destructive.is-secondary:hover:not(:disabled, [aria-disabled=true]) {
  background: rgba(204, 24, 24, 0.04);
}
.components-button.is-destructive.is-tertiary:active:not(:disabled, [aria-disabled=true]), .components-button.is-destructive.is-secondary:active:not(:disabled, [aria-disabled=true]) {
  background: rgba(204, 24, 24, 0.08);
}
.components-button {
  /**
   * Link buttons.
   */
}
.components-button.is-link {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none;
  outline: none;
  text-align: right;
  font-weight: var(--wpds-typography-font-weight-default, 400);
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: from-font;
}
@media not (prefers-reduced-motion) {
  .components-button.is-link {
    transition-property: border, background, color;
    transition-duration: 0.05s;
    transition-timing-function: ease-in-out;
  }
}
.components-button.is-link {
  height: auto;
}
.components-button.is-link:focus:not(:active) {
  border-radius: 2px;
  text-decoration: none;
}
.components-button.is-link:disabled, .components-button.is-link[aria-disabled=true] {
  color: #949494;
}
.components-button:not(:disabled, [aria-disabled=true]):active {
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-button:disabled, .components-button[aria-disabled=true] {
  cursor: default;
  color: #949494;
}
@media not (prefers-reduced-motion) {
  .components-button.is-busy, .components-button.is-secondary.is-busy, .components-button.is-secondary.is-busy:disabled, .components-button.is-secondary.is-busy[aria-disabled=true] {
    animation: components-button__busy-animation 2500ms infinite linear;
  }
}
.components-button.is-busy, .components-button.is-secondary.is-busy, .components-button.is-secondary.is-busy:disabled, .components-button.is-secondary.is-busy[aria-disabled=true] {
  background-size: 100px 100%;
  /* stylelint-disable -- Disable reason: This function call looks nicer when each argument is on its own line. */
  background-image: linear-gradient(45deg, rgb(249.9, 249.9, 249.9) 33%, rgb(224.4, 224.4, 224.4) 33%, rgb(224.4, 224.4, 224.4) 70%, rgb(249.9, 249.9, 249.9) 70%);
  /* stylelint-enable */
}
.components-button.is-compact {
  height: 32px;
}
.components-button.is-compact.has-icon:not(.has-text) {
  padding: 0;
  min-width: 32px;
}
.components-button.is-small {
  height: var(--wpds-dimension-size-sm, 24px);
  line-height: 22px;
  padding: 0 8px;
  font-size: 11px;
}
.components-button.is-small.has-icon:not(.has-text) {
  padding: 0;
  min-width: var(--wpds-dimension-size-sm, 24px);
}
.components-button.has-icon {
  padding: 6px;
  min-width: 36px;
  justify-content: center;
}
.components-button.has-icon.is-next-40px-default-size {
  min-width: 40px;
}
.components-button.has-icon .dashicon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 2px;
  box-sizing: content-box;
}
.components-button.has-icon.has-text {
  justify-content: start;
  padding-left: 12px;
  padding-right: 8px;
  gap: 4px;
}
.components-button.has-icon.has-text.has-icon-right {
  padding-left: 8px;
  padding-right: 12px;
}
.components-button.has-icon:not(.has-text) svg,
.components-button.has-icon:not(.has-text) .dashicon {
  margin-inline: -1px;
}
.components-button.is-pressed, .components-button.is-pressed:hover {
  color: var(--wp-components-color-foreground-inverted, var(--wpds-color-background-surface-neutral, #fcfcfc));
}
.components-button.is-pressed:not(:disabled, [aria-disabled=true]), .components-button.is-pressed:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-button.is-pressed:disabled, .components-button.is-pressed[aria-disabled=true] {
  color: #949494;
}
.components-button.is-pressed:disabled:not(.is-primary):not(.is-secondary):not(.is-tertiary), .components-button.is-pressed[aria-disabled=true]:not(.is-primary):not(.is-secondary):not(.is-tertiary) {
  color: var(--wp-components-color-foreground-inverted, var(--wpds-color-background-surface-neutral, #fcfcfc));
  background: #949494;
}
.components-button svg {
  fill: currentColor;
  outline: none;
  flex-shrink: 0;
}

@keyframes components-button__busy-animation {
  0% {
    background-position: right 200px top 0;
  }
}
.components-checkbox-control {
  --checkbox-input-size: 16px;
  --checkbox-input-margin: 8px;
}

.components-checkbox-control__label {
  line-height: var(--checkbox-input-size);
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-checkbox-control:not(:has(:disabled)) .components-checkbox-control__label {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-checkbox-control__input[type=checkbox] {
  transition: none;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-checkbox-control__input[type=checkbox] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-checkbox-control__input[type=checkbox]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-checkbox-control__input[type=checkbox]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-checkbox-control__input[type=checkbox]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-checkbox-control__input[type=checkbox]:hover:not(:disabled, [aria-disabled=true]) {
  background: var(--wpds-color-background-interactive-neutral-active, #fff);
}
.components-checkbox-control__input[type=checkbox]:checked::before, .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
  margin: -3px -5px;
  color: #fff;
}
@media (min-width: 782px) {
  .components-checkbox-control__input[type=checkbox]:checked::before, .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
    margin: -4px -5px 0 0;
  }
}
.components-checkbox-control__input[type=checkbox][aria-checked=mixed] {
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
  content: "\\f460";
  float: right;
  display: inline-block;
  vertical-align: middle;
  width: 16px;
  /* stylelint-disable-next-line font-family-no-missing-generic-family-keyword -- dashicons don't need a generic family keyword. */
  font: 400 30px/1 dashicons;
  speak: none;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@media (min-width: 782px) {
  .components-checkbox-control__input[type=checkbox][aria-checked=mixed]::before {
    float: none;
    font-size: 21px;
  }
}
.components-checkbox-control__input[type=checkbox][aria-disabled=true], .components-checkbox-control__input[type=checkbox]:disabled {
  background: var(--wpds-color-background-interactive-neutral-disabled, #fff);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  cursor: default;
  opacity: 1;
}
.components-checkbox-control__input[type=checkbox][aria-disabled=true]:checked::before, .components-checkbox-control__input[type=checkbox][aria-disabled=true][aria-checked=mixed]::before, .components-checkbox-control__input[type=checkbox]:disabled:checked::before, .components-checkbox-control__input[type=checkbox]:disabled[aria-checked=mixed]::before {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-checkbox-control__input[type=checkbox] {
  background: #fff;
  color: #1e1e1e;
  clear: none;
  display: inline-block;
  line-height: 0;
  margin: 0 0 0 4px;
  outline: 0;
  padding: 0 !important;
  text-align: center;
  vertical-align: top;
  position: relative;
  width: var(--checkbox-input-size);
  height: var(--checkbox-input-size);
  appearance: none;
}
@media not (prefers-reduced-motion) {
  .components-checkbox-control__input[type=checkbox] {
    transition: 0.1s border-color ease-in-out;
  }
}
.components-checkbox-control__input[type=checkbox]:not(:disabled):is(:checked, :indeterminate) {
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  border-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-checkbox-control__input[type=checkbox]:not(:disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-checkbox-control__input[type=checkbox]:checked::before {
  content: none;
}
.components-checkbox-control__input[type=checkbox]::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 50%;
  width: max(var(--checkbox-input-size), 24px);
  aspect-ratio: 1;
  transform: translate(50%, -50%);
}

.components-checkbox-control__input-container {
  position: relative;
  display: inline-block;
  margin-left: var(--checkbox-input-margin);
  vertical-align: middle;
  width: var(--checkbox-input-size);
  aspect-ratio: 1;
  line-height: 1;
  flex-shrink: 0;
}

svg.components-checkbox-control__checked,
svg.components-checkbox-control__indeterminate {
  color: #fff;
  cursor: var(--wpds-cursor-control, pointer);
  position: absolute;
  right: 50%;
  top: 50%;
  transform: translate(50%, -50%);
  width: var(--checkbox-input-size);
  height: var(--checkbox-input-size);
  -webkit-user-select: none;
          user-select: none;
  pointer-events: none;
}

.components-checkbox-control:has(:disabled) svg.components-checkbox-control__checked,
.components-checkbox-control:has(:disabled) svg.components-checkbox-control__indeterminate {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}

.components-checkbox-control__help {
  display: inline-block;
  margin-inline-start: calc(var(--checkbox-input-size) + var(--checkbox-input-margin));
}

.components-circular-option-picker {
  display: inline-block;
  width: 100%;
  min-width: 188px;
  isolation: isolate;
}
.components-circular-option-picker .components-circular-option-picker__custom-clear-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
.components-circular-option-picker .components-circular-option-picker__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  position: relative;
  z-index: 1;
}
.components-circular-option-picker > *:not(.components-circular-option-picker__swatches) {
  position: relative;
  z-index: 0;
}

.components-circular-option-picker__option-wrapper {
  display: inline-block;
  height: 28px;
  width: 28px;
  vertical-align: top;
  transform: scale(1);
}
@media not (prefers-reduced-motion) {
  .components-circular-option-picker__option-wrapper {
    transition: 100ms transform ease-out;
    will-change: transform;
  }
}
.components-circular-option-picker__option-wrapper:hover {
  transform: scale(1.1);
}
.components-circular-option-picker__option-wrapper > div {
  height: 100%;
  width: 100%;
}

.components-circular-option-picker__option-wrapper::before {
  content: "";
  position: absolute;
  inset: 1px;
  border-radius: 50%;
  z-index: -1;
  background: url('data:image/svg+xml,%3Csvg width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M6 8V6H4v2h2zM8 8V6h2v2H8zM10 16H8v-2h2v2zM12 16v-2h2v2h-2zM12 18v-2h-2v2H8v2h2v-2h2zM14 18v2h-2v-2h2zM16 18h-2v-2h2v2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M18 18h2v-2h-2v-2h2v-2h-2v-2h2V8h-2v2h-2V8h-2v2h2v2h-2v2h2v2h2v2zm-2-4v-2h2v2h-2z" fill="%23555D65"/%3E%3Cpath d="M18 18v2h-2v-2h2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M8 10V8H6v2H4v2h2v2H4v2h2v2H4v2h2v2H4v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2v2h-2V4h-2v2h-2V4h-2v2h-2V4h-2v2h2v2h-2v2H8zm0 2v-2H6v2h2zm2 0v-2h2v2h-2zm0 2v-2H8v2H6v2h2v2H6v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h-2v2h-2V6h-2v2h-2v2h2v2h-2v2h-2z" fill="%23555D65"/%3E%3Cpath fill-rule="evenodd" clip-rule="evenodd" d="M4 0H2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v2H0v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h2V0h-2v2h-2V0h-2v2h-2V0h-2v2h-2V0h-2v2h-2V0h-2v2H8V0H6v2H4V0zm0 4V2H2v2h2zm2 0V2h2v2H6zm0 2V4H4v2H2v2h2v2H2v2h2v2H2v2h2v2H2v2h2v2H2v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2v-2h-2v-2h2V8h-2V6h2V4h-2V2h-2v2h-2V2h-2v2h-2V2h-2v2h-2V2h-2v2H8v2H6z" fill="%23555D65"/%3E%3C/svg%3E');
}

.components-circular-option-picker__option {
  display: inline-block;
  vertical-align: top;
  height: 100% !important;
  aspect-ratio: 1;
  border: none;
  border-radius: 50%;
  background: transparent;
  box-shadow: inset 0 0 0 14px;
}
@media not (prefers-reduced-motion) {
  .components-circular-option-picker__option {
    transition: 100ms box-shadow ease;
  }
}
.components-circular-option-picker__option {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-circular-option-picker__option[aria-pressed=true], .components-circular-option-picker__option[aria-selected=true] {
  position: relative;
  z-index: 1;
  overflow: visible;
}
.components-circular-option-picker__option[aria-pressed=true] + svg, .components-circular-option-picker__option[aria-selected=true] + svg {
  position: absolute;
  right: 2px;
  top: 2px;
  border-radius: 50%;
  z-index: 2;
  pointer-events: none;
}
.components-circular-option-picker__option::after {
  content: "";
  position: absolute;
  inset: -1px;
  border: 1px solid transparent;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}

.components-circular-option-picker__button-action .components-circular-option-picker__option {
  color: #fff;
  background: #fff;
}

.components-circular-option-picker__dropdown-link-action {
  margin-left: 16px;
}
.components-circular-option-picker__dropdown-link-action .components-button {
  line-height: 22px;
}

.components-palette-edit__popover-gradient-picker,
.components-palette-edit__popover-duotone-picker {
  width: 260px;
  padding: 8px;
}

.component-color-indicator {
  width: 20px;
  height: 20px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
  display: inline-block;
  padding: 0;
  background: #fff linear-gradient(45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
}

.components-combobox-control {
  width: 100%;
}

input.components-combobox-control__input[type=text] {
  width: 100%;
  border: none;
  box-shadow: none;
  font-family: inherit;
  font-size: 16px;
  padding: 2px;
  margin: 0;
  line-height: inherit;
  min-height: auto;
  background: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
@media (min-width: 600px) {
  input.components-combobox-control__input[type=text] {
    font-size: 13px;
  }
}
input.components-combobox-control__input[type=text]:focus {
  outline: none;
  box-shadow: none;
}

.components-combobox-control__suggestions-container {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-combobox-control__suggestions-container {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-combobox-control__suggestions-container:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-combobox-control__suggestions-container:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-combobox-control__suggestions-container::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-combobox-control__suggestions-container {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  width: 100%;
  padding: 0;
}
.components-combobox-control__suggestions-container:focus-within {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-combobox-control__suggestions-container .components-spinner {
  margin: 0;
}

.components-color-palette__custom-color-wrapper {
  position: relative;
  z-index: 0;
}

.components-color-palette__custom-color-button {
  position: relative;
  border: none;
  background: none;
  height: 64px;
  width: 100%;
  box-sizing: border-box;
  cursor: var(--wpds-cursor-control, pointer);
  outline: 1px solid transparent;
  border-radius: 4px 4px 0 0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
}
.components-color-palette__custom-color-button:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-color-palette__custom-color-button::after {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: -1;
  border-radius: 3px 3px 0 0;
  background-image: repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
  background-position: 0 0, 24px 24px;
  background-size: 48px 48px;
}

.components-color-palette__custom-color-text-wrapper {
  padding: 12px 16px;
  border-radius: 0 0 4px 4px;
  position: relative;
  font-size: 13px;
  box-shadow: inset 0 -1px 0 0 rgba(0, 0, 0, 0.2), inset -1px 0 0 0 rgba(0, 0, 0, 0.2), inset 1px 0 0 0 rgba(0, 0, 0, 0.2);
}

.components-color-palette__custom-color-name {
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  margin: 0 1px;
}

.components-color-palette__custom-color-value {
  color: #757575;
}
.components-color-palette__custom-color-value--is-hex {
  text-transform: uppercase;
}
.components-color-palette__custom-color-value:empty::after {
  content: "​";
  visibility: hidden;
}

.components-custom-gradient-picker__gradient-bar {
  border-radius: 2px;
  width: 100%;
  height: 48px;
  position: relative;
  z-index: 1;
}
.components-custom-gradient-picker__gradient-bar.has-gradient {
  background-image: repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0), repeating-linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%, #e0e0e0);
  background-position: 0 0, 12px 12px;
  background-size: 24px 24px;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__gradient-bar-background {
  position: absolute;
  inset: 0;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__markers-container {
  position: relative;
  width: calc(100% - 48px);
  margin-right: auto;
  margin-left: auto;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-dropdown {
  position: absolute;
  height: 16px;
  width: 16px;
  top: 16px;
  display: flex;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown::before,
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button::before {
  content: "";
  position: absolute;
  inset: -16px 0;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown {
  height: inherit;
  width: inherit;
  min-width: 16px !important;
  border-radius: 50%;
  background: #fff;
  padding: 2px;
  color: #1e1e1e;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__insert-point-dropdown svg {
  height: 100%;
  width: 100%;
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button {
  height: inherit;
  width: inherit;
  border-radius: 50%;
  padding: 0;
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button.is-active {
  box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus) * 2) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button:focus:not(:active) {
  outline-offset: 1px;
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25), 0 0 0 calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) + 2px) var(--wpds-color-background-surface-neutral-strong, #fff);
}
.components-custom-gradient-picker__gradient-bar .components-custom-gradient-picker__control-point-button:focus:not(:active).is-active {
  box-shadow: inset 0 0 0 calc(var(--wp-admin-border-width-focus) * 2) #fff, 0 0 2px 0 rgba(0, 0, 0, 0.25), 0 0 0 calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) + 2px) var(--wpds-color-background-surface-neutral-strong, #fff);
}

.components-custom-gradient-picker__remove-control-point-wrapper {
  padding-bottom: 8px;
}

.components-custom-gradient-picker__inserter {
  direction: ltr;
}

.components-custom-gradient-picker__liner-gradient-indicator {
  display: inline-block;
  flex: 0 auto;
  width: 20px;
  height: 20px;
}

.components-custom-gradient-picker__ui-line {
  position: relative;
  z-index: 0;
}

.components-drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 40;
  visibility: hidden;
  opacity: 0;
  border-radius: 2px;
}
.components-drop-zone.is-active {
  opacity: 1;
  visibility: visible;
}
.components-drop-zone .components-drop-zone__content {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  background-color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  align-items: center;
  justify-content: center;
  z-index: 50;
  text-align: center;
  color: #fff;
  opacity: 0;
  pointer-events: none;
}
.components-drop-zone .components-drop-zone__content-inner {
  opacity: 0;
  transform: scale(0.9);
}
.components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content {
  opacity: 1;
}
@media not (prefers-reduced-motion) {
  .components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content {
    transition: opacity 0.2s ease-in-out;
  }
}
.components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content-inner {
  opacity: 1;
  transform: scale(1);
}
@media not (prefers-reduced-motion) {
  .components-drop-zone.is-active.is-dragging-over-element .components-drop-zone__content-inner {
    transition: opacity 0.1s ease-in-out 0.1s, transform 0.1s ease-in-out 0.1s;
  }
}

.components-drop-zone__content-icon,
.components-drop-zone__content-text {
  display: block;
}

.components-drop-zone__content-icon {
  margin: 0 auto 8px;
  line-height: 0;
  fill: currentColor;
  pointer-events: none;
}

.components-drop-zone__content-text {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-dropdown {
  display: inline-block;
}

.components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black)) !important;
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight !important;
    color: HighlightText !important;
  }
}
.components-dropdown__content .components-button[role^=menuitem]:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed) !important;
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
    outline: var(--wpds-border-width-xs, 1px) solid GrayText;
    outline-offset: 0;
  }
}
.components-dropdown__content .components-button[role^=menuitem][aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-dropdown__content .components-popover__content {
  padding: 8px;
}
.components-dropdown__content .components-popover__content:has(.components-menu-group) {
  padding: 0;
}
.components-dropdown__content .components-popover__content:has(.components-menu-group) .components-dropdown-menu__menu > .components-menu-item__button,
.components-dropdown__content .components-popover__content:has(.components-menu-group) > .components-menu-item__button {
  margin: 8px;
  width: auto;
}
.components-dropdown__content [role=menuitem] {
  white-space: nowrap;
}
.components-dropdown__content .components-menu-group {
  padding: 8px;
}
.components-dropdown__content .components-menu-group + .components-menu-group {
  border-top: 1px solid #ccc;
  padding: 8px;
}
.components-dropdown__content.is-alternate .components-menu-group + .components-menu-group {
  border-color: #1e1e1e;
}

.components-dropdown-menu__toggle {
  vertical-align: top;
}

.components-dropdown-menu__menu {
  width: 100%;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  line-height: 1.4;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item,
.components-dropdown-menu__menu .components-menu-item {
  width: 100%;
  padding: 6px;
  outline: none;
  cursor: var(--wpds-cursor-control, pointer);
  white-space: nowrap;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.has-separator,
.components-dropdown-menu__menu .components-menu-item.has-separator {
  margin-top: 6px;
  position: relative;
  overflow: visible;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.has-separator::before,
.components-dropdown-menu__menu .components-menu-item.has-separator::before {
  display: block;
  content: "";
  box-sizing: content-box;
  background-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  position: absolute;
  top: -3px;
  right: 0;
  left: 0;
  height: 1px;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-active svg,
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-active .dashicon,
.components-dropdown-menu__menu .components-menu-item.is-active svg,
.components-dropdown-menu__menu .components-menu-item.is-active .dashicon {
  color: #fff;
  background: #1e1e1e;
  box-shadow: 0 0 0 1px #1e1e1e;
  border-radius: 1px;
}
.components-dropdown-menu__menu .components-dropdown-menu__menu-item.is-icon-only,
.components-dropdown-menu__menu .components-menu-item.is-icon-only {
  width: auto;
}
.components-dropdown-menu__menu .components-menu-item__button,
.components-dropdown-menu__menu .components-menu-item__button.components-button {
  min-height: 32px;
  height: auto;
  text-align: right;
  padding-right: 8px;
  padding-left: 8px;
  padding-top: 3px;
  padding-bottom: 3px;
}
.components-dropdown-menu__menu .components-menu-item__button.has-icon,
.components-dropdown-menu__menu .components-menu-item__button.components-button.has-icon {
  padding-top: 5px;
  padding-bottom: 5px;
}

.components-duotone-picker__color-indicator::before {
  background: transparent;
}

.components-duotone-picker__color-indicator > .components-button {
  background: linear-gradient(45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button.is-pressed:hover:not(:disabled) {
  background: linear-gradient(45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button:hover:not(:disabled):not([aria-disabled=true]) {
  color: transparent;
}
.components-duotone-picker__color-indicator > .components-button:not([aria-disabled=true]):active {
  color: transparent;
}

.components-color-list-picker,
.components-color-list-picker__swatch-button {
  width: 100%;
}

.components-color-list-picker__color-picker {
  margin: 8px 0;
}

.components-color-list-picker__swatch-color {
  margin: 2px;
}

.components-external-link {
  border-radius: var(--wpds-border-radius-sm, 2px);
  color: var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9));
  text-decoration: none;
}
.components-external-link:visited {
  color: var(--wpds-color-foreground-interactive-brand, var(--wp-admin-theme-color, #3858e9));
}
.components-external-link:hover, .components-external-link:active {
  color: var(--wpds-color-foreground-interactive-brand-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 52%, black));
}
.components-external-link:focus {
  box-shadow: none;
  border-radius: var(--wpds-border-radius-sm, 2px);
}
.components-external-link:focus:not(:active) {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}

.components-external-link__contents {
  text-decoration: underline;
  text-underline-offset: 0.2em;
  text-decoration-thickness: from-font;
}

.components-external-link__icon {
  line-height: 1;
  display: inline-block;
  margin-inline-start: var(--wpds-dimension-padding-xs, 4px);
  font-weight: var(--wpds-typography-font-weight-default, 400);
}

.components-form-toggle {
  position: relative;
  isolation: isolate;
  display: inline-block;
  height: 16px;
}
.components-form-toggle .components-form-toggle__track {
  content: "";
  display: inline-block;
  box-sizing: border-box;
  vertical-align: top;
  background-color: var(--wpds-color-background-interactive-neutral-weak, #0000);
  border: 1px solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  width: 32px;
  height: 16px;
  border-radius: 8px;
}
@media not (prefers-reduced-motion) {
  .components-form-toggle .components-form-toggle__track {
    transition: 0.2s background-color ease, 0.2s border-color ease;
  }
}
.components-form-toggle .components-form-toggle__thumb {
  display: block;
  position: absolute;
  box-sizing: border-box;
  top: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
@media not (prefers-reduced-motion) {
  .components-form-toggle .components-form-toggle__thumb {
    transition: 0.2s transform ease, 0.2s background-color ease-out;
  }
}
.components-form-toggle .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02), 0 3px 3px rgba(0, 0, 0, 0.02), 0 4px 4px rgba(0, 0, 0, 0.01);
  border: 6px solid transparent;
}
@media (forced-colors: active) {
  .components-form-toggle .components-form-toggle__thumb {
    background-color: ButtonText;
  }
}
.components-form-toggle:not(.is-checked, .is-disabled):hover .components-form-toggle__track {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-form-toggle.is-checked .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9));
  border-color: transparent;
}
@media (forced-colors: active) {
  .components-form-toggle.is-checked .components-form-toggle__track {
    background-color: Highlight;
  }
}
.components-form-toggle .components-form-toggle__input:focus + .components-form-toggle__track {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-form-toggle.is-checked .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-brand-strong, #fff);
  border-width: 0;
  transform: translateX(-16px);
}
@media (forced-colors: active) {
  .components-form-toggle.is-checked .components-form-toggle__thumb {
    background-color: HighlightText;
  }
}
.components-form-toggle.is-disabled .components-form-toggle__track, [inert] .components-form-toggle .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled .components-form-toggle__track, [inert] .components-form-toggle .components-form-toggle__track {
    border-color: GrayText;
  }
}
.components-form-toggle.is-disabled .components-form-toggle__thumb, [inert] .components-form-toggle .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled .components-form-toggle__thumb, [inert] .components-form-toggle .components-form-toggle__thumb {
    background-color: GrayText;
    border-color: GrayText;
  }
}
.components-form-toggle.is-disabled.is-checked .components-form-toggle__track, [inert] .components-form-toggle.is-checked .components-form-toggle__track {
  background-color: var(--wpds-color-background-interactive-brand-strong-disabled, #e6e6e6);
  border-color: transparent;
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled.is-checked .components-form-toggle__track, [inert] .components-form-toggle.is-checked .components-form-toggle__track {
    background-color: GrayText;
  }
}
.components-form-toggle.is-disabled.is-checked .components-form-toggle__thumb, [inert] .components-form-toggle.is-checked .components-form-toggle__thumb {
  background-color: var(--wpds-color-foreground-interactive-brand-strong-disabled, #8d8d8d);
}
@media (forced-colors: active) {
  .components-form-toggle.is-disabled.is-checked .components-form-toggle__thumb, [inert] .components-form-toggle.is-checked .components-form-toggle__thumb {
    background-color: Canvas;
  }
}

.components-form-toggle input.components-form-toggle__input[type=checkbox] {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  margin: 0;
  padding: 0;
  z-index: 1;
  border: none;
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]:checked {
  background: none;
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]::before {
  content: "";
}
.components-form-toggle input.components-form-toggle__input[type=checkbox]:not(:disabled, [aria-disabled=true]) {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-form-token-field__input-container {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-form-token-field__input-container {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-form-token-field__input-container:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-form-token-field__input-container:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-form-token-field__input-container::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-form-token-field__input-container {
  width: 100%;
  padding: 0;
  cursor: text;
}
.components-form-token-field__input-container.is-disabled {
  background: var(--wp-components-color-gray-100, var(--wpds-color-background-surface-neutral, #fcfcfc));
  border-color: var(--wp-components-color-gray-400, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
  cursor: default;
}
.components-form-token-field__input-container.is-disabled:hover {
  border-color: var(--wp-components-color-gray-400, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
}
.components-form-token-field__input-container.is-active {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-form-token-field__input-container input[type=text].components-form-token-field__input {
  display: inline-block;
  flex: 1;
  font-family: inherit;
  font-size: 16px;
  line-height: 1;
  width: 100%;
  max-width: 100%;
  margin-right: 4px;
  padding: 0;
  min-height: 24px;
  min-width: 50px;
  background: inherit;
  border: 0;
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  box-shadow: none;
}
@media (min-width: 600px) {
  .components-form-token-field__input-container input[type=text].components-form-token-field__input {
    font-size: 13px;
  }
}
.components-form-token-field__input-container input[type=text].components-form-token-field__input:focus, .components-form-token-field.is-active .components-form-token-field__input-container input[type=text].components-form-token-field__input {
  outline: none;
  box-shadow: none;
}
.components-form-token-field__input-container .components-form-token-field__token + input[type=text].components-form-token-field__input {
  width: auto;
}

.components-form-token-field__token {
  font-size: 13px;
  display: flex;
  color: #1e1e1e;
  max-width: 100%;
}
.components-form-token-field__token.is-success .components-form-token-field__token-text,
.components-form-token-field__token.is-success .components-form-token-field__remove-token {
  background: #4ab866;
}
.components-form-token-field__token.is-error .components-form-token-field__token-text,
.components-form-token-field__token.is-error .components-form-token-field__remove-token {
  background: #cc1818;
}
.components-form-token-field__token.is-validating .components-form-token-field__token-text,
.components-form-token-field__token.is-validating .components-form-token-field__remove-token {
  color: #757575;
}
.components-form-token-field__token.is-disabled .components-form-token-field__token-text,
.components-form-token-field__token.is-disabled .components-form-token-field__remove-token.components-button {
  background: var(--wp-components-color-gray-100, var(--wpds-color-background-surface-neutral, #fcfcfc));
  color: var(--wp-components-color-gray-600, var(--wpds-color-stroke-interactive-neutral, #8d8d8d));
}
.components-form-token-field__token.is-borderless {
  position: relative;
  padding: 0 0 0 24px;
}
.components-form-token-field__token.is-borderless .components-form-token-field__token-text {
  background: transparent;
}
.components-form-token-field__token.is-borderless:not(.is-disabled) .components-form-token-field__token-text {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}
.components-form-token-field__token.is-borderless .components-form-token-field__remove-token {
  background: transparent;
  color: #757575;
  position: absolute;
  top: 1px;
  left: 0;
}
.components-form-token-field__token.is-borderless.is-success .components-form-token-field__token-text {
  color: #4ab866;
}
.components-form-token-field__token.is-borderless.is-error .components-form-token-field__token-text {
  color: #cc1818;
  padding: 0 6px 0 4px;
}
.components-form-token-field__token.is-borderless.is-validating .components-form-token-field__token-text {
  color: #1e1e1e;
}

.components-form-token-field__token-text,
.components-form-token-field__remove-token.components-button {
  display: inline-block;
  height: auto;
  background: #ddd;
  min-width: unset;
}
@media not (prefers-reduced-motion) {
  .components-form-token-field__token-text,
  .components-form-token-field__remove-token.components-button {
    transition: all 0.2s cubic-bezier(0.4, 1, 0.4, 1);
  }
}

.components-form-token-field__token-text {
  border-radius: 0 1px 1px 0;
  padding: 0 8px 0 0;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.components-form-token-field__remove-token.components-button {
  border-radius: 1px 0 0 1px;
  color: #1e1e1e;
  line-height: 10px;
  overflow: initial;
}
.components-form-token-field__remove-token.components-button:hover:not(:disabled) {
  color: #1e1e1e;
}

.components-form-token-field__suggestions-list {
  flex: 1 0 100%;
  min-width: 100%;
  max-height: 128px;
  overflow-y: auto;
}
@media not (prefers-reduced-motion) {
  .components-form-token-field__suggestions-list {
    transition: all 0.15s ease-in-out;
  }
}
.components-form-token-field__suggestions-list {
  list-style: none;
  box-shadow: inset 0 1px 0 0 #949494;
  margin: 0;
  padding: 0;
}

.components-form-token-field__suggestion {
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  display: block;
  font-size: 13px;
  padding: 8px 12px;
  min-height: 32px;
  margin: 0;
  box-sizing: border-box;
}
.components-form-token-field__suggestion.is-selected:not([aria-disabled=true], .is-empty) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black));
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff);
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-form-token-field__suggestion.is-selected:not([aria-disabled=true], .is-empty) {
    forced-color-adjust: none;
    background-color: Highlight;
    color: HighlightText;
  }
}
.components-form-token-field__suggestion[aria-disabled=true] {
  pointer-events: none;
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-form-token-field__suggestion[aria-disabled=true].is-selected {
  background: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}
.components-form-token-field__suggestion:not(.is-empty) {
  cursor: var(--wpds-cursor-control, pointer);
}

@media (min-width: 600px) {
  .components-guide {
    width: 600px;
  }
}
.components-guide .components-modal__content {
  padding: 0;
  margin-top: 0;
}
.components-guide .components-modal__content::before {
  content: none;
}
.components-guide .components-modal__header {
  border-bottom: none;
  padding: 0;
  position: sticky;
  height: 64px;
}
.components-guide .components-modal__header .components-button {
  align-self: flex-start;
  margin: 8px 0 0 8px;
  position: static;
}
.components-guide .components-guide__container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-top: -64px;
  min-height: 100%;
}
.components-guide .components-guide__page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}
@media (min-width: 600px) {
  .components-guide .components-guide__page {
    min-height: 300px;
  }
}
.components-guide .components-guide__footer {
  align-content: center;
  display: flex;
  height: 36px;
  justify-content: center;
  margin: 0 0 24px 0;
  padding: 0 24px;
  position: relative;
  width: 100%;
}
.components-guide .components-guide__page-control {
  margin: 0;
  text-align: center;
}
.components-guide .components-guide__page-control li {
  display: inline-block;
  margin: 0;
}
.components-guide .components-guide__page-control .components-button {
  margin: -6px 0;
  color: #e0e0e0;
}
.components-guide .components-guide__page-control li[aria-current=step] .components-button {
  color: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
}

.components-modal__frame.components-guide {
  border: none;
  min-width: 312px;
  max-height: 575px;
}
@media (max-width: 600px) {
  .components-modal__frame.components-guide {
    margin: auto;
    max-width: calc(100vw - 16px * 2);
  }
}

.components-button.components-guide__back-button, .components-button.components-guide__forward-button, .components-button.components-guide__finish-button {
  position: absolute;
}
.components-button.components-guide__back-button {
  right: 24px;
}
.components-button.components-guide__forward-button, .components-button.components-guide__finish-button {
  left: 24px;
}

[role=region] {
  position: relative;
}
[role=region].interface-interface-skeleton__content:focus-visible::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1000000;
}

.is-focusing-regions [role=region]:focus::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1000000;
}
.is-focusing-regions.is-distraction-free .interface-interface-skeleton__header .edit-post-header,
.is-focusing-regions .interface-interface-skeleton__sidebar .editor-layout__toggle-sidebar-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-layout__toggle-publish-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-layout__toggle-entities-saved-states-panel,
.is-focusing-regions .interface-interface-skeleton__actions:focus .editor-post-publish-panel {
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(2 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(2 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
}

.components-input-control__container:focus-within:not(:has(:is(.components-input-control__prefix, .components-input-control__suffix):focus-within)) .components-input-control__backdrop {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}

.components-menu-group + .components-menu-group {
  padding-top: 8px;
  border-top: 1px solid #1e1e1e;
}
.components-menu-group + .components-menu-group.has-hidden-separator {
  border-top: none;
  margin-top: 0;
  padding-top: 0;
}

.components-menu-group:has(> div:empty) {
  display: none;
}

.components-menu-group__label {
  padding: 0 8px;
  margin-top: 4px;
  margin-bottom: 12px;
  color: #757575;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  white-space: nowrap;
}

.components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]),
.components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 93%, black)) !important;
  color: var(--wpds-color-foreground-interactive-brand-strong-active, #fff) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]),
  .components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) {
    forced-color-adjust: none;
    background-color: Highlight !important;
    color: HighlightText !important;
  }
}
.components-menu-item__button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info,
.components-menu-item__button.components-button:is(:focus, [aria-selected=true]):not(:disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]),
.components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed) !important;
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e) !important;
  outline: none;
  box-shadow: none;
}
@media (forced-colors: active) {
  .components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]),
  .components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) {
    outline: var(--wpds-border-width-xs, 1px) solid GrayText;
    outline-offset: 0;
  }
}
.components-menu-item__button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info,
.components-menu-item__button.components-button[aria-expanded=true]:not(:focus, [aria-selected=true], :disabled, [aria-disabled=true]) .components-menu-item__info {
  color: inherit;
}
.components-menu-item__button,
.components-menu-item__button.components-button {
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-menu-item__button[role=menuitemradio] .components-menu-item__item:only-child, .components-menu-item__button[role=menuitemcheckbox] .components-menu-item__item:only-child,
.components-menu-item__button.components-button[role=menuitemradio] .components-menu-item__item:only-child,
.components-menu-item__button.components-button[role=menuitemcheckbox] .components-menu-item__item:only-child {
  padding-left: 46px;
  box-sizing: initial;
}
.components-menu-item__button .components-menu-items__item-icon,
.components-menu-item__button.components-button .components-menu-items__item-icon {
  display: inline-block;
  flex: 0 0 auto;
}
.components-menu-item__button .components-menu-items__item-icon.has-icon-right,
.components-menu-item__button.components-button .components-menu-items__item-icon.has-icon-right {
  margin-left: -2px;
  margin-right: 24px;
}
.components-menu-item__button .components-menu-item__shortcut + .components-menu-items__item-icon.has-icon-right,
.components-menu-item__button.components-button .components-menu-item__shortcut + .components-menu-items__item-icon.has-icon-right {
  margin-right: 8px;
}
.components-menu-item__button .block-editor-block-icon,
.components-menu-item__button.components-button .block-editor-block-icon {
  margin-right: -2px;
  margin-left: 8px;
}
.components-menu-item__button.is-primary,
.components-menu-item__button.components-button.is-primary {
  justify-content: center;
}
.components-menu-item__button.is-primary .components-menu-item__item,
.components-menu-item__button.components-button.is-primary .components-menu-item__item {
  margin-left: 0;
}
.components-menu-item__button:disabled.is-tertiary, .components-menu-item__button[aria-disabled=true].is-tertiary,
.components-menu-item__button.components-button:disabled.is-tertiary,
.components-menu-item__button.components-button[aria-disabled=true].is-tertiary {
  background: none;
  color: var(--wp-components-color-accent-darker-10, var(--wp-admin-theme-color-darker-10, #2145e6));
  opacity: 0.3;
}

.components-menu-item__info-wrapper {
  display: flex;
  flex-direction: column;
  margin-left: auto;
}

.components-menu-item__info {
  margin-top: 4px;
  font-size: 12px;
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
  white-space: normal;
}

.components-menu-item__item {
  white-space: nowrap;
  min-width: 160px;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
}

.components-menu-item__shortcut {
  align-self: center;
  margin-left: 0;
  margin-right: auto;
  padding-right: 24px;
  color: currentColor;
  display: none;
}
@media (min-width: 480px) {
  .components-menu-item__shortcut {
    display: inline;
  }
}

.components-menu-items-choice,
.components-menu-items-choice.components-button {
  min-height: 40px;
  height: auto;
}
.components-menu-items-choice svg,
.components-menu-items-choice.components-button svg {
  margin-left: 12px;
}
.components-menu-items-choice.has-icon,
.components-menu-items-choice.components-button.has-icon {
  padding-right: 12px;
}

body.modal-open {
  overflow: hidden;
}

.components-modal__screen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.35);
  z-index: 100000;
  display: flex;
}
@keyframes __wp-base-styles-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media not (prefers-reduced-motion) {
  .components-modal__screen-overlay {
    animation: __wp-base-styles-fade-in var(--wpds-motion-duration-sm, 100ms) var(--wpds-motion-easing-subtle, cubic-bezier(0.15, 0, 0.15, 1)) 0s;
    animation-fill-mode: forwards;
  }
}
@keyframes __wp-base-styles-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
@media not (prefers-reduced-motion) {
  .components-modal__screen-overlay.is-animating-out {
    animation: __wp-base-styles-fade-out var(--wpds-motion-duration-sm, 100ms) var(--wpds-motion-easing-subtle, cubic-bezier(0.15, 0, 0.15, 1)) var(--wpds-motion-duration-xs, 50ms);
    animation-fill-mode: forwards;
  }
}

.components-modal__frame {
  box-sizing: border-box;
}
.components-modal__frame *,
.components-modal__frame *::before,
.components-modal__frame *::after {
  box-sizing: inherit;
}
.components-modal__frame {
  align-self: flex-end;
  margin: 0;
  width: 100%;
  max-height: calc(100% - var(--wpds-dimension-gap-3xl, 40px));
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08), 0 15px 27px rgba(0, 0, 0, 0.07), 0 30px 36px rgba(0, 0, 0, 0.04), 0 50px 43px rgba(0, 0, 0, 0.02);
}
@media (forced-colors: active) {
  .components-modal__frame {
    outline: var(--wpds-border-width-xs, 1px) solid CanvasText;
  }
}
.components-modal__frame {
  border-radius: var(--wpds-border-radius-lg, 8px) var(--wpds-border-radius-lg, 8px) 0 0;
  overflow: hidden;
  display: flex;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
  animation-name: components-modal__appear-animation;
  animation-fill-mode: forwards;
  animation-timing-function: var(--wpds-motion-easing-expressive, cubic-bezier(0.25, 0, 0, 1));
}
.components-modal__frame h1,
.components-modal__frame h2,
.components-modal__frame h3 {
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
@media not (prefers-reduced-motion) {
  .components-modal__frame {
    animation-duration: var(--wpds-motion-duration-md, 200ms);
  }
}
.components-modal__screen-overlay.is-animating-out .components-modal__frame {
  animation-name: components-modal__disappear-animation;
  animation-timing-function: var(--wpds-motion-easing-expressive, cubic-bezier(0.25, 0, 0, 1));
}
@media (min-width: 600px) {
  .components-modal__frame {
    align-self: auto;
    border-radius: var(--wpds-border-radius-lg, 8px);
    margin: auto;
    width: auto;
    min-width: var(--wpds-dimension-surface-width-sm, 320px);
    max-width: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
    max-height: calc(100% - 128px);
  }
  .components-modal__frame.has-size-small, .components-modal__frame.has-size-medium, .components-modal__frame.has-size-large {
    width: 100%;
  }
  .components-modal__frame.has-size-small {
    max-width: var(--wpds-dimension-surface-width-md, 400px);
  }
  .components-modal__frame.has-size-medium {
    max-width: var(--wpds-dimension-surface-width-lg, 560px);
  }
  .components-modal__frame.has-size-large {
    max-width: var(--wpds-dimension-surface-width-2xl, 960px);
  }
}
@media (min-width: 960px) {
  .components-modal__frame {
    max-height: 70%;
  }
}
.components-modal__frame.is-full-screen {
  margin: 0;
  width: 100%;
  height: 100%;
  max-height: none;
  border-radius: 0;
}
.components-modal__frame.is-full-screen :where(.components-modal__content) {
  display: flex;
  margin-bottom: var(--wpds-dimension-gap-xl, 24px);
  padding-bottom: 0;
}
.components-modal__frame.is-full-screen :where(.components-modal__content) > :last-child {
  flex: 1;
}
@media (min-width: 600px) {
  .components-modal__frame.is-full-screen {
    margin: auto;
    border-radius: var(--wpds-border-radius-lg, 8px);
    width: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
    height: calc(100% - var(--wpds-dimension-gap-lg, 16px) * 2);
  }
}
@media (min-width: 782px) {
  .components-modal__frame.is-full-screen {
    width: calc(100% - var(--wpds-dimension-gap-3xl, 40px) * 2);
    height: calc(100% - var(--wpds-dimension-gap-3xl, 40px) * 2);
    max-width: none;
  }
}

@keyframes components-modal__appear-animation {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes components-modal__disappear-animation {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(100%);
  }
}
@media (min-width: 600px) {
  @keyframes components-modal__appear-animation {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  @keyframes components-modal__disappear-animation {
    from {
      opacity: 1;
      transform: scale(1);
    }
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }
}
.components-modal__header {
  box-sizing: border-box;
  border-bottom: var(--wpds-border-width-xs, 1px) solid transparent;
  padding: var(--wpds-dimension-padding-2xl, 24px);
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: calc(64px + var(--wpds-dimension-padding-sm, 8px));
  width: 100%;
  z-index: 10;
  position: absolute;
  top: 0;
  right: 0;
}
.components-modal__header .components-modal__header-heading {
  font-size: var(--wpds-typography-font-size-xl, 20px);
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
}
.components-modal__header h1 {
  line-height: 1;
  margin: 0;
}
.components-modal__content.has-scrolled-content:not(.hide-header) .components-modal__header {
  border-bottom-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.components-modal__header + p {
  margin-top: 0;
}

.components-modal__header-heading-container {
  align-items: center;
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
}

.components-modal__header-icon-container {
  display: inline-block;
}
.components-modal__header-icon-container svg {
  max-width: 36px;
  max-height: 36px;
  padding: var(--wpds-dimension-padding-sm, 8px);
}

.components-modal__content {
  flex: 1;
  margin-top: calc(64px + var(--wpds-dimension-padding-sm, 8px));
  padding: var(--wpds-dimension-padding-xs, 4px) var(--wpds-dimension-padding-2xl, 24px) var(--wpds-dimension-padding-2xl, 24px);
  overflow: auto;
}
.components-modal__content.hide-header {
  margin-top: 0;
  padding-top: var(--wpds-dimension-padding-2xl, 24px);
}
.components-modal__content.is-scrollable:focus-visible {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}

.components-notice {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-info-weak, #f3f9ff);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-info, #adc6e2);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-info, #001b4f);
  box-sizing: border-box;
  isolation: isolate;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
  padding: var(--wpds-dimension-padding-md, 12px);
  border: var(--wpds-border-width-xs, 1px) solid var(--wp-components-notice-border-color);
  border-radius: var(--wpds-border-radius-lg, 8px);
  background-color: var(--wp-components-notice-background-color);
  color: var(--wp-components-notice-text-color);
  font-family: var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif);
  font-size: var(--wpds-typography-font-size-md, 13px);
  line-height: var(--wpds-typography-line-height-sm, 20px);
}
.components-notice.is-success {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-success-weak, #ebffed);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-success, #92d39d);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-success, #002900);
}
.components-notice.is-warning {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-warning-weak, #fff7e1);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-warning, #e1bd7c);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-warning, #2e1900);
}
.components-notice.is-error {
  --wp-components-notice-background-color: var(--wpds-color-background-surface-error-weak, #fff6f5);
  --wp-components-notice-border-color: var(--wpds-color-stroke-surface-error, #e0afa7);
  --wp-components-notice-text-color: var(--wpds-color-foreground-content-error, #470000);
}

.components-notice__content {
  grid-column: 1;
  grid-row: 1;
  padding-block: calc((var(--wpds-dimension-size-sm, 24px) - 1lh) / 2);
}

.components-notice__actions {
  grid-column: 1;
  grid-row: 2;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--wpds-dimension-gap-md, 12px);
  margin-top: var(--wpds-dimension-gap-sm, 8px);
}

.components-notice__dismiss {
  grid-column: 2;
  grid-row: 1;
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
  margin-inline-start: var(--wpds-dimension-gap-xs, 4px);
  mix-blend-mode: luminosity;
}
.components-notice__dismiss:not(:disabled):not([aria-disabled=true]):not(.is-secondary):hover, .components-notice__dismiss:not(:disabled):not([aria-disabled=true]):not(.is-secondary):active, .components-notice__dismiss:not(:disabled):not([aria-disabled=true]):focus {
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e);
}
@media (forced-colors: active) {
  .components-notice__dismiss {
    mix-blend-mode: normal;
  }
}

.components-notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--wpds-dimension-gap-md, 12px);
  max-width: 100vw;
  box-sizing: border-box;
}

.components-panel {
  background: #fff;
  border: 1px solid #e0e0e0;
}
.components-panel > .components-panel__header:first-child,
.components-panel > .components-panel__body:first-child {
  margin-top: -1px;
}
.components-panel > .components-panel__header:last-child,
.components-panel > .components-panel__body:last-child {
  border-bottom-width: 0;
}

.components-panel + .components-panel {
  margin-top: -1px;
}

.components-panel__body {
  border-top: 1px solid #e0e0e0;
  border-bottom: 1px solid #e0e0e0;
}
.components-panel__body h3 {
  margin: 0 0 0.5em;
}
.components-panel__body.is-opened {
  padding: 16px;
}

.components-panel__header {
  display: flex;
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  box-sizing: content-box;
  height: 47px;
}
.components-panel__header h2 {
  margin: 0;
  font-size: inherit;
  color: inherit;
}

.components-panel__body + .components-panel__body,
.components-panel__body + .components-panel__header,
.components-panel__header + .components-panel__body,
.components-panel__header + .components-panel__header {
  margin-top: -1px;
}

.components-panel__body > .components-panel__body-title {
  display: block;
  padding: 0;
  font-size: inherit;
  margin-top: 0;
  margin-bottom: 0;
}
@media not (prefers-reduced-motion) {
  .components-panel__body > .components-panel__body-title {
    transition: 0.1s background ease-in-out;
  }
}

.components-panel__body.is-opened > .components-panel__body-title {
  margin: -16px;
  margin-bottom: 5px;
}

.components-panel__body > .components-panel__body-title:hover {
  background: #f0f0f0;
  border: none;
}

.components-panel__body-toggle.components-button {
  position: relative;
  padding: 16px 16px 16px 48px;
  width: 100%;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  text-align: right;
  color: #1e1e1e;
}
@media not (prefers-reduced-motion) {
  .components-panel__body-toggle.components-button {
    transition: 0.1s background ease-in-out;
  }
}
.components-panel__body-toggle.components-button {
  height: auto;
}
.components-panel__body-toggle.components-button:focus {
  outline-offset: calc(var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) * -1);
  border-radius: 0;
}
.components-panel__body-toggle.components-button .components-panel__arrow {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #1e1e1e;
  fill: currentColor;
}
@media not (prefers-reduced-motion) {
  .components-panel__body-toggle.components-button .components-panel__arrow {
    transition: 0.1s color ease-in-out;
  }
}
.components-panel__body-toggle.components-button {
}
body.rtl .components-panel__body-toggle.components-button .dashicons-arrow-right {
  transform: scaleX(-1);
  margin-top: -10px;
}
.components-panel__body-toggle.components-button {
}

.components-panel__icon {
  color: #757575;
  margin: -2px 6px -2px 0;
}

.components-panel__body-toggle-icon {
  margin-left: -5px;
}

.components-panel__color-title {
  float: right;
  height: 19px;
}

.components-panel__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  min-height: 36px;
}
.components-panel__row select {
  min-width: 0;
}
.components-panel__row label {
  margin-left: 12px;
  flex-shrink: 0;
  max-width: 75%;
}
.components-panel__row:empty, .components-panel__row:first-of-type {
  margin-top: 0;
}

.components-panel .circle-picker {
  padding-bottom: 20px;
}

.components-placeholder.components-placeholder {
  font-size: 13px;
  box-sizing: border-box;
  position: relative;
  padding: 24px;
  width: 100%;
  text-align: right;
  margin: 0;
  color: #1e1e1e;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  -webkit-font-smoothing: subpixel-antialiased;
  border-radius: 2px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  outline: 1px solid transparent;
}

.components-placeholder__error,
.components-placeholder__instructions,
.components-placeholder__label,
.components-placeholder__fieldset {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  letter-spacing: initial;
  line-height: initial;
  text-transform: none;
  font-weight: 400;
}

.components-placeholder__label {
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  align-items: center;
  display: flex;
}
.components-placeholder__label > svg,
.components-placeholder__label .dashicon,
.components-placeholder__label .block-editor-block-icon {
  margin-left: 4px;
  fill: currentColor;
}
.components-placeholder__label:empty {
  display: none;
}

.components-placeholder__fieldset,
.components-placeholder__fieldset form {
  display: flex;
  flex-direction: row;
  width: 100%;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: flex-start;
}
.components-placeholder__fieldset p,
.components-placeholder__fieldset form p {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-placeholder__fieldset.is-column-layout,
.components-placeholder__fieldset.is-column-layout form {
  flex-direction: column;
}

.components-placeholder__input[type=url] {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-placeholder__input[type=url] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-placeholder__input[type=url]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-placeholder__input[type=url]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-placeholder__input[type=url]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-placeholder__input[type=url] {
  flex: 1 1 auto;
}

.components-placeholder__error {
  width: 100%;
  gap: 8px;
}

.components-placeholder__fieldset .components-button:not(.is-link) ~ .components-button.is-link {
  margin-right: 10px;
  margin-left: 10px;
}
.components-placeholder__fieldset .components-button:not(.is-link) ~ .components-button.is-link:last-child {
  margin-left: 0;
}

.components-placeholder.is-medium .components-placeholder__instructions, .components-placeholder.is-small .components-placeholder__instructions {
  display: none;
}
.components-placeholder.is-medium .components-placeholder__fieldset,
.components-placeholder.is-medium .components-placeholder__fieldset form, .components-placeholder.is-small .components-placeholder__fieldset,
.components-placeholder.is-small .components-placeholder__fieldset form {
  flex-direction: column;
}
.components-placeholder.is-medium .components-placeholder__fieldset > *,
.components-placeholder.is-medium .components-button, .components-placeholder.is-small .components-placeholder__fieldset > *,
.components-placeholder.is-small .components-button {
  width: 100%;
  justify-content: center;
}
.components-placeholder.is-small {
  padding: 16px;
}

/**
 * Dashed style placeholders
 */
.components-placeholder.has-illustration {
  color: inherit;
  display: flex;
  box-shadow: none;
  border-radius: 0;
  backdrop-filter: blur(100px);
  background-color: transparent;
  backface-visibility: hidden;
}
.is-dark-theme .components-placeholder.has-illustration {
  background-color: rgba(0, 0, 0, 0.1);
}
.components-placeholder.has-illustration .components-placeholder__fieldset {
  margin-right: 0;
  margin-left: 0;
}
.components-placeholder.has-illustration .components-placeholder__label,
.components-placeholder.has-illustration .components-placeholder__instructions,
.components-placeholder.has-illustration .components-button {
  opacity: 0;
  pointer-events: none;
}
@media not (prefers-reduced-motion) {
  .components-placeholder.has-illustration .components-placeholder__label,
  .components-placeholder.has-illustration .components-placeholder__instructions,
  .components-placeholder.has-illustration .components-button {
    transition: opacity 0.1s linear;
  }
}
.is-selected > .components-placeholder.has-illustration .components-placeholder__label,
.is-selected > .components-placeholder.has-illustration .components-placeholder__instructions,
.is-selected > .components-placeholder.has-illustration .components-button {
  opacity: 1;
  pointer-events: auto;
}
.components-placeholder.has-illustration::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: none;
  background: currentColor;
  opacity: 0.1;
}
.components-placeholder.has-illustration {
  overflow: hidden;
}
.is-selected .components-placeholder.has-illustration {
  overflow: auto;
}

.components-placeholder__preview {
  display: flex;
  justify-content: center;
}

.components-placeholder__illustration {
  box-sizing: content-box;
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  width: 100%;
  height: 100%;
  stroke: currentColor;
  opacity: 0.25;
}

.components-popover {
  box-sizing: border-box;
}
.components-popover *,
.components-popover *::before,
.components-popover *::after {
  box-sizing: inherit;
}
.components-popover {
  z-index: 1000000;
}
.components-popover.is-expanded {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  z-index: 1000000 !important;
}

.components-popover__content {
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  box-shadow: 0 0 0 var(--wpds-border-width-xs, 1px) var(--wpds-color-stroke-surface-neutral, #dbdbdb), 0 2px 3px rgba(0, 0, 0, 0.05), 0 4px 5px rgba(0, 0, 0, 0.04), 0 12px 12px rgba(0, 0, 0, 0.03), 0 16px 16px rgba(0, 0, 0, 0.02);
  border-radius: var(--wpds-border-radius-md, 4px);
  box-sizing: border-box;
  width: min-content;
}
.is-alternate .components-popover__content {
  box-shadow: 0 0 0 1px #1e1e1e;
  border-radius: 2px;
}
.is-unstyled .components-popover__content {
  background: none;
  border-radius: 0;
  box-shadow: none;
}
.components-popover.is-expanded .components-popover__content {
  position: static;
  height: calc(100% - 48px);
  overflow-y: visible;
  width: auto;
  box-shadow: 0 calc(var(--wpds-border-width-xs, 1px) * -1) 0 0 var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.components-popover.is-expanded.is-alternate .components-popover__content {
  box-shadow: 0 -1px 0 #1e1e1e;
}
@media (forced-colors: active) {
  .components-popover:where(:not(.is-unstyled):not(.is-expanded)) .components-popover__content {
    outline: var(--wpds-border-width-xs, 1px) solid transparent;
  }
}

.components-popover__header {
  align-items: center;
  background: var(--wpds-color-background-surface-neutral-strong, #fff);
  display: flex;
  height: 48px;
  justify-content: space-between;
  padding: 0 16px 0 8px;
}

.components-popover__header-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.components-popover__arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  pointer-events: none;
  display: flex;
}
.components-popover__arrow::before {
  content: "";
  position: absolute;
  top: calc(var(--wpds-border-width-xs, 1px) * -1);
  right: 1px;
  height: calc(var(--wpds-border-width-xs, 1px) * 2);
  left: 1px;
  background-color: var(--wpds-color-background-surface-neutral-strong, #fff);
}
@media (forced-colors: active) {
  .components-popover__arrow::before {
    background-color: Canvas;
  }
}
.components-popover__arrow.is-top {
  bottom: -14px !important;
  transform: rotate(0);
}
.components-popover__arrow.is-right {
  left: -14px !important;
  transform: rotate(90deg);
}
.components-popover__arrow.is-bottom {
  top: -14px !important;
  transform: rotate(180deg);
}
.components-popover__arrow.is-left {
  /*rtl:begin:ignore*/
  right: -14px !important;
  transform: rotate(-90deg);
}

.components-popover__triangle {
  display: block;
  flex: 1;
}

.components-popover__triangle-bg {
  fill: var(--wpds-color-background-surface-neutral-strong, #fff);
}
@media (forced-colors: active) {
  .components-popover__triangle-bg {
    fill: Canvas;
  }
}

.components-popover__triangle-border {
  fill: transparent;
  stroke-width: var(--wpds-border-width-xs, 1px);
  stroke: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
}
.is-alternate .components-popover__triangle-border {
  stroke: #1e1e1e;
}
@media (forced-colors: active) {
  .components-popover:not(.is-unstyled) .components-popover__triangle-border {
    stroke: CanvasText;
  }
}

.components-radio-control {
  border: 0;
  margin: 0;
  padding: 0;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
}

.components-radio-control__help {
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
}

.components-radio-control__option {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto minmax(0, max-content);
  column-gap: 8px;
  align-items: center;
}

.components-radio-control__input[type=radio] {
  grid-column: 1;
  grid-row: 1;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  background: var(--wpds-color-background-interactive-neutral-weak, #0000);
  transition: none;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  min-width: 16px;
  max-width: 16px;
  position: relative;
}
.components-radio-control__input[type=radio]::after {
  content: "";
  position: absolute;
  top: 50%;
  right: 50%;
  width: 24px;
  aspect-ratio: 1;
  transform: translate(50%, -50%);
}
.components-radio-control__input[type=radio]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-radio-control__input[type=radio]:hover {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-radio-control__input[type=radio]:checked::before {
  box-sizing: inherit;
  width: 8px;
  height: 8px;
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  margin: 0;
  background-color: currentColor;
  border: 4px solid currentColor;
}
.components-radio-control__input[type=radio]:checked {
  background: var(--wpds-color-background-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9));
  border-color: transparent;
  color: var(--wpds-color-foreground-interactive-brand-strong, #fff);
}
.components-radio-control__input[type=radio][aria-disabled=true], .components-radio-control__input[type=radio]:disabled {
  background: var(--wpds-color-background-interactive-neutral-weak-disabled, #0000);
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  cursor: default;
  opacity: 1;
}
@media (forced-colors: active) {
  .components-radio-control__input[type=radio][aria-disabled=true], .components-radio-control__input[type=radio]:disabled {
    color: GrayText;
    border-color: GrayText;
  }
}
.components-radio-control__input[type=radio] {
  display: inline-flex;
  margin: 0;
  padding: 0;
  appearance: none;
}
.components-radio-control__input[type=radio]:not(:disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-radio-control__input[type=radio]:checked::before {
  content: "";
  border-radius: 50%;
}
.components-radio-control__input[type=radio]:disabled:checked::before {
  opacity: 1;
}

.components-radio-control__label {
  grid-column: 2;
  grid-row: 1;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-radio-control__input:not(:disabled) + .components-radio-control__label {
  cursor: var(--wpds-cursor-control, pointer);
}
.components-radio-control__label {
  line-height: 16px;
}

.components-radio-control__option-description {
  grid-column: 2;
  grid-row: 2;
  padding-block-start: 4px;
}
.components-radio-control__option-description.components-radio-control__option-description {
  margin-top: 0;
}

.components-resizable-box__handle {
  display: none;
  width: 23px;
  height: 23px;
  z-index: 2;
}
.components-resizable-box__container.has-show-handle .components-resizable-box__handle {
  display: block;
}
.components-resizable-box__handle > div {
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 2;
  outline: none;
}

.components-resizable-box__container > img {
  width: inherit;
}

.components-resizable-box__handle::after {
  display: block;
  content: "";
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  cursor: inherit;
  position: absolute;
  top: calc(50% - 8px);
  left: calc(50% - 8px);
  box-shadow: inset 0 0 0 var(--wp-admin-border-width-focus) var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9)), 0 1px 1px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02), 0 3px 3px rgba(0, 0, 0, 0.02), 0 4px 4px rgba(0, 0, 0, 0.01);
  outline: 2px solid transparent;
}

.components-resizable-box__side-handle::before {
  display: block;
  border-radius: 9999px;
  content: "";
  width: 3px;
  height: 3px;
  background: var(--wp-components-color-accent, var(--wp-admin-theme-color, #3858e9));
  cursor: inherit;
  position: absolute;
  top: calc(50% - 1px);
  left: calc(50% - 1px);
}
@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle::before {
    transition: transform 0.1s ease-in;
    will-change: transform;
  }
}
.components-resizable-box__side-handle::before {
  opacity: 0;
}

.components-resizable-box__side-handle {
  z-index: 2;
}

.components-resizable-box__corner-handle {
  z-index: 2;
}

.components-resizable-box__side-handle.components-resizable-box__handle-top,
.components-resizable-box__side-handle.components-resizable-box__handle-bottom,
.components-resizable-box__side-handle.components-resizable-box__handle-top::before,
.components-resizable-box__side-handle.components-resizable-box__handle-bottom::before {
  width: 100%;
  right: 0;
  border-right: 0;
  border-left: 0;
}

.components-resizable-box__side-handle.components-resizable-box__handle-left,
.components-resizable-box__side-handle.components-resizable-box__handle-right,
.components-resizable-box__side-handle.components-resizable-box__handle-left::before,
.components-resizable-box__side-handle.components-resizable-box__handle-right::before {
  height: 100%;
  top: 0;
  border-top: 0;
  border-bottom: 0;
}

@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle.components-resizable-box__handle-top:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-bottom:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-top:active::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-bottom:active::before {
    animation: components-resizable-box__top-bottom-animation 0.1s ease-out 0s;
    animation-fill-mode: forwards;
  }
}

@media not (prefers-reduced-motion) {
  .components-resizable-box__side-handle.components-resizable-box__handle-left:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-right:hover::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-left:active::before,
  .components-resizable-box__side-handle.components-resizable-box__handle-right:active::before {
    animation: components-resizable-box__left-right-animation 0.1s ease-out 0s;
    animation-fill-mode: forwards;
  }
}

/* This CSS is shown only to Safari, which has a bug with table-caption making it jumpy.
See https://bugs.webkit.org/show_bug.cgi?id=187903. */
@media not all and (min-resolution: 0.001dpcm) {
  @supports (-webkit-appearance: none) {
    .components-resizable-box__side-handle.components-resizable-box__handle-top:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-bottom:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-top:active::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-bottom:active::before {
      animation: none;
    }
    .components-resizable-box__side-handle.components-resizable-box__handle-left:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-right:hover::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-left:active::before,
    .components-resizable-box__side-handle.components-resizable-box__handle-right:active::before {
      animation: none;
    }
  }
}
@keyframes components-resizable-box__top-bottom-animation {
  from {
    transform: scaleX(0);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}
@keyframes components-resizable-box__left-right-animation {
  from {
    transform: scaleY(0);
    opacity: 0;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}
.components-resizable-box__handle-right {
  right: calc(11.5px * -1);
}

.components-resizable-box__handle-left {
  left: calc(11.5px * -1);
}

.components-resizable-box__handle-top {
  top: calc(11.5px * -1);
}

.components-resizable-box__handle-bottom {
  bottom: calc(11.5px * -1);
}
.components-responsive-wrapper {
  position: relative;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.components-responsive-wrapper__content {
  display: block;
  max-width: 100%;
  width: 100%;
}

.components-sandbox {
  overflow: hidden;
}

iframe.components-sandbox {
  width: 100%;
}

html.lockscroll,
body.lockscroll {
  overflow: hidden;
}

.components-select-control__input {
  outline: 0;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0) !important;
}

.components-snackbar {
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(16px) saturate(180%);
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 3px rgba(0, 0, 0, 0.04), 0 6px 6px rgba(0, 0, 0, 0.03), 0 8px 8px rgba(0, 0, 0, 0.02);
  color: #fff;
  padding: 12px 20px;
  width: 100%;
  max-width: var(--wpds-dimension-surface-width-lg, 560px);
  box-sizing: border-box;
  cursor: var(--wpds-cursor-control, pointer);
  pointer-events: auto;
}
@media (min-width: 600px) {
  .components-snackbar {
    width: fit-content;
  }
}
.components-snackbar:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
}
.components-snackbar.components-snackbar-explicit-dismiss {
  cursor: default;
}
.components-snackbar .components-snackbar__content-with-icon {
  position: relative;
  padding-right: 24px;
}
.components-snackbar .components-snackbar__icon {
  position: absolute;
  right: -8px;
  top: calc((5.8px) / -2);
}
.components-snackbar .components-snackbar__dismiss-button {
  margin-right: 24px;
  cursor: var(--wpds-cursor-control, pointer);
}

.components-snackbar__action.components-button,
.components-snackbar__action.components-external-link {
  margin-right: 32px;
  color: #fff;
  flex-shrink: 0;
  --focus-color: #fff;
}
.components-snackbar__action.components-button:hover,
.components-snackbar__action.components-external-link:hover {
  text-decoration: none;
  color: currentColor;
}

.components-snackbar__content {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  line-height: 1.4;
}

.components-snackbar-list {
  position: absolute;
  z-index: 100000;
  width: 100%;
  box-sizing: border-box;
  pointer-events: none;
}

.components-snackbar-list__notice-container {
  position: relative;
  padding-top: 8px;
}

.components-tab-panel__tabs {
  display: flex;
  align-items: stretch;
  flex-direction: row;
}
.components-tab-panel__tabs[aria-orientation=vertical] {
  flex-direction: column;
}

.components-tab-panel__tabs-item {
  position: relative;
  isolation: isolate;
  border-radius: 0;
  height: 48px !important;
  background: transparent;
  border: none;
  cursor: var(--wpds-cursor-control, pointer);
  padding: 3px var(--wpds-dimension-padding-lg, 16px);
  margin-right: 0;
  font-weight: var(--wpds-typography-font-weight-default, 400);
}
.components-tab-panel__tabs-item[aria-selected=true] {
  cursor: default;
}
.components-tab-panel__tabs-item:disabled, .components-tab-panel__tabs-item[aria-disabled=true] {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]) {
  color: var(--wpds-color-foreground-interactive-neutral, #1e1e1e);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):is(:hover, :active):not([aria-selected=true]), .components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):focus-visible {
  color: var(--wpds-color-foreground-interactive-neutral-active, #1e1e1e);
}
.components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):is(:hover, :active):not([aria-selected=true])::before, .components-tab-panel__tabs .components-tab-panel__tabs-item:not(:disabled, [aria-disabled=true]):focus-visible::before {
  background-color: var(--wpds-color-background-interactive-neutral-weak-active, #ededed);
}
.components-tab-panel__tabs-item:focus:not(:disabled) {
  position: relative;
  outline: none;
}
.components-tab-panel__tabs-item::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: none;
  background: currentColor;
  height: calc(0 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
  border-radius: 0;
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs-item::after {
    transition: height 0.1s linear;
  }
}
.components-tab-panel__tabs-item.is-active::after {
  height: calc(1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
  outline: 2px solid transparent;
  outline-offset: -1px;
}
.components-tab-panel__tabs-item::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: var(--wpds-dimension-padding-md, 12px);
  pointer-events: none;
  border-radius: var(--wpds-border-radius-sm, 2px);
}
.components-tab-panel__tabs-item:focus-visible::before {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::before {
  inset: 0;
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label {
  position: relative;
  display: inline-flex;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::after {
  inset-block-start: 50%;
  inset-block-end: auto;
  inset-inline: 0 auto;
  width: 0;
  height: var(--wpds-dimension-size-sm, 24px);
  transform: translateY(-50%);
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item::after {
    transition-property: width;
  }
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item:not(.has-icon)::after {
  content: none;
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: calc(-1 * var(--wpds-dimension-padding-lg, 16px));
  width: 0;
  background: currentColor;
  pointer-events: none;
}
@media not (prefers-reduced-motion) {
  .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item .components-tab-panel__tabs-item-label::after {
    transition: width 0.1s linear;
  }
}
.components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item.is-active::after, .components-tab-panel__tabs[aria-orientation=vertical] .components-tab-panel__tabs-item.is-active .components-tab-panel__tabs-item-label::after {
  width: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline: 2px solid transparent;
  outline-offset: -1px;
}

.components-tab-panel__tab-content:focus {
  outline: none;
}
.components-tab-panel__tab-content:focus-visible {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: 0;
}

.components-text-control__input,
.components-text-control__input[type=text],
.components-text-control__input[type=tel],
.components-text-control__input[type=time],
.components-text-control__input[type=url],
.components-text-control__input[type=week],
.components-text-control__input[type=password],
.components-text-control__input[type=color],
.components-text-control__input[type=date],
.components-text-control__input[type=datetime],
.components-text-control__input[type=datetime-local],
.components-text-control__input[type=email],
.components-text-control__input[type=month],
.components-text-control__input[type=number] {
  width: 100%;
  height: 40px;
  margin: 0;
  background: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  color: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 6px 8px;
  /* Fonts smaller than 16px causes mobile safari to zoom. */
  font-size: 16px;
  /* Override core line-height. To be reviewed. */
  line-height: normal;
  border: var(--wpds-border-width-xs, 1px) solid var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  border-radius: var(--wpds-border-radius-sm, 2px);
}
@media (min-width: 600px) {
  .components-text-control__input,
  .components-text-control__input[type=text],
  .components-text-control__input[type=tel],
  .components-text-control__input[type=time],
  .components-text-control__input[type=url],
  .components-text-control__input[type=week],
  .components-text-control__input[type=password],
  .components-text-control__input[type=color],
  .components-text-control__input[type=date],
  .components-text-control__input[type=datetime],
  .components-text-control__input[type=datetime-local],
  .components-text-control__input[type=email],
  .components-text-control__input[type=month],
  .components-text-control__input[type=number] {
    font-size: 13px;
    /* Override core line-height. To be reviewed. */
    line-height: normal;
  }
}
.components-text-control__input:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=text]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=tel]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=time]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=url]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=week]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=password]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=color]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=date]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=datetime]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=datetime-local]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=email]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=month]:hover:not(:disabled, [aria-disabled=true]),
.components-text-control__input[type=number]:hover:not(:disabled, [aria-disabled=true]) {
  border-color: var(--wpds-color-stroke-interactive-neutral-active, #6e6e6e);
}
.components-text-control__input:focus,
.components-text-control__input[type=text]:focus,
.components-text-control__input[type=tel]:focus,
.components-text-control__input[type=time]:focus,
.components-text-control__input[type=url]:focus,
.components-text-control__input[type=week]:focus,
.components-text-control__input[type=password]:focus,
.components-text-control__input[type=color]:focus,
.components-text-control__input[type=date]:focus,
.components-text-control__input[type=datetime]:focus,
.components-text-control__input[type=datetime-local]:focus,
.components-text-control__input[type=email]:focus,
.components-text-control__input[type=month]:focus,
.components-text-control__input[type=number]:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  border-color: var(--wpds-color-stroke-interactive-neutral, #8d8d8d);
  box-shadow: none;
}
.components-text-control__input::placeholder,
.components-text-control__input[type=text]::placeholder,
.components-text-control__input[type=tel]::placeholder,
.components-text-control__input[type=time]::placeholder,
.components-text-control__input[type=url]::placeholder,
.components-text-control__input[type=week]::placeholder,
.components-text-control__input[type=password]::placeholder,
.components-text-control__input[type=color]::placeholder,
.components-text-control__input[type=date]::placeholder,
.components-text-control__input[type=datetime]::placeholder,
.components-text-control__input[type=datetime-local]::placeholder,
.components-text-control__input[type=email]::placeholder,
.components-text-control__input[type=month]::placeholder,
.components-text-control__input[type=number]::placeholder {
  color: rgba(30, 30, 30, 0.62);
}
.components-text-control__input,
.components-text-control__input[type=text],
.components-text-control__input[type=tel],
.components-text-control__input[type=time],
.components-text-control__input[type=url],
.components-text-control__input[type=week],
.components-text-control__input[type=password],
.components-text-control__input[type=color],
.components-text-control__input[type=date],
.components-text-control__input[type=datetime],
.components-text-control__input[type=datetime-local],
.components-text-control__input[type=email],
.components-text-control__input[type=month],
.components-text-control__input[type=number] {
  padding-right: 12px;
  padding-left: 12px;
}
.components-text-control__input::placeholder,
.components-text-control__input[type=text]::placeholder,
.components-text-control__input[type=tel]::placeholder,
.components-text-control__input[type=time]::placeholder,
.components-text-control__input[type=url]::placeholder,
.components-text-control__input[type=week]::placeholder,
.components-text-control__input[type=password]::placeholder,
.components-text-control__input[type=color]::placeholder,
.components-text-control__input[type=date]::placeholder,
.components-text-control__input[type=datetime]::placeholder,
.components-text-control__input[type=datetime-local]::placeholder,
.components-text-control__input[type=email]::placeholder,
.components-text-control__input[type=month]::placeholder,
.components-text-control__input[type=number]::placeholder {
  color: color-mix(in srgb, var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e)), transparent 38%);
}
.components-text-control__input:disabled, .components-text-control__input[aria-disabled=true],
.components-text-control__input[type=text]:disabled,
.components-text-control__input[type=text][aria-disabled=true],
.components-text-control__input[type=tel]:disabled,
.components-text-control__input[type=tel][aria-disabled=true],
.components-text-control__input[type=time]:disabled,
.components-text-control__input[type=time][aria-disabled=true],
.components-text-control__input[type=url]:disabled,
.components-text-control__input[type=url][aria-disabled=true],
.components-text-control__input[type=week]:disabled,
.components-text-control__input[type=week][aria-disabled=true],
.components-text-control__input[type=password]:disabled,
.components-text-control__input[type=password][aria-disabled=true],
.components-text-control__input[type=color]:disabled,
.components-text-control__input[type=color][aria-disabled=true],
.components-text-control__input[type=date]:disabled,
.components-text-control__input[type=date][aria-disabled=true],
.components-text-control__input[type=datetime]:disabled,
.components-text-control__input[type=datetime][aria-disabled=true],
.components-text-control__input[type=datetime-local]:disabled,
.components-text-control__input[type=datetime-local][aria-disabled=true],
.components-text-control__input[type=email]:disabled,
.components-text-control__input[type=email][aria-disabled=true],
.components-text-control__input[type=month]:disabled,
.components-text-control__input[type=month][aria-disabled=true],
.components-text-control__input[type=number]:disabled,
.components-text-control__input[type=number][aria-disabled=true] {
  border-color: var(--wpds-color-stroke-interactive-neutral-disabled, #dbdbdb);
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
  background: var(--wpds-color-background-interactive-neutral-disabled, #fff);
}
@media (forced-colors: active) {
  .components-text-control__input:disabled, .components-text-control__input[aria-disabled=true],
  .components-text-control__input[type=text]:disabled,
  .components-text-control__input[type=text][aria-disabled=true],
  .components-text-control__input[type=tel]:disabled,
  .components-text-control__input[type=tel][aria-disabled=true],
  .components-text-control__input[type=time]:disabled,
  .components-text-control__input[type=time][aria-disabled=true],
  .components-text-control__input[type=url]:disabled,
  .components-text-control__input[type=url][aria-disabled=true],
  .components-text-control__input[type=week]:disabled,
  .components-text-control__input[type=week][aria-disabled=true],
  .components-text-control__input[type=password]:disabled,
  .components-text-control__input[type=password][aria-disabled=true],
  .components-text-control__input[type=color]:disabled,
  .components-text-control__input[type=color][aria-disabled=true],
  .components-text-control__input[type=date]:disabled,
  .components-text-control__input[type=date][aria-disabled=true],
  .components-text-control__input[type=datetime]:disabled,
  .components-text-control__input[type=datetime][aria-disabled=true],
  .components-text-control__input[type=datetime-local]:disabled,
  .components-text-control__input[type=datetime-local][aria-disabled=true],
  .components-text-control__input[type=email]:disabled,
  .components-text-control__input[type=email][aria-disabled=true],
  .components-text-control__input[type=month]:disabled,
  .components-text-control__input[type=month][aria-disabled=true],
  .components-text-control__input[type=number]:disabled,
  .components-text-control__input[type=number][aria-disabled=true] {
    border-color: GrayText;
    color: GrayText;
  }
}
.components-text-control__input:disabled::placeholder, .components-text-control__input[aria-disabled=true]::placeholder,
.components-text-control__input[type=text]:disabled::placeholder,
.components-text-control__input[type=text][aria-disabled=true]::placeholder,
.components-text-control__input[type=tel]:disabled::placeholder,
.components-text-control__input[type=tel][aria-disabled=true]::placeholder,
.components-text-control__input[type=time]:disabled::placeholder,
.components-text-control__input[type=time][aria-disabled=true]::placeholder,
.components-text-control__input[type=url]:disabled::placeholder,
.components-text-control__input[type=url][aria-disabled=true]::placeholder,
.components-text-control__input[type=week]:disabled::placeholder,
.components-text-control__input[type=week][aria-disabled=true]::placeholder,
.components-text-control__input[type=password]:disabled::placeholder,
.components-text-control__input[type=password][aria-disabled=true]::placeholder,
.components-text-control__input[type=color]:disabled::placeholder,
.components-text-control__input[type=color][aria-disabled=true]::placeholder,
.components-text-control__input[type=date]:disabled::placeholder,
.components-text-control__input[type=date][aria-disabled=true]::placeholder,
.components-text-control__input[type=datetime]:disabled::placeholder,
.components-text-control__input[type=datetime][aria-disabled=true]::placeholder,
.components-text-control__input[type=datetime-local]:disabled::placeholder,
.components-text-control__input[type=datetime-local][aria-disabled=true]::placeholder,
.components-text-control__input[type=email]:disabled::placeholder,
.components-text-control__input[type=email][aria-disabled=true]::placeholder,
.components-text-control__input[type=month]:disabled::placeholder,
.components-text-control__input[type=month][aria-disabled=true]::placeholder,
.components-text-control__input[type=number]:disabled::placeholder,
.components-text-control__input[type=number][aria-disabled=true]::placeholder {
  color: var(--wpds-color-foreground-interactive-neutral-disabled, #8d8d8d);
}

.components-text-control__input[type=email],
.components-text-control__input[type=url] {
  direction: ltr;
}

.components-tip {
  display: flex;
  color: #757575;
}
.components-tip svg {
  align-self: center;
  color: #f0b849;
  flex-shrink: 0;
  margin-left: 16px;
}
.components-tip p {
  margin: 0;
}

.components-toggle-control__label {
  line-height: 16px;
  color: var(--wpds-color-foreground-content-neutral, #1e1e1e);
}
.components-toggle-control__label:not(.is-disabled) {
  cursor: var(--wpds-cursor-control, pointer);
}

.components-toggle-control__help {
  display: inline-block;
  margin-inline-start: 40px;
}

.components-accessible-toolbar {
  display: inline-flex;
  border: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  border-radius: 2px;
  flex-shrink: 0;
}
.components-accessible-toolbar > .components-toolbar-group:last-child {
  border-left: none;
}
.components-accessible-toolbar.is-unstyled {
  border: none;
}
.components-accessible-toolbar.is-unstyled > .components-toolbar-group {
  border-left: none;
}

.components-accessible-toolbar[aria-orientation=vertical],
.components-toolbar[aria-orientation=vertical] {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.components-accessible-toolbar .components-button,
.components-toolbar .components-button {
  position: relative;
  height: 48px;
  z-index: 1;
  padding-right: 16px;
  padding-left: 16px;
}
.components-accessible-toolbar .components-button:focus:not(:disabled),
.components-toolbar .components-button:focus:not(:disabled) {
  box-shadow: none;
  outline: none;
}
.components-accessible-toolbar .components-button::before,
.components-toolbar .components-button::before {
  content: "";
  position: absolute;
  display: block;
  border-radius: 2px;
  height: 32px;
  right: 8px;
  left: 8px;
  z-index: -1;
}
@media not (prefers-reduced-motion) {
  .components-accessible-toolbar .components-button::before,
  .components-toolbar .components-button::before {
    animation: components-button__appear-animation 0.1s ease;
    animation-fill-mode: forwards;
  }
}
.components-accessible-toolbar .components-button svg,
.components-toolbar .components-button svg {
  position: relative;
  margin-right: auto;
  margin-left: auto;
}
.components-accessible-toolbar .components-button.is-pressed,
.components-toolbar .components-button.is-pressed {
  background: transparent;
}
.components-accessible-toolbar .components-button.is-pressed:hover,
.components-toolbar .components-button.is-pressed:hover {
  background: transparent;
}
.components-accessible-toolbar .components-button.is-pressed::before,
.components-toolbar .components-button.is-pressed::before {
  background: var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
}
.components-accessible-toolbar .components-button:focus::before,
.components-toolbar .components-button:focus::before {
  box-shadow: inset 0 0 0 1px #fff, 0 0 0 var(--wp-admin-border-width-focus) var(--wp-admin-theme-color);
  outline: 2px solid transparent;
}
.components-accessible-toolbar .components-button.has-icon.has-icon,
.components-toolbar .components-button.has-icon.has-icon {
  padding-right: 8px;
  padding-left: 8px;
  min-width: 48px;
}

@keyframes components-button__appear-animation {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}
.components-toolbar__control.components-button {
  position: relative;
}
.components-toolbar__control.components-button[data-subscript] svg {
  padding: 5px 0 5px 10px;
}
.components-toolbar__control.components-button[data-subscript]::after {
  content: attr(data-subscript);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  line-height: 12px;
  position: absolute;
  left: 8px;
  bottom: 10px;
}
.components-toolbar__control.components-button:not(:disabled).is-pressed[data-subscript]::after {
  color: #fff;
}

.components-toolbar-group {
  min-height: 48px;
  border-left: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  background-color: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  display: inline-flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  padding-right: 6px;
  padding-left: 6px;
}
.components-toolbar-group .components-toolbar-group.components-toolbar-group {
  border-width: 0;
  margin: 0;
}
.components-toolbar-group {
  line-height: 0;
}
.components-toolbar-group .components-button.components-button,
.components-toolbar-group .components-button.has-icon.has-icon {
  justify-content: center;
  min-width: 36px;
  padding-right: 6px;
  padding-left: 6px;
}
.components-toolbar-group .components-button.components-button svg,
.components-toolbar-group .components-button.has-icon.has-icon svg {
  min-width: var(--wpds-dimension-size-sm, 24px);
}
.components-toolbar-group .components-button.components-button::before,
.components-toolbar-group .components-button.has-icon.has-icon::before {
  right: 2px;
  left: 2px;
}

.components-toolbar {
  min-height: 48px;
  margin: 0;
  border: 1px solid var(--wp-components-color-foreground, var(--wpds-color-foreground-content-neutral, #1e1e1e));
  background-color: var(--wp-components-color-background, var(--wpds-color-background-surface-neutral-strong, #fff));
  display: inline-flex;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.components-toolbar .components-toolbar.components-toolbar {
  border-width: 0;
  margin: 0;
}

div.components-toolbar > div {
  display: flex;
  margin: 0;
}
div.components-toolbar > div + div.has-left-divider {
  margin-right: 6px;
  position: relative;
  overflow: visible;
}
div.components-toolbar > div + div.has-left-divider::before {
  display: inline-block;
  content: "";
  box-sizing: content-box;
  background-color: var(--wpds-color-stroke-surface-neutral, #dbdbdb);
  position: absolute;
  top: 8px;
  right: -3px;
  width: 1px;
  height: 20px;
}

.components-tooltip {
  background: #1e1e1e;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  border-radius: var(--wpds-border-radius-md, 4px);
  color: #f0f0f0;
  text-align: center;
  line-height: 1.4;
  font-size: 12px;
  padding: 4px 8px;
  z-index: 1000002;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 2px 3px rgba(0, 0, 0, 0.04), 0 6px 6px rgba(0, 0, 0, 0.03), 0 8px 8px rgba(0, 0, 0, 0.02);
}

.components-tooltip__shortcut {
  margin-right: 8px;
}

.components-validated-control__wrapper-with-error-delegate:has(input:invalid[data-validity-visible]) .components-validated-control__content-editable [role=textbox], .components-validated-control__wrapper-with-error-delegate:has(select:invalid[data-validity-visible]) .components-input-control__backdrop, .components-validated-control textarea:invalid[data-validity-visible], .components-validated-control:has(:is(input, select):invalid[data-validity-visible]) .components-input-control__backdrop {
  --focus-color: var(--wpds-color-stroke-interactive-error, #cc1818);
}

.components-validated-control__wrapper-with-error-delegate:has(input:invalid[data-validity-visible]) .components-validated-control__content-editable [role=textbox], .components-validated-control__wrapper-with-error-delegate:has(select:invalid[data-validity-visible]) .components-input-control__backdrop, .components-validated-control textarea:invalid[data-validity-visible], .components-validated-control:has(:is(input, select):invalid[data-validity-visible]) .components-input-control__backdrop {
  border-color: var(--wpds-color-stroke-interactive-error, #cc1818);
}

.components-validated-control__wrapper-with-error-delegate {
  position: relative;
}
.components-validated-control__error-delegate {
  position: absolute;
  top: 0;
  height: 100%;
  width: 100%;
  opacity: 0;
  pointer-events: none;
}

:root {
  --wp-admin-theme-color: #3858e9;
  --wp-admin-theme-color--rgb: 56, 88, 233;
  --wp-admin-theme-color-darker-10: rgb(33.0384615385, 68.7307692308, 230.4615384615);
  --wp-admin-theme-color-darker-10--rgb: 33.0384615385, 68.7307692308, 230.4615384615;
  --wp-admin-theme-color-darker-20: rgb(23.6923076923, 58.1538461538, 214.3076923077);
  --wp-admin-theme-color-darker-20--rgb: 23.6923076923, 58.1538461538, 214.3076923077;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  :root {
    --wp-admin-border-width-focus: 1.5px;
  }
}`})))()}var Xn;function init_content(){return(init_content=e((()=>{Xn=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
:root {
  --wp-block-synced-color: #7a00df;
  --wp-block-synced-color--rgb: 122, 0, 223;
  --wp-bound-block-color: var(--wp-block-synced-color);
  --wp-editor-canvas-background: #ddd;
  --wp-admin-theme-color: #3858e9;
  --wp-admin-theme-color--rgb: 56, 88, 233;
  --wp-admin-theme-color-darker-10: rgb(33.0384615385, 68.7307692308, 230.4615384615);
  --wp-admin-theme-color-darker-10--rgb: 33.0384615385, 68.7307692308, 230.4615384615;
  --wp-admin-theme-color-darker-20: rgb(23.6923076923, 58.1538461538, 214.3076923077);
  --wp-admin-theme-color-darker-20--rgb: 23.6923076923, 58.1538461538, 214.3076923077;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  :root {
    --wp-admin-border-width-focus: 1.5px;
  }
}

body.admin-color-fresh {
  --wp-admin-theme-color: #007cba;
  --wp-admin-theme-color--rgb: 0, 124, 186;
  --wp-admin-theme-color-darker-10: rgb(0, 107, 160.5);
  --wp-admin-theme-color-darker-10--rgb: 0, 107, 160.5;
  --wp-admin-theme-color-darker-20: #005a87;
  --wp-admin-theme-color-darker-20--rgb: 0, 90, 135;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  body.admin-color-fresh {
    --wp-admin-border-width-focus: 1.5px;
  }
}

.block-editor-block-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.block-editor-block-icon.has-colors svg {
  fill: currentColor;
}
.block-editor-block-icon svg {
  min-width: 20px;
  min-height: 20px;
  max-width: 24px;
  max-height: 24px;
}

.block-editor-block-styles .block-editor-block-list__block {
  margin: 0;
}

/**
 * Cross-Block Selection
 */
@keyframes selection-overlay__fade-in-animation {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.4;
  }
}
/* stylelint-disable -- Stylelint is disabled to allow the hack to work. */
_::-webkit-full-page-media, _:future, :root .block-editor-block-list__layout::selection,
_::-webkit-full-page-media, _:future, :root [data-has-multi-selection=true] .block-editor-block-list__layout::selection {
  background-color: transparent;
}

/* stylelint-enable */
.block-editor-block-list__layout {
  position: relative;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::selection, .block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected) ::selection {
  background: transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
  content: "";
  position: absolute;
  z-index: 1;
  pointer-events: none;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: var(--wp-admin-theme-color);
  opacity: 0.4;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
    animation: selection-overlay__fade-in-animation 0.1s ease-out;
    animation-fill-mode: forwards;
  }
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
  outline: 2px solid transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected).is-highlighted::after {
  outline-color: transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted,
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted ~ .is-multi-selected,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[draggable=true]:not(.is-multi-selected),
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[data-draggable=true]:not(.is-multi-selected),
.block-editor-block-list__layout .block-editor-block-list__block:not([contenteditable=true]):focus {
  outline: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted ~ .is-multi-selected::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[draggable=true]:not(.is-multi-selected)::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[data-draggable=true]:not(.is-multi-selected)::after,
.block-editor-block-list__layout .block-editor-block-list__block:not([contenteditable=true]):focus::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(1 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-block-hidden {
  visibility: hidden;
  overflow: hidden;
  height: 0;
  border: none !important;
  padding: 0 !important;
  opacity: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.block-editor-block-list__layout.is-layout-flex:not(.is-vertical) > .is-block-hidden {
  width: 0;
  height: auto;
  align-self: stretch;
  white-space: nowrap !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
}
.block-editor-block-list__layout [class^=components-] {
  -webkit-user-select: text;
          user-select: text;
}

.block-editor-block-list__layout .block-editor-block-list__block {
  position: relative;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-editing-disabled {
  pointer-events: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-negative-margin.is-selected, .block-editor-block-list__layout .block-editor-block-list__block.has-negative-margin.has-child-selected {
  z-index: 20;
}
.block-editor-block-list__layout .block-editor-block-list__block {
  /**
   * Notices
   */
}
.block-editor-block-list__layout .block-editor-block-list__block .components-placeholder .components-with-notices-ui {
  margin: -10px 0 12px 0;
}
.block-editor-block-list__layout .block-editor-block-list__block .components-with-notices-ui {
  margin: 0 0 12px 0;
  width: 100%;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning {
  min-height: 48px;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning > * {
  pointer-events: none;
  -webkit-user-select: none;
          user-select: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning .block-editor-warning {
  pointer-events: all;
}
.block-editor-block-list__layout .block-editor-block-list__block[data-clear=true] {
  float: none;
}
.block-editor-block-list__layout .block-editor-block-list__block:not([draggable=true]), .block-editor-block-list__layout .block-editor-block-list__block:not([data-draggable=true]) {
  cursor: default;
}
.block-editor-block-list__layout .block-editor-block-list__block[draggable=true], .block-editor-block-list__layout .block-editor-block-list__block[data-draggable=true] {
  cursor: grab;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected {
  cursor: default;
}
.block-editor-block-list__layout .block-editor-block-list__block[contenteditable],
.block-editor-block-list__layout .block-editor-block-list__block [contenteditable] {
  cursor: text;
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-hovered:not(.is-selected)::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline):not(.rich-text):not([contenteditable=true]).is-selected::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(1 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-hovered::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-selected::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-highlighted::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-hovered::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-selected::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-highlighted::after {
  outline-color: var(--wp-block-synced-color);
}
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.block-editor-block-list__block:not([contenteditable]):focus::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.block-editor-block-list__block:not([contenteditable]):focus::after {
  outline-color: var(--wp-block-synced-color);
}

@keyframes block-editor-is-editable__animation {
  from {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  to {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0);
  }
}
@keyframes block-editor-is-editable__animation_reduce-motion {
  0% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  99% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  100% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0);
  }
}
.is-root-container:not([inert]) .block-editor-block-list__block.is-selected .block-editor-block-list__block.has-editable-outline::after {
  animation-name: block-editor-is-editable__animation;
  animation-duration: 0.8s;
  animation-timing-function: ease-out;
  animation-delay: 0.1s;
  animation-fill-mode: backwards;
  bottom: 0;
  content: "";
  left: 0;
  pointer-events: none;
  position: absolute;
  right: 0;
  top: 0;
}
@media (prefers-reduced-motion: reduce) {
  .is-root-container:not([inert]) .block-editor-block-list__block.is-selected .block-editor-block-list__block.has-editable-outline::after {
    animation-name: block-editor-is-editable__animation_reduce-motion;
    animation-delay: 0s;
  }
}

.is-focus-mode .block-editor-block-list__block:not(.has-child-selected) {
  opacity: 0.2;
}
@media not (prefers-reduced-motion) {
  .is-focus-mode .block-editor-block-list__block:not(.has-child-selected) {
    transition: opacity 0.1s linear;
  }
}
.is-focus-mode .block-editor-block-list__block:not(.has-child-selected) .block-editor-block-list__block, .is-focus-mode .block-editor-block-list__block:not(.has-child-selected).is-selected, .is-focus-mode .block-editor-block-list__block:not(.has-child-selected).is-multi-selected {
  opacity: 1;
}

.is-focus-mode .block-editor-block-list__block.is-editing-content-only-section.has-child-selected, .is-focus-mode .block-editor-block-list__block.is-editing-content-only-section.has-child-selected .block-editor-block-list__block {
  opacity: 1;
}

.wp-block[data-align=left] > *,
.wp-block[data-align=right] > *,
.wp-block.alignleft,
.wp-block.alignright {
  z-index: 9;
}

.wp-site-blocks > [data-align=left] {
  float: left;
  margin-right: 2em;
}

.wp-site-blocks > [data-align=right] {
  float: right;
  margin-left: 2em;
}

.wp-site-blocks > [data-align=center] {
  justify-content: center;
  margin-left: auto;
  margin-right: auto;
}

/**
 * In-Canvas Inserter
 */
.block-editor-block-list .block-editor-inserter {
  margin: 8px;
  cursor: move;
  cursor: grab;
}

@keyframes block-editor-inserter__toggle__fade-in-animation {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media not (prefers-reduced-motion) {
  .wp-block .block-list-appender .block-editor-inserter__toggle {
    animation: block-editor-inserter__toggle__fade-in-animation 0.1s ease;
    animation-fill-mode: forwards;
  }
}

.block-editor-block-list__block .block-editor-block-list__block-html-textarea {
  display: block;
  margin: 0;
  padding: 12px;
  width: 100%;
  border: none;
  outline: none;
  border-radius: 2px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  resize: none;
  field-sizing: content;
  overflow: auto;
  font-family: Menlo, Consolas, monaco, monospace;
  font-size: 15px;
  line-height: 1.5;
  /*rtl:ignore*/
  direction: ltr;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__block .block-editor-block-list__block-html-textarea {
    transition: padding 0.2s linear;
  }
}
.block-editor-block-list__block .block-editor-block-list__block-html-textarea:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}

.block-editor-block-list__zoom-out-separator {
  /* same color as the iframe's background */
  background: #ddd;
  margin-left: -1px;
  margin-right: -1px;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__zoom-out-separator {
    transition: background-color 0.3s ease;
  }
}
.block-editor-block-list__zoom-out-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #000;
  font-weight: 400;
}
.is-zoomed-out .block-editor-block-list__zoom-out-separator {
  font-size: calc(13px / var(--wp-block-editor-iframe-zoom-out-scale));
}
.block-editor-block-list__zoom-out-separator.is-dragged-over {
  background: #ccc;
}

.has-global-padding > .block-editor-block-list__zoom-out-separator,
.block-editor-block-list__layout.is-root-container.has-global-padding > .block-editor-block-list__zoom-out-separator {
  max-width: none;
  margin: 0 calc(-1 * var(--wp--style--root--padding-right) - 1px) 0 calc(-1 * var(--wp--style--root--padding-left) - 1px) !important;
}

.is-dragging {
  cursor: grabbing;
}

.is-preview-mode {
  pointer-events: none;
}
.is-preview-mode .block-editor-block-list__block {
  pointer-events: auto;
}
.is-preview-mode .block-editor-block-list__block > *:not(.block-editor-block-list__block) {
  pointer-events: none;
}

.block-editor-block-list__block.is-movable-multi-selected:not(.is-partially-selected) {
  cursor: grab;
}
.is-dragging .block-editor-block-list__block.is-movable-multi-selected:not(.is-partially-selected) {
  cursor: grabbing;
}

.block-editor-block-list__drag-count {
  position: fixed;
  z-index: 1001;
  pointer-events: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  border-radius: 12px;
  background: var(--wp-admin-theme-color);
  color: #fff;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.is-vertical .block-list-appender {
  width: 24px;
  margin-right: auto;
  margin-top: 12px;
  margin-left: 12px;
}

.block-list-appender > .block-editor-inserter {
  display: block;
}

.block-editor-block-list__block:not(.is-selected):not(.has-child-selected):not(.block-editor-block-list__layout) .block-editor-block-list__layout > .block-list-appender .block-list-appender__toggle {
  opacity: 0;
  transform: scale(0);
}

.block-editor-block-list__block.has-block-overlay {
  cursor: default;
}
.block-editor-block-list__block.has-block-overlay .block-editor-block-list__block {
  pointer-events: none;
}
.block-editor-block-list__block.has-block-overlay .block-editor-block-list__block.has-block-overlay::before {
  left: 0;
  right: 0;
  width: auto;
}

.block-editor-block-list__layout .is-dragging:not([data-drag-pile]) {
  opacity: 0.1;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile]) iframe {
  pointer-events: none;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile])::selection {
  background: transparent !important;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile])::after {
  content: none !important;
}

[data-drag-pile] .block-editor-block-list__layout .is-dragging:not([data-drag-pile]) {
  visibility: hidden;
}
[data-drag-pile] .block-editor-block-list__layout .is-dragging[data-drag-pile] {
  position: relative;
  z-index: 999;
  box-shadow: 4px 4px 8px rgba(0, 0, 0, 0.15);
}

.block-editor-block-preview__content-iframe .block-list-appender {
  display: none;
}

.block-editor-block-preview__live-content * {
  pointer-events: none;
}
.block-editor-block-preview__live-content .block-list-appender {
  display: none;
}
.block-editor-block-preview__live-content .components-button:disabled {
  opacity: initial;
}
.block-editor-block-preview__live-content .components-placeholder,
.block-editor-block-preview__live-content .block-editor-block-list__block[data-empty=true] {
  display: none;
}

.block-editor-block-variation-picker__variations,
.block-editor-block-variation-picker__skip,
.wp-block-group-placeholder__variations {
  list-style: none;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  padding: 0;
  margin: 0;
  gap: 8px;
  font-size: 12px;
}
.block-editor-block-variation-picker__variations svg,
.block-editor-block-variation-picker__skip svg,
.wp-block-group-placeholder__variations svg {
  fill: #949494;
  color: #949494 !important;
}
.block-editor-block-variation-picker__variations .components-button,
.block-editor-block-variation-picker__skip .components-button,
.wp-block-group-placeholder__variations .components-button {
  padding: 4px;
}
.block-editor-block-variation-picker__variations .components-button:hover,
.block-editor-block-variation-picker__skip .components-button:hover,
.wp-block-group-placeholder__variations .components-button:hover {
  background: none !important;
}
.block-editor-block-variation-picker__variations .components-button:hover svg,
.block-editor-block-variation-picker__skip .components-button:hover svg,
.wp-block-group-placeholder__variations .components-button:hover svg {
  fill: var(--wp-admin-theme-color);
  color: var(--wp-admin-theme-color) !important;
}
.block-editor-block-variation-picker__variations > li,
.block-editor-block-variation-picker__skip > li,
.wp-block-group-placeholder__variations > li {
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.block-editor-button-block-appender {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  color: #1e1e1e;
  border-color: currentColor;
}
.is-dark-theme .block-editor-button-block-appender {
  color: rgba(255, 255, 255, 0.65);
}
.block-editor-button-block-appender:hover {
  color: var(--wp-admin-theme-color);
}
.block-editor-button-block-appender:active {
  color: #000;
}

.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender), .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender), .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender), .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) {
  pointer-events: none;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  border: 1px dashed currentColor;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter {
  opacity: 0;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within {
  opacity: 1;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after {
  border: none;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter {
  opacity: 1;
}
.block-editor-block-list__block:not(.is-selected) > .block-editor-block-list__block > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after {
  border: none;
}
.block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-button-block-appender {
  background-color: var(--wp-admin-theme-color);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
  color: rgba(255, 255, 255, 0.65);
}
@media not (prefers-reduced-motion) {
  .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-button-block-appender {
    transition: background-color 0.2s ease-in-out;
  }
}

/**
 * Default block appender.
 *
 * This component shows up in 3 places:
 * - the black plus that sits at the end of the canvas, if the last block isn't a paragraph
 * - on the right, inside empty paragraphs
 * - absolute positioned and blue inside nesting containers
 */
.block-editor-default-block-appender {
  clear: both;
  margin-left: auto;
  margin-right: auto;
  position: relative;
}
.block-editor-default-block-appender[data-root-client-id=""] .block-editor-default-block-appender__content:hover {
  outline: 1px solid transparent;
}
.block-editor-default-block-appender .block-editor-default-block-appender__content {
  opacity: 0.62;
  text-shadow: none;
  margin-block-start: 0;
  margin-block-end: 0;
}
.block-editor-default-block-appender .components-drop-zone__content-icon {
  display: none;
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon {
  background: #1e1e1e;
  color: #fff;
  padding: 0;
  min-width: 24px;
  height: 24px;
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon:hover {
  color: #fff;
  background: var(--wp-admin-theme-color);
}
@media not (prefers-reduced-motion) {
  .block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon svg {
    transition: transform cubic-bezier(0.165, 0.84, 0.44, 1) 0.2s;
  }
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon.is-pressed svg {
  transform: rotate(45deg);
}

.block-editor-default-block-appender .block-editor-inserter {
  position: absolute;
  top: 0;
  right: 0;
  line-height: 0;
}
.block-editor-default-block-appender .block-editor-inserter:disabled {
  display: none;
}

/**
 * Fixed position appender (right bottom corner).
 *
 * These styles apply to all in-canvas inserters. All in-canvas inserters always
 * exist within a block.
 */
.block-editor-block-list__block .block-list-appender {
  position: absolute;
  list-style: none;
  padding: 0;
  z-index: 2;
  bottom: 0;
  right: 0;
}
.block-editor-block-list__block .block-list-appender.block-list-appender {
  margin: 0;
  line-height: 0;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter:disabled {
  display: none;
}
.block-editor-block-list__block .block-list-appender .block-editor-default-block-appender {
  height: 24px;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle {
  background: #1e1e1e;
  color: #fff;
  padding: 0;
  min-width: 24px;
  height: 24px;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon:hover,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle:hover {
  color: #fff;
  background: var(--wp-admin-theme-color);
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon svg,
  .block-editor-block-list__block .block-list-appender .block-list-appender__toggle svg {
    transition: transform cubic-bezier(0.165, 0.84, 0.44, 1) 0.2s;
  }
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon.is-pressed svg,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle.is-pressed svg {
  transform: rotate(45deg);
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle {
  flex-direction: row;
  box-shadow: none;
  width: 24px;
  display: none;
  padding: 0 !important;
}
.block-editor-block-list__block .block-list-appender .block-editor-default-block-appender__content {
  display: none;
}
.block-editor-block-list__block .block-list-appender:first-child {
  position: relative;
  right: auto;
  align-self: center;
  list-style: none;
  line-height: inherit;
}
.block-editor-block-list__block .block-list-appender:first-child .block-editor-default-block-appender__content {
  display: block;
}

.block-editor-block-list__block.is-selected .block-editor-block-list__layout > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block.is-selected .block-editor-block-list__layout > .block-list-appender .block-list-appender__toggle,
.block-editor-block-list__block.is-selected > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block.is-selected > .block-list-appender .block-list-appender__toggle {
  display: flex;
}

.block-editor-default-block-appender__content {
  cursor: text;
}

.block-editor-iframe__body {
  position: relative;
}

.block-editor-iframe__html {
  transform-origin: top center;
}
@media not (prefers-reduced-motion) {
  .block-editor-iframe__html {
    transition: background-color 400ms;
  }
}
.block-editor-iframe__html.zoom-out-animation {
  position: fixed;
  left: 0;
  right: 0;
  top: calc(-1 * var(--wp-block-editor-iframe-zoom-out-scroll-top, 0px));
  bottom: 0;
  overflow-y: var(--wp-block-editor-iframe-zoom-out-overflow-behavior, scroll);
}
.block-editor-iframe__html.is-zoomed-out {
  transform: translateX(calc((var(--wp-block-editor-iframe-zoom-out-scale-container-width) - var(--wp-block-editor-iframe-zoom-out-container-width, 100vw)) / 2 / var(--wp-block-editor-iframe-zoom-out-scale, 1)));
  scale: var(--wp-block-editor-iframe-zoom-out-scale, 1);
  background-color: var(--wp-editor-canvas-background);
  margin-bottom: calc(-1 * calc(calc(var(--wp-block-editor-iframe-zoom-out-content-height) * (1 - var(--wp-block-editor-iframe-zoom-out-scale, 1))) + calc(2 * var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1)) + 2px));
  padding-top: calc(var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  padding-bottom: calc(var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
}
.block-editor-iframe__html.is-zoomed-out body {
  min-height: calc((var(--wp-block-editor-iframe-zoom-out-inner-height) - calc(2 * var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1))) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
}
.block-editor-iframe__html.is-zoomed-out body > .is-root-container:not(.wp-block-post-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.block-editor-iframe__html.is-zoomed-out body > .is-root-container:not(.wp-block-post-content) > main {
  flex: 1;
}
.block-editor-iframe__html.is-zoomed-out .wp-block[draggable] {
  cursor: grab;
}

.block-editor-media-placeholder__cancel-button.is-link {
  margin: 1em;
  display: block;
}

.block-editor-media-placeholder.is-appender {
  min-height: 0;
}
.block-editor-media-placeholder.is-appender:hover {
  cursor: var(--wpds-cursor-control, pointer);
  box-shadow: 0 0 0 1px var(--wp-admin-theme-color);
}

.block-editor-plain-text {
  box-shadow: none;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  line-height: inherit;
  border: none;
  padding: 0;
  margin: 0;
}

.block-editor-plain-text {
  width: 100%;
  field-sizing: content;
}

.rich-text [data-rich-text-placeholder] {
  pointer-events: none;
}
.rich-text [data-rich-text-placeholder]::after {
  content: attr(data-rich-text-placeholder);
  opacity: 0.62;
  text-shadow: none;
}
.rich-text:focus {
  outline: none;
}

figcaption.block-editor-rich-text__editable [data-rich-text-placeholder]::before {
  opacity: 0.8;
}

[data-rich-text-script] {
  display: inline;
}
[data-rich-text-script]::before {
  content: "</>";
  background: rgb(255, 255, 0);
}

[data-rich-text-comment],
[data-rich-text-format-boundary] {
  border-radius: 2px;
}

[data-rich-text-comment] {
  background-color: currentColor;
}
[data-rich-text-comment] span {
  filter: invert(100%);
  color: currentColor;
  padding: 0 2px;
}

.rich-text [contenteditable=false]::selection {
  background-color: transparent;
}

.is-selected .non-breaking-space {
  background: radial-gradient(circle, #cc1818 2px, transparent 2.5px) center/100% 100% no-repeat;
}

.block-editor-warning {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 1em;
  border: 1px solid #1e1e1e;
  border-radius: 2px;
  background-color: #fff;
}
.block-editor-warning .block-editor-warning__message {
  line-height: 1.4;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  color: #1e1e1e;
  margin: 0;
}
.block-editor-warning p.block-editor-warning__message.block-editor-warning__message {
  min-height: auto;
}
.block-editor-warning .block-editor-warning__contents {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: baseline;
  width: 100%;
  gap: 12px;
}
.block-editor-warning .block-editor-warning__actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.components-popover.block-editor-warning__dropdown {
  z-index: 99998;
}`})))()}var Zn;function init_content_rtl(){return(init_content_rtl=e((()=>{Zn=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
:root {
  --wp-block-synced-color: #7a00df;
  --wp-block-synced-color--rgb: 122, 0, 223;
  --wp-bound-block-color: var(--wp-block-synced-color);
  --wp-editor-canvas-background: #ddd;
  --wp-admin-theme-color: #3858e9;
  --wp-admin-theme-color--rgb: 56, 88, 233;
  --wp-admin-theme-color-darker-10: rgb(33.0384615385, 68.7307692308, 230.4615384615);
  --wp-admin-theme-color-darker-10--rgb: 33.0384615385, 68.7307692308, 230.4615384615;
  --wp-admin-theme-color-darker-20: rgb(23.6923076923, 58.1538461538, 214.3076923077);
  --wp-admin-theme-color-darker-20--rgb: 23.6923076923, 58.1538461538, 214.3076923077;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  :root {
    --wp-admin-border-width-focus: 1.5px;
  }
}

body.admin-color-fresh {
  --wp-admin-theme-color: #007cba;
  --wp-admin-theme-color--rgb: 0, 124, 186;
  --wp-admin-theme-color-darker-10: rgb(0, 107, 160.5);
  --wp-admin-theme-color-darker-10--rgb: 0, 107, 160.5;
  --wp-admin-theme-color-darker-20: #005a87;
  --wp-admin-theme-color-darker-20--rgb: 0, 90, 135;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  body.admin-color-fresh {
    --wp-admin-border-width-focus: 1.5px;
  }
}

.block-editor-block-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}
.block-editor-block-icon.has-colors svg {
  fill: currentColor;
}
.block-editor-block-icon svg {
  min-width: 20px;
  min-height: 20px;
  max-width: 24px;
  max-height: 24px;
}

.block-editor-block-styles .block-editor-block-list__block {
  margin: 0;
}

/**
 * Cross-Block Selection
 */
@keyframes selection-overlay__fade-in-animation {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.4;
  }
}
/* stylelint-disable -- Stylelint is disabled to allow the hack to work. */
_::-webkit-full-page-media, _:future, :root .block-editor-block-list__layout::selection,
_::-webkit-full-page-media, _:future, :root [data-has-multi-selection=true] .block-editor-block-list__layout::selection {
  background-color: transparent;
}

/* stylelint-enable */
.block-editor-block-list__layout {
  position: relative;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::selection, .block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected) ::selection {
  background: transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
  content: "";
  position: absolute;
  z-index: 1;
  pointer-events: none;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: var(--wp-admin-theme-color);
  opacity: 0.4;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
    animation: selection-overlay__fade-in-animation 0.1s ease-out;
    animation-fill-mode: forwards;
  }
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected)::after {
  outline: 2px solid transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected:not(.is-partially-selected).is-highlighted::after {
  outline-color: transparent;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted,
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted ~ .is-multi-selected,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[draggable=true]:not(.is-multi-selected),
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[data-draggable=true]:not(.is-multi-selected),
.block-editor-block-list__layout .block-editor-block-list__block:not([contenteditable=true]):focus {
  outline: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-highlighted ~ .is-multi-selected::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[draggable=true]:not(.is-multi-selected)::after,
.block-editor-block-list__layout .block-editor-block-list__block.is-hovered-draggable[data-draggable=true]:not(.is-multi-selected)::after,
.block-editor-block-list__layout .block-editor-block-list__block:not([contenteditable=true]):focus::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(1 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
  z-index: 1;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-block-hidden {
  visibility: hidden;
  overflow: hidden;
  height: 0;
  border: none !important;
  padding: 0 !important;
  opacity: 0;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}
.block-editor-block-list__layout.is-layout-flex:not(.is-vertical) > .is-block-hidden {
  width: 0;
  height: auto;
  align-self: stretch;
  white-space: nowrap !important;
  margin-right: 0 !important;
  margin-left: 0 !important;
}
.block-editor-block-list__layout [class^=components-] {
  -webkit-user-select: text;
          user-select: text;
}

.block-editor-block-list__layout .block-editor-block-list__block {
  position: relative;
  overflow-wrap: break-word;
  pointer-events: auto;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-editing-disabled {
  pointer-events: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-negative-margin.is-selected, .block-editor-block-list__layout .block-editor-block-list__block.has-negative-margin.has-child-selected {
  z-index: 20;
}
.block-editor-block-list__layout .block-editor-block-list__block {
  /**
   * Notices
   */
}
.block-editor-block-list__layout .block-editor-block-list__block .components-placeholder .components-with-notices-ui {
  margin: -10px 0 12px 0;
}
.block-editor-block-list__layout .block-editor-block-list__block .components-with-notices-ui {
  margin: 0 0 12px 0;
  width: 100%;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning {
  min-height: 48px;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning > * {
  pointer-events: none;
  -webkit-user-select: none;
          user-select: none;
}
.block-editor-block-list__layout .block-editor-block-list__block.has-warning .block-editor-warning {
  pointer-events: all;
}
.block-editor-block-list__layout .block-editor-block-list__block[data-clear=true] {
  float: none;
}
.block-editor-block-list__layout .block-editor-block-list__block:not([draggable=true]), .block-editor-block-list__layout .block-editor-block-list__block:not([data-draggable=true]) {
  cursor: default;
}
.block-editor-block-list__layout .block-editor-block-list__block[draggable=true], .block-editor-block-list__layout .block-editor-block-list__block[data-draggable=true] {
  cursor: grab;
}
.block-editor-block-list__layout .block-editor-block-list__block.is-multi-selected {
  cursor: default;
}
.block-editor-block-list__layout .block-editor-block-list__block[contenteditable],
.block-editor-block-list__layout .block-editor-block-list__block [contenteditable] {
  cursor: text;
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-hovered:not(.is-selected)::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline):not(.rich-text):not([contenteditable=true]).is-selected::after {
  content: "";
  position: absolute;
  pointer-events: none;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  outline-color: var(--wp-admin-theme-color);
  outline-style: solid;
  outline-width: calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  outline-offset: calc(1 * -1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  box-shadow: inset 0 0 0 calc(1 * var(--wp-admin-border-width-focus) / var(--wp-block-editor-iframe-zoom-out-scale, 1) + 0.5px) rgba(255, 255, 255, 0.7);
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-hovered::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-selected::after, .is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-highlighted::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-hovered::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-selected::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.is-highlighted::after {
  outline-color: var(--wp-block-synced-color);
}
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.block-editor-block-list__block:not([contenteditable]):focus::after,
.is-outline-mode .block-editor-block-list__block:not(.remove-outline).is-reusable.block-editor-block-list__block:not([contenteditable]):focus::after {
  outline-color: var(--wp-block-synced-color);
}

@keyframes block-editor-is-editable__animation {
  from {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  to {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0);
  }
}
@keyframes block-editor-is-editable__animation_reduce-motion {
  0% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  99% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0.1);
  }
  100% {
    background-color: rgba(var(--wp-admin-theme-color--rgb), 0);
  }
}
.is-root-container:not([inert]) .block-editor-block-list__block.is-selected .block-editor-block-list__block.has-editable-outline::after {
  animation-name: block-editor-is-editable__animation;
  animation-duration: 0.8s;
  animation-timing-function: ease-out;
  animation-delay: 0.1s;
  animation-fill-mode: backwards;
  bottom: 0;
  content: "";
  right: 0;
  pointer-events: none;
  position: absolute;
  left: 0;
  top: 0;
}
@media (prefers-reduced-motion: reduce) {
  .is-root-container:not([inert]) .block-editor-block-list__block.is-selected .block-editor-block-list__block.has-editable-outline::after {
    animation-name: block-editor-is-editable__animation_reduce-motion;
    animation-delay: 0s;
  }
}

.is-focus-mode .block-editor-block-list__block:not(.has-child-selected) {
  opacity: 0.2;
}
@media not (prefers-reduced-motion) {
  .is-focus-mode .block-editor-block-list__block:not(.has-child-selected) {
    transition: opacity 0.1s linear;
  }
}
.is-focus-mode .block-editor-block-list__block:not(.has-child-selected) .block-editor-block-list__block, .is-focus-mode .block-editor-block-list__block:not(.has-child-selected).is-selected, .is-focus-mode .block-editor-block-list__block:not(.has-child-selected).is-multi-selected {
  opacity: 1;
}

.is-focus-mode .block-editor-block-list__block.is-editing-content-only-section.has-child-selected, .is-focus-mode .block-editor-block-list__block.is-editing-content-only-section.has-child-selected .block-editor-block-list__block {
  opacity: 1;
}

.wp-block[data-align=left] > *,
.wp-block[data-align=right] > *,
.wp-block.alignleft,
.wp-block.alignright {
  z-index: 9;
}

.wp-site-blocks > [data-align=left] {
  float: right;
  margin-left: 2em;
}

.wp-site-blocks > [data-align=right] {
  float: left;
  margin-right: 2em;
}

.wp-site-blocks > [data-align=center] {
  justify-content: center;
  margin-right: auto;
  margin-left: auto;
}

/**
 * In-Canvas Inserter
 */
.block-editor-block-list .block-editor-inserter {
  margin: 8px;
  cursor: move;
  cursor: grab;
}

@keyframes block-editor-inserter__toggle__fade-in-animation {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@media not (prefers-reduced-motion) {
  .wp-block .block-list-appender .block-editor-inserter__toggle {
    animation: block-editor-inserter__toggle__fade-in-animation 0.1s ease;
    animation-fill-mode: forwards;
  }
}

.block-editor-block-list__block .block-editor-block-list__block-html-textarea {
  display: block;
  margin: 0;
  padding: 12px;
  width: 100%;
  border: none;
  outline: none;
  border-radius: 2px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  resize: none;
  field-sizing: content;
  overflow: auto;
  font-family: Menlo, Consolas, monaco, monospace;
  font-size: 15px;
  line-height: 1.5;
  direction: ltr;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__block .block-editor-block-list__block-html-textarea {
    transition: padding 0.2s linear;
  }
}
.block-editor-block-list__block .block-editor-block-list__block-html-textarea:focus {
  outline: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)) solid var(--focus-color, var(--wpds-color-stroke-focus, var(--wp-admin-theme-color, #3858e9)));
  outline-offset: var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px));
  outline-offset: calc(-1 * var(--wpds-border-width-focus, var(--wp-admin-border-width-focus, 2px)));
}

.block-editor-block-list__zoom-out-separator {
  /* same color as the iframe's background */
  background: #ddd;
  margin-right: -1px;
  margin-left: -1px;
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__zoom-out-separator {
    transition: background-color 0.3s ease;
  }
}
.block-editor-block-list__zoom-out-separator {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #000;
  font-weight: 400;
}
.is-zoomed-out .block-editor-block-list__zoom-out-separator {
  font-size: calc(13px / var(--wp-block-editor-iframe-zoom-out-scale));
}
.block-editor-block-list__zoom-out-separator.is-dragged-over {
  background: #ccc;
}

.has-global-padding > .block-editor-block-list__zoom-out-separator,
.block-editor-block-list__layout.is-root-container.has-global-padding > .block-editor-block-list__zoom-out-separator {
  max-width: none;
  margin: 0 calc(-1 * var(--wp--style--root--padding-left) - 1px) 0 calc(-1 * var(--wp--style--root--padding-right) - 1px) !important;
}

.is-dragging {
  cursor: grabbing;
}

.is-preview-mode {
  pointer-events: none;
}
.is-preview-mode .block-editor-block-list__block {
  pointer-events: auto;
}
.is-preview-mode .block-editor-block-list__block > *:not(.block-editor-block-list__block) {
  pointer-events: none;
}

.block-editor-block-list__block.is-movable-multi-selected:not(.is-partially-selected) {
  cursor: grab;
}
.is-dragging .block-editor-block-list__block.is-movable-multi-selected:not(.is-partially-selected) {
  cursor: grabbing;
}

.block-editor-block-list__drag-count {
  position: fixed;
  z-index: 1001;
  pointer-events: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 4px;
  border-radius: 12px;
  background: var(--wp-admin-theme-color);
  color: #fff;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 12px;
  font-weight: 500;
}

.is-vertical .block-list-appender {
  width: 24px;
  margin-left: auto;
  margin-top: 12px;
  margin-right: 12px;
}

.block-list-appender > .block-editor-inserter {
  display: block;
}

.block-editor-block-list__block:not(.is-selected):not(.has-child-selected):not(.block-editor-block-list__layout) .block-editor-block-list__layout > .block-list-appender .block-list-appender__toggle {
  opacity: 0;
  transform: scale(0);
}

.block-editor-block-list__block.has-block-overlay {
  cursor: default;
}
.block-editor-block-list__block.has-block-overlay .block-editor-block-list__block {
  pointer-events: none;
}
.block-editor-block-list__block.has-block-overlay .block-editor-block-list__block.has-block-overlay::before {
  right: 0;
  left: 0;
  width: auto;
}

.block-editor-block-list__layout .is-dragging:not([data-drag-pile]) {
  opacity: 0.1;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile]) iframe {
  pointer-events: none;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile])::selection {
  background: transparent !important;
}
.block-editor-block-list__layout .is-dragging:not([data-drag-pile])::after {
  content: none !important;
}

[data-drag-pile] .block-editor-block-list__layout .is-dragging:not([data-drag-pile]) {
  visibility: hidden;
}
[data-drag-pile] .block-editor-block-list__layout .is-dragging[data-drag-pile] {
  position: relative;
  z-index: 999;
  box-shadow: -4px 4px 8px rgba(0, 0, 0, 0.15);
}

.block-editor-block-preview__content-iframe .block-list-appender {
  display: none;
}

.block-editor-block-preview__live-content * {
  pointer-events: none;
}
.block-editor-block-preview__live-content .block-list-appender {
  display: none;
}
.block-editor-block-preview__live-content .components-button:disabled {
  opacity: initial;
}
.block-editor-block-preview__live-content .components-placeholder,
.block-editor-block-preview__live-content .block-editor-block-list__block[data-empty=true] {
  display: none;
}

.block-editor-block-variation-picker__variations,
.block-editor-block-variation-picker__skip,
.wp-block-group-placeholder__variations {
  list-style: none;
  display: flex;
  justify-content: flex-start;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
  padding: 0;
  margin: 0;
  gap: 8px;
  font-size: 12px;
}
.block-editor-block-variation-picker__variations svg,
.block-editor-block-variation-picker__skip svg,
.wp-block-group-placeholder__variations svg {
  fill: #949494;
  color: #949494 !important;
}
.block-editor-block-variation-picker__variations .components-button,
.block-editor-block-variation-picker__skip .components-button,
.wp-block-group-placeholder__variations .components-button {
  padding: 4px;
}
.block-editor-block-variation-picker__variations .components-button:hover,
.block-editor-block-variation-picker__skip .components-button:hover,
.wp-block-group-placeholder__variations .components-button:hover {
  background: none !important;
}
.block-editor-block-variation-picker__variations .components-button:hover svg,
.block-editor-block-variation-picker__skip .components-button:hover svg,
.wp-block-group-placeholder__variations .components-button:hover svg {
  fill: var(--wp-admin-theme-color);
  color: var(--wp-admin-theme-color) !important;
}
.block-editor-block-variation-picker__variations > li,
.block-editor-block-variation-picker__skip > li,
.wp-block-group-placeholder__variations > li {
  width: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.block-editor-button-block-appender {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: auto;
  color: #1e1e1e;
  border-color: currentColor;
}
.is-dark-theme .block-editor-button-block-appender {
  color: rgba(255, 255, 255, 0.65);
}
.block-editor-button-block-appender:hover {
  color: var(--wp-admin-theme-color);
}
.block-editor-button-block-appender:active {
  color: #000;
}

.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender), .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender), .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender), .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) {
  pointer-events: none;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: none;
  border: 1px dashed currentColor;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter {
  opacity: 0;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender) .block-editor-inserter:focus-within {
  opacity: 1;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over::after {
  border: none;
}
.is-layout-constrained.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .is-layout-flow.block-editor-block-list__block:not(.is-selected) > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-constrained.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter, .block-editor-block-list__block:not(.is-selected) > .is-layout-flow.wp-block-group__inner-container > .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-inserter {
  opacity: 1;
}
.block-editor-block-list__block:not(.is-selected) > .block-editor-block-list__block > .block-list-appender:only-child:has(.block-editor-button-block-appender)::after {
  border: none;
}
.block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-button-block-appender {
  background-color: var(--wp-admin-theme-color);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
  color: rgba(255, 255, 255, 0.65);
}
@media not (prefers-reduced-motion) {
  .block-list-appender:only-child:has(.block-editor-button-block-appender).is-drag-over .block-editor-button-block-appender {
    transition: background-color 0.2s ease-in-out;
  }
}

/**
 * Default block appender.
 *
 * This component shows up in 3 places:
 * - the black plus that sits at the end of the canvas, if the last block isn't a paragraph
 * - on the right, inside empty paragraphs
 * - absolute positioned and blue inside nesting containers
 */
.block-editor-default-block-appender {
  clear: both;
  margin-right: auto;
  margin-left: auto;
  position: relative;
}
.block-editor-default-block-appender[data-root-client-id=""] .block-editor-default-block-appender__content:hover {
  outline: 1px solid transparent;
}
.block-editor-default-block-appender .block-editor-default-block-appender__content {
  opacity: 0.62;
  text-shadow: none;
  margin-block-start: 0;
  margin-block-end: 0;
}
.block-editor-default-block-appender .components-drop-zone__content-icon {
  display: none;
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon {
  background: #1e1e1e;
  color: #fff;
  padding: 0;
  min-width: 24px;
  height: 24px;
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon:hover {
  color: #fff;
  background: var(--wp-admin-theme-color);
}
@media not (prefers-reduced-motion) {
  .block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon svg {
    transition: transform cubic-bezier(0.165, 0.84, 0.44, 1) 0.2s;
  }
}
.block-editor-default-block-appender .block-editor-inserter__toggle.components-button.has-icon.is-pressed svg {
  transform: rotate(-45deg);
}

.block-editor-default-block-appender .block-editor-inserter {
  position: absolute;
  top: 0;
  left: 0;
  line-height: 0;
}
.block-editor-default-block-appender .block-editor-inserter:disabled {
  display: none;
}

/**
 * Fixed position appender (right bottom corner).
 *
 * These styles apply to all in-canvas inserters. All in-canvas inserters always
 * exist within a block.
 */
.block-editor-block-list__block .block-list-appender {
  position: absolute;
  list-style: none;
  padding: 0;
  z-index: 2;
  bottom: 0;
  left: 0;
}
.block-editor-block-list__block .block-list-appender.block-list-appender {
  margin: 0;
  line-height: 0;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter:disabled {
  display: none;
}
.block-editor-block-list__block .block-list-appender .block-editor-default-block-appender {
  height: 24px;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle {
  background: #1e1e1e;
  color: #fff;
  padding: 0;
  min-width: 24px;
  height: 24px;
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon:hover,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle:hover {
  color: #fff;
  background: var(--wp-admin-theme-color);
}
@media not (prefers-reduced-motion) {
  .block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon svg,
  .block-editor-block-list__block .block-list-appender .block-list-appender__toggle svg {
    transition: transform cubic-bezier(0.165, 0.84, 0.44, 1) 0.2s;
  }
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon.is-pressed svg,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle.is-pressed svg {
  transform: rotate(-45deg);
}
.block-editor-block-list__block .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block .block-list-appender .block-list-appender__toggle {
  flex-direction: row;
  box-shadow: none;
  width: 24px;
  display: none;
  padding: 0 !important;
}
.block-editor-block-list__block .block-list-appender .block-editor-default-block-appender__content {
  display: none;
}
.block-editor-block-list__block .block-list-appender:first-child {
  position: relative;
  left: auto;
  align-self: center;
  list-style: none;
  line-height: inherit;
}
.block-editor-block-list__block .block-list-appender:first-child .block-editor-default-block-appender__content {
  display: block;
}

.block-editor-block-list__block.is-selected .block-editor-block-list__layout > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block.is-selected .block-editor-block-list__layout > .block-list-appender .block-list-appender__toggle,
.block-editor-block-list__block.is-selected > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon,
.block-editor-block-list__block.is-selected > .block-list-appender .block-list-appender__toggle {
  display: flex;
}

.block-editor-default-block-appender__content {
  cursor: text;
}

.block-editor-iframe__body {
  position: relative;
}

.block-editor-iframe__html {
  transform-origin: top center;
}
@media not (prefers-reduced-motion) {
  .block-editor-iframe__html {
    transition: background-color 400ms;
  }
}
.block-editor-iframe__html.zoom-out-animation {
  position: fixed;
  right: 0;
  left: 0;
  top: calc(-1 * var(--wp-block-editor-iframe-zoom-out-scroll-top, 0px));
  bottom: 0;
  overflow-y: var(--wp-block-editor-iframe-zoom-out-overflow-behavior, scroll);
}
.block-editor-iframe__html.is-zoomed-out {
  transform: translateX(calc(-1*((var(--wp-block-editor-iframe-zoom-out-scale-container-width) - var(--wp-block-editor-iframe-zoom-out-container-width, 100vw)) / 2 / var(--wp-block-editor-iframe-zoom-out-scale, 1))));
  scale: var(--wp-block-editor-iframe-zoom-out-scale, 1);
  background-color: var(--wp-editor-canvas-background);
  margin-bottom: calc(-1 * calc(calc(var(--wp-block-editor-iframe-zoom-out-content-height) * (1 - var(--wp-block-editor-iframe-zoom-out-scale, 1))) + calc(2 * var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1)) + 2px));
  padding-top: calc(var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
  padding-bottom: calc(var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
}
.block-editor-iframe__html.is-zoomed-out body {
  min-height: calc((var(--wp-block-editor-iframe-zoom-out-inner-height) - calc(2 * var(--wp-block-editor-iframe-zoom-out-frame-size, 0px) / var(--wp-block-editor-iframe-zoom-out-scale, 1))) / var(--wp-block-editor-iframe-zoom-out-scale, 1));
}
.block-editor-iframe__html.is-zoomed-out body > .is-root-container:not(.wp-block-post-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.block-editor-iframe__html.is-zoomed-out body > .is-root-container:not(.wp-block-post-content) > main {
  flex: 1;
}
.block-editor-iframe__html.is-zoomed-out .wp-block[draggable] {
  cursor: grab;
}

.block-editor-media-placeholder__cancel-button.is-link {
  margin: 1em;
  display: block;
}

.block-editor-media-placeholder.is-appender {
  min-height: 0;
}
.block-editor-media-placeholder.is-appender:hover {
  cursor: var(--wpds-cursor-control, pointer);
  box-shadow: 0 0 0 1px var(--wp-admin-theme-color);
}

.block-editor-plain-text {
  box-shadow: none;
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  line-height: inherit;
  border: none;
  padding: 0;
  margin: 0;
}

.block-editor-plain-text {
  width: 100%;
  field-sizing: content;
}

.rich-text [data-rich-text-placeholder] {
  pointer-events: none;
}
.rich-text [data-rich-text-placeholder]::after {
  content: attr(data-rich-text-placeholder);
  opacity: 0.62;
  text-shadow: none;
}
.rich-text:focus {
  outline: none;
}

figcaption.block-editor-rich-text__editable [data-rich-text-placeholder]::before {
  opacity: 0.8;
}

[data-rich-text-script] {
  display: inline;
}
[data-rich-text-script]::before {
  content: "</>";
  background: rgb(255, 255, 0);
}

[data-rich-text-comment],
[data-rich-text-format-boundary] {
  border-radius: 2px;
}

[data-rich-text-comment] {
  background-color: currentColor;
}
[data-rich-text-comment] span {
  filter: invert(100%);
  color: currentColor;
  padding: 0 2px;
}

.rich-text [contenteditable=false]::selection {
  background-color: transparent;
}

.is-selected .non-breaking-space {
  background: radial-gradient(circle, #cc1818 2px, transparent 2.5px) center/100% 100% no-repeat;
}

.block-editor-warning {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  padding: 1em;
  border: 1px solid #1e1e1e;
  border-radius: 2px;
  background-color: #fff;
}
.block-editor-warning .block-editor-warning__message {
  line-height: 1.4;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  font-size: 13px;
  color: #1e1e1e;
  margin: 0;
}
.block-editor-warning p.block-editor-warning__message.block-editor-warning__message {
  min-height: auto;
}
.block-editor-warning .block-editor-warning__contents {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: baseline;
  width: 100%;
  gap: 12px;
}
.block-editor-warning .block-editor-warning__actions {
  align-items: center;
  display: flex;
  gap: 8px;
}

.components-popover.block-editor-warning__dropdown {
  z-index: 99998;
}`})))()}var Qn;function init_style_rtl$1(){return(init_style_rtl$1=e((()=>{Qn=`@charset "UTF-8";
.wp-block-accordion {
  box-sizing: border-box;
}

.wp-block-accordion-item.is-open > .wp-block-accordion-heading .wp-block-accordion-heading__toggle-icon {
  transform: rotate(-45deg);
}
.wp-block-accordion-item {
  /* Add transitions only for users who do not prefer reduced motion */
}
@media (prefers-reduced-motion: no-preference) {
  .wp-block-accordion-item {
    transition: grid-template-rows 0.3s ease-out;
  }
  .wp-block-accordion-item > .wp-block-accordion-heading .wp-block-accordion-heading__toggle-icon {
    transition: transform 0.2s ease-in-out;
  }
}

.wp-block-accordion-heading__toggle {
  font-family: inherit;
  font-size: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  text-decoration: inherit;
  word-spacing: inherit;
  font-style: inherit;
  background: none;
  border: none;
  color: inherit;
  padding: var(--wp--preset--spacing--20, 1em) 0;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  text-align: inherit;
  width: 100%;
}
.wp-block-accordion-heading__toggle:not(:focus-visible) {
  outline: none;
}
.wp-block-accordion-heading__toggle:hover .wp-block-accordion-heading__toggle-title {
  text-decoration: underline;
}

.wp-block-accordion-heading__toggle-title {
  flex: 1;
}

.wp-block-accordion-heading__toggle-icon {
  width: 1.2em;
  height: 1.2em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wp-block-accordion-panel[hidden] {
  border: none !important;
  box-shadow: none !important;
  margin-block-start: 0;
  padding: 0 !important;
}

.wp-block-archives {
  box-sizing: border-box;
}

.wp-block-archives-dropdown label {
  display: block;
}

.wp-block-avatar {
  box-sizing: border-box;
  line-height: 0;
}
.wp-block-avatar img {
  box-sizing: border-box;
}
.wp-block-avatar.aligncenter {
  text-align: center;
}

/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
.wp-block-audio {
  box-sizing: border-box;
}
.wp-block-audio :where(figcaption) {
  margin-top: 0.5em;
  margin-bottom: 1em;
}
.wp-block-audio audio {
  width: 100%;
  min-width: 300px;
}

.wp-block-breadcrumbs {
  box-sizing: border-box;
}
.wp-block-breadcrumbs ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.wp-block-breadcrumbs li {
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
}
.wp-block-breadcrumbs li:not(:last-child)::after {
  content: var(--separator, "/")/"";
  margin: 0 0.5em;
  opacity: 0.7;
}
.wp-block-breadcrumbs span {
  color: inherit;
}

.wp-block-button__link {
  cursor: pointer;
  display: inline-block;
  text-align: center;
  word-break: normal;
  overflow-wrap: anywhere;
  box-sizing: border-box;
  height: 100%;
  align-content: center;
}
.wp-block-button__link.aligncenter {
  text-align: center;
}
.wp-block-button__link.alignright {
  text-align: right;
}

:where(.wp-block-button__link) {
  box-shadow: none;
  text-decoration: none;
  border-radius: 9999px;
  padding: calc(0.667em + 2px) calc(1.333em + 2px);
}

.wp-block-button[style*=text-decoration] .wp-block-button__link {
  text-decoration: inherit;
}

.wp-block-buttons > .wp-block-button.has-custom-width {
  max-width: none;
}
.wp-block-buttons > .wp-block-button.has-custom-width .wp-block-button__link {
  width: 100%;
}
.wp-block-buttons > .wp-block-button.has-custom-font-size .wp-block-button__link {
  font-size: inherit;
}
.wp-block-buttons > .wp-block-button[class*=wp-block-button__width] {
  width: calc(var(--wp--block-button--width) * 1% - var(--wp--style--block-gap, 0.5em) * (1 - var(--wp--block-button--width) / 100));
}
.wp-block-buttons > .wp-block-button.wp-block-button__width-25 {
  width: calc(25% - var(--wp--style--block-gap, 0.5em) * 0.75);
}
.wp-block-buttons > .wp-block-button.wp-block-button__width-50 {
  width: calc(50% - var(--wp--style--block-gap, 0.5em) * 0.5);
}
.wp-block-buttons > .wp-block-button.wp-block-button__width-75 {
  width: calc(75% - var(--wp--style--block-gap, 0.5em) * 0.25);
}
.wp-block-buttons > .wp-block-button.wp-block-button__width-100 {
  width: 100%;
  flex-basis: 100%;
}

.wp-block-buttons.is-vertical > .wp-block-button[class*=wp-block-button__width] {
  width: calc(var(--wp--block-button--width) * 1%);
}
.wp-block-buttons.is-vertical > .wp-block-button.wp-block-button__width-25 {
  width: 25%;
}
.wp-block-buttons.is-vertical > .wp-block-button.wp-block-button__width-50 {
  width: 50%;
}
.wp-block-buttons.is-vertical > .wp-block-button.wp-block-button__width-75 {
  width: 75%;
}

.wp-block-button.is-style-squared,
.wp-block-button__link.wp-block-button.is-style-squared {
  border-radius: 0;
}

.wp-block-button.no-border-radius,
.wp-block-button__link.no-border-radius {
  border-radius: 0 !important;
}

:root :where(.wp-block-button.is-style-outline > .wp-block-button__link),
:root :where(.wp-block-button .wp-block-button__link.is-style-outline) {
  border: 2px solid currentColor;
  padding: 0.667em 1.333em;
}
:root :where(.wp-block-button.is-style-outline > .wp-block-button__link:not(.has-text-color)),
:root :where(.wp-block-button .wp-block-button__link.is-style-outline:not(.has-text-color)) {
  color: currentColor;
}
:root :where(.wp-block-button.is-style-outline > .wp-block-button__link:not(.has-background)),
:root :where(.wp-block-button .wp-block-button__link.is-style-outline:not(.has-background)) {
  background-color: transparent;
  background-image: none;
}

.wp-block-buttons {
  box-sizing: border-box;
}
.wp-block-buttons.is-vertical {
  flex-direction: column;
}
.wp-block-buttons.is-vertical > .wp-block-button:last-child {
  margin-bottom: 0;
}
.wp-block-buttons > .wp-block-button {
  display: inline-block;
  margin: 0;
}
.wp-block-buttons.is-content-justification-left {
  justify-content: flex-start;
}
.wp-block-buttons.is-content-justification-left.is-vertical {
  align-items: flex-start;
}
.wp-block-buttons.is-content-justification-center {
  justify-content: center;
}
.wp-block-buttons.is-content-justification-center.is-vertical {
  align-items: center;
}
.wp-block-buttons.is-content-justification-right {
  justify-content: flex-end;
}
.wp-block-buttons.is-content-justification-right.is-vertical {
  align-items: flex-end;
}
.wp-block-buttons.is-content-justification-space-between {
  justify-content: space-between;
}
.wp-block-buttons.aligncenter {
  text-align: center;
}
.wp-block-buttons {
  /* stylelint-disable @stylistic/indentation -- Disable the stylelint rule, otherwise this selector is ugly! */
}
.wp-block-buttons:not(.is-content-justification-space-between,
.is-content-justification-right,
.is-content-justification-left,
.is-content-justification-center) .wp-block-button.aligncenter {
  /* stylelint-enable @stylistic/indentation */
  margin-right: auto;
  margin-left: auto;
  width: 100%;
}
.wp-block-buttons[style*=text-decoration] .wp-block-button,
.wp-block-buttons[style*=text-decoration] .wp-block-button__link {
  text-decoration: inherit;
}
.wp-block-buttons.has-custom-font-size .wp-block-button__link {
  font-size: inherit;
}
.wp-block-buttons .wp-block-button__link {
  width: 100%;
}

.wp-block-button.aligncenter {
  text-align: center;
}

.wp-block-calendar {
  text-align: center;
}
.wp-block-calendar th,
.wp-block-calendar td {
  padding: 0.25em;
  border: 1px solid;
}
.wp-block-calendar th {
  font-weight: 400;
}
.wp-block-calendar caption {
  background-color: inherit;
}
.wp-block-calendar table {
  width: 100%;
  border-collapse: collapse;
}
.wp-block-calendar table.has-background th {
  background-color: inherit;
}
.wp-block-calendar table.has-text-color th {
  color: inherit;
}
.wp-block-calendar :where(table:not(.has-text-color)) {
  color: #40464d;
}
.wp-block-calendar :where(table:not(.has-text-color)) th,
.wp-block-calendar :where(table:not(.has-text-color)) td {
  border-color: #ddd;
}

:where(.wp-block-calendar table:not(.has-background) th) {
  background: #ddd;
}

.wp-block-categories {
  box-sizing: border-box;
}
.wp-block-categories.alignleft {
  margin-right: 2em;
}
.wp-block-categories.alignright {
  margin-left: 2em;
}
.wp-block-categories {
  /* Only apply the text align on dropdowns, not lists. */
}
.wp-block-categories.wp-block-categories-dropdown.aligncenter {
  text-align: center;
}

:where(.wp-block-categories__label:not(.screen-reader-text)) {
  width: 100%;
  display: block;
}

.wp-block-code {
  box-sizing: border-box;
}
.wp-block-code code {
  display: block;
  font-family: inherit;
  overflow-wrap: break-word;
  white-space: break-spaces;
  direction: ltr;
  text-align: initial;
}

.wp-block-columns {
  display: flex;
  box-sizing: border-box;
  flex-wrap: wrap !important;
}
@media (min-width: 782px) {
  .wp-block-columns {
    flex-wrap: nowrap !important;
  }
}
.wp-block-columns {
  align-items: initial !important;
  /**
  * All Columns Alignment
  */
}
.wp-block-columns.are-vertically-aligned-top {
  align-items: flex-start;
}
.wp-block-columns.are-vertically-aligned-center {
  align-items: center;
}
.wp-block-columns.are-vertically-aligned-bottom {
  align-items: flex-end;
}
@media (max-width: 781px) {
  .wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column {
    flex-basis: 100% !important;
  }
}
@media (min-width: 782px) {
  .wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column {
    flex-basis: 0;
    flex-grow: 1;
  }
  .wp-block-columns:not(.is-not-stacked-on-mobile) > .wp-block-column[style*=flex-basis] {
    flex-grow: 0;
  }
}
.wp-block-columns.is-not-stacked-on-mobile {
  flex-wrap: nowrap !important;
}
.wp-block-columns.is-not-stacked-on-mobile > .wp-block-column {
  flex-basis: 0;
  flex-grow: 1;
}
.wp-block-columns.is-not-stacked-on-mobile > .wp-block-column[style*=flex-basis] {
  flex-grow: 0;
}

:where(.wp-block-columns) {
  margin-bottom: 1.75em;
}

:where(.wp-block-columns.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

.wp-block-column {
  flex-grow: 1;
  min-width: 0;
  word-break: normal;
  overflow-wrap: break-word;
  /**
  * Individual Column Alignment
  */
}
.wp-block-column.is-vertically-aligned-top {
  align-self: flex-start;
}
.wp-block-column.is-vertically-aligned-center {
  align-self: center;
}
.wp-block-column.is-vertically-aligned-bottom {
  align-self: flex-end;
}
.wp-block-column.is-vertically-aligned-stretch {
  align-self: stretch;
}
.wp-block-column.is-vertically-aligned-top, .wp-block-column.is-vertically-aligned-center, .wp-block-column.is-vertically-aligned-bottom {
  width: 100%;
}

/* Styles for backwards compatibility with the legacy \`post-comments\` block */
.wp-block-post-comments {
  box-sizing: border-box;
  /* utility classes */
}
.wp-block-post-comments .alignleft {
  float: right;
}
.wp-block-post-comments .alignright {
  float: left;
}
.wp-block-post-comments {
  /* end utility classes */
}
.wp-block-post-comments .navigation::after {
  content: "";
  display: table;
  clear: both;
}
.wp-block-post-comments .commentlist {
  clear: both;
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .commentlist .comment {
  min-height: 2.25em;
  padding-right: 3.25em;
}
.wp-block-post-comments .commentlist .comment p {
  font-size: 1em;
  line-height: 1.8;
  margin: 1em 0;
}
.wp-block-post-comments .commentlist .children {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .comment-author {
  line-height: 1.5;
}
.wp-block-post-comments .comment-author .avatar {
  border-radius: 1.5em;
  display: block;
  float: right;
  height: 2.5em;
  margin-top: 0.5em;
  margin-left: 0.75em;
  width: 2.5em;
}
.wp-block-post-comments .comment-author cite {
  font-style: normal;
}
.wp-block-post-comments .comment-meta {
  font-size: 0.875em;
  line-height: 1.5;
}
.wp-block-post-comments .comment-meta b {
  font-weight: 400;
}
.wp-block-post-comments .comment-meta .comment-awaiting-moderation {
  margin-top: 1em;
  margin-bottom: 1em;
  display: block;
}
.wp-block-post-comments .comment-body .commentmetadata {
  font-size: 0.875em;
}
.wp-block-post-comments .comment-form textarea,
.wp-block-post-comments .comment-form input:not([type=submit]):not([type=checkbox]) {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
.wp-block-post-comments .comment-form-cookies-consent {
  display: flex;
  gap: 0.25em;
}
.wp-block-post-comments .comment-form-cookies-consent #wp-comment-cookies-consent {
  margin-top: 0.35em;
}
.wp-block-post-comments .comment-reply-title {
  margin-bottom: 0;
}
.wp-block-post-comments .comment-reply-title :where(small) {
  font-size: var(--wp--preset--font-size--medium, smaller);
  margin-right: 0.5em;
}
.wp-block-post-comments .reply {
  font-size: 0.875em;
  margin-bottom: 1.4em;
}
.wp-block-post-comments textarea,
.wp-block-post-comments input:not([type=submit]) {
  border: 1px solid #949494;
  font-size: 1em;
  font-family: inherit;
}
.wp-block-post-comments textarea,
.wp-block-post-comments input:not([type=submit]):not([type=checkbox]) {
  padding: calc(0.667em + 2px);
}

:where(.wp-block-post-comments .comment-form-comment label),
:where(.wp-block-post-comments .comment-form-author label),
:where(.wp-block-post-comments .comment-form-email label),
:where(.wp-block-post-comments .comment-form-url label) {
  display: block;
  margin-bottom: 0.25em;
}

:where(.wp-block-post-comments input[type=submit]) {
  border: none;
}

.wp-block-comments {
  box-sizing: border-box;
}

.wp-block-comments-pagination {
  box-sizing: border-box;
}
.wp-block-comments-pagination > .wp-block-comments-pagination-next,
.wp-block-comments-pagination > .wp-block-comments-pagination-previous,
.wp-block-comments-pagination > .wp-block-comments-pagination-numbers {
  font-size: inherit;
}
.wp-block-comments-pagination .wp-block-comments-pagination-previous-arrow {
  margin-left: 1ch;
  display: inline-block;
}
.wp-block-comments-pagination .wp-block-comments-pagination-previous-arrow:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-comments-pagination .wp-block-comments-pagination-next-arrow {
  margin-right: 1ch;
  display: inline-block;
}
.wp-block-comments-pagination .wp-block-comments-pagination-next-arrow:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-comments-pagination.aligncenter {
  justify-content: center;
}

.wp-block-comments-pagination-previous {
  box-sizing: border-box;
}

.wp-block-comments-pagination-next {
  box-sizing: border-box;
}

.wp-block-comment-template {
  box-sizing: border-box;
  margin-bottom: 0;
  max-width: 100%;
  list-style: none;
  padding: 0;
}
.wp-block-comment-template li {
  clear: both;
}
.wp-block-comment-template ol {
  margin-bottom: 0;
  max-width: 100%;
  list-style: none;
  padding-right: 2rem;
}
.wp-block-comment-template.alignleft {
  float: right;
}
.wp-block-comment-template.aligncenter {
  margin-right: auto;
  margin-left: auto;
  width: fit-content;
}
.wp-block-comment-template.alignright {
  float: left;
}

.wp-block-comment-date {
  box-sizing: border-box;
}

.comment-awaiting-moderation {
  display: block;
  font-size: 0.875em;
  line-height: 1.5;
}

.wp-block-comment-content {
  box-sizing: border-box;
}

.wp-block-comment-author-name {
  box-sizing: border-box;
}

.wp-block-comment-edit-link {
  box-sizing: border-box;
}

.wp-block-comment-reply-link {
  box-sizing: border-box;
}

.wp-block-cover-image,
.wp-block-cover {
  min-height: 430px;
  padding: 1em;
  position: relative;
  background-position: center center;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  overflow: clip;
}
.wp-block-cover-image:has(.wp-block-navigation__responsive-container.is-menu-open),
.wp-block-cover:has(.wp-block-navigation__responsive-container.is-menu-open) {
  overflow: visible;
}
.wp-block-cover-image,
.wp-block-cover {
  box-sizing: border-box; direction: ltr;
  /**
   * Set a default background color for has-background-dim _unless_ it includes another
   * background-color class (e.g. has-green-background-color). The presence of another
   * background-color class implies that another style will provide the background color
   * for the overlay.
   *
   * See:
   *   - Issue with background color specificity: https://github.com/WordPress/gutenberg/issues/26545
   *   - Issue with alternative fix: https://github.com/WordPress/gutenberg/issues/26545
   */
}
.wp-block-cover-image.has-background-dim:not([class*=-background-color]),
.wp-block-cover-image .has-background-dim:not([class*=-background-color]),
.wp-block-cover.has-background-dim:not([class*=-background-color]),
.wp-block-cover .has-background-dim:not([class*=-background-color]) {
  background-color: #000;
}
.wp-block-cover-image .has-background-dim.has-background-gradient,
.wp-block-cover .has-background-dim.has-background-gradient {
  background-color: transparent;
}
.wp-block-cover-image.has-background-dim::before,
.wp-block-cover.has-background-dim::before {
  content: "";
  background-color: inherit;
}
.wp-block-cover-image.has-background-dim:not(.has-background-gradient)::before,
.wp-block-cover-image .wp-block-cover__background,
.wp-block-cover-image .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim:not(.has-background-gradient)::before,
.wp-block-cover .wp-block-cover__background,
.wp-block-cover .wp-block-cover__gradient-background {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  opacity: 0.5;
}
.wp-block-cover-image.has-background-dim.has-background-dim-10:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-10 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-10 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-10:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-10 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-10 .wp-block-cover__gradient-background {
  opacity: 0.1;
}
.wp-block-cover-image.has-background-dim.has-background-dim-20:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-20 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-20 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-20:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-20 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-20 .wp-block-cover__gradient-background {
  opacity: 0.2;
}
.wp-block-cover-image.has-background-dim.has-background-dim-30:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-30 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-30 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-30:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-30 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-30 .wp-block-cover__gradient-background {
  opacity: 0.3;
}
.wp-block-cover-image.has-background-dim.has-background-dim-40:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-40 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-40 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-40:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-40 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-40 .wp-block-cover__gradient-background {
  opacity: 0.4;
}
.wp-block-cover-image.has-background-dim.has-background-dim-50:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-50 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-50 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-50:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-50 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-50 .wp-block-cover__gradient-background {
  opacity: 0.5;
}
.wp-block-cover-image.has-background-dim.has-background-dim-60:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-60 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-60 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-60:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-60 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-60 .wp-block-cover__gradient-background {
  opacity: 0.6;
}
.wp-block-cover-image.has-background-dim.has-background-dim-70:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-70 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-70 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-70:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-70 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-70 .wp-block-cover__gradient-background {
  opacity: 0.7;
}
.wp-block-cover-image.has-background-dim.has-background-dim-80:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-80 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-80 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-80:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-80 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-80 .wp-block-cover__gradient-background {
  opacity: 0.8;
}
.wp-block-cover-image.has-background-dim.has-background-dim-90:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-90 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-90 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-90:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-90 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-90 .wp-block-cover__gradient-background {
  opacity: 0.9;
}
.wp-block-cover-image.has-background-dim.has-background-dim-100:not(.has-background-gradient)::before,
.wp-block-cover-image.has-background-dim.has-background-dim-100 .wp-block-cover__background,
.wp-block-cover-image.has-background-dim.has-background-dim-100 .wp-block-cover__gradient-background,
.wp-block-cover.has-background-dim.has-background-dim-100:not(.has-background-gradient)::before,
.wp-block-cover.has-background-dim.has-background-dim-100 .wp-block-cover__background,
.wp-block-cover.has-background-dim.has-background-dim-100 .wp-block-cover__gradient-background {
  opacity: 1;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-0,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-0,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-0,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-0 {
  opacity: 0;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-10,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-10,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-10,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-10 {
  opacity: 0.1;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-20,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-20,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-20,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-20 {
  opacity: 0.2;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-30,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-30,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-30,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-30 {
  opacity: 0.3;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-40,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-40,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-40,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-40 {
  opacity: 0.4;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-50,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-50,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-50,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-50 {
  opacity: 0.5;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-60,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-60,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-60,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-60 {
  opacity: 0.6;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-70,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-70,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-70,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-70 {
  opacity: 0.7;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-80,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-80,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-80,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-80 {
  opacity: 0.8;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-90,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-90,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-90,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-90 {
  opacity: 0.9;
}
.wp-block-cover-image .wp-block-cover__gradient-background.has-background-dim.has-background-dim-100,
.wp-block-cover-image .wp-block-cover__background.has-background-dim.has-background-dim-100,
.wp-block-cover .wp-block-cover__gradient-background.has-background-dim.has-background-dim-100,
.wp-block-cover .wp-block-cover__background.has-background-dim.has-background-dim-100 {
  opacity: 1;
}
.wp-block-cover-image.alignleft, .wp-block-cover-image.alignright,
.wp-block-cover.alignleft,
.wp-block-cover.alignright {
  max-width: 420px;
  width: 100%;
}
.wp-block-cover-image.aligncenter, .wp-block-cover-image.alignleft, .wp-block-cover-image.alignright,
.wp-block-cover.aligncenter,
.wp-block-cover.alignleft,
.wp-block-cover.alignright {
  display: flex;
}
.wp-block-cover-image .wp-block-cover__inner-container,
.wp-block-cover .wp-block-cover__inner-container {
  position: relative;
  width: 100%;
  color: inherit; direction: rtl;
}
.wp-block-cover-image.is-position-top-left,
.wp-block-cover.is-position-top-left {
  align-items: flex-start;
  justify-content: flex-start;
}
.wp-block-cover-image.is-position-top-center,
.wp-block-cover.is-position-top-center {
  align-items: flex-start;
  justify-content: center;
}
.wp-block-cover-image.is-position-top-right,
.wp-block-cover.is-position-top-right {
  align-items: flex-start;
  justify-content: flex-end;
}
.wp-block-cover-image.is-position-center-left,
.wp-block-cover.is-position-center-left {
  align-items: center;
  justify-content: flex-start;
}
.wp-block-cover-image.is-position-center-center,
.wp-block-cover.is-position-center-center {
  align-items: center;
  justify-content: center;
}
.wp-block-cover-image.is-position-center-right,
.wp-block-cover.is-position-center-right {
  align-items: center;
  justify-content: flex-end;
}
.wp-block-cover-image.is-position-bottom-left,
.wp-block-cover.is-position-bottom-left {
  align-items: flex-end;
  justify-content: flex-start;
}
.wp-block-cover-image.is-position-bottom-center,
.wp-block-cover.is-position-bottom-center {
  align-items: flex-end;
  justify-content: center;
}
.wp-block-cover-image.is-position-bottom-right,
.wp-block-cover.is-position-bottom-right {
  align-items: flex-end;
  justify-content: flex-end;
}
.wp-block-cover-image.has-custom-content-position.has-custom-content-position .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position .wp-block-cover__inner-container {
  margin: 0;
}
.wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-top-left .wp-block-cover__inner-container, .wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-top-right .wp-block-cover__inner-container, .wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-center-left .wp-block-cover__inner-container, .wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-center-right .wp-block-cover__inner-container, .wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-bottom-left .wp-block-cover__inner-container, .wp-block-cover-image.has-custom-content-position.has-custom-content-position.is-position-bottom-right .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-top-left .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-top-right .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-center-left .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-center-right .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-bottom-left .wp-block-cover__inner-container,
.wp-block-cover.has-custom-content-position.has-custom-content-position.is-position-bottom-right .wp-block-cover__inner-container {
  margin: 0;
  width: auto;
}
.wp-block-cover-image .wp-block-cover__image-background,
.wp-block-cover-image video.wp-block-cover__video-background,
.wp-block-cover .wp-block-cover__image-background,
.wp-block-cover video.wp-block-cover__video-background {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: cover;
  outline: none;
  border: none;
  box-shadow: none;
}
@supports (-webkit-hyphens: none) {
  .wp-block-cover-image.has-aspect-ratio,
  .wp-block-cover.has-aspect-ratio {
    min-height: fit-content !important;
  }
}
.wp-block-cover-image .wp-block-cover__embed-background,
.wp-block-cover .wp-block-cover__embed-background {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  outline: none;
  border: none;
  box-shadow: none;
  pointer-events: none;
}
.wp-block-cover-image .wp-block-cover__embed-background .wp-block-embed__wrapper,
.wp-block-cover .wp-block-cover__embed-background .wp-block-embed__wrapper {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}
.wp-block-cover-image .wp-block-cover__embed-background iframe,
.wp-block-cover-image .wp-block-cover__embed-background .wp-block-embed__wrapper iframe,
.wp-block-cover .wp-block-cover__embed-background iframe,
.wp-block-cover .wp-block-cover__embed-background .wp-block-embed__wrapper iframe {
  position: absolute;
  top: 50%;
  right: 50%;
  width: 100vw;
  height: 100vh;
  min-width: 100%;
  min-height: 100%;
  transform: translate(50%, -50%);
  pointer-events: none;
}

.wp-block-cover-image.has-parallax,
.wp-block-cover.has-parallax,
.wp-block-cover__image-background.has-parallax,
video.wp-block-cover__video-background.has-parallax {
  background-attachment: fixed;
  background-size: cover;
  background-repeat: no-repeat;
}
@supports (-webkit-touch-callout: inherit) {
  .wp-block-cover-image.has-parallax,
  .wp-block-cover.has-parallax,
  .wp-block-cover__image-background.has-parallax,
  video.wp-block-cover__video-background.has-parallax {
    background-attachment: scroll;
  }
}
@media (prefers-reduced-motion: reduce) {
  .wp-block-cover-image.has-parallax,
  .wp-block-cover.has-parallax,
  .wp-block-cover__image-background.has-parallax,
  video.wp-block-cover__video-background.has-parallax {
    background-attachment: scroll;
  }
}
.wp-block-cover-image.is-repeated,
.wp-block-cover.is-repeated,
.wp-block-cover__image-background.is-repeated,
video.wp-block-cover__video-background.is-repeated {
  background-repeat: repeat;
  background-size: auto;
}

section.wp-block-cover-image h2,
.wp-block-cover-image-text,
.wp-block-cover-text {
  color: #fff;
}
section.wp-block-cover-image h2 a,
section.wp-block-cover-image h2 a:hover,
section.wp-block-cover-image h2 a:focus,
section.wp-block-cover-image h2 a:active,
.wp-block-cover-image-text a,
.wp-block-cover-image-text a:hover,
.wp-block-cover-image-text a:focus,
.wp-block-cover-image-text a:active,
.wp-block-cover-text a,
.wp-block-cover-text a:hover,
.wp-block-cover-text a:focus,
.wp-block-cover-text a:active {
  color: #fff;
}

.wp-block-cover-image .wp-block-cover.has-left-content {
  justify-content: flex-start;
}
.wp-block-cover-image .wp-block-cover.has-right-content {
  justify-content: flex-end;
}

section.wp-block-cover-image.has-left-content > h2,
.wp-block-cover-image.has-left-content .wp-block-cover-image-text,
.wp-block-cover.has-left-content .wp-block-cover-text {
  margin-right: 0;
  text-align: right;
}

section.wp-block-cover-image.has-right-content > h2,
.wp-block-cover-image.has-right-content .wp-block-cover-image-text,
.wp-block-cover.has-right-content .wp-block-cover-text {
  margin-left: 0;
  text-align: left;
}

section.wp-block-cover-image > h2,
.wp-block-cover-image .wp-block-cover-image-text,
.wp-block-cover .wp-block-cover-text {
  font-size: 2em;
  line-height: 1.25;
  z-index: 1;
  margin-bottom: 0;
  max-width: 840px;
  padding: 0.44em;
  text-align: center;
}

:where(.wp-block-cover:not(.has-text-color)),
:where(.wp-block-cover-image:not(.has-text-color)) {
  color: #fff;
}

:where(.wp-block-cover.is-light:not(.has-text-color)),
:where(.wp-block-cover-image.is-light:not(.has-text-color)) {
  color: #000;
}

:root :where(.wp-block-cover p:not(.has-text-color)),
:root :where(.wp-block-cover h1:not(.has-text-color)),
:root :where(.wp-block-cover h2:not(.has-text-color)),
:root :where(.wp-block-cover h3:not(.has-text-color)),
:root :where(.wp-block-cover h4:not(.has-text-color)),
:root :where(.wp-block-cover h5:not(.has-text-color)),
:root :where(.wp-block-cover h6:not(.has-text-color)) {
  color: inherit;
}

body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__video-background {
  z-index: 0;
}
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__embed-background {
  z-index: 0;
}
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__image-background {
  z-index: 0;
}
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)).has-background-dim:not(.has-background-gradient)::before,
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__background,
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__gradient-background {
  z-index: 1;
}
body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__inner-container {
  z-index: 1;
}
.has-modal-open body:not(.editor-styles-wrapper) .wp-block-cover:not(.wp-block-cover:has(.wp-block-cover__background + .wp-block-cover__inner-container)) .wp-block-cover__inner-container {
  z-index: auto;
}

.wp-block-details {
  box-sizing: border-box;
}

.wp-block-details summary {
  cursor: pointer;
}

.wp-block[data-align=left] > [data-type="core/embed"],
.wp-block[data-align=right] > [data-type="core/embed"],
.wp-block-embed.alignleft,
.wp-block-embed.alignright {
  max-width: 360px;
  width: 100%;
}
.wp-block[data-align=left] > [data-type="core/embed"] .wp-block-embed__wrapper,
.wp-block[data-align=right] > [data-type="core/embed"] .wp-block-embed__wrapper,
.wp-block-embed.alignleft .wp-block-embed__wrapper,
.wp-block-embed.alignright .wp-block-embed__wrapper {
  min-width: 280px;
}

:root :where(.wp-block-cover .wp-block-embed) {
  min-width: 320px;
  min-height: 240px;
}

.wp-block-group.is-layout-flex .wp-block-embed {
  flex: 1 1 0%;
}

:root :where(.wp-block-group.is-layout-flex .wp-block-embed) {
  min-width: 0;
}

.wp-block-embed {
  overflow-wrap: break-word;
}
.wp-block-embed :where(figcaption) {
  margin-top: 0.5em;
  margin-bottom: 1em;
}
.wp-block-embed iframe {
  max-width: 100%;
}

.wp-block-embed__wrapper {
  position: relative;
}

.wp-embed-responsive .wp-has-aspect-ratio .wp-block-embed__wrapper::before {
  content: "";
  display: block;
  padding-top: 50%;
}
.wp-embed-responsive .wp-has-aspect-ratio iframe {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  height: 100%;
  width: 100%;
}

.wp-embed-responsive .wp-embed-aspect-21-9 .wp-block-embed__wrapper::before {
  padding-top: 42.85%;
}
.wp-embed-responsive .wp-embed-aspect-18-9 .wp-block-embed__wrapper::before {
  padding-top: 50%;
}
.wp-embed-responsive .wp-embed-aspect-16-9 .wp-block-embed__wrapper::before {
  padding-top: 56.25%;
}
.wp-embed-responsive .wp-embed-aspect-4-3 .wp-block-embed__wrapper::before {
  padding-top: 75%;
}
.wp-embed-responsive .wp-embed-aspect-1-1 .wp-block-embed__wrapper::before {
  padding-top: 100%;
}
.wp-embed-responsive .wp-embed-aspect-9-16 .wp-block-embed__wrapper::before {
  padding-top: 177.77%;
}
.wp-embed-responsive .wp-embed-aspect-1-2 .wp-block-embed__wrapper::before {
  padding-top: 200%;
}

.wp-block-file {
  box-sizing: border-box;
}
.wp-block-file.aligncenter {
  text-align: center;
}
.wp-block-file.alignright {
  text-align: right;
}
.wp-block-file * + .wp-block-file__button {
  margin-right: 0.75em;
}

:root :where(.wp-block-file:not(.wp-element-button)) {
  font-size: 0.8em;
}

:where(.wp-block-file) {
  margin-bottom: 1.5em;
}

.wp-block-file__embed {
  margin-bottom: 1em;
}

:where(.wp-block-file__button) {
  border-radius: 2em;
  padding: 0.5em 1em;
  display: inline-block;
}
:where(.wp-block-file__button):where(a):hover, :where(.wp-block-file__button):where(a):visited, :where(.wp-block-file__button):where(a):focus, :where(.wp-block-file__button):where(a):active {
  box-shadow: none;
  color: #fff;
  opacity: 0.85;
  text-decoration: none;
}

.wp-block-gallery:not(.has-nested-images),
.blocks-gallery-grid:not(.has-nested-images) {
  display: flex;
  flex-wrap: wrap;
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item {
  margin: 0 0 1em 1em;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: center;
  position: relative;
  width: calc(50% - 1em);
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image:nth-of-type(even),
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item:nth-of-type(even),
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image:nth-of-type(even),
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item:nth-of-type(even) {
  margin-left: 0;
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image figure,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item figure,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image figure,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item figure {
  margin: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image img,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item img,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image img,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item img {
  display: block;
  max-width: 100%;
  height: auto;
  width: auto;
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image figcaption,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item figcaption,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image figcaption,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item figcaption {
  position: absolute;
  bottom: 0;
  width: 100%;
  max-height: 100%;
  overflow: auto;
  padding: 3em 0.77em 0.7em;
  color: #fff;
  text-align: center;
  font-size: 0.8em;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.7) 0, rgba(0, 0, 0, 0.3) 70%, transparent);
  box-sizing: border-box;
  margin: 0;
  z-index: 2;
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image figcaption img,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item figcaption img,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image figcaption img,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item figcaption img {
  display: inline;
}
.wp-block-gallery:not(.has-nested-images) figcaption,
.blocks-gallery-grid:not(.has-nested-images) figcaption {
  flex-grow: 1;
}
.wp-block-gallery:not(.has-nested-images).is-cropped .blocks-gallery-image a,
.wp-block-gallery:not(.has-nested-images).is-cropped .blocks-gallery-image img, .wp-block-gallery:not(.has-nested-images).is-cropped .blocks-gallery-item a,
.wp-block-gallery:not(.has-nested-images).is-cropped .blocks-gallery-item img,
.blocks-gallery-grid:not(.has-nested-images).is-cropped .blocks-gallery-image a,
.blocks-gallery-grid:not(.has-nested-images).is-cropped .blocks-gallery-image img,
.blocks-gallery-grid:not(.has-nested-images).is-cropped .blocks-gallery-item a,
.blocks-gallery-grid:not(.has-nested-images).is-cropped .blocks-gallery-item img {
  width: 100%;
  height: 100%;
  flex: 1;
  object-fit: cover;
}
.wp-block-gallery:not(.has-nested-images).columns-1 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-1 .blocks-gallery-item,
.blocks-gallery-grid:not(.has-nested-images).columns-1 .blocks-gallery-image,
.blocks-gallery-grid:not(.has-nested-images).columns-1 .blocks-gallery-item {
  width: 100%;
  margin-left: 0;
}
@media (min-width: 600px) {
  .wp-block-gallery:not(.has-nested-images).columns-3 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-3 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-3 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-3 .blocks-gallery-item {
    width: calc(33.3333333333% - 0.6666666667em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-4 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-4 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-4 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-4 .blocks-gallery-item {
    width: calc(25% - 0.75em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-5 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-5 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-5 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-5 .blocks-gallery-item {
    width: calc(20% - 0.8em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-6 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-6 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-6 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-6 .blocks-gallery-item {
    width: calc(16.6666666667% - 0.8333333333em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-7 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-7 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-7 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-7 .blocks-gallery-item {
    width: calc(14.2857142857% - 0.8571428571em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-8 .blocks-gallery-image, .wp-block-gallery:not(.has-nested-images).columns-8 .blocks-gallery-item,
  .blocks-gallery-grid:not(.has-nested-images).columns-8 .blocks-gallery-image,
  .blocks-gallery-grid:not(.has-nested-images).columns-8 .blocks-gallery-item {
    width: calc(12.5% - 0.875em);
    margin-left: 1em;
  }
  .wp-block-gallery:not(.has-nested-images).columns-1 .blocks-gallery-image:nth-of-type(1n), .wp-block-gallery:not(.has-nested-images).columns-1 .blocks-gallery-item:nth-of-type(1n),
  .blocks-gallery-grid:not(.has-nested-images).columns-1 .blocks-gallery-image:nth-of-type(1n),
  .blocks-gallery-grid:not(.has-nested-images).columns-1 .blocks-gallery-item:nth-of-type(1n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-2 .blocks-gallery-image:nth-of-type(2n), .wp-block-gallery:not(.has-nested-images).columns-2 .blocks-gallery-item:nth-of-type(2n),
  .blocks-gallery-grid:not(.has-nested-images).columns-2 .blocks-gallery-image:nth-of-type(2n),
  .blocks-gallery-grid:not(.has-nested-images).columns-2 .blocks-gallery-item:nth-of-type(2n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-3 .blocks-gallery-image:nth-of-type(3n), .wp-block-gallery:not(.has-nested-images).columns-3 .blocks-gallery-item:nth-of-type(3n),
  .blocks-gallery-grid:not(.has-nested-images).columns-3 .blocks-gallery-image:nth-of-type(3n),
  .blocks-gallery-grid:not(.has-nested-images).columns-3 .blocks-gallery-item:nth-of-type(3n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-4 .blocks-gallery-image:nth-of-type(4n), .wp-block-gallery:not(.has-nested-images).columns-4 .blocks-gallery-item:nth-of-type(4n),
  .blocks-gallery-grid:not(.has-nested-images).columns-4 .blocks-gallery-image:nth-of-type(4n),
  .blocks-gallery-grid:not(.has-nested-images).columns-4 .blocks-gallery-item:nth-of-type(4n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-5 .blocks-gallery-image:nth-of-type(5n), .wp-block-gallery:not(.has-nested-images).columns-5 .blocks-gallery-item:nth-of-type(5n),
  .blocks-gallery-grid:not(.has-nested-images).columns-5 .blocks-gallery-image:nth-of-type(5n),
  .blocks-gallery-grid:not(.has-nested-images).columns-5 .blocks-gallery-item:nth-of-type(5n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-6 .blocks-gallery-image:nth-of-type(6n), .wp-block-gallery:not(.has-nested-images).columns-6 .blocks-gallery-item:nth-of-type(6n),
  .blocks-gallery-grid:not(.has-nested-images).columns-6 .blocks-gallery-image:nth-of-type(6n),
  .blocks-gallery-grid:not(.has-nested-images).columns-6 .blocks-gallery-item:nth-of-type(6n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-7 .blocks-gallery-image:nth-of-type(7n), .wp-block-gallery:not(.has-nested-images).columns-7 .blocks-gallery-item:nth-of-type(7n),
  .blocks-gallery-grid:not(.has-nested-images).columns-7 .blocks-gallery-image:nth-of-type(7n),
  .blocks-gallery-grid:not(.has-nested-images).columns-7 .blocks-gallery-item:nth-of-type(7n) {
    margin-left: 0;
  }
  .wp-block-gallery:not(.has-nested-images).columns-8 .blocks-gallery-image:nth-of-type(8n), .wp-block-gallery:not(.has-nested-images).columns-8 .blocks-gallery-item:nth-of-type(8n),
  .blocks-gallery-grid:not(.has-nested-images).columns-8 .blocks-gallery-image:nth-of-type(8n),
  .blocks-gallery-grid:not(.has-nested-images).columns-8 .blocks-gallery-item:nth-of-type(8n) {
    margin-left: 0;
  }
}
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-image:last-child,
.wp-block-gallery:not(.has-nested-images) .blocks-gallery-item:last-child,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-image:last-child,
.blocks-gallery-grid:not(.has-nested-images) .blocks-gallery-item:last-child {
  margin-left: 0;
}
.wp-block-gallery:not(.has-nested-images).alignleft, .wp-block-gallery:not(.has-nested-images).alignright,
.blocks-gallery-grid:not(.has-nested-images).alignleft,
.blocks-gallery-grid:not(.has-nested-images).alignright {
  max-width: 420px;
  width: 100%;
}
.wp-block-gallery:not(.has-nested-images).aligncenter .blocks-gallery-item figure,
.blocks-gallery-grid:not(.has-nested-images).aligncenter .blocks-gallery-item figure {
  justify-content: center;
}

.wp-block-gallery:not(.is-cropped) .blocks-gallery-item {
  align-self: flex-start;
}

figure.wp-block-gallery.has-nested-images:where(.is-layout-flex) {
  align-items: normal;
}

.wp-block-gallery.has-nested-images:where(.is-layout-flex) figure.wp-block-image:not(#individual-image) {
  width: calc(50% - var(--wp--style--unstable-gallery-gap, 16px) / 2);
  margin: 0;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex) figure.wp-block-image {
  display: flex;
  flex-grow: 1;
  justify-content: center;
  flex-direction: column;
  max-width: 100%;
  box-sizing: border-box;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex) figure.wp-block-image > div,
.wp-block-gallery.has-nested-images:where(.is-layout-flex) figure.wp-block-image > a {
  margin: 0;
  flex-direction: column;
  flex-grow: 1;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex) figure.wp-block-image img {
  display: block;
  height: auto;
  max-width: 100% !important;
  width: auto;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex) figcaption {
  flex-grow: 1;
  flex-basis: 100%;
  text-align: center;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex):not(.is-cropped) figure.wp-block-image:not(#individual-image) {
  margin-top: 0;
  margin-bottom: auto;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).is-cropped figure.wp-block-image:not(#individual-image) {
  align-self: inherit;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).is-cropped figure.wp-block-image:not(#individual-image) > div:not(.components-drop-zone),
.wp-block-gallery.has-nested-images:where(.is-layout-flex).is-cropped figure.wp-block-image:not(#individual-image) > a {
  display: flex;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).is-cropped figure.wp-block-image:not(#individual-image) a,
.wp-block-gallery.has-nested-images:where(.is-layout-flex).is-cropped figure.wp-block-image:not(#individual-image) img {
  width: 100%;
  flex: 1 0 0%;
  height: 100%;
  object-fit: cover;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-1 figure.wp-block-image:not(#individual-image) {
  width: 100%;
}
@media (min-width: 600px) {
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-3 figure.wp-block-image:not(#individual-image) {
    width: calc(33.3333333333% - var(--wp--style--unstable-gallery-gap, 16px) * 0.6666666667);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-4 figure.wp-block-image:not(#individual-image) {
    width: calc(25% - var(--wp--style--unstable-gallery-gap, 16px) * 0.75);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-5 figure.wp-block-image:not(#individual-image) {
    width: calc(20% - var(--wp--style--unstable-gallery-gap, 16px) * 0.8);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-6 figure.wp-block-image:not(#individual-image) {
    width: calc(16.6666666667% - var(--wp--style--unstable-gallery-gap, 16px) * 0.8333333333);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-7 figure.wp-block-image:not(#individual-image) {
    width: calc(14.2857142857% - var(--wp--style--unstable-gallery-gap, 16px) * 0.8571428571);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-8 figure.wp-block-image:not(#individual-image) {
    width: calc(12.5% - var(--wp--style--unstable-gallery-gap, 16px) * 0.875);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-default figure.wp-block-image:not(#individual-image) {
    width: calc(33.33% - var(--wp--style--unstable-gallery-gap, 16px) * 0.6666666667);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-default figure.wp-block-image:not(#individual-image):first-child:nth-last-child(2),
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-default figure.wp-block-image:not(#individual-image):first-child:nth-last-child(2) ~ figure.wp-block-image:not(#individual-image) {
    width: calc(50% - var(--wp--style--unstable-gallery-gap, 16px) * 0.5);
  }
  .wp-block-gallery.has-nested-images:where(.is-layout-flex).columns-default figure.wp-block-image:not(#individual-image):first-child:nth-last-child(1) {
    width: 100%;
  }
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).alignleft, .wp-block-gallery.has-nested-images:where(.is-layout-flex).alignright {
  max-width: 420px;
  width: 100%;
}
.wp-block-gallery.has-nested-images:where(.is-layout-flex).aligncenter {
  justify-content: center;
}

.wp-block-gallery.has-nested-images figure.wp-block-image {
  position: relative;
  margin: 0;
}
.wp-block-gallery.has-nested-images figure.wp-block-image:has(figcaption)::before,
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 100%;
}
.wp-block-gallery.has-nested-images figure.wp-block-image:has(figcaption)::before {
  content: "";
  height: 100%;
  max-height: 3em;
  pointer-events: none;
  backdrop-filter: blur(3px);
  mask-image: linear-gradient(0deg, #000 20%, transparent 100%);
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
  color: #fff;
  text-shadow: 0 0 1.5px #000;
  font-size: 13px;
  margin: 0;
  overflow: auto;
  padding: 1em;
  text-align: center;
  box-sizing: border-box;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption::-webkit-scrollbar-track {
  background-color: transparent;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 8px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption:hover::-webkit-scrollbar-thumb, .wp-block-gallery.has-nested-images figure.wp-block-image figcaption:focus::-webkit-scrollbar-thumb, .wp-block-gallery.has-nested-images figure.wp-block-image figcaption:focus-within::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.8);
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
  scrollbar-width: thin;
  scrollbar-gutter: stable both-edges;
  scrollbar-color: transparent transparent;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption:hover, .wp-block-gallery.has-nested-images figure.wp-block-image figcaption:focus, .wp-block-gallery.has-nested-images figure.wp-block-image figcaption:focus-within {
  scrollbar-color: rgba(255, 255, 255, 0.8) transparent;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
  will-change: transform;
}
@media (hover: none) {
  .wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
    scrollbar-color: rgba(255, 255, 255, 0.8) transparent;
  }
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption {
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption img {
  display: inline;
}
.wp-block-gallery.has-nested-images figure.wp-block-image figcaption a {
  color: inherit;
}
.wp-block-gallery.has-nested-images figure.wp-block-image.has-custom-border img {
  box-sizing: border-box;
}
.wp-block-gallery.has-nested-images figure.wp-block-image.is-style-rounded > div,
.wp-block-gallery.has-nested-images figure.wp-block-image.is-style-rounded > a, .wp-block-gallery.has-nested-images figure.wp-block-image.has-custom-border > div,
.wp-block-gallery.has-nested-images figure.wp-block-image.has-custom-border > a {
  flex: 1 1 auto;
}
.wp-block-gallery.has-nested-images figure.wp-block-image.is-style-rounded figcaption, .wp-block-gallery.has-nested-images figure.wp-block-image.has-custom-border figcaption {
  flex: initial;
  background: none;
  color: inherit;
  margin: 0;
  padding: 10px 10px 9px;
  position: relative;
  text-shadow: none;
}
.wp-block-gallery.has-nested-images figure.wp-block-image.is-style-rounded::before, .wp-block-gallery.has-nested-images figure.wp-block-image.has-custom-border::before {
  content: none;
}

:where(.wp-block-gallery.has-nested-images.is-layout-grid) > .blocks-gallery-caption {
  grid-column: 1/-1;
  text-align: center;
}

.wp-block-group {
  box-sizing: border-box;
}

:where(.wp-block-group.wp-block-group-is-layout-constrained) {
  position: relative;
}

h1:where(.wp-block-heading).has-background,
h2:where(.wp-block-heading).has-background,
h3:where(.wp-block-heading).has-background,
h4:where(.wp-block-heading).has-background,
h5:where(.wp-block-heading).has-background,
h6:where(.wp-block-heading).has-background {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}
h1.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]), h1.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]),
h2.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]),
h2.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]),
h3.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]),
h3.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]),
h4.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]),
h4.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]),
h5.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]),
h5.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]),
h6.has-text-align-right[style*=writing-mode]:where([style*=vertical-rl]),
h6.has-text-align-left[style*=writing-mode]:where([style*=vertical-lr]) {
  rotate: 180deg;
}

/**
 * Editor and frontend styles for the Icon Block.
 */
/* Icon Block styles. */
.wp-block-icon {
  line-height: 0;
}
.wp-block-icon.aligncenter {
  display: flex;
  justify-content: center;
}
.wp-block-icon svg {
  box-sizing: border-box;
  fill: currentColor;
}
.wp-block-icon svg.is-flip-horizontal {
  transform: scaleX(-1);
}
.wp-block-icon svg.is-flip-vertical {
  transform: scaleY(-1);
}
.wp-block-icon svg.is-flip-horizontal.is-flip-vertical {
  transform: scaleX(-1) scaleY(-1);
}

:where(.wp-block-icon) svg {
  width: 100%;
  height: 100%;
}
:where(.wp-block-icon) svg :where(path, rect, circle, ellipse, line, polygon, polyline) {
  vector-effect: none;
}

.wp-block-image > a,
.wp-block-image > figure > a {
  display: inline-block;
  color: inherit;
}
.wp-block-image img {
  height: auto;
  max-width: 100%;
  vertical-align: bottom;
  box-sizing: border-box;
}
@media not (prefers-reduced-motion) {
  .wp-block-image img.hide {
    visibility: hidden;
  }
  .wp-block-image img.show {
    animation: show-content-image 0.4s;
  }
}
.wp-block-image[style*=border-radius] > a,
.wp-block-image[style*=border-radius] img {
  border-radius: inherit;
}
.wp-block-image.has-custom-border img {
  box-sizing: border-box;
}
.wp-block-image.aligncenter {
  text-align: center;
}
.wp-block-image.alignfull > a, .wp-block-image.alignwide > a {
  width: 100%;
}
.wp-block-image.alignfull img, .wp-block-image.alignwide img {
  height: auto;
  width: 100%;
}
.wp-block-image.alignleft, .wp-block-image.alignright, .wp-block-image.aligncenter,
.wp-block-image .alignleft,
.wp-block-image .alignright,
.wp-block-image .aligncenter {
  display: table;
}
.wp-block-image.alignleft > figcaption, .wp-block-image.alignright > figcaption, .wp-block-image.aligncenter > figcaption,
.wp-block-image .alignleft > figcaption,
.wp-block-image .alignright > figcaption,
.wp-block-image .aligncenter > figcaption {
  display: table-caption;
  caption-side: bottom;
}
.wp-block-image .alignleft {
  float: left;
  margin-left: 0;
  margin-right: 1em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.wp-block-image .alignright {
  float: right;
  margin-right: 0;
  margin-left: 1em;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.wp-block-image .aligncenter {
  margin-right: auto;
  margin-left: auto;
}
.wp-block-image :where(figcaption) {
  margin-top: 0.5em;
  margin-bottom: 1em;
}
.wp-block-image.is-style-circle-mask img {
  border-radius: 9999px;
}
@supports (mask-image: none) or (-webkit-mask-image: none) {
  .wp-block-image.is-style-circle-mask img {
    mask-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='50'/%3E%3C/svg%3E");
    mask-mode: alpha;
    mask-repeat: no-repeat;
    mask-size: contain;
    mask-position: center;
    border-radius: 0;
  }
}

:root :where(.wp-block-image.is-style-rounded img, .wp-block-image .is-style-rounded img) {
  border-radius: 9999px;
}

.wp-block-image figure {
  margin: 0;
}

.wp-lightbox-container {
  position: relative;
  display: flex;
  flex-direction: column;
}
.wp-lightbox-container img {
  cursor: zoom-in;
}
.wp-lightbox-container:has(img:hover) button {
  opacity: 1;
}
.wp-lightbox-container button {
  opacity: 0;
  border: none;
  background-color: rgba(90, 90, 90, 0.25);
  backdrop-filter: blur(16px) saturate(180%);
  cursor: zoom-in;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  position: absolute;
  z-index: 100;
  top: 16px;
  left: 16px;
  text-align: center;
  padding: 0;
  border-radius: 4px;
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-container button {
    transition: opacity 0.2s ease;
  }
}
.wp-lightbox-container button:focus-visible {
  outline: 3px auto rgba(90, 90, 90, 0.25);
  outline: 3px auto -webkit-focus-ring-color;
  outline-offset: 3px;
}
.wp-lightbox-container button:hover {
  cursor: pointer;
  opacity: 1;
}
.wp-lightbox-container button:focus {
  opacity: 1;
}
.wp-lightbox-container button:hover, .wp-lightbox-container button:focus, .wp-lightbox-container button:not(:hover):not(:active):not(.has-background) {
  background-color: rgba(90, 90, 90, 0.25);
  border: none;
}

.wp-lightbox-overlay {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100000;
  overflow: hidden;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  visibility: hidden;
  cursor: zoom-out;
}
.wp-lightbox-overlay .wp-lightbox-close-button {
  font-family: inherit;
  position: absolute;
  top: calc(env(safe-area-inset-top) + 16px);
  left: calc(env(safe-area-inset-left) + 16px);
  padding: 0 4px;
  cursor: pointer;
  z-index: 5000000;
  min-width: 40px;
  min-height: 40px;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.wp-lightbox-overlay .wp-lightbox-close-button:hover, .wp-lightbox-overlay .wp-lightbox-close-button:focus, .wp-lightbox-overlay .wp-lightbox-close-button:not(:hover):not(:active):not(.has-background) {
  background: none;
  border: none;
}
.wp-lightbox-overlay .wp-lightbox-close-button:has(.wp-lightbox-close-text:not([hidden])) .wp-lightbox-close-icon svg {
  height: 1em;
  width: 1em;
}
.wp-lightbox-overlay .wp-lightbox-close-icon svg {
  display: block;
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-prev,
.wp-lightbox-overlay .wp-lightbox-navigation-button-next {
  position: absolute;
  padding: 0 8px;
  z-index: 2000002;
  font-family: inherit;
  min-width: 40px;
  min-height: 40px;
  gap: 4px;
  display: flex;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  bottom: 16px;
  line-height: 1;
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-prev[hidden],
.wp-lightbox-overlay .wp-lightbox-navigation-button-next[hidden] {
  display: none;
}
@media (min-width: 960px) {
  .wp-lightbox-overlay .wp-lightbox-navigation-button-prev,
  .wp-lightbox-overlay .wp-lightbox-navigation-button-next {
    bottom: 50%;
    transform: translateY(-50%);
  }
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-prev:hover, .wp-lightbox-overlay .wp-lightbox-navigation-button-prev:focus, .wp-lightbox-overlay .wp-lightbox-navigation-button-prev:not(:hover):not(:active):not(.has-background),
.wp-lightbox-overlay .wp-lightbox-navigation-button-next:hover,
.wp-lightbox-overlay .wp-lightbox-navigation-button-next:focus,
.wp-lightbox-overlay .wp-lightbox-navigation-button-next:not(:hover):not(:active):not(.has-background) {
  background: none;
  border: none;
  padding: 0 8px;
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-prev:has(.wp-lightbox-navigation-text:not([hidden])) .wp-lightbox-navigation-icon svg,
.wp-lightbox-overlay .wp-lightbox-navigation-button-next:has(.wp-lightbox-navigation-text:not([hidden])) .wp-lightbox-navigation-icon svg {
  width: 1.5em;
  height: 1.5em;
  display: block;
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-prev {
  right: calc(env(safe-area-inset-right) + 16px);
}
.wp-lightbox-overlay .wp-lightbox-navigation-button-next {
  left: calc(env(safe-area-inset-left) + 16px);
}
.wp-lightbox-overlay .wp-lightbox-navigation-icon svg {
  vertical-align: middle;
}
.wp-lightbox-overlay .lightbox-image-container {
  position: absolute;
  overflow: hidden;
  top: 50%;
  right: 50%;
  transform-origin: top right;
  transform: translate(calc(-1*(-50% + var(--wp--lightbox-drag-offset, 0px))), -50%);
  width: var(--wp--lightbox-container-width);
  height: var(--wp--lightbox-container-height);
  z-index: 2000001;
  cursor: default;
}
.wp-lightbox-overlay .wp-block-image {
  position: relative;
  transform-origin: 100% 0;
  display: flex;
  width: 100%;
  height: 100%;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  z-index: 3000000;
  margin: 0;
}
.wp-lightbox-overlay .wp-block-image img {
  min-width: var(--wp--lightbox-image-width);
  min-height: var(--wp--lightbox-image-height);
  width: var(--wp--lightbox-image-width);
  height: var(--wp--lightbox-image-height);
}
.wp-lightbox-overlay .wp-block-image figcaption {
  display: none;
}
.wp-lightbox-overlay .lightbox-thumbnail-container {
  --wp--lightbox-image-width: var(--wp--lightbox-thumbnail-width);
  --wp--lightbox-image-height: var(--wp--lightbox-thumbnail-height);
}
.wp-lightbox-overlay button {
  border: none;
  background: none;
}
.wp-lightbox-overlay .scrim {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 2000000;
  background-color: rgb(255, 255, 255);
  opacity: 0.9;
}
.wp-lightbox-overlay.active {
  visibility: visible;
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-overlay.active {
    animation: both turn-on-visibility 0.25s;
  }
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-overlay.active img {
    animation: both turn-on-visibility 0.35s;
  }
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-overlay.show-closing-animation:not(.active) {
    animation: both turn-off-visibility 0.35s;
  }
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-overlay.show-closing-animation:not(.active) img {
    animation: both turn-off-visibility 0.25s;
  }
}
@media not (prefers-reduced-motion) {
  .wp-lightbox-overlay.zoom.active {
    opacity: 1;
    visibility: visible;
    animation: none;
  }
  .wp-lightbox-overlay.zoom.active .lightbox-image-container {
    animation: lightbox-zoom-in 0.4s;
  }
  .wp-lightbox-overlay.zoom.active .lightbox-image-container img {
    animation: none;
  }
  .wp-lightbox-overlay.zoom.active .scrim {
    animation: turn-on-visibility 0.4s forwards;
  }
  .wp-lightbox-overlay.zoom.show-closing-animation:not(.active) {
    animation: none;
  }
  .wp-lightbox-overlay.zoom.show-closing-animation:not(.active) .lightbox-image-container {
    animation: lightbox-zoom-out 0.4s;
  }
  .wp-lightbox-overlay.zoom.show-closing-animation:not(.active) .lightbox-image-container img {
    animation: none;
  }
  .wp-lightbox-overlay.zoom.show-closing-animation:not(.active) .scrim {
    animation: turn-off-visibility 0.4s forwards;
  }
}

@keyframes show-content-image {
  0% {
    visibility: hidden;
  }
  99% {
    visibility: hidden;
  }
  100% {
    visibility: visible;
  }
}
@keyframes turn-on-visibility {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
@keyframes turn-off-visibility {
  0% {
    opacity: 1;
    visibility: visible;
  }
  99% {
    opacity: 0;
    visibility: visible;
  }
  100% {
    opacity: 0;
    visibility: hidden;
  }
}
@keyframes lightbox-zoom-in {
  0% {
    clip-path: var(--wp--lightbox-initial-clip);
    transform: translate(calc(-1*((-100vw + var(--wp--lightbox-scrollbar-width)) / 2 + var(--wp--lightbox-initial-left-position))), calc(-50vh + var(--wp--lightbox-initial-top-position))) scale(var(--wp--lightbox-scale));
  }
  100% {
    clip-path: inset(0);
    transform: translate(50%, -50%) scale(1, 1);
  }
}
@keyframes lightbox-zoom-out {
  0% {
    visibility: visible;
    clip-path: inset(0);
    transform: translate(50%, -50%) scale(1, 1);
  }
  99% {
    visibility: visible;
  }
  100% {
    visibility: hidden;
    clip-path: var(--wp--lightbox-initial-clip);
    transform: translate(calc(-1*((-100vw + var(--wp--lightbox-scrollbar-width)) / 2 + var(--wp--lightbox-initial-left-position))), calc(-50vh + var(--wp--lightbox-initial-top-position))) scale(var(--wp--lightbox-scale));
  }
}
:where(.wp-block-latest-comments) {
  padding-right: 0;
}

ol.wp-block-latest-comments {
  margin-right: 0;
  box-sizing: border-box;
}

:where(.wp-block-latest-comments:not([style*=line-height] .wp-block-latest-comments__comment)) {
  line-height: 1.1;
}

:where(.wp-block-latest-comments:not([style*=line-height] .wp-block-latest-comments__comment-excerpt p)) {
  line-height: 1.8;
}

.has-dates :where(.wp-block-latest-comments:not([style*=line-height])),
.has-excerpts :where(.wp-block-latest-comments:not([style*=line-height])) {
  line-height: 1.5;
}

.wp-block-latest-comments__comment {
  list-style: none;
  margin-bottom: 1em;
}
.has-avatars .wp-block-latest-comments__comment {
  min-height: 2.25em;
  list-style: none;
}
.has-avatars .wp-block-latest-comments__comment .wp-block-latest-comments__comment-meta,
.has-avatars .wp-block-latest-comments__comment .wp-block-latest-comments__comment-excerpt {
  margin-right: 3.25em;
}

.wp-block-latest-comments__comment-excerpt p {
  font-size: 0.875em;
  margin: 0.36em 0 1.4em;
}

.wp-block-latest-comments__comment-date {
  display: block;
  font-size: 0.75em;
}

.wp-block-latest-comments .avatar,
.wp-block-latest-comments__comment-avatar {
  border-radius: 1.5em;
  display: block;
  float: right;
  height: 2.5em;
  margin-left: 0.75em;
  width: 2.5em;
}

.wp-block-latest-comments[style*=font-size] a,
.wp-block-latest-comments[class*=-font-size] a {
  font-size: inherit;
}

.wp-block-latest-posts {
  box-sizing: border-box;
}
.wp-block-latest-posts.alignleft {
  margin-right: 2em;
}
.wp-block-latest-posts.alignright {
  margin-left: 2em;
}
.wp-block-latest-posts.wp-block-latest-posts__list {
  list-style: none;
}
.wp-block-latest-posts.wp-block-latest-posts__list li {
  clear: both;
  overflow-wrap: break-word;
}
.wp-block-latest-posts.is-grid:not(.is-layout-grid) {
  display: flex;
  flex-wrap: wrap;
}
.wp-block-latest-posts.is-grid:not(.is-layout-grid) li {
  margin: 0 0 1.25em 1.25em;
  width: 100%;
}
@media (min-width: 600px) {
  .wp-block-latest-posts.columns-2:not(.is-layout-grid) li {
    width: calc(100% / 2 - 1.25em + 1.25em / 2);
  }
  .wp-block-latest-posts.columns-2:not(.is-layout-grid) li:nth-child(2n) {
    margin-left: 0;
  }
  .wp-block-latest-posts.columns-3:not(.is-layout-grid) li {
    width: calc(100% / 3 - 1.25em + 1.25em / 3);
  }
  .wp-block-latest-posts.columns-3:not(.is-layout-grid) li:nth-child(3n) {
    margin-left: 0;
  }
  .wp-block-latest-posts.columns-4:not(.is-layout-grid) li {
    width: calc(100% / 4 - 1.25em + 1.25em / 4);
  }
  .wp-block-latest-posts.columns-4:not(.is-layout-grid) li:nth-child(4n) {
    margin-left: 0;
  }
  .wp-block-latest-posts.columns-5:not(.is-layout-grid) li {
    width: calc(100% / 5 - 1.25em + 1.25em / 5);
  }
  .wp-block-latest-posts.columns-5:not(.is-layout-grid) li:nth-child(5n) {
    margin-left: 0;
  }
  .wp-block-latest-posts.columns-6:not(.is-layout-grid) li {
    width: calc(100% / 6 - 1.25em + 1.25em / 6);
  }
  .wp-block-latest-posts.columns-6:not(.is-layout-grid) li:nth-child(6n) {
    margin-left: 0;
  }
}

@media (max-width: 600px) {
  .wp-block-latest-posts-is-layout-grid[class*=columns-]:not(.has-native-responsive-grid) {
    grid-template-columns: 1fr;
  }
}
:root :where(.wp-block-latest-posts.is-grid) {
  padding: 0;
}
:root :where(.wp-block-latest-posts.wp-block-latest-posts__list) {
  padding-right: 0;
}

.wp-block-latest-posts__post-date,
.wp-block-latest-posts__post-author {
  display: block;
  font-size: 0.8125em;
}

.wp-block-latest-posts__post-excerpt,
.wp-block-latest-posts__post-full-content {
  margin-top: 0.5em;
  margin-bottom: 1em;
}

.wp-block-latest-posts__featured-image a {
  display: inline-block;
}
.wp-block-latest-posts__featured-image img {
  height: auto;
  width: auto;
  max-width: 100%;
}
.wp-block-latest-posts__featured-image.alignleft {
  margin-right: 1em;
  float: left;
}
.wp-block-latest-posts__featured-image.alignright {
  margin-left: 1em;
  float: right;
}
.wp-block-latest-posts__featured-image.aligncenter {
  margin-bottom: 1em;
  text-align: center;
}

ol,
ul {
  box-sizing: border-box;
}

:root :where(.wp-block-list.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

.wp-block-loginout {
  box-sizing: border-box;
}

.wp-block-math {
  overflow-x: auto;
  overflow-y: hidden;
}

.wp-block-media-text {
  direction: ltr;
  display: grid;
  grid-template-columns: 50% 1fr;
  grid-template-rows: auto;
  box-sizing: border-box;
}
.wp-block-media-text.has-media-on-the-right {
  grid-template-columns: 1fr 50%;
}

.wp-block-media-text.is-vertically-aligned-top > .wp-block-media-text__content,
.wp-block-media-text.is-vertically-aligned-top > .wp-block-media-text__media {
  align-self: start;
}

.wp-block-media-text > .wp-block-media-text__content,
.wp-block-media-text > .wp-block-media-text__media,
.wp-block-media-text.is-vertically-aligned-center > .wp-block-media-text__content,
.wp-block-media-text.is-vertically-aligned-center > .wp-block-media-text__media {
  align-self: center;
}

.wp-block-media-text.is-vertically-aligned-bottom > .wp-block-media-text__content,
.wp-block-media-text.is-vertically-aligned-bottom > .wp-block-media-text__media {
  align-self: end;
}

.wp-block-media-text > .wp-block-media-text__media {
  grid-column: 1;
  grid-row: 1;
  margin: 0;
}

.wp-block-media-text > .wp-block-media-text__content {
  direction: rtl;
  grid-column: 2;
  grid-row: 1;
  word-break: normal;
  overflow-wrap: anywhere;
  min-width: 0;
}

:root :where(.wp-block-media-text > .wp-block-media-text__content) {
  padding: 0 8%;
}

.wp-block-media-text.has-media-on-the-right > .wp-block-media-text__media {
  grid-column: 2;
  grid-row: 1;
}

.wp-block-media-text.has-media-on-the-right > .wp-block-media-text__content {
  grid-column: 1;
  grid-row: 1;
}

.wp-block-media-text__media a {
  display: block;
}

.wp-block-media-text__media img,
.wp-block-media-text__media video {
  height: auto;
  max-width: unset;
  width: 100%;
  vertical-align: middle;
}

/* \`is-image-fill\` is deprecated and the styles are kept for backwards compatibility. */
.wp-block-media-text.is-image-fill > .wp-block-media-text__media {
  height: 100%;
  min-height: 250px;
  background-size: cover;
}

.wp-block-media-text.is-image-fill > .wp-block-media-text__media > a {
  display: block;
  height: 100%;
}

.wp-block-media-text.is-image-fill > .wp-block-media-text__media img {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  border: 0;
}

/* Image fill for versions 8 and onwards */
.wp-block-media-text.is-image-fill-element > .wp-block-media-text__media {
  position: relative;
  height: 100%;
  min-height: 250px;
}

.wp-block-media-text.is-image-fill-element > .wp-block-media-text__media > a {
  display: block;
  height: 100%;
}

.wp-block-media-text.is-image-fill-element > .wp-block-media-text__media img {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/*
* Here we here not able to use a mobile first CSS approach.
* Custom widths are set using inline styles, and on mobile,
* we need 100% width, so we use important to overwrite the inline style.
* If the style were set on mobile first, on desktop styles,
* we would have no way of setting the style again to the inline style.
*/
@media (max-width: 600px) {
  .wp-block-media-text.is-stacked-on-mobile {
    grid-template-columns: 100% !important;
  }
  .wp-block-media-text.is-stacked-on-mobile > .wp-block-media-text__media {
    grid-column: 1;
    grid-row: 1;
  }
  .wp-block-media-text.is-stacked-on-mobile > .wp-block-media-text__content {
    grid-column: 1;
    grid-row: 2;
  }
}
.wp-block-navigation {
  position: relative;
}
.wp-block-navigation ul {
  margin-top: 0;
  margin-bottom: 0;
  margin-right: 0;
  padding-right: 0;
}
.wp-block-navigation ul,
.wp-block-navigation ul li {
  list-style: none;
}
.wp-block-navigation .wp-block-navigation-item {
  background-color: inherit;
  display: flex;
  align-items: center;
  position: relative;
}
.wp-block-navigation .wp-block-navigation-item .wp-block-navigation__submenu-container:empty {
  display: none;
}
.wp-block-navigation .wp-block-navigation-item__content {
  display: block;
  z-index: 1;
}
.wp-block-navigation .wp-block-navigation-item__content.wp-block-navigation-item__content {
  color: inherit;
}
.wp-block-navigation.has-text-decoration-underline .wp-block-navigation-item__content {
  text-decoration: underline;
}
.wp-block-navigation.has-text-decoration-underline .wp-block-navigation-item__content:focus, .wp-block-navigation.has-text-decoration-underline .wp-block-navigation-item__content:active {
  text-decoration: underline;
}
.wp-block-navigation.has-text-decoration-line-through .wp-block-navigation-item__content {
  text-decoration: line-through;
}
.wp-block-navigation.has-text-decoration-line-through .wp-block-navigation-item__content:focus, .wp-block-navigation.has-text-decoration-line-through .wp-block-navigation-item__content:active {
  text-decoration: line-through;
}
.wp-block-navigation :where(a), .wp-block-navigation :where(a:focus), .wp-block-navigation :where(a:active) {
  text-decoration: none;
}
.wp-block-navigation .wp-block-navigation__submenu-icon {
  align-self: center;
  line-height: 0;
  display: inline-block;
  font-size: inherit;
  padding: 0;
  background-color: inherit;
  color: currentColor;
  border: none;
  width: 0.6em;
  height: 0.6em;
  margin-right: 0.25em;
}
.wp-block-navigation .wp-block-navigation__submenu-icon svg {
  display: inline-block;
  stroke: currentColor;
  width: inherit;
  height: inherit;
  margin-top: 0.075em;
}
.wp-block-navigation {
  --navigation-layout-justification-setting: flex-start;
  --navigation-layout-direction: row;
  --navigation-layout-wrap: wrap;
  --navigation-layout-justify: flex-start;
  --navigation-layout-align: center;
}
.wp-block-navigation.is-vertical {
  --navigation-layout-direction: column;
  --navigation-layout-justify: initial;
  --navigation-layout-align: flex-start;
  text-align: var(--navigation-layout-text-align, inherit);
}
.wp-block-navigation.is-vertical .wp-block-navigation-item__content {
  text-align: inherit;
}
.wp-block-navigation.is-vertical .wp-block-navigation-item:not(.open-always) > .wp-block-navigation__submenu-container {
  text-align: initial;
}
.wp-block-navigation.no-wrap {
  --navigation-layout-wrap: nowrap;
}
.wp-block-navigation.items-justified-center {
  --navigation-layout-justification-setting: center;
  --navigation-layout-justify: center;
  --navigation-layout-text-align: center;
}
.wp-block-navigation.items-justified-center.is-vertical {
  --navigation-layout-align: center;
}
.wp-block-navigation.items-justified-right {
  --navigation-layout-justification-setting: flex-end;
  --navigation-layout-justify: flex-end;
  --navigation-layout-text-align: end;
}
.wp-block-navigation.items-justified-right.is-vertical {
  --navigation-layout-align: flex-end;
}
.wp-block-navigation.items-justified-space-between {
  --navigation-layout-justification-setting: space-between;
  --navigation-layout-justify: space-between;
}

:where(.wp-block-navigation) ul li {
  padding: 0;
}

.wp-block-navigation .has-child .wp-block-navigation__submenu-container {
  background-color: inherit;
  color: inherit;
  position: absolute;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: normal;
  opacity: 0;
}
@media not (prefers-reduced-motion) {
  .wp-block-navigation .has-child .wp-block-navigation__submenu-container {
    transition: opacity 0.1s linear;
  }
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container {
  visibility: hidden;
  width: 0;
  height: 0;
  overflow: hidden;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container > .wp-block-navigation-item > .wp-block-navigation-item__content {
  display: flex;
  flex-grow: 1;
  padding: 0.5em 1em;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container > .wp-block-navigation-item > .wp-block-navigation-item__content .wp-block-navigation__submenu-icon {
  margin-left: 0;
  margin-right: auto;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container .wp-block-navigation-item__content {
  margin: 0;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container {
  right: -1px;
  top: 100%;
}
@media (min-width: 782px) {
  .wp-block-navigation .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
    right: 100%;
    top: -1px;
  }
  .wp-block-navigation .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container::before {
    content: "";
    position: absolute;
    left: 100%;
    height: 100%;
    display: block;
    width: 0.5em;
    background: transparent;
  }
  .wp-block-navigation .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-icon {
    margin-left: 0.25em;
  }
  .wp-block-navigation .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-icon svg {
    transform: rotate(90deg);
  }
}
@media (hover: hover) {
  .wp-block-navigation .has-child:not(.open-on-click):not(.open-always):hover > .wp-block-navigation__submenu-container {
    visibility: visible;
    overflow: visible;
    opacity: 1;
    width: auto;
    height: auto;
    min-width: 200px;
  }
}
.wp-block-navigation .has-child:not(.open-on-click):not(.open-on-hover-click):not(.open-always):focus-within > .wp-block-navigation__submenu-container, .wp-block-navigation .has-child:not(.open-always) .wp-block-navigation-submenu__toggle[aria-expanded=true] ~ .wp-block-navigation__submenu-container {
  visibility: visible;
  overflow: visible;
  opacity: 1;
  width: auto;
  height: auto;
  min-width: 200px;
}
.wp-block-navigation .has-child.open-always {
  flex-wrap: var(--navigation-layout-wrap, wrap);
  flex-direction: var(--navigation-layout-direction, initial);
  justify-content: var(--navigation-layout-justify, initial);
  align-items: var(--navigation-layout-align, initial);
  gap: var(--wp--style--block-gap, 2em);
}
.wp-block-navigation .has-child.open-always .wp-block-navigation-item {
  justify-content: var(--navigation-layout-justify, initial);
}
.wp-block-navigation .has-child.open-always.wp-block-navigation-submenu,
.wp-block-navigation .has-child.open-always .wp-block-navigation__submenu-container {
  gap: var(--wp--style--block-gap, 2em);
}
.wp-block-navigation .has-child.open-always.wp-block-navigation-submenu,
.wp-block-navigation .has-child.open-always .wp-block-navigation__submenu-container,
.wp-block-navigation .has-child.open-always .wp-block-navigation-item {
  padding-top: 0;
  padding-bottom: 0;
}
.wp-block-navigation .has-child.open-always .wp-block-navigation__submenu-container {
  padding-right: var(--wp--style--block-gap, 2em);
  padding-left: var(--wp--style--block-gap, 2em);
}
.wp-block-navigation .has-child.open-always .wp-block-navigation__submenu-container .wp-block-navigation-item__content {
  padding: 0;
}
.wp-block-navigation .has-child.open-always > .wp-block-navigation-item__content,
.wp-block-navigation .has-child.open-always .wp-block-navigation__submenu-container > .wp-block-navigation-item > .wp-block-navigation-item__content {
  flex-grow: 0;
}
.wp-block-navigation .has-child.open-always > .wp-block-navigation__submenu-container {
  visibility: visible;
  overflow: visible;
  opacity: 1;
  width: auto;
  height: auto;
  flex-basis: 100%;
  position: static;
  border: none;
  background-color: transparent;
  color: inherit;
  box-shadow: none !important;
}

.wp-block-navigation.has-background .has-child .wp-block-navigation__submenu-container {
  right: 0;
  top: 100%;
}
@media (min-width: 782px) {
  .wp-block-navigation.has-background .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
    right: 100%;
    top: 0;
  }
}

.wp-block-navigation-submenu {
  position: relative;
  display: flex;
}
.wp-block-navigation-submenu .wp-block-navigation__submenu-icon svg {
  stroke: currentColor;
}

button.wp-block-navigation-item__content {
  background-color: transparent;
  border: none;
  color: currentColor;
  font-size: inherit;
  font-family: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  font-style: inherit;
  font-weight: inherit;
  text-transform: inherit;
  text-align: right;
}

.wp-block-navigation-submenu__toggle {
  cursor: pointer;
}
.wp-block-navigation-submenu__toggle[aria-expanded=true] + .wp-block-navigation__submenu-icon > svg,
.wp-block-navigation-submenu__toggle[aria-expanded=true] > svg {
  transform: rotate(-180deg);
}

.wp-block-navigation-item.open-on-click .wp-block-navigation-submenu__toggle {
  padding-right: 0;
  padding-left: 0.85em;
}
.wp-block-navigation-item.open-on-click .wp-block-navigation-submenu__toggle + .wp-block-navigation__submenu-icon {
  margin-right: -0.6em;
  pointer-events: none;
}

.wp-block-navigation-item.open-on-click button.wp-block-navigation-item__content:not(.wp-block-navigation-submenu__toggle) {
  padding: 0;
}

/**
 * Margins
 */
.wp-block-navigation__responsive-container,
.wp-block-navigation__responsive-close,
.wp-block-navigation__responsive-dialog,
.wp-block-navigation .wp-block-page-list,
.wp-block-navigation__container,
.wp-block-navigation__responsive-container-content {
  gap: inherit;
}

/**
 * Paddings
 */
:where(.wp-block-navigation.has-background .wp-block-navigation-item a:not(.wp-element-button)),
:where(.wp-block-navigation.has-background .wp-block-navigation-submenu a:not(.wp-element-button)) {
  padding: 0.5em 1em;
}

:where(.wp-block-navigation .wp-block-navigation__submenu-container .wp-block-navigation-item a:not(.wp-element-button)),
:where(.wp-block-navigation .wp-block-navigation__submenu-container .wp-block-navigation-submenu a:not(.wp-element-button)),
:where(.wp-block-navigation .wp-block-navigation__submenu-container .wp-block-navigation-submenu button.wp-block-navigation-item__content),
:where(.wp-block-navigation .wp-block-navigation__submenu-container .wp-block-pages-list__item button.wp-block-navigation-item__content) {
  padding: 0.5em 1em;
}

/**
 * Justifications.
 */
.wp-block-navigation.items-justified-space-between .wp-block-page-list > .has-child:last-child .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-space-between > .wp-block-navigation__container > .has-child:last-child .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-right .wp-block-page-list > .has-child .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-right .wp-block-navigation__container .has-child .wp-block-navigation__submenu-container {
  right: auto;
  left: 0;
}
.wp-block-navigation.items-justified-space-between .wp-block-page-list > .has-child:last-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-space-between > .wp-block-navigation__container > .has-child:last-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-right .wp-block-page-list > .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
.wp-block-navigation.items-justified-right .wp-block-navigation__container .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
  right: -1px;
  left: -1px;
}
@media (min-width: 782px) {
  .wp-block-navigation.items-justified-space-between .wp-block-page-list > .has-child:last-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
  .wp-block-navigation.items-justified-space-between > .wp-block-navigation__container > .has-child:last-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
  .wp-block-navigation.items-justified-right .wp-block-page-list > .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container,
  .wp-block-navigation.items-justified-right .wp-block-navigation__container .has-child .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
    right: auto;
    left: 100%;
  }
}

.wp-block-navigation:not(.has-background) .wp-block-navigation__submenu-container {
  background-color: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.wp-block-navigation.has-background .wp-block-navigation__submenu-container {
  background-color: inherit;
}

.wp-block-navigation:not(.has-text-color) .wp-block-navigation__submenu-container {
  color: #000;
}

.wp-block-navigation__container {
  display: flex;
  flex-wrap: var(--navigation-layout-wrap, wrap);
  flex-direction: var(--navigation-layout-direction, initial);
  justify-content: var(--navigation-layout-justify, initial);
  align-items: var(--navigation-layout-align, initial);
  list-style: none;
  margin: 0;
  padding-right: 0;
}
.wp-block-navigation__container .is-responsive {
  display: none;
}

.wp-block-navigation__container:only-child,
.wp-block-page-list:only-child {
  flex-grow: 1;
}

/**
 * Mobile menu.
 */
@keyframes overlay-menu__fade-in-animation {
  from {
    opacity: 0;
    transform: translateY(0.5em);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.wp-block-navigation__responsive-container {
  display: none;
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
}
.wp-block-navigation__responsive-container :where(.wp-block-navigation-item a) {
  color: inherit;
}
.wp-block-navigation__responsive-container .wp-block-navigation__responsive-container-content {
  display: flex;
  flex-wrap: var(--navigation-layout-wrap, wrap);
  flex-direction: var(--navigation-layout-direction, initial);
  justify-content: var(--navigation-layout-justify, initial);
  align-items: var(--navigation-layout-align, initial);
}
.wp-block-navigation__responsive-container:not(.is-menu-open.is-menu-open) {
  color: inherit !important;
  background-color: inherit !important;
}
.wp-block-navigation__responsive-container.is-menu-open {
  display: flex;
  flex-direction: column;
  background-color: inherit;
}
@media not (prefers-reduced-motion) {
  .wp-block-navigation__responsive-container.is-menu-open {
    animation: overlay-menu__fade-in-animation 0.1s ease-out;
    animation-fill-mode: forwards;
  }
}
.wp-block-navigation__responsive-container.is-menu-open:not(.disable-default-overlay) {
  padding-top: clamp(1rem, var(--wp--style--root--padding-top), 20rem);
  padding-left: clamp(1rem, var(--wp--style--root--padding-right), 20rem);
  padding-bottom: clamp(1rem, var(--wp--style--root--padding-bottom), 20rem);
  padding-right: clamp(1rem, var(--wp--style--root--padding-left), 20rem);
}
.wp-block-navigation__responsive-container.is-menu-open {
  overflow: auto;
  z-index: 100000;
}
.wp-block-navigation__responsive-container.is-menu-open:not(.disable-default-overlay) .wp-block-navigation__responsive-container-content {
  padding-top: calc(2rem + 24px);
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content {
  overflow: visible;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: var(--navigation-layout-justification-setting, inherit);
  text-align: var(--navigation-layout-text-align, inherit);
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-page-list,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__container {
  justify-content: flex-start;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__submenu-icon {
  display: none;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .has-child .wp-block-navigation__submenu-container {
  opacity: 1;
  visibility: visible;
  height: auto;
  width: auto;
  overflow: initial;
  min-width: 200px;
  position: static;
  border: none;
  padding-right: 2rem;
  padding-left: 2rem;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__submenu-container,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__container {
  gap: inherit;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__submenu-container {
  padding-top: var(--wp--style--block-gap, 2em);
  text-align: inherit;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation-item__content {
  padding: 0;
  text-align: inherit;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation__container,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-navigation-item,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-container-content .wp-block-page-list {
  display: flex;
  flex-direction: column;
  align-items: var(--navigation-layout-justification-setting, initial);
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation-item .wp-block-navigation__submenu-container,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__container,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation-item,
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-page-list {
  color: inherit !important;
  background: transparent !important;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation-item .wp-block-navigation__submenu-container {
  box-shadow: none !important;
}
.wp-block-navigation__responsive-container.is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container {
  left: auto;
  right: auto;
}
.wp-block-navigation__responsive-container.disable-default-overlay .wp-block-navigation__overlay-container {
  display: none;
  width: 100%;
}
.wp-block-navigation__responsive-container.disable-default-overlay .wp-block-navigation__responsive-close {
  max-width: none;
}
.wp-block-navigation__responsive-container.disable-default-overlay.is-menu-open .wp-block-navigation__responsive-container-content > *:not(.wp-block-navigation__overlay-container) {
  display: none;
}
.wp-block-navigation__responsive-container.disable-default-overlay.is-menu-open .wp-block-navigation__responsive-container-content .wp-block-navigation__overlay-container {
  display: block;
}
.wp-block-navigation__responsive-container.disable-default-overlay.is-menu-open .wp-block-navigation__responsive-container-content .wp-block-navigation__overlay-container .wp-block-navigation__submenu-container {
  left: auto;
  right: 0;
}
@media (min-width: 600px) {
  .wp-block-navigation__responsive-container:not(.hidden-by-default):not(.is-menu-open) {
    display: block;
    width: 100%;
    position: relative;
    z-index: auto;
    background-color: inherit;
  }
  .wp-block-navigation__responsive-container:not(.hidden-by-default):not(.is-menu-open) .wp-block-navigation__responsive-container-close {
    display: none;
  }
  .wp-block-navigation__responsive-container.is-menu-open .wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container {
    right: 0;
  }
}

.wp-block-navigation:not(.has-background) .wp-block-navigation__responsive-container.is-menu-open:not(.disable-default-overlay) {
  background-color: #fff;
}

.wp-block-navigation:not(.has-text-color) .wp-block-navigation__responsive-container.is-menu-open:not(.disable-default-overlay) {
  color: #000;
}

.wp-block-navigation__toggle_button_label {
  font-size: 1rem;
  font-weight: 700;
}

.wp-block-navigation__responsive-container-open,
.wp-block-navigation__responsive-container-close {
  vertical-align: middle;
  cursor: pointer;
  color: currentColor;
  background: transparent;
  border: none;
  margin: 0;
  padding: 0;
  text-transform: inherit;
}
.wp-block-navigation__responsive-container-open svg,
.wp-block-navigation__responsive-container-close svg {
  fill: currentColor;
  pointer-events: none;
  display: block;
  width: 24px;
  height: 24px;
}

.wp-block-navigation__responsive-container-open {
  display: flex;
}
.wp-block-navigation__responsive-container-open.wp-block-navigation__responsive-container-open.wp-block-navigation__responsive-container-open {
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
}
@media (min-width: 600px) {
  .wp-block-navigation__responsive-container-open:not(.always-shown) {
    display: none;
  }
}

.wp-block-navigation__responsive-container-close {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}
.wp-block-navigation__responsive-container-close.wp-block-navigation__responsive-container-close.wp-block-navigation__responsive-container-close {
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
}

.disable-default-overlay .wp-block-navigation__responsive-container-close {
  top: clamp(1rem, var(--wp--style--root--padding-left), 20rem);
  left: clamp(1rem, var(--wp--style--root--padding-left), 20rem);
}

.wp-block-navigation__responsive-close {
  width: 100%;
}
.has-modal-open .wp-block-navigation__responsive-close {
  max-width: var(--wp--style--global--wide-size, 100%);
  margin-right: auto;
  margin-left: auto;
}
.wp-block-navigation__responsive-close:focus {
  outline: none;
}

.is-menu-open .wp-block-navigation__responsive-close,
.is-menu-open .wp-block-navigation__responsive-dialog,
.is-menu-open .wp-block-navigation__responsive-container-content {
  box-sizing: border-box;
}

.wp-block-navigation__responsive-dialog {
  position: relative;
}

.has-modal-open .admin-bar .is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-dialog {
  margin-top: 46px;
}
@media (min-width: 782px) {
  .has-modal-open .admin-bar .is-menu-open:where(:not(.disable-default-overlay)) .wp-block-navigation__responsive-dialog {
    margin-top: 32px;
  }
}

html.has-modal-open {
  overflow: hidden;
}

.wp-block-navigation .wp-block-navigation-item__label {
  overflow-wrap: break-word;
}
.wp-block-navigation .wp-block-navigation-item__description {
  display: none;
}

.link-ui-tools {
  outline: 1px solid #f0f0f0;
  padding: 8px;
}

.link-ui-block-inserter {
  padding-top: 8px;
}

.link-ui-block-inserter__back {
  margin-right: 8px;
  text-transform: uppercase;
}

:where(.wp-block-navigation-overlay-close) {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  text-transform: inherit;
  border: none;
}

.wp-block-navigation-overlay-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  padding: 0;
  background: transparent;
  cursor: pointer;
  text-decoration: none;
}
.wp-block-navigation-overlay-close:focus {
  outline-offset: 2px;
}
.wp-block-navigation-overlay-close svg {
  width: 24px;
  height: 24px;
  fill: currentColor;
  display: block;
  flex-shrink: 0;
}
.wp-block-navigation-overlay-close .wp-block-navigation-overlay-close__text {
  display: inline-flex;
  align-items: center;
}

.wp-block-navigation .wp-block-page-list {
  display: flex;
  flex-direction: var(--navigation-layout-direction, initial);
  justify-content: var(--navigation-layout-justify, initial);
  align-items: var(--navigation-layout-align, initial);
  flex-wrap: var(--navigation-layout-wrap, wrap);
  background-color: inherit;
}
.wp-block-navigation .wp-block-navigation-item {
  background-color: inherit;
}

.wp-block-page-list {
  box-sizing: border-box;
}

.is-small-text {
  font-size: 0.875em;
}

.is-regular-text {
  font-size: 1em;
}

.is-large-text {
  font-size: 2.25em;
}

.is-larger-text {
  font-size: 3em;
}

.has-drop-cap:not(:focus)::first-letter {
  float: right;
  font-size: 8.4em;
  line-height: 0.68;
  font-weight: 100;
  margin: 0.05em 0 0 0.1em;
  text-transform: uppercase;
  font-style: normal;
}

body.rtl .has-drop-cap:not(:focus)::first-letter {
  float: initial;
  margin-right: 0.1em;
}

p.has-drop-cap.has-background {
  overflow: hidden;
}

:root :where(p.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

:where(p.has-text-color:not(.has-link-color)) a {
  color: inherit;
}

p.has-text-align-right[style*="writing-mode:vertical-rl"],
p.has-text-align-left[style*="writing-mode:vertical-lr"] {
  rotate: 180deg;
}

.waveform-player {
  font-family: inherit;
  color: inherit;
  line-height: var(--waveform-line-height, 1.4);
  --wfp-accent: #71717a;
  --wfp-button-color: rgba(255, 255, 255, .9);
  --wfp-text-color: #ffffff;
  --wfp-text-secondary-color: rgba(255, 255, 255, .6);
  --wfp-btn-artwork-color: rgba(255, 255, 255, .9);
  --wfp-btn-artwork-scrim: rgba(0, 0, 0, .5);
}

.waveform-player.waveform-theme-light {
  --wfp-button-color: rgba(0, 0, 0, .8);
  --wfp-text-color: #333333;
  --wfp-text-secondary-color: rgba(0, 0, 0, .6);
}

.waveform-player * {
  box-sizing: border-box;
}

.waveform-body {
  display: flex;
  flex-direction: column;
  gap: var(--waveform-body-gap, 8px);
}

.waveform-track {
  display: flex;
  align-items: center;
  gap: var(--waveform-track-gap, 12px);
  position: relative;
}

.waveform-btn {
  width: var(--wfp-btn-size, 36px);
  height: var(--wfp-btn-size, 36px);
  min-width: var(--wfp-btn-size, 36px);
  border-radius: var(--wfp-btn-radius, 50%);
  border: 2px solid currentColor;
  background: transparent;
  color: var(--wfp-button-color, inherit);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
  opacity: 0.9;
  flex-shrink: 0;
}

.waveform-btn:hover:not(:disabled) {
  opacity: 1;
  transform: scale(1.05);
}

.waveform-btn-minimal {
  width: calc(var(--wfp-btn-size, 36px) * 1.1);
  height: calc(var(--wfp-btn-size, 36px) * 1.1);
  min-width: calc(var(--wfp-btn-size, 36px) * 1.1);
  border: none;
  border-radius: 0;
  opacity: 0.7;
}

.waveform-btn-minimal:hover:not(:disabled) {
  opacity: 1;
  transform: none;
}

.waveform-btn.waveform-btn-minimal svg {
  width: calc(var(--wfp-btn-size, 36px) * 0.94);
  height: calc(var(--wfp-btn-size, 36px) * 0.94);
}

.waveform-btn:disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.waveform-btn > * {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.waveform-btn svg {
  width: calc(var(--wfp-btn-size, 36px) * 0.45);
  height: calc(var(--wfp-btn-size, 36px) * 0.45);
  fill: currentColor;
  display: block;
}

.waveform-btn-has-artwork {
  --wfp-btn-size: 64px;
  --wfp-btn-radius: 8px;
  position: relative;
  overflow: hidden;
  border: none;
  color: var(--wfp-btn-artwork-color);
}

.waveform-btn > .waveform-btn-artwork {
  display: block;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  z-index: 0;
}

.waveform-btn-has-artwork:after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--wfp-btn-artwork-scrim);
  pointer-events: none;
  z-index: 1;
}

.waveform-btn-has-artwork > :not(.waveform-btn-artwork) {
  position: relative;
  z-index: 2;
}

.waveform-icon-play svg {
  margin-right: 1px;
}

.waveform-container {
  flex: 1;
  position: relative;
  min-height: 60px;
  cursor: pointer;
  min-width: 0;
  width: 100%;
}

.waveform-container:focus-visible {
  outline: 2px solid currentColor;
}

.waveform-container canvas {
  display: block;
  width: 100%;
  height: 100%;
  max-width: 100%;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 1;
}

.waveform-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  min-height: 20px;
}

.waveform-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.waveform-title {
  color: var(--wfp-text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.waveform-artist {
  color: var(--wfp-text-secondary-color);
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.waveform-time {
  color: var(--wfp-text-secondary-color);
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
}

.waveform-bpm {
  color: var(--wfp-text-secondary-color);
  font-size: 11px;
  white-space: nowrap;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.waveform-loading {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1019607843);
  z-index: 10;
}

.waveform-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.waveform-error-text {
  font-size: 12px;
  opacity: 0.7;
  text-align: center;
  padding: 0 20px;
}

.waveform-markers {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 5;
}

.waveform-marker {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  background: rgba(255, 255, 255, 0.5019607843);
  border: none;
  padding: 0;
  cursor: pointer;
  pointer-events: all;
  transition: all 0.2s;
}

.waveform-marker:hover {
  width: 4px;
  z-index: 20;
}

.waveform-marker.active {
  width: 4px;
  background: currentColor;
  z-index: 10;
}

.waveform-marker-tooltip {
  position: absolute;
  bottom: calc(100% + 4px);
  right: 50%;
  transform: translate(50%);
  background: rgba(0, 0, 0, 0.9019607843);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1000;
}

.waveform-marker:hover .waveform-marker-tooltip, .waveform-marker.show-label .waveform-marker-tooltip {
  opacity: 1;
}

.waveform-hover-time {
  position: absolute;
  bottom: calc(100% + 4px);
  transform: translate(50%);
  background: rgba(0, 0, 0, 0.9019607843);
  color: #fff;
  padding: 3px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 1000;
}

.waveform-seek-handle {
  position: absolute;
  top: 50%;
  right: 0;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3490196078);
  transform: translate(50%, -50%) scale(0);
  opacity: 0;
  transition: opacity 0.12s ease, transform 0.12s ease;
  pointer-events: none;
  z-index: 6;
}

.waveform-seek-handle.is-visible {
  opacity: 1;
  transform: translate(50%, -50%) scale(1);
}

.waveform-seek-handle.is-active {
  transform: translate(50%, -50%) scale(1.25);
}

.waveform-btn:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

.waveform-marker:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 1px;
  width: 4px;
}

.waveform-speed {
  position: relative;
  flex-shrink: 0;
}

.speed-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  padding: 4px 8px;
  color: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 40px;
}

.speed-btn:hover {
  background: rgba(255, 255, 255, 0.0509803922);
  border-color: rgba(255, 255, 255, 0.3019607843);
}

.speed-value {
  font-weight: 600;
}

.speed-menu {
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 4px;
  background: rgba(0, 0, 0, 0.9490196078);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 4px;
  z-index: 100;
  min-width: 60px;
}

.speed-option {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7019607843);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: right;
  border-radius: 4px;
}

.speed-option:hover {
  background: rgba(255, 255, 255, 0.1019607843);
  color: #fff;
}

.speed-option.active {
  background: rgba(255, 255, 255, 0.1607843137);
  color: #fff;
  font-weight: 600;
}

.waveform-player.waveform-focused {
  outline: 2px solid var(--wfp-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

.waveform-player:focus {
  outline: none;
}

.waveform-player:focus-visible {
  outline: 1px solid var(--wfp-accent);
  outline-offset: 1px;
}

.waveform-layout-preview .waveform-meta {
  display: none !important;
}

.waveform-layout-preview .waveform-info {
  justify-content: center;
}

.waveform-layout-preview .waveform-text {
  flex: 0 1 auto;
  align-items: center;
  text-align: center;
}

.waveform-player.waveform-focused {
  outline: none;
}

.waveform-track.waveform-align-top {
  align-items: flex-start;
}

.waveform-track.waveform-align-top .waveform-btn {
  margin-top: 5px;
}

.waveform-track.waveform-align-center {
  align-items: center;
}

.waveform-track.waveform-align-bottom {
  align-items: flex-end;
}

.waveform-track.waveform-align-bottom .waveform-btn {
  margin-bottom: 5px;
}

@media (max-width: 480px) {
  .waveform-btn {
    width: var(--wfp-btn-size, 32px);
    height: var(--wfp-btn-size, 32px);
    min-width: var(--wfp-btn-size, 32px);
  }
  .waveform-container {
    min-height: 50px;
  }
  .waveform-info {
    font-size: 12px;
  }
  .waveform-artist, .waveform-time, .waveform-bpm {
    font-size: 10px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .waveform-player *, .waveform-player *:before, .waveform-player *:after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
.wp-block-playlist {
  box-sizing: border-box;
}
.wp-block-playlist .wp-block-playlist__waveform-player {
  width: 100%;
  margin: var(--wp--preset--spacing--20, 0.625em) 0;
  position: relative;
}
.wp-block-playlist .wp-block-playlist__waveform-player:focus-visible {
  outline: revert;
  outline-offset: revert;
}
.wp-block-playlist .waveform-track {
  height: 100px;
  gap: 0;
}
.wp-block-playlist .waveform-btn {
  border: none;
  border-radius: 0;
  border-end-start-radius: 0.125rem;
  border-start-start-radius: 0.125rem;
  width: 100px;
  height: 100px;
  min-width: 100px;
  background: currentColor;
  margin: 0;
}
.wp-block-playlist .waveform-btn:hover:not(:disabled) {
  transform: none;
}
.wp-block-playlist .waveform-btn svg {
  width: 3rem;
  height: 3rem;
}
.wp-block-playlist .waveform-btn .waveform-icon-pause svg {
  width: 2.625rem;
  height: 2.625rem;
}
.wp-block-playlist .waveform-player.has-play-button-artwork .waveform-btn {
  background-image: var(--wp--playlist--play-button-artwork);
  background-position: center;
  background-size: cover;
  color: #fff;
}
.wp-block-playlist .waveform-player.has-play-button-artwork .waveform-btn svg {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
}
.wp-block-playlist .waveform-player.has-play-button-artwork .waveform-btn svg path {
  fill: #fff !important;
}
.wp-block-playlist .waveform-track.waveform-align-bottom .waveform-btn {
  margin-bottom: 0;
}
.wp-block-playlist .waveform-btn:focus-visible,
.wp-block-playlist .waveform-container:focus-visible {
  outline: revert;
  outline-offset: revert;
}
.wp-block-playlist .waveform-artist {
  opacity: 0.7;
}
.wp-block-playlist .waveform-info,
.wp-block-playlist .waveform-artist,
.wp-block-playlist .waveform-title,
.wp-block-playlist .waveform-time {
  font-size: inherit;
}
.wp-block-playlist .wp-block-playlist__tracklist {
  margin: 0;
  padding-right: 0;
  list-style: none;
}
.wp-block-playlist .wp-block-playlist__tracklist.wp-block-playlist__tracklist-is-hidden {
  display: none;
}
.wp-block-playlist .wp-block-playlist__tracklist.wp-block-playlist__tracklist-artist-is-hidden .wp-block-playlist-track__artist {
  display: none;
}
.wp-block-playlist .wp-block-playlist__tracklist.wp-block-playlist__tracklist-length-is-hidden .wp-block-playlist-track__length {
  display: none;
}
.wp-block-playlist .wp-block-playlist__tracklist.wp-block-playlist__tracklist-show-numbers {
  counter-reset: playlist-track;
}

.wp-block-playlist-track:has([aria-current=true]) {
  background-color: color-mix(in srgb, currentColor 10%, transparent);
}
.wp-block-playlist-track:hover {
  background-color: color-mix(in srgb, currentColor 15%, transparent);
}
.wp-block-playlist__tracklist-show-numbers .wp-block-playlist-track {
  counter-increment: playlist-track;
}
.wp-block-playlist-track .wp-block-playlist-track__button {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--wp--preset--spacing--20, 0.5em);
  font-size: inherit;
  font-family: inherit;
  text-align: right;
  background-color: transparent;
  color: inherit;
  border: 0;
  outline-offset: 2px;
  cursor: pointer;
}
.wp-block-playlist__tracklist-show-numbers .wp-block-playlist-track .wp-block-playlist-track__button::before {
  content: counter(playlist-track);
  width: 2ch;
  margin-left: var(--wp--preset--spacing--20, 0.5em);
  font-size: 0.85em;
  opacity: 0.7;
}
.wp-block-playlist-track .wp-block-playlist-track__button .wp-block-playlist-track__image {
  flex: 0 0 50px;
  width: 50px;
  height: 50px;
  margin-left: var(--wp--preset--spacing--20, 0.5em);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-sizing: border-box;
  object-fit: cover;
}
.wp-block-playlist-track .wp-block-playlist-track__button .wp-block-playlist-track__content {
  flex: 1 1 0;
  min-width: 0;
}
.wp-block-playlist-track .wp-block-playlist-track__button .wp-block-playlist-track__title {
  display: block;
}
.wp-block-playlist-track .wp-block-playlist-track__button .wp-block-playlist-track__artist {
  display: block;
  font-size: 0.85em;
  opacity: 0.7;
  margin-top: 0.125em;
}
.wp-block-playlist-track .wp-block-playlist-track__button .wp-block-playlist-track__length {
  margin-right: auto;
  font-size: 0.85em;
  opacity: 0.7;
}

.wp-block-post-author {
  display: flex;
  flex-wrap: wrap;
  box-sizing: border-box;
}
.wp-block-post-author__byline {
  width: 100%;
  margin-top: 0;
  margin-bottom: 0;
  font-size: 0.5em;
}
.wp-block-post-author__avatar {
  margin-left: 1em;
}
.wp-block-post-author__bio {
  margin-bottom: 0.7em;
  font-size: 0.7em;
}
.wp-block-post-author__content {
  flex-grow: 1;
  flex-basis: 0;
}
.wp-block-post-author__name {
  margin: 0;
}

.wp-block-post-author-biography {
  box-sizing: border-box;
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

:where(.wp-block-post-comments-form textarea),
:where(.wp-block-post-comments-form input:not([type=submit])) {
  border-width: 1px;
  border-style: solid;
  border-color: #949494;
  font-size: 1em;
  font-family: inherit;
}

:where(.wp-block-post-comments-form textarea),
:where(.wp-block-post-comments-form input:where(:not([type=submit]):not([type=checkbox]))) {
  padding: calc(0.667em + 2px);
}

.wp-block-post-comments-form {
  box-sizing: border-box;
}
.wp-block-post-comments-form[style*=font-weight] :where(.comment-reply-title) {
  font-weight: inherit;
}
.wp-block-post-comments-form[style*=font-family] :where(.comment-reply-title) {
  font-family: inherit;
}
.wp-block-post-comments-form[class*=-font-size] :where(.comment-reply-title), .wp-block-post-comments-form[style*=font-size] :where(.comment-reply-title) {
  font-size: inherit;
}
.wp-block-post-comments-form[style*=line-height] :where(.comment-reply-title) {
  line-height: inherit;
}
.wp-block-post-comments-form[style*=font-style] :where(.comment-reply-title) {
  font-style: inherit;
}
.wp-block-post-comments-form[style*=letter-spacing] :where(.comment-reply-title) {
  letter-spacing: inherit;
}
.wp-block-post-comments-form :where(input[type=submit]) {
  box-shadow: none;
  cursor: pointer;
  display: inline-block;
  text-align: center;
  overflow-wrap: break-word;
}
.wp-block-post-comments-form .comment-form textarea,
.wp-block-post-comments-form .comment-form input:not([type=submit]):not([type=checkbox]):not([type=hidden]) {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
.wp-block-post-comments-form .comment-form-cookies-consent {
  display: flex;
  gap: 0.25em;
}
.wp-block-post-comments-form .comment-form-cookies-consent #wp-comment-cookies-consent {
  margin-top: 0.35em;
}
.wp-block-post-comments-form .comment-reply-title {
  margin-bottom: 0;
}
.wp-block-post-comments-form .comment-reply-title :where(small) {
  font-size: var(--wp--preset--font-size--medium, smaller);
  margin-right: 0.5em;
}

:where(.wp-block-post-comments-form .comment-form-author label),
:where(.wp-block-post-comments-form .comment-form-email label),
:where(.wp-block-post-comments-form .comment-form-url label) {
  display: block;
  margin-bottom: 0.25em;
}

.wp-block-post-comments-count {
  box-sizing: border-box;
}

.wp-block-post-content {
  display: flow-root;
}

.wp-block-post-comments-link {
  box-sizing: border-box;
}

.wp-block-post-date {
  box-sizing: border-box;
}

:where(.wp-block-post-excerpt) {
  box-sizing: border-box;
  margin-top: var(--wp--style--block-gap);
  margin-bottom: var(--wp--style--block-gap);
}

.wp-block-post-excerpt__excerpt {
  margin-top: 0;
  margin-bottom: 0;
}

.wp-block-post-excerpt__more-text {
  margin-top: var(--wp--style--block-gap);
  margin-bottom: 0;
}

.wp-block-post-excerpt__more-link {
  display: inline-block;
}

.wp-block-post-featured-image {
  margin-right: 0;
  margin-left: 0;
}
.wp-block-post-featured-image a {
  display: block;
  height: 100%;
}
.wp-block-post-featured-image :where(img) {
  max-width: 100%;
  width: 100%;
  height: auto;
  vertical-align: bottom;
  box-sizing: border-box;
}
.wp-block-post-featured-image.alignwide img, .wp-block-post-featured-image.alignfull img {
  width: 100%;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim {
  position: absolute;
  inset: 0;
  background-color: #000;
}
.wp-block-post-featured-image {
  position: relative;
}

.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-gradient {
  background-color: transparent;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-0 {
  opacity: 0;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-10 {
  opacity: 0.1;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-20 {
  opacity: 0.2;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-30 {
  opacity: 0.3;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-40 {
  opacity: 0.4;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-50 {
  opacity: 0.5;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-60 {
  opacity: 0.6;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-70 {
  opacity: 0.7;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-80 {
  opacity: 0.8;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-90 {
  opacity: 0.9;
}
.wp-block-post-featured-image .wp-block-post-featured-image__overlay.has-background-dim-100 {
  opacity: 1;
}
.wp-block-post-featured-image:where(.alignleft, .alignright) {
  width: 100%;
}

.wp-block-post-navigation-link {
  box-sizing: border-box;
}
.wp-block-post-navigation-link .wp-block-post-navigation-link__arrow-previous {
  display: inline-block;
  margin-left: 1ch;
}
.wp-block-post-navigation-link .wp-block-post-navigation-link__arrow-previous:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-post-navigation-link .wp-block-post-navigation-link__arrow-next {
  display: inline-block;
  margin-right: 1ch;
}
.wp-block-post-navigation-link .wp-block-post-navigation-link__arrow-next:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-post-navigation-link.has-text-align-right[style*="writing-mode: vertical-rl"], .wp-block-post-navigation-link.has-text-align-left[style*="writing-mode: vertical-lr"] {
  rotate: 180deg;
}

.wp-block-post-terms {
  box-sizing: border-box;
}
.wp-block-post-terms .wp-block-post-terms__separator {
  white-space: pre-wrap;
}

.wp-block-post-time-to-read {
  box-sizing: border-box;
}

.wp-block-post-title {
  word-break: normal;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}
.wp-block-post-title :where(a) {
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  text-decoration: inherit;
}

.wp-block-post-author-name {
  box-sizing: border-box;
}

.wp-block-preformatted {
  box-sizing: border-box;
  white-space: pre-wrap;
}

:where(.wp-block-preformatted.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

.wp-block-pullquote {
  text-align: center;
  overflow-wrap: break-word;
  box-sizing: border-box;
  margin: 0 0 1em 0;
  padding: 4em 0;
}
.wp-block-pullquote p,
.wp-block-pullquote blockquote {
  color: inherit;
}
.wp-block-pullquote blockquote {
  margin: 0;
}
.wp-block-pullquote p {
  margin-top: 0;
}
.wp-block-pullquote p:last-child {
  margin-bottom: 0;
}
.wp-block-pullquote.alignleft, .wp-block-pullquote.alignright {
  max-width: 420px;
}
.wp-block-pullquote cite,
.wp-block-pullquote footer {
  position: relative;
}
.wp-block-pullquote .has-text-color a {
  color: inherit;
}

.wp-block-pullquote.has-text-align-left blockquote {
  text-align: right;
}

.wp-block-pullquote.has-text-align-right blockquote {
  text-align: left;
}

.wp-block-pullquote.has-text-align-center blockquote {
  text-align: center;
}

.wp-block-pullquote.is-style-solid-color {
  border: none;
}
.wp-block-pullquote.is-style-solid-color blockquote {
  margin-right: auto;
  margin-left: auto;
  max-width: 60%;
}
.wp-block-pullquote.is-style-solid-color blockquote p {
  margin-top: 0;
  margin-bottom: 0;
  font-size: 2em;
}
.wp-block-pullquote.is-style-solid-color blockquote cite {
  text-transform: none;
  font-style: normal;
}

.wp-block-pullquote :where(cite) {
  color: inherit;
  display: block;
}

.wp-block-post-template {
  margin-top: 0;
  margin-bottom: 0;
  max-width: 100%;
  list-style: none;
  padding: 0;
  box-sizing: border-box;
}
.wp-block-post-template.is-flex-container {
  flex-direction: row;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25em;
}
.wp-block-post-template.is-flex-container > li {
  margin: 0;
  width: 100%;
}
@media (min-width: 600px) {
  .wp-block-post-template.is-flex-container.is-flex-container.columns-2 > li {
    width: calc(100% / 2 - 1.25em + 1.25em / 2);
  }
  .wp-block-post-template.is-flex-container.is-flex-container.columns-3 > li {
    width: calc(100% / 3 - 1.25em + 1.25em / 3);
  }
  .wp-block-post-template.is-flex-container.is-flex-container.columns-4 > li {
    width: calc(100% / 4 - 1.25em + 1.25em / 4);
  }
  .wp-block-post-template.is-flex-container.is-flex-container.columns-5 > li {
    width: calc(100% / 5 - 1.25em + 1.25em / 5);
  }
  .wp-block-post-template.is-flex-container.is-flex-container.columns-6 > li {
    width: calc(100% / 6 - 1.25em + 1.25em / 6);
  }
}

@media (max-width: 600px) {
  .wp-block-post-template-is-layout-grid[class*=columns-]:not(.has-native-responsive-grid) {
    grid-template-columns: 1fr;
  }
}
.wp-block-post-template-is-layout-constrained > li > .alignright,
.wp-block-post-template-is-layout-flow > li > .alignright {
  float: left;
  margin-right: 2em;
  margin-left: 0;
}

.wp-block-post-template-is-layout-constrained > li > .alignleft,
.wp-block-post-template-is-layout-flow > li > .alignleft {
  float: right;
  margin-right: 0;
  margin-left: 2em;
}

.wp-block-post-template-is-layout-constrained > li > .aligncenter,
.wp-block-post-template-is-layout-flow > li > .aligncenter {
  margin-inline-start: auto;
  margin-inline-end: auto;
}

:where(.wp-block-query-no-results) {
  box-sizing: border-box;
}

.wp-block-query-pagination {
  box-sizing: border-box;
}
.wp-block-query-pagination.is-content-justification-space-between > .wp-block-query-pagination-next:last-of-type {
  margin-inline-start: auto;
}
.wp-block-query-pagination.is-content-justification-space-between > .wp-block-query-pagination-previous:first-child {
  margin-inline-end: auto;
}
.wp-block-query-pagination .wp-block-query-pagination-previous-arrow {
  margin-left: 1ch;
  display: inline-block;
}
.wp-block-query-pagination .wp-block-query-pagination-previous-arrow:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-query-pagination .wp-block-query-pagination-next-arrow {
  margin-right: 1ch;
  display: inline-block;
}
.wp-block-query-pagination .wp-block-query-pagination-next-arrow:not(.is-arrow-chevron) {
  transform: scaleX(-1);;
}
.wp-block-query-pagination.aligncenter {
  justify-content: center;
}

.wp-block-query-pagination-numbers {
  box-sizing: border-box;
}

.wp-block-query-title {
  box-sizing: border-box;
}

.wp-block-query-total {
  box-sizing: border-box;
}

.wp-block-quote {
  box-sizing: border-box;
  overflow-wrap: break-word;
}
.wp-block-quote.is-style-large:where(:not(.is-style-plain)), .wp-block-quote.is-large:where(:not(.is-style-plain)) {
  margin-bottom: 1em;
  padding: 0 1em;
}
.wp-block-quote.is-style-large:where(:not(.is-style-plain)) p, .wp-block-quote.is-large:where(:not(.is-style-plain)) p {
  font-size: 1.5em;
  font-style: italic;
  line-height: 1.6;
}
.wp-block-quote.is-style-large:where(:not(.is-style-plain)) cite,
.wp-block-quote.is-style-large:where(:not(.is-style-plain)) footer, .wp-block-quote.is-large:where(:not(.is-style-plain)) cite,
.wp-block-quote.is-large:where(:not(.is-style-plain)) footer {
  font-size: 1.125em;
  text-align: left;
}
.wp-block-quote > cite {
  display: block;
}

.wp-block-read-more {
  display: block;
  width: fit-content;
}
.wp-block-read-more:where(:not([style*=text-decoration])) {
  text-decoration: none;
}
.wp-block-read-more:where(:not([style*=text-decoration])):focus, .wp-block-read-more:where(:not([style*=text-decoration])):active {
  text-decoration: none;
}

ul.wp-block-rss.alignleft {
  margin-right: 2em;
}
ul.wp-block-rss.alignright {
  margin-left: 2em;
}
ul.wp-block-rss.is-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
}
ul.wp-block-rss.is-grid li {
  margin: 0 0 1em 1em;
  width: 100%;
}
@media (min-width: 600px) {
  ul.wp-block-rss.columns-2 li {
    width: calc(100% / 2 - 1em);
  }
  ul.wp-block-rss.columns-3 li {
    width: calc(100% / 3 - 1em);
  }
  ul.wp-block-rss.columns-4 li {
    width: calc(100% / 4 - 1em);
  }
  ul.wp-block-rss.columns-5 li {
    width: calc(100% / 5 - 1em);
  }
  ul.wp-block-rss.columns-6 li {
    width: calc(100% / 6 - 1em);
  }
}

.wp-block-rss__item-publish-date,
.wp-block-rss__item-author {
  display: block;
  font-size: 0.8125em;
}

.wp-block-rss {
  box-sizing: border-box;
  list-style: none;
  padding: 0;
}

.wp-block-search__button {
  margin-right: 10px;
  word-break: normal;
}
.wp-block-search__button.has-icon {
  line-height: 0;
}
.wp-block-search__button svg {
  min-width: 24px;
  min-height: 24px;
  width: 1.25em;
  height: 1.25em;
  fill: currentColor;
  vertical-align: text-bottom;
}

:where(.wp-block-search__button) {
  border: 1px solid #ccc;
  padding: 6px 10px;
}

.wp-block-search__inside-wrapper {
  display: flex;
  flex: auto;
  flex-wrap: nowrap;
  max-width: 100%;
}

:where(.wp-block-search__label) {
  width: 100%;
}

.wp-block-search.wp-block-search__button-only .wp-block-search__button {
  margin-right: 0;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}
.wp-block-search.wp-block-search__button-only .wp-block-search__inside-wrapper {
  transition-property: width;
  min-width: 0 !important;
}
.wp-block-search.wp-block-search__button-only .wp-block-search__input {
  transition-duration: 300ms;
  flex-basis: 100%;
}
.wp-block-search.wp-block-search__button-only.wp-block-search__searchfield-hidden {
  overflow: hidden;
}
.wp-block-search.wp-block-search__button-only.wp-block-search__searchfield-hidden .wp-block-search__inside-wrapper {
  overflow: hidden;
}
.wp-block-search.wp-block-search__button-only.wp-block-search__searchfield-hidden .wp-block-search__input {
  width: 0 !important;
  min-width: 0 !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
  border-right-width: 0 !important;
  border-left-width: 0 !important;
  flex-grow: 0;
  margin: 0;
  flex-basis: 0;
}
.wp-block-search.wp-block-search__button-only.wp-block-search__searchfield-hidden:focus-within {
  overflow: visible;
}
.wp-block-search.wp-block-search__button-only.wp-block-search__searchfield-hidden:focus-within .wp-block-search__inside-wrapper {
  overflow: visible;
}

:where(.wp-block-search__input) {
  font-family: inherit;
  font-weight: inherit;
  font-size: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  font-style: inherit;
  padding: 8px;
  flex-grow: 1;
  margin-right: 0;
  margin-left: 0;
  min-width: 3rem;
  border: 1px solid #949494;
  text-decoration: unset !important;
  appearance: initial;
}

:where(.wp-block-search__button-inside .wp-block-search__inside-wrapper) {
  padding: 4px;
  border-width: 1px;
  border-style: solid;
  border-color: #949494;
  background-color: #fff;
  box-sizing: border-box;
}
:where(.wp-block-search__button-inside .wp-block-search__inside-wrapper) .wp-block-search__input {
  border-radius: 0;
  border: none;
  padding: 0 4px;
}
:where(.wp-block-search__button-inside .wp-block-search__inside-wrapper) .wp-block-search__input:focus {
  outline: none;
}
:where(.wp-block-search__button-inside .wp-block-search__inside-wrapper) :where(.wp-block-search__button) {
  padding: 4px 8px;
}

.wp-block-search.aligncenter .wp-block-search__inside-wrapper {
  margin: auto;
}

.wp-block[data-align=right] .wp-block-search.wp-block-search__button-only .wp-block-search__inside-wrapper {
  float: left;
}

.wp-block-separator {
  border-top: 2px solid currentColor;
  border-right: none;
  border-left: none;
  border-bottom: none;
}

:root :where(.wp-block-separator.is-style-dots) {
  text-align: center;
  line-height: 1;
  height: auto;
}
:root :where(.wp-block-separator.is-style-dots)::before {
  content: "···";
  color: currentColor;
  font-size: 1.5em;
  letter-spacing: 2em;
  padding-left: 2em;
  font-family: serif;
}

.wp-block-separator.is-style-dots {
  background: none !important;
  border: none !important;
}

.wp-block-site-logo {
  box-sizing: border-box;
  line-height: 0;
}
.wp-block-site-logo a {
  display: inline-block;
  line-height: 0;
}
.wp-block-site-logo.is-default-size img {
  width: 120px;
  height: auto;
}
.wp-block-site-logo img {
  height: auto;
  max-width: 100%;
}
.wp-block-site-logo a,
.wp-block-site-logo img {
  border-radius: inherit;
}
.wp-block-site-logo.aligncenter {
  margin-right: auto;
  margin-left: auto;
  text-align: center;
}

:root :where(.wp-block-site-logo.is-style-rounded) {
  border-radius: 9999px;
}

.wp-block-site-tagline {
  box-sizing: border-box;
}

.wp-block-site-title {
  box-sizing: border-box;
}
.wp-block-site-title :where(a) {
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  font-style: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  text-decoration: inherit;
}

.wp-block-social-links {
  box-sizing: border-box;
  padding-right: 0;
  padding-left: 0;
  text-indent: 0;
  margin-right: 0;
  background: none;
}
.wp-block-social-links .wp-social-link a,
.wp-block-social-links .wp-social-link a:hover {
  text-decoration: none;
  border-bottom: 0;
  box-shadow: none;
}
.wp-block-social-links .wp-social-link span:not(.screen-reader-text) {
  margin-right: 0.5em;
  margin-left: 0.5em;
  font-size: 0.65em;
}
.wp-block-social-links.has-small-icon-size {
  font-size: 16px;
}
.wp-block-social-links, .wp-block-social-links.has-normal-icon-size {
  font-size: 24px;
}
.wp-block-social-links.has-large-icon-size {
  font-size: 36px;
}
.wp-block-social-links.has-huge-icon-size {
  font-size: 48px;
}
.wp-block-social-links.aligncenter {
  justify-content: center;
  display: flex;
}
.wp-block-social-links.alignright {
  justify-content: flex-end;
}

.wp-block-social-link {
  display: block;
  border-radius: 9999px;
}
@media not (prefers-reduced-motion) {
  .wp-block-social-link {
    transition: transform 0.1s ease;
  }
}
.wp-block-social-link {
  height: auto;
}
.wp-block-social-link a {
  align-items: center;
  display: flex;
  line-height: 0;
}
.wp-block-social-link:hover {
  transform: scale(1.1);
}

.wp-block-social-links .wp-block-social-link.wp-social-link {
  display: inline-block;
  margin: 0;
  padding: 0;
}
.wp-block-social-links .wp-block-social-link.wp-social-link .wp-block-social-link-anchor, .wp-block-social-links .wp-block-social-link.wp-social-link .wp-block-social-link-anchor:hover, .wp-block-social-links .wp-block-social-link.wp-social-link .wp-block-social-link-anchor:active, .wp-block-social-links .wp-block-social-link.wp-social-link .wp-block-social-link-anchor:visited,
.wp-block-social-links .wp-block-social-link.wp-social-link .wp-block-social-link-anchor svg {
  color: currentColor;
  fill: currentColor;
}

:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link {
  background-color: #f0f0f0;
  color: #444;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-amazon {
  background-color: #f90;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-bandcamp {
  background-color: #1ea0c3;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-behance {
  background-color: #0757fe;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-bluesky {
  background-color: #0a7aff;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-codepen {
  background-color: #1e1f26;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-deviantart {
  background-color: #02e49b;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-discord {
  background-color: #5865f2;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-dribbble {
  background-color: #e94c89;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-dropbox {
  background-color: #4280ff;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-etsy {
  background-color: #f45800;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-facebook {
  background-color: #0866ff;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-fivehundredpx {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-flickr {
  background-color: #0461dd;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-foursquare {
  background-color: #e65678;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-github {
  background-color: #24292d;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-goodreads {
  background-color: #eceadd;
  color: #382110;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-google {
  background-color: #ea4434;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-gravatar {
  background-color: #1d4fc4;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-instagram {
  background-color: #f00075;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-lastfm {
  background-color: #e21b24;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-linkedin {
  background-color: #0d66c2;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-mastodon {
  background-color: #3288d4;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-medium {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-meetup {
  background-color: #f6405f;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-patreon {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-pinterest {
  background-color: #e60122;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-pocket {
  background-color: #ef4155;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-reddit {
  background-color: #ff4500;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-skype {
  background-color: #0478d7;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-snapchat {
  background-color: #fefc00;
  color: #fff;
  stroke: #000;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-soundcloud {
  background-color: #ff5600;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-spotify {
  background-color: #1bd760;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-telegram {
  background-color: #2aabee;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-threads {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-tiktok {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-tumblr {
  background-color: #011835;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-twitch {
  background-color: #6440a4;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-twitter {
  background-color: #1da1f2;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-vimeo {
  background-color: #1eb7ea;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-vk {
  background-color: #4680c2;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-wordpress {
  background-color: #3499cd;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-whatsapp {
  background-color: #25d366;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-x {
  background-color: #000;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-yelp {
  background-color: #d32422;
  color: #fff;
}
:where(.wp-block-social-links:not(.is-style-logos-only)) .wp-social-link-youtube {
  background-color: #f00;
  color: #fff;
}

:where(.wp-block-social-links.is-style-logos-only) .wp-social-link {
  background: none;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-amazon {
  color: #f90;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-bandcamp {
  color: #1ea0c3;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-behance {
  color: #0757fe;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-bluesky {
  color: #0a7aff;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-codepen {
  color: #1e1f26;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-deviantart {
  color: #02e49b;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-discord {
  color: #5865f2;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-dribbble {
  color: #e94c89;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-dropbox {
  color: #4280ff;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-etsy {
  color: #f45800;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-facebook {
  color: #0866ff;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-fivehundredpx {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-flickr {
  color: #0461dd;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-foursquare {
  color: #e65678;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-github {
  color: #24292d;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-goodreads {
  color: #382110;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-google {
  color: #ea4434;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-gravatar {
  color: #1d4fc4;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-instagram {
  color: #f00075;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-lastfm {
  color: #e21b24;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-linkedin {
  color: #0d66c2;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-mastodon {
  color: #3288d4;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-medium {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-meetup {
  color: #f6405f;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-patreon {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-pinterest {
  color: #e60122;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-pocket {
  color: #ef4155;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-reddit {
  color: #ff4500;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-skype {
  color: #0478d7;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-snapchat {
  color: #fff;
  stroke: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-soundcloud {
  color: #ff5600;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-spotify {
  color: #1bd760;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-telegram {
  color: #2aabee;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-threads {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-tiktok {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-tumblr {
  color: #011835;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-twitch {
  color: #6440a4;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-twitter {
  color: #1da1f2;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-vimeo {
  color: #1eb7ea;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-vk {
  color: #4680c2;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-whatsapp {
  color: #25d366;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-wordpress {
  color: #3499cd;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-x {
  color: #000;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-yelp {
  color: #d32422;
}
:where(.wp-block-social-links.is-style-logos-only) .wp-social-link-youtube {
  color: #f00;
}

.wp-block-social-links.is-style-pill-shape .wp-social-link {
  width: auto;
}

:root :where(.wp-block-social-links .wp-social-link svg) {
  width: 1em;
  height: 1em;
}
:root :where(.wp-block-social-links.is-style-logos-only .wp-social-link svg) {
  width: 1.25em;
  height: 1.25em;
}
:root :where(.wp-block-social-links .wp-social-link a) {
  padding: 0.25em;
}
:root :where(.wp-block-social-links.is-style-logos-only .wp-social-link a) {
  padding: 0;
}
:root :where(.wp-block-social-links.is-style-pill-shape .wp-social-link a) {
  padding-right: 0.6666666667em;
  padding-left: 0.6666666667em;
}

.wp-block-social-links:not(.has-icon-color):not(.has-icon-background-color) .wp-social-link-snapchat .wp-block-social-link-label {
  color: #000;
}

.wp-block-spacer {
  clear: both;
}

.wp-block-tag-cloud {
  box-sizing: border-box;
}
.wp-block-tag-cloud.aligncenter {
  text-align: center;
  justify-content: center;
}
.wp-block-tag-cloud a {
  display: inline-block;
  margin-left: 5px;
}
.wp-block-tag-cloud span {
  display: inline-block;
  margin-right: 5px;
  text-decoration: none;
}

:root :where(.wp-block-tag-cloud.is-style-outline) {
  display: flex;
  flex-wrap: wrap;
  gap: 1ch;
}

:root :where(.wp-block-tag-cloud.is-style-outline a) {
  border: 1px solid currentColor;
  font-size: unset !important;
  margin-left: 0 !important;
  padding: 1ch 2ch;
  text-decoration: none !important;
}

:where(.wp-block-tab-list button) {
  box-sizing: border-box;
  color: inherit;
  display: block;
  width: max-content;
  text-decoration: none;
  cursor: pointer;
  flex-basis: inherit !important;
  flex-grow: inherit !important;
  position: relative;
  border: none;
  background: none;
  appearance: none;
  -webkit-appearance: none;
  margin: 0;
  padding: var(--wp--preset--spacing--20, 0.5em) var(--wp--preset--spacing--30, 1em);
  font-size: inherit;
  font-family: inherit;
  font-weight: inherit;
  line-height: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  text-align: inherit;
}
:where(.wp-block-tab-list button)[aria-selected=true]::before {
  content: "";
  position: absolute;
  border-bottom: 2px solid currentColor;
  pointer-events: none;
  right: 0;
  width: 100%;
  bottom: 0;
}

.wp-block-tab-panel:empty {
  display: none !important;
}
.wp-block-tab-panel[hidden] {
  box-shadow: none !important;
  border: none !important;
  margin-block-start: 0;
  padding: 0 !important;
}

.wp-block-table {
  overflow-x: auto;
}
.wp-block-table table {
  border-collapse: collapse;
  width: 100%;
}
.wp-block-table thead {
  border-bottom: 3px solid;
}
.wp-block-table tfoot {
  border-top: 3px solid;
}
.wp-block-table td,
.wp-block-table th {
  border: 1px solid;
  padding: 0.5em;
}
.wp-block-table .has-fixed-layout {
  table-layout: fixed;
  width: 100%;
}
.wp-block-table .has-fixed-layout td,
.wp-block-table .has-fixed-layout th {
  word-break: normal;
  overflow-wrap: anywhere;
}
.wp-block-table.alignleft, .wp-block-table.aligncenter, .wp-block-table.alignright {
  display: table;
  width: auto;
}
.wp-block-table.alignleft td,
.wp-block-table.alignleft th, .wp-block-table.aligncenter td,
.wp-block-table.aligncenter th, .wp-block-table.alignright td,
.wp-block-table.alignright th {
  word-break: normal;
  overflow-wrap: anywhere;
}
.wp-block-table .has-subtle-light-gray-background-color {
  background-color: #f3f4f5;
}
.wp-block-table .has-subtle-pale-green-background-color {
  background-color: #e9fbe5;
}
.wp-block-table .has-subtle-pale-blue-background-color {
  background-color: #e7f5fe;
}
.wp-block-table .has-subtle-pale-pink-background-color {
  background-color: #fcf0ef;
}
.wp-block-table.is-style-stripes {
  border-spacing: 0;
  border-collapse: inherit;
  background-color: transparent;
}
.wp-block-table.is-style-stripes tbody tr:nth-child(odd) {
  background-color: #f0f0f0;
}
.wp-block-table.is-style-stripes.has-subtle-light-gray-background-color tbody tr:nth-child(odd) {
  background-color: #f3f4f5;
}
.wp-block-table.is-style-stripes.has-subtle-pale-green-background-color tbody tr:nth-child(odd) {
  background-color: #e9fbe5;
}
.wp-block-table.is-style-stripes.has-subtle-pale-blue-background-color tbody tr:nth-child(odd) {
  background-color: #e7f5fe;
}
.wp-block-table.is-style-stripes.has-subtle-pale-pink-background-color tbody tr:nth-child(odd) {
  background-color: #fcf0ef;
}
.wp-block-table.is-style-stripes th,
.wp-block-table.is-style-stripes td {
  border-color: transparent;
}
.wp-block-table.is-style-stripes {
  border-bottom: 1px solid #f0f0f0;
}
.wp-block-table .has-border-color > *,
.wp-block-table .has-border-color tr,
.wp-block-table .has-border-color th,
.wp-block-table .has-border-color td {
  border-color: inherit;
}
.wp-block-table table[style*=border-top-color] > *,
.wp-block-table table[style*=border-top-color] tr:first-child {
  border-top-color: inherit;
}
.wp-block-table table[style*=border-top-color] > * th,
.wp-block-table table[style*=border-top-color] > * td,
.wp-block-table table[style*=border-top-color] tr:first-child th,
.wp-block-table table[style*=border-top-color] tr:first-child td {
  border-top-color: inherit;
}
.wp-block-table table[style*=border-top-color] tr:not(:first-child) {
  border-top-color: currentColor;
}
.wp-block-table table[style*=border-right-color] > *,
.wp-block-table table[style*=border-right-color] tr,
.wp-block-table table[style*=border-right-color] th,
.wp-block-table table[style*=border-right-color] td:last-child {
  border-left-color: inherit;
}
.wp-block-table table[style*=border-bottom-color] > *,
.wp-block-table table[style*=border-bottom-color] tr:last-child {
  border-bottom-color: inherit;
}
.wp-block-table table[style*=border-bottom-color] > * th,
.wp-block-table table[style*=border-bottom-color] > * td,
.wp-block-table table[style*=border-bottom-color] tr:last-child th,
.wp-block-table table[style*=border-bottom-color] tr:last-child td {
  border-bottom-color: inherit;
}
.wp-block-table table[style*=border-bottom-color] tr:not(:last-child) {
  border-bottom-color: currentColor;
}
.wp-block-table table[style*=border-left-color] > *,
.wp-block-table table[style*=border-left-color] tr,
.wp-block-table table[style*=border-left-color] th,
.wp-block-table table[style*=border-left-color] td:first-child {
  border-right-color: inherit;
}
.wp-block-table table[style*=border-style] > *,
.wp-block-table table[style*=border-style] tr,
.wp-block-table table[style*=border-style] th,
.wp-block-table table[style*=border-style] td {
  border-style: inherit;
}
.wp-block-table table[style*=border-width] > *,
.wp-block-table table[style*=border-width] tr,
.wp-block-table table[style*=border-width] th,
.wp-block-table table[style*=border-width] td {
  border-width: inherit;
  border-style: inherit;
}

:root :where(.wp-block-table-of-contents) {
  box-sizing: border-box;
}

.wp-block-tabs {
  box-sizing: border-box;
}

.wp-block-term-count {
  box-sizing: border-box;
}

:where(.wp-block-term-description) {
  box-sizing: border-box;
  margin-top: var(--wp--style--block-gap);
  margin-bottom: var(--wp--style--block-gap);
}

.wp-block-term-description p {
  margin-top: 0;
  margin-bottom: 0;
}

.wp-block-term-name {
  box-sizing: border-box;
}

.wp-block-term-template {
  margin-top: 0;
  margin-bottom: 0;
  max-width: 100%;
  list-style: none;
  padding: 0;
  box-sizing: border-box;
}

.wp-block-text-columns {
  display: flex;
}
.wp-block-text-columns.aligncenter {
  display: flex;
}
.wp-block-text-columns .wp-block-column {
  margin: 0 1em;
  padding: 0;
}
.wp-block-text-columns .wp-block-column:first-child {
  margin-right: 0;
}
.wp-block-text-columns .wp-block-column:last-child {
  margin-left: 0;
}
.wp-block-text-columns.columns-2 .wp-block-column {
  width: 50%;
}
.wp-block-text-columns.columns-3 .wp-block-column {
  width: 33.3333333333%;
}
.wp-block-text-columns.columns-4 .wp-block-column {
  width: 25%;
}

pre.wp-block-verse {
  box-sizing: border-box;
  overflow: auto;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
}

:root :where(pre.wp-block-verse) {
  min-width: 1em;
}

:where(pre.wp-block-verse) {
  font-family: inherit;
}

pre.wp-block-verse.has-fit-text {
  white-space: pre !important;
}

.wp-block-video {
  box-sizing: border-box;
}
.wp-block-video video {
  width: 100%;
  height: auto;
  vertical-align: middle;
}
@supports (position: sticky) {
  .wp-block-video [poster] {
    object-fit: cover;
  }
}
.wp-block-video.aligncenter {
  text-align: center;
}
.wp-block-video :where(figcaption) {
  margin-top: 0.5em;
  margin-bottom: 1em;
}

.editor-styles-wrapper,
.entry-content {
  counter-reset: footnotes;
}

a[data-fn].fn {
  vertical-align: super;
  font-size: smaller;
  counter-increment: footnotes;
  display: inline-flex;
  text-decoration: none;
  text-indent: -9999999px;
}

a[data-fn].fn::after {
  content: "[" counter(footnotes) "]";
  text-indent: 0;
  float: right;
}

:root {
  --wp-block-synced-color: #7a00df;
  --wp-block-synced-color--rgb: 122, 0, 223;
  --wp-bound-block-color: var(--wp-block-synced-color);
  --wp-editor-canvas-background: #ddd;
  --wp-admin-theme-color: #3858e9;
  --wp-admin-theme-color--rgb: 56, 88, 233;
  --wp-admin-theme-color-darker-10: rgb(33.0384615385, 68.7307692308, 230.4615384615);
  --wp-admin-theme-color-darker-10--rgb: 33.0384615385, 68.7307692308, 230.4615384615;
  --wp-admin-theme-color-darker-20: rgb(23.6923076923, 58.1538461538, 214.3076923077);
  --wp-admin-theme-color-darker-20--rgb: 23.6923076923, 58.1538461538, 214.3076923077;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  :root {
    --wp-admin-border-width-focus: 1.5px;
  }
}

body.admin-color-fresh {
  --wp-admin-theme-color: #007cba;
  --wp-admin-theme-color--rgb: 0, 124, 186;
  --wp-admin-theme-color-darker-10: rgb(0, 107, 160.5);
  --wp-admin-theme-color-darker-10--rgb: 0, 107, 160.5;
  --wp-admin-theme-color-darker-20: #005a87;
  --wp-admin-theme-color-darker-20--rgb: 0, 90, 135;
  --wp-admin-border-width-focus: 2px;
}
@media (min-resolution: 192dpi) {
  body.admin-color-fresh {
    --wp-admin-border-width-focus: 1.5px;
  }
}

/**
 * Element styles.
 */
.wp-element-button {
  cursor: pointer;
}

:root .has-very-light-gray-background-color {
  background-color: #eee;
}
:root .has-very-dark-gray-background-color {
  background-color: #313131;
}
:root .has-very-light-gray-color {
  color: #eee;
}
:root .has-very-dark-gray-color {
  color: #313131;
}
:root {
  /* stylelint-disable @stylistic/function-comma-space-after -- We can not use spacing because of WP multi site kses rule. */
}
:root .has-vivid-green-cyan-to-vivid-cyan-blue-gradient-background {
  background: linear-gradient(-135deg, rgb(0, 208, 132) 0%, rgb(6, 147, 227) 100%);
}
:root .has-purple-crush-gradient-background {
  background: linear-gradient(-135deg, rgb(52, 226, 228) 0%, rgb(71, 33, 251) 50%, rgb(171, 29, 254) 100%);
}
:root .has-hazy-dawn-gradient-background {
  background: linear-gradient(-135deg, rgb(250, 172, 168) 0%, rgb(218, 208, 236) 100%);
}
:root .has-subdued-olive-gradient-background {
  background: linear-gradient(-135deg, rgb(250, 250, 225) 0%, rgb(103, 166, 113) 100%);
}
:root .has-atomic-cream-gradient-background {
  background: linear-gradient(-135deg, rgb(253, 215, 154) 0%, rgb(0, 74, 89) 100%);
}
:root .has-nightshade-gradient-background {
  background: linear-gradient(-135deg, rgb(51, 9, 104) 0%, rgb(49, 205, 207) 100%);
}
:root .has-midnight-gradient-background {
  background: linear-gradient(-135deg, rgb(2, 3, 129) 0%, rgb(40, 116, 252) 100%);
}
:root {
  /* stylelint-enable @stylistic/function-comma-space-after */
  --wp--preset--font-size--normal: 16px;
  --wp--preset--font-size--huge: 42px;
}

.has-regular-font-size {
  font-size: 1em;
}

.has-larger-font-size {
  font-size: 2.625em;
}

.has-normal-font-size {
  font-size: var(--wp--preset--font-size--normal);
}

.has-huge-font-size {
  font-size: var(--wp--preset--font-size--huge);
}

:root .has-text-align-center {
  text-align: center;
}

:root .has-text-align-left {
  text-align: left;
}

:root .has-text-align-right {
  text-align: right;
}

:root .has-text-color,
:root .has-inline-color,
:root .has-link-color a {
  -webkit-text-fill-color: currentColor;
}

.has-fit-text {
  white-space: nowrap !important;
}

#end-resizable-editor-section {
  display: none;
}

.aligncenter {
  clear: both;
}

.items-justified-left {
  justify-content: flex-start;
}

.items-justified-center {
  justify-content: center;
}

.items-justified-right {
  justify-content: flex-end;
}

.items-justified-space-between {
  justify-content: space-between;
}

.screen-reader-text {
  border: 0;
  clip-path: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
  overflow-wrap: normal !important;
  word-break: normal !important;
}

.screen-reader-text:focus {
  background-color: #ddd;
  clip-path: none;
  color: #444;
  display: block;
  font-size: 1em;
  height: auto;
  right: 5px;
  line-height: normal;
  padding: 15px 23px 14px;
  text-decoration: none;
  top: 5px;
  width: auto;
  z-index: 100000;
}

/**
 * The following provide a simple means of applying a default border style when
 * a user first makes a selection in the border block support panel.
 * This prevents issues such as where the user could set a border width
 * and see no border due there being no border style set.
 *
 * This is intended to be removed once intelligent defaults can be set while
 * making border selections via the block support.
 *
 * See: https://github.com/WordPress/gutenberg/pull/33743
 */
html :where(.has-border-color) {
  border-style: solid;
}

html :where([style^=border-color],
[style*=";border-color"],
[style*="; border-color"]) {
  border-style: solid;
}

html :where([style^=border-top-color],
[style*=";border-top-color"],
[style*="; border-top-color"]) {
  border-top-style: solid;
}

html :where([style^=border-right-color],
[style*=";border-right-color"],
[style*="; border-right-color"]) {
  border-right-style: solid;
}

html :where([style^=border-bottom-color],
[style*=";border-bottom-color"],
[style*="; border-bottom-color"]) {
  border-bottom-style: solid;
}

html :where([style^=border-left-color],
[style*=";border-left-color"],
[style*="; border-left-color"]) {
  border-left-style: solid;
}

html :where([style^=border-width],
[style*=";border-width"],
[style*="; border-width"]) {
  border-style: solid;
}

html :where([style^=border-top-width],
[style*=";border-top-width"],
[style*="; border-top-width"]) {
  border-top-style: solid;
}

html :where([style^=border-right-width],
[style*=";border-right-width"],
[style*="; border-right-width"]) {
  border-right-style: solid;
}

html :where([style^=border-bottom-width],
[style*=";border-bottom-width"],
[style*="; border-bottom-width"]) {
  border-bottom-style: solid;
}

html :where([style^=border-left-width],
[style*=";border-left-width"],
[style*="; border-left-width"]) {
  border-left-style: solid;
}

/**
 * Provide baseline responsiveness for images.
 */
html :where(img[class*=wp-image-]) {
  height: auto;
  max-width: 100%;
}

/**
 * Reset user agent styles for figure element margins.
 */
:where(figure) {
  margin: 0 0 1em 0;
}

html :where(.is-position-sticky) {
  --wp-admin--admin-bar--position-offset: var(--wp-admin--admin-bar--height, 0px);
}

@media screen and (max-width: 600px) {
  html :where(.is-position-sticky) {
    --wp-admin--admin-bar--position-offset: 0px;
  }
}
@supports (not (-webkit-backdrop-filter: blur(1px))) and (not (-moz-appearance: none)) {
  mtd[columnalign=right] {
    text-align: -webkit-right;
  }
  mtd[columnalign=left] {
    text-align: -webkit-left;
  }
  menclose[notation~=top] {
    padding-top: 0.1em;
    border-top: 0.065em solid;
  }
  menclose[notation~=bottom] {
    padding-bottom: 0.1em;
    border-bottom: 0.065em solid;
  }
}`})))()}var $n;function init_theme(){return(init_theme=e((()=>{$n=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
.wp-block-audio :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-audio :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-audio {
  margin: 0 0 1em 0;
}

.wp-block-code {
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: Menlo, Consolas, monaco, monospace;
  padding: 0.8em 1em;
}

.wp-block-embed :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-embed :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-embed {
  margin: 0 0 1em 0;
}

.blocks-gallery-caption {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .blocks-gallery-caption {
  color: rgba(255, 255, 255, 0.65);
}

:root :where(.wp-block-image figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme :root :where(.wp-block-image figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-image {
  margin: 0 0 1em 0;
}

.wp-block-pullquote {
  border-top: 4px solid currentColor;
  border-bottom: 4px solid currentColor;
  margin-bottom: 1.75em;
  color: currentColor;
}
.wp-block-pullquote :where(cite),
.wp-block-pullquote :where(footer), .wp-block-pullquote__citation {
  color: currentColor;
  text-transform: uppercase;
  font-size: 0.8125em;
  font-style: normal;
}

.wp-block-quote {
  border-left: 0.25em solid currentColor;
  margin: 0 0 1.75em 0;
  padding-left: 1em;
}
.wp-block-quote cite,
.wp-block-quote footer {
  color: currentColor;
  font-size: 0.8125em;
  position: relative;
  font-style: normal;
}
.wp-block-quote:where(.has-text-align-right) {
  border-left: none;
  border-right: 0.25em solid currentColor;
  padding-left: 0;
  padding-right: 1em;
}
.wp-block-quote:where(.has-text-align-center) {
  border: none;
  padding-left: 0;
}
.wp-block-quote:where(.is-style-plain), .wp-block-quote.is-style-large, .wp-block-quote.is-large {
  border: none;
}

:where(.wp-block-search .wp-block-search__label) {
  font-weight: 700;
}

.wp-block-search__button {
  border: 1px solid #ccc;
  padding: 0.375em 0.625em;
}

:where(.wp-block-group.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

.wp-block-separator.has-css-opacity {
  opacity: 0.4;
}

.wp-block-separator {
  border: none;
  border-bottom: 2px solid currentColor;
  margin-left: auto;
  margin-right: auto;
}
.wp-block-separator.has-alpha-channel-opacity {
  opacity: initial;
}
.wp-block-separator:not(.is-style-wide):not(.is-style-dots) {
  width: 100px;
}
.wp-block-separator.has-background:not(.is-style-dots) {
  border-bottom: none;
  height: 1px;
}
.wp-block-separator.has-background:not(.is-style-wide):not(.is-style-dots) {
  height: 2px;
}

.wp-block-table {
  margin: 0 0 1em 0;
}
.wp-block-table td,
.wp-block-table th {
  word-break: normal;
}
.wp-block-table :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-table :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-video :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-video :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-video {
  margin: 0 0 1em 0;
}

:root :where(.wp-block-template-part.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
  margin-top: 0;
  margin-bottom: 0;
}`})))()}var er;function init_theme_rtl(){return(init_theme_rtl=e((()=>{er=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
.wp-block-audio :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-audio :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-audio {
  margin: 0 0 1em 0;
}

.wp-block-code {
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: Menlo, Consolas, monaco, monospace;
  padding: 0.8em 1em;
}

.wp-block-embed :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-embed :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-embed {
  margin: 0 0 1em 0;
}

.blocks-gallery-caption {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .blocks-gallery-caption {
  color: rgba(255, 255, 255, 0.65);
}

:root :where(.wp-block-image figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme :root :where(.wp-block-image figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-image {
  margin: 0 0 1em 0;
}

.wp-block-pullquote {
  border-top: 4px solid currentColor;
  border-bottom: 4px solid currentColor;
  margin-bottom: 1.75em;
  color: currentColor;
}
.wp-block-pullquote :where(cite),
.wp-block-pullquote :where(footer), .wp-block-pullquote__citation {
  color: currentColor;
  text-transform: uppercase;
  font-size: 0.8125em;
  font-style: normal;
}

.wp-block-quote {
  border-right: 0.25em solid currentColor;
  margin: 0 0 1.75em 0;
  padding-right: 1em;
}
.wp-block-quote cite,
.wp-block-quote footer {
  color: currentColor;
  font-size: 0.8125em;
  position: relative;
  font-style: normal;
}
.wp-block-quote:where(.has-text-align-right) {
  border-right: none;
  border-left: 0.25em solid currentColor;
  padding-right: 0;
  padding-left: 1em;
}
.wp-block-quote:where(.has-text-align-center) {
  border: none;
  padding-right: 0;
}
.wp-block-quote:where(.is-style-plain), .wp-block-quote.is-style-large, .wp-block-quote.is-large {
  border: none;
}

:where(.wp-block-search .wp-block-search__label) {
  font-weight: 700;
}

.wp-block-search__button {
  border: 1px solid #ccc;
  padding: 0.375em 0.625em;
}

:where(.wp-block-group.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
}

.wp-block-separator.has-css-opacity {
  opacity: 0.4;
}

.wp-block-separator {
  border: none;
  border-bottom: 2px solid currentColor;
  margin-right: auto;
  margin-left: auto;
}
.wp-block-separator.has-alpha-channel-opacity {
  opacity: initial;
}
.wp-block-separator:not(.is-style-wide):not(.is-style-dots) {
  width: 100px;
}
.wp-block-separator.has-background:not(.is-style-dots) {
  border-bottom: none;
  height: 1px;
}
.wp-block-separator.has-background:not(.is-style-wide):not(.is-style-dots) {
  height: 2px;
}

.wp-block-table {
  margin: 0 0 1em 0;
}
.wp-block-table td,
.wp-block-table th {
  word-break: normal;
}
.wp-block-table :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-table :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-video :where(figcaption) {
  color: #555;
  font-size: 13px;
  text-align: center;
}
.is-dark-theme .wp-block-video :where(figcaption) {
  color: rgba(255, 255, 255, 0.65);
}

.wp-block-video {
  margin: 0 0 1em 0;
}

:root :where(.wp-block-template-part.has-background) {
  padding: var(--wp--style--block-background-padding, 1.25em 2.375em);
  margin-top: 0;
  margin-bottom: 0;
}`})))()}var tr;function init_editor(){return(init_editor=e((()=>{tr=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
.block-library-utils__media-control {
  position: relative;
}
.block-library-utils__media-control .components-drop-zone__content-icon {
  display: none;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow {
  display: block;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow button.components-button {
  color: #1e1e1e;
  border-color: #ccc;
  width: 100%;
  display: block;
  height: 40px;
  padding-right: 32px;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow button.components-button:hover {
  color: var(--wp-admin-theme-color);
}

.block-library-utils__media-control__inspector-media-replace-title {
  word-break: break-all;
  white-space: normal;
  text-align: start;
}

.block-library-utils__media-control__inspector-image-indicator {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  background: #fff linear-gradient(-45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  background-size: cover;
  outline: 1px solid transparent;
}

.block-library-utils__media-control__reset {
  position: absolute;
  right: 0;
  top: 8px;
  margin: auto 8px auto;
  opacity: 0;
  border-radius: 2px;
}
@media not (prefers-reduced-motion) {
  .block-library-utils__media-control__reset {
    transition: opacity 0.1s ease-in-out;
  }
}
.block-library-utils__media-control:hover .block-library-utils__media-control__reset, .block-library-utils__media-control__reset:focus, .block-library-utils__media-control__reset:hover {
  opacity: 1;
}
@media (hover: none) {
  .block-library-utils__media-control__reset {
    opacity: 1;
  }
}

.wp-block-audio {
  margin-left: 0;
  margin-right: 0;
  position: relative;
}
.wp-block-audio.is-transient audio {
  opacity: 0.3;
}
.wp-block-audio .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -9px;
  margin-left: -9px;
}

.wp-block-avatar__image img {
  width: 100%;
}

.wp-block-avatar.aligncenter .components-resizable-box__container {
  margin: 0 auto;
}

.wp-block-avatar__help-text {
  grid-column: 1/-1;
}

.wp-block[data-align=center] > .wp-block-button {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.wp-block[data-align=right] > .wp-block-button {
  /*!rtl:ignore*/
  text-align: right;
}

.wp-block-button {
  position: relative;
  cursor: text;
}
.wp-block-button[data-rich-text-placeholder]::after {
  opacity: 0.8;
}

div[data-type="core/button"] {
  display: table;
}

.wp-block-buttons > .wp-block {
  margin: 0;
}
.wp-block-buttons > .wp-block-button.wp-block-button.wp-block-button.wp-block-button.wp-block-button {
  margin: 0;
}
.wp-block-buttons > .block-list-appender {
  display: inline-flex;
  align-items: center;
}
.wp-block-buttons.is-vertical > .block-list-appender .block-list-appender__toggle {
  justify-content: flex-start;
}
.wp-block-buttons > .wp-block-button:focus {
  box-shadow: none;
}
.wp-block-buttons {
  /* stylelint-disable @stylistic/indentation -- Disable the stylelint rule, otherwise this selector is ugly! */
}
.wp-block-buttons:not(.is-content-justification-space-between,
.is-content-justification-right,
.is-content-justification-left,
.is-content-justification-center) .wp-block[data-align=center] {
  /* stylelint-enable @stylistic/indentation */
  margin-left: auto;
  margin-right: auto;
  margin-top: 0;
  width: 100%;
}
.wp-block-buttons:not(.is-content-justification-space-between,
.is-content-justification-right,
.is-content-justification-left,
.is-content-justification-center) .wp-block[data-align=center] .wp-block-button {
  margin-bottom: 0;
}

.wp-block[data-align=center] > .wp-block-buttons {
  align-items: center;
  justify-content: center;
}

.wp-block[data-align=right] > .wp-block-buttons {
  justify-content: flex-end;
}

.wp-block-categories ul {
  padding-left: 2.5em;
}
.wp-block-categories ul ul {
  margin-top: 6px;
}

/* Center alignment for classic themes. */
[data-align=center] .wp-block-categories {
  text-align: center;
}

.wp-block-categories__indentation {
  padding-left: 16px;
}

.wp-block-code code {
  background: none;
}

.wp-block-columns :where(.wp-block) {
  max-width: none;
  margin-left: 0;
  margin-right: 0;
}

html :where(.wp-block-column) {
  margin-top: 0;
  margin-bottom: 0;
}

/* Styles for backwards compatibility with the legacy \`post-comments\` block */
.wp-block-post-comments, .wp-block-comments__legacy-placeholder {
  box-sizing: border-box;
  /* utility classes */
}
.wp-block-post-comments .alignleft, .wp-block-comments__legacy-placeholder .alignleft {
  float: left;
}
.wp-block-post-comments .alignright, .wp-block-comments__legacy-placeholder .alignright {
  float: right;
}
.wp-block-post-comments, .wp-block-comments__legacy-placeholder {
  /* end utility classes */
}
.wp-block-post-comments .navigation::after, .wp-block-comments__legacy-placeholder .navigation::after {
  content: "";
  display: table;
  clear: both;
}
.wp-block-post-comments .commentlist, .wp-block-comments__legacy-placeholder .commentlist {
  clear: both;
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .commentlist .comment, .wp-block-comments__legacy-placeholder .commentlist .comment {
  min-height: 2.25em;
  padding-left: 3.25em;
}
.wp-block-post-comments .commentlist .comment p, .wp-block-comments__legacy-placeholder .commentlist .comment p {
  font-size: 1em;
  line-height: 1.8;
  margin: 1em 0;
}
.wp-block-post-comments .commentlist .children, .wp-block-comments__legacy-placeholder .commentlist .children {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .comment-author, .wp-block-comments__legacy-placeholder .comment-author {
  line-height: 1.5;
}
.wp-block-post-comments .comment-author .avatar, .wp-block-comments__legacy-placeholder .comment-author .avatar {
  border-radius: 1.5em;
  display: block;
  float: left;
  height: 2.5em;
  margin-top: 0.5em;
  margin-right: 0.75em;
  width: 2.5em;
}
.wp-block-post-comments .comment-author cite, .wp-block-comments__legacy-placeholder .comment-author cite {
  font-style: normal;
}
.wp-block-post-comments .comment-meta, .wp-block-comments__legacy-placeholder .comment-meta {
  font-size: 0.875em;
  line-height: 1.5;
}
.wp-block-post-comments .comment-meta b, .wp-block-comments__legacy-placeholder .comment-meta b {
  font-weight: 400;
}
.wp-block-post-comments .comment-meta .comment-awaiting-moderation, .wp-block-comments__legacy-placeholder .comment-meta .comment-awaiting-moderation {
  margin-top: 1em;
  margin-bottom: 1em;
  display: block;
}
.wp-block-post-comments .comment-body .commentmetadata, .wp-block-comments__legacy-placeholder .comment-body .commentmetadata {
  font-size: 0.875em;
}
.wp-block-post-comments .comment-form textarea, .wp-block-comments__legacy-placeholder .comment-form textarea,
.wp-block-post-comments .comment-form input:not([type=submit]):not([type=checkbox]),
.wp-block-comments__legacy-placeholder .comment-form input:not([type=submit]):not([type=checkbox]) {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
.wp-block-post-comments .comment-form-cookies-consent, .wp-block-comments__legacy-placeholder .comment-form-cookies-consent {
  display: flex;
  gap: 0.25em;
}
.wp-block-post-comments .comment-form-cookies-consent #wp-comment-cookies-consent, .wp-block-comments__legacy-placeholder .comment-form-cookies-consent #wp-comment-cookies-consent {
  margin-top: 0.35em;
}
.wp-block-post-comments .comment-reply-title, .wp-block-comments__legacy-placeholder .comment-reply-title {
  margin-bottom: 0;
}
.wp-block-post-comments .comment-reply-title :where(small), .wp-block-comments__legacy-placeholder .comment-reply-title :where(small) {
  font-size: var(--wp--preset--font-size--medium, smaller);
  margin-left: 0.5em;
}
.wp-block-post-comments .reply, .wp-block-comments__legacy-placeholder .reply {
  font-size: 0.875em;
  margin-bottom: 1.4em;
}
.wp-block-post-comments textarea, .wp-block-comments__legacy-placeholder textarea,
.wp-block-post-comments input:not([type=submit]),
.wp-block-comments__legacy-placeholder input:not([type=submit]) {
  border: 1px solid #949494;
  font-size: 1em;
  font-family: inherit;
}
.wp-block-post-comments textarea, .wp-block-comments__legacy-placeholder textarea,
.wp-block-post-comments input:not([type=submit]):not([type=checkbox]),
.wp-block-comments__legacy-placeholder input:not([type=submit]):not([type=checkbox]) {
  padding: calc(0.667em + 2px);
}

:where(.wp-block-post-comments .comment-form-comment label, .wp-block-comments__legacy-placeholder .comment-form-comment label),
:where(.wp-block-post-comments .comment-form-author label, .wp-block-comments__legacy-placeholder .comment-form-author label),
:where(.wp-block-post-comments .comment-form-email label, .wp-block-comments__legacy-placeholder .comment-form-email label),
:where(.wp-block-post-comments .comment-form-url label, .wp-block-comments__legacy-placeholder .comment-form-url label) {
  display: block;
  margin-bottom: 0.25em;
}

:where(.wp-block-post-comments input[type=submit], .wp-block-comments__legacy-placeholder input[type=submit]) {
  border: none;
}

.wp-block-comments {
  box-sizing: border-box;
}

.block-library-comments-toolbar__popover .components-popover__content {
  min-width: 230px;
}

.wp-block-comments__legacy-placeholder * {
  pointer-events: none;
}

.wp-block-comment-author-avatar__placeholder {
  border: currentColor 1px dashed;
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-dasharray: 3;
}

.wp-block[data-align=center] > .wp-block-comments-pagination {
  justify-content: center;
}

:where(.editor-styles-wrapper) .wp-block-comments-pagination {
  max-width: 100%;
}

.wp-block-comments-pagination > .wp-block-comments-pagination-next,
.wp-block-comments-pagination > .wp-block-comments-pagination-previous,
.wp-block-comments-pagination > .wp-block-comments-pagination-numbers {
  font-size: inherit;
}

.wp-block-comments-pagination-numbers a {
  text-decoration: underline;
}
.wp-block-comments-pagination-numbers .page-numbers {
  margin-right: 2px;
}
.wp-block-comments-pagination-numbers .page-numbers:last-child {
  /*rtl:ignore*/
  margin-right: 0;
}

.wp-block-comments-title.has-background {
  padding: inherit;
}

.wp-block-cover.is-placeholder {
  padding: 0 !important;
  display: flex;
  align-items: stretch;
  min-height: 240px;
}
.wp-block-cover.is-placeholder .components-placeholder.is-large {
  justify-content: flex-start;
  z-index: 1;
}
.wp-block-cover.is-placeholder:focus::after {
  min-height: auto;
}
.wp-block-cover.components-placeholder h2 {
  color: inherit;
}
.wp-block-cover.is-transient {
  position: relative;
}
.wp-block-cover.is-transient::before {
  background-color: #fff;
  content: "";
  height: 100%;
  opacity: 0.3;
  position: absolute;
  width: 100%;
  z-index: 1;
}
.wp-block-cover.is-transient .wp-block-cover__inner-container {
  z-index: 2;
}
.wp-block-cover.is-transient .components-spinner {
  z-index: 3;
}
.wp-block-cover .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}
.wp-block-cover .wp-block-cover__inner-container {
  text-align: left;
  margin-left: 0;
  margin-right: 0;
}
.wp-block-cover .wp-block-cover__placeholder-background-options {
  width: 100%;
}
.wp-block-cover .wp-block-cover__image--placeholder-image {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

[data-align=left] > .wp-block-cover,
[data-align=right] > .wp-block-cover {
  max-width: 420px;
  width: 100%;
}

.block-library-cover__reset-button {
  margin-left: auto;
}

.block-library-cover__resize-container {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  min-height: 50px;
}

.components-popover.block-editor-block-popover.block-library-cover__resizable-box-popover .components-popover__content > div,
.components-popover.block-editor-block-popover.block-library-cover__resizable-box-popover .block-library-cover__resize-container {
  pointer-events: none;
  overflow: visible;
}

.block-editor-block-patterns-list__list-item .has-parallax.wp-block-cover {
  background-attachment: scroll;
}

.color-block-support-panel__inner-wrapper > :not(.block-editor-tools-panel-color-gradient-settings__item) {
  margin-top: 24px;
}

.wp-block-details summary div {
  display: inline;
}

.wp-block-embed {
  margin-left: 0;
  margin-right: 0;
  clear: both;
}
.wp-block-embed.is-loading {
  display: flex;
  justify-content: center;
}
.wp-block-embed .wp-block-embed__placeholder-input {
  flex: 1 1 auto;
}
.wp-block-embed .components-placeholder__error {
  word-break: normal;
  overflow-wrap: break-word;
}

.wp-block-post-content .wp-block-embed__learn-more a {
  color: var(--wp-admin-theme-color);
}

.block-library-embed__interactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0;
}

.wp-block[data-align=left] > .wp-block-embed,
.wp-block[data-align=right] > .wp-block-embed {
  max-width: 360px;
  width: 100%;
}
.wp-block[data-align=left] > .wp-block-embed .wp-block-embed__wrapper,
.wp-block[data-align=right] > .wp-block-embed .wp-block-embed__wrapper {
  min-width: 280px;
}

.wp-block[data-align=left] > .wp-block-file, .wp-block[data-align=right] > .wp-block-file {
  height: auto;
}
.wp-block[data-align=center] > .wp-block-file {
  text-align: center;
}
.wp-block-file {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}
.wp-block-file .components-resizable-box__container {
  margin-bottom: 1em;
}
.wp-block-file .wp-block-file__preview {
  margin-bottom: 1em;
  width: 100%;
  height: 100%;
}
.wp-block-file .wp-block-file__preview-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.wp-block-file .wp-block-file__content-wrapper {
  flex-grow: 1;
}
.wp-block-file a {
  min-width: 1em;
}
.wp-block-file a:not(.wp-block-file__button) {
  display: inline-block;
}
.wp-block-file .wp-block-file__button-richtext-wrapper {
  display: inline-block;
  margin-left: 0.75em;
}

.block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area iframe {
  height: 50vh !important;
}
@media (min-width: 960px) {
  .block-editor-freeform-modal .block-editor-freeform-modal__content:not(.is-full-screen) {
    height: 9999rem;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .components-modal__header + div {
    height: 100%;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-tinymce {
    height: calc(100% - 36px - 16px);
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-container-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-width: 50vw;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area iframe {
    flex-grow: 1;
    height: 10px !important;
  }
}
.block-editor-freeform-modal__actions {
  margin-top: 16px;
}

:root :where(figure.wp-block-gallery.is-layout-flex) {
  display: block;
}
:root :where(figure.wp-block-gallery.is-layout-flex) > .blocks-gallery-caption {
  flex: 0 0 100%;
}

:root :where(.wp-block-gallery.is-layout-grid) > .blocks-gallery-caption,
:root :where(.wp-block-gallery.is-layout-grid) > .components-placeholder,
:root :where(.wp-block-gallery.is-layout-grid) > .block-editor-media-placeholder {
  grid-column: 1/-1;
}

:root :where(figure.wp-block-gallery) .block-editor-media-placeholder.is-appender .components-placeholder__label {
  display: none;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder.is-appender .block-editor-media-placeholder__button {
  margin-bottom: 0;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder {
  margin: 0;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder .components-placeholder__label {
  display: flex;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder figcaption {
  z-index: 2;
}
:root :where(figure.wp-block-gallery) .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -9px;
  margin-left: -9px;
}

/**
 * Gallery inspector controls settings.
 */
.gallery-settings-buttons .components-button:first-child {
  margin-right: 8px;
}

/**
 * Deprecated css past this point. This can be removed once all galleries are migrated
 * to V2.
 */
.blocks-gallery-item figure:not(.is-selected):focus,
.blocks-gallery-item img:focus {
  outline: none;
}
.blocks-gallery-item figure.is-selected::before {
  box-shadow: 0 0 0 1px #fff inset, 0 0 0 3px var(--wp-admin-theme-color) inset;
  content: "";
  outline: 2px solid transparent;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}
.blocks-gallery-item figure.is-transient img {
  opacity: 0.3;
}
.blocks-gallery-item .block-editor-media-placeholder {
  margin: 0;
  height: 100%;
}
.blocks-gallery-item .block-editor-media-placeholder .components-placeholder__label {
  display: flex;
}

.wp-block-gallery ul.blocks-gallery-grid {
  padding: 0;
  margin: 0;
}

@media (min-width: 600px) {
  .wp-block-update-gallery-modal {
    max-width: 480px;
  }
}

.wp-block-update-gallery-modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.wp-block-gallery__source-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wp-block-gallery__source-settings .wp-block-gallery__source-description {
  margin: 0;
  color: #757575;
  font-size: 12px;
}
.wp-block-gallery__source-settings .components-button {
  justify-content: center;
  width: 100%;
}

.wp-block-gallery__source-notice {
  margin: 16px 0 0;
}

/**
 * Group: All Alignment Settings
 */
.wp-block-group .block-editor-block-list__insertion-point {
  left: 0;
  right: 0;
}

[data-type="core/group"].is-selected .block-list-appender {
  margin-left: 0;
  margin-right: 0;
}
[data-type="core/group"].is-selected .has-background .block-list-appender {
  margin-top: 18px;
  margin-bottom: 18px;
}

.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child {
  gap: inherit;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-default-block-appender__content,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-inserter {
  display: inherit;
  width: 100%;
  flex-direction: inherit;
  flex: 1;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child::after {
  content: "";
  display: flex;
  flex: 1 0 40px;
  pointer-events: none;
  min-height: 38px;
  border: 1px dashed currentColor;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child {
  pointer-events: none;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-inserter,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-button-block-appender {
  pointer-events: all;
}

.block-library-html__edit .block-library-html__preview-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
}

.block-library-html__no-output-marker {
  position: absolute;
  top: -4px;
  right: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 4px;
  transform: translateY(-100%);
  border-radius: 2px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  outline: 1px solid transparent;
  color: #1e1e1e;
  cursor: default;
}
.block-library-html__edit:hover > .block-library-html__no-output-marker, .block-library-html__edit.is-selected > .block-library-html__no-output-marker {
  background: var(--wp-admin-theme-color);
  box-shadow: none;
  color: #fff;
}
.is-layout-flex > .block-library-html__edit > .block-library-html__no-output-marker {
  top: 50%;
  transform: translateY(-50%);
}
.is-layout-flex:not(.is-vertical) > .block-library-html__edit > .block-library-html__no-output-marker {
  right: auto;
  left: 50%;
  margin: 0;
  transform: translate(-50%, -50%);
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-right: 32px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-right: 60px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-right: 88px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-right: 116px;
}

.block-library-html__edit-code {
  margin: 16px;
}
.block-library-html__edit-code .block-library-html__edit-code-button {
  justify-content: center;
}

@media (min-width: 600px) {
  .block-library-html__modal:not(.is-full-screen) {
    height: 9999rem;
  }
}
.block-library-html__modal .components-modal__children-container {
  height: 100%;
}

.block-library-html__modal-tabs {
  flex: 1;
}

.block-library-html__modal-content {
  flex: 1;
}

.block-library-html__modal-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 16px;
  font-family: Menlo, Consolas, monaco, monospace;
}

.block-library-html__modal-editor {
  width: 100%;
  height: 100%;
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  resize: none;
  /*rtl:ignore*/
  direction: ltr;
  overflow-x: auto;
  box-sizing: border-box;
}
.block-library-html__modal-editor:focus {
  outline: none;
  box-shadow: none;
}

.block-library-html__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}
.block-library-html__preview iframe {
  height: 100%;
}

.wp-block[data-align=center] > .wp-block-icon {
  display: flex;
  justify-content: center;
}

.wp-block-icon__inserter-sidebar {
  padding-bottom: 24px;
}
@media (min-width: 782px) {
  .wp-block-icon__inserter-sidebar {
    overflow-x: visible;
    overflow-y: auto;
    position: absolute;
    top: 72px;
    left: 0;
    bottom: 0;
    width: 280px;
    padding-top: 24px;
    padding-inline: 24px;
  }
}

@media (min-width: 782px) {
  .wp-block-icon__inserter-panel {
    margin-inline-start: 280px;
  }
}

.wp-block-icon__inserter-loading {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.wp-block-icon__inserter-grid-icons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.wp-block-icon__inserter-grid-no-results {
  display: flex;
  justify-content: center;
}

.wp-block-icon__inserter-grid-icons-list-item {
  display: flex;
  flex-direction: column;
  height: auto !important;
}

.wp-block-icon__inserter-grid-icons-list-item-icon {
  padding: 12px;
}
.wp-block-icon__inserter-grid-icons-list-item-icon svg {
  display: block;
  width: 24px;
  height: 24px;
}

.wp-block-icon__inserter-grid-icons-list-item-title {
  font-size: 12px;
  padding: 4px 4px 8px;
  overflow-wrap: break-word;
}

.wp-block-icon__inserter-modal .wp-block-icon__inserter-grid-group-title {
  position: sticky;
  top: -4px;
  z-index: 1;
  padding: 12px 4px;
  margin: 0;
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
  text-transform: uppercase;
  font-size: var(--wpds-typography-font-size-sm, 12px);
  background-color: #fff;
}

.wp-block-icon__inserter-modal .wp-block-icon__inserter-grid > :first-child > .wp-block-icon__inserter-grid-group-title {
  margin-top: -4px;
}

.wp-block-icon__toolbar-content {
  width: 250px;
}

.wp-block-icon__placeholder {
  backdrop-filter: blur(100px);
}

.wp-block-image.wp-block-image .block-editor-media-placeholder.is-small {
  min-height: 60px;
}

figure.wp-block-image:not(.wp-block) {
  margin: 0;
}

.wp-block-image {
  position: relative;
}
.wp-block-image.is-transient:not(.alignwide):not(.alignfull), .wp-block-image:has(img.is-swapping-media):not(.alignwide):not(.alignfull) {
  width: fit-content;
}
.wp-block-image .is-applying img, .wp-block-image.is-transient img,
.wp-block-image img.is-swapping-media {
  opacity: 0.3;
}
.wp-block-image figcaption img {
  display: inline;
}
.wp-block-image .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}
.wp-block-image .components-resizable-box__container {
  pointer-events: none;
}
.wp-block-image .components-resizable-box__handle {
  pointer-events: auto;
}

.wp-block-image__placeholder {
  aspect-ratio: 4/3;
}
.wp-block-image__placeholder.has-illustration::before {
  background: #fff;
  opacity: 0.8;
}
.wp-block-image__placeholder .components-placeholder__illustration {
  opacity: 0.1;
}

.wp-block-image.is-selected .block-editor-media-placeholder {
  filter: none !important;
}

.block-editor-block-list__block[data-type="core/image"] .block-editor-block-toolbar .block-editor-url-input__button-modal {
  position: absolute;
  left: 0;
  right: 0;
  margin: -1px 0;
}
@media (min-width: 600px) {
  .block-editor-block-list__block[data-type="core/image"] .block-editor-block-toolbar .block-editor-url-input__button-modal {
    margin: -1px;
  }
}

[data-align=wide] > .wp-block-image img,
[data-align=full] > .wp-block-image img {
  height: auto;
  width: 100%;
}

.wp-block[data-align=left] > .wp-block-image,
.wp-block[data-align=center] > .wp-block-image,
.wp-block[data-align=right] > .wp-block-image {
  display: table;
}
.wp-block[data-align=left] > .wp-block-image > figcaption,
.wp-block[data-align=center] > .wp-block-image > figcaption,
.wp-block[data-align=right] > .wp-block-image > figcaption {
  display: table-caption;
  caption-side: bottom;
}

.wp-block[data-align=left] > .wp-block-image {
  margin-right: 1em;
  margin-left: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.wp-block[data-align=right] > .wp-block-image {
  margin-left: 1em;
  margin-right: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.wp-block[data-align=center] > .wp-block-image {
  margin-left: auto;
  margin-right: auto;
  text-align: center;
}

.wp-block[data-align]:has(> .wp-block-image) {
  position: relative;
}

.wp-block-image__toolbar_content_textarea__container {
  padding: 8px;
}

.wp-block-image__toolbar_content_textarea {
  width: 250px;
}

.wp-block-latest-posts > li {
  overflow: hidden;
}

.wp-block-latest-posts li a > div {
  display: inline;
}

:root :where(.wp-block-latest-posts) {
  padding-left: 2.5em;
}

:root :where(.wp-block-latest-posts.is-grid),
:root :where(.wp-block-latest-posts__list) {
  padding-left: 0;
}

.wp-block-math__textarea-control textarea {
  font-family: Menlo, Consolas, monaco, monospace;
  /*rtl:ignore*/
  direction: ltr;
}

.wp-block-math__learn-more {
  display: inline-block;
  margin-top: var(--wpds-dimension-gap-sm, 8px);
}

.wp-block-media-text__media {
  position: relative;
}
.wp-block-media-text__media.is-transient img {
  opacity: 0.3;
}
.wp-block-media-text__media .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -9px;
  margin-left: -9px;
}

.wp-block-media-text .__resizable_base__ {
  grid-column: 1/span 2;
  grid-row: 2;
}

.wp-block-media-text .editor-media-container__resizer {
  width: 100% !important;
}

.wp-block-media-text.is-image-fill .editor-media-container__resizer,
.wp-block-media-text.is-image-fill .components-placeholder.has-illustration,
.wp-block-media-text.is-image-fill-element .editor-media-container__resizer,
.wp-block-media-text.is-image-fill-element .components-placeholder.has-illustration {
  height: 100% !important;
}

.wp-block-media-text > .block-editor-block-list__layout > .block-editor-block-list__block {
  max-width: unset;
}

/* Make the featured image placeholder the same height as the media selection area. */
.wp-block-media-text--placeholder-image {
  min-height: 205px;
}

.block-editor-block-list__block[data-type="core/more"] {
  max-width: 100%;
  text-align: center;
  margin-top: 28px;
  margin-bottom: 28px;
}

.wp-block-more {
  display: block;
  text-align: center;
  white-space: nowrap;
}
.wp-block-more .rich-text {
  position: relative;
  font-size: 13px;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #757575;
  display: inline-flex;
  white-space: nowrap;
  text-align: center;
  background: #fff;
  padding: 10px 36px;
}
.wp-block-more::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: 3px dashed #ccc;
}

/**
 * Editor only CSS.
 */
.editor-styles-wrapper .wp-block-navigation ul {
  margin-top: 0;
  margin-bottom: 0;
  margin-left: 0;
  padding-left: 0;
}
.editor-styles-wrapper .wp-block-navigation .wp-block-navigation-item.wp-block {
  margin: revert;
}

.wp-block-navigation-item__label {
  display: inline;
}

/**
 * Submenus.
 */
.wp-block-navigation__container,
.wp-block-navigation-item {
  background-color: inherit;
}

.wp-block-navigation:not(.is-selected):not(.has-child-selected) .has-child:hover > .wp-block-navigation__submenu-container {
  opacity: 0;
  visibility: hidden;
}

.has-child.is-selected > .wp-block-navigation__submenu-container, .has-child.has-child-selected > .wp-block-navigation__submenu-container {
  display: flex;
  opacity: 1;
  visibility: visible;
}

.is-dragging-components-draggable .has-child.is-dragging-within > .wp-block-navigation__submenu-container {
  opacity: 1;
  visibility: visible;
}

.wp-block-navigation__container.block-editor-block-list__layout {
  flex-grow: 1;
}

.is-editing > .wp-block-navigation__container {
  visibility: visible;
  opacity: 1;
  display: flex;
  flex-direction: column;
}

.is-dragging-components-draggable .wp-block-navigation-link > .wp-block-navigation__container {
  opacity: 1;
  visibility: hidden;
}
.is-dragging-components-draggable .wp-block-navigation-link > .wp-block-navigation__container .block-editor-block-draggable-chip-wrapper {
  visibility: visible;
}

.is-editing > .wp-block-navigation__submenu-container > .block-list-appender {
  display: block;
  position: static;
  width: 100%;
}
.is-editing > .wp-block-navigation__submenu-container > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon {
  display: flex;
  margin-right: 0;
  margin-left: auto;
  border: 1px solid currentColor;
  background-color: transparent;
  color: #1e1e1e;
}

.wp-block-navigation__submenu-container .block-list-appender {
  display: none;
}

/**
 * Colors Selector component
 */
.block-library-colors-selector {
  width: auto;
}
.block-library-colors-selector .block-library-colors-selector__toggle {
  display: block;
  margin: 0 auto;
  padding: 3px;
  width: auto;
}
.block-library-colors-selector .block-library-colors-selector__icon-container {
  height: 30px;
  position: relative;
  margin: 0 auto;
  padding: 3px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}
.block-library-colors-selector .block-library-colors-selector__state-selection {
  margin-left: auto;
  margin-right: auto;
  border-radius: 11px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  line-height: 20px;
  padding: 2px;
}
.block-library-colors-selector .block-library-colors-selector__state-selection > svg {
  min-width: auto !important;
}
.block-library-colors-selector .block-library-colors-selector__state-selection.has-text-color > svg,
.block-library-colors-selector .block-library-colors-selector__state-selection.has-text-color > svg path {
  color: inherit;
}

.block-library-colors-selector__popover .color-palette-controller-container {
  padding: 16px;
}
.block-library-colors-selector__popover .components-base-control__label {
  height: 20px;
  line-height: 20px;
}
.block-library-colors-selector__popover .component-color-indicator {
  float: right;
  margin-top: 2px;
}
.block-library-colors-selector__popover .components-panel__body-title {
  display: none;
}

.wp-block-navigation__container > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon {
  display: flex;
}

/**
 * Setup state
 */
@keyframes loadingpulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.components-placeholder.wp-block-navigation-placeholder {
  outline: none;
  padding: 0;
  box-shadow: none;
  background: none;
  min-height: 0;
}
.components-placeholder.wp-block-navigation-placeholder .components-placeholder__fieldset {
  font-size: inherit;
}
.components-placeholder.wp-block-navigation-placeholder .components-placeholder__fieldset .components-button {
  margin-bottom: 0;
}
.components-placeholder.wp-block-navigation-placeholder {
  color: inherit;
}
.wp-block-navigation.is-selected .components-placeholder.wp-block-navigation-placeholder {
  color: #1e1e1e;
}

.wp-block-navigation-placeholder__preview {
  display: flex;
  align-items: center;
  min-width: 96px;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}
.wp-block-navigation.is-selected .wp-block-navigation-placeholder__preview {
  display: none;
}
.wp-block-navigation-placeholder__preview {
  color: currentColor;
  background: transparent;
}
.wp-block-navigation-placeholder__preview::before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
  border: 1px dashed currentColor;
  border-radius: inherit;
}
.wp-block-navigation-placeholder__preview > svg {
  fill: currentColor;
}

.wp-block-navigation.is-vertical .is-small .components-placeholder__fieldset,
.wp-block-navigation.is-vertical .is-medium .components-placeholder__fieldset {
  min-height: 90px;
}

.wp-block-navigation.is-vertical .is-large .components-placeholder__fieldset {
  min-height: 132px;
}

.wp-block-navigation-placeholder__preview,
.wp-block-navigation-placeholder__controls {
  padding: 6px 8px;
  flex-direction: row;
  align-items: flex-start;
}

.wp-block-navigation-placeholder__controls {
  border-radius: 2px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  display: none;
  position: relative;
  z-index: 1;
}
.wp-block-navigation.is-selected .wp-block-navigation-placeholder__controls {
  display: flex;
}
.wp-block-navigation-placeholder__controls {
  float: left;
  width: 100%;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator,
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator + hr, .is-medium .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator,
.is-medium .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator + hr {
  display: none;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions, .wp-block-navigation.is-vertical .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions {
  flex-direction: column;
  align-items: flex-start;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions hr, .wp-block-navigation.is-vertical .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions hr {
  display: none;
}
.wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__icon {
  margin-right: 12px;
  height: 36px;
}

.wp-block-navigation-placeholder__actions__indicator {
  display: flex;
  padding: 0 6px 0 0;
  align-items: center;
  justify-content: flex-start;
  line-height: 0;
  height: 36px;
  margin-left: 4px;
}
.wp-block-navigation-placeholder__actions__indicator svg {
  margin-right: 4px;
  fill: currentColor;
}

.wp-block-navigation .components-placeholder.is-medium .components-placeholder__fieldset {
  flex-direction: row !important;
}

.wp-block-navigation-placeholder__actions {
  display: flex;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  gap: 6px;
  align-items: center;
}
.wp-block-navigation-placeholder__actions .components-dropdown,
.wp-block-navigation-placeholder__actions > .components-button {
  margin-right: 0;
}
.wp-block-navigation-placeholder__actions {
  height: 100%;
}
.wp-block-navigation-placeholder__actions.wp-block-navigation-placeholder__actions hr {
  border: 0;
  min-height: 1px;
  min-width: 1px;
  background-color: #1e1e1e;
  margin: auto 0;
  height: 100%;
  max-height: 16px;
}

/**
 * Mobile menu.
 */
@media (min-width: 600px) {
  .wp-block-navigation__responsive-container:not(.is-menu-open) .components-button.wp-block-navigation__responsive-container-close {
    display: none;
  }
}

.wp-block-navigation__responsive-container.is-menu-open {
  position: fixed;
  top: 159px;
}
@media (min-width: 782px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    top: 97px;
  }
}
@media (min-width: 782px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    left: 36px;
  }
}
@media (min-width: 960px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    left: 160px;
  }
}

.is-mobile-preview .wp-block-navigation__responsive-container.is-menu-open,
.is-tablet-preview .wp-block-navigation__responsive-container.is-menu-open {
  top: 145px;
}

.is-fullscreen-mode .wp-block-navigation__responsive-container.is-menu-open {
  left: 0;
  top: 159px;
}
@media (min-width: 782px) {
  .is-fullscreen-mode .wp-block-navigation__responsive-container.is-menu-open {
    top: 65px;
  }
}
.is-fullscreen-mode .is-mobile-preview .wp-block-navigation__responsive-container.is-menu-open,
.is-fullscreen-mode .is-tablet-preview .wp-block-navigation__responsive-container.is-menu-open {
  top: 113px;
}

body.editor-styles-wrapper .wp-block-navigation__responsive-container.is-menu-open {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.components-button.wp-block-navigation__responsive-container-open.wp-block-navigation__responsive-container-open,
.components-button.wp-block-navigation__responsive-container-close.wp-block-navigation__responsive-container-close {
  padding: 0;
  height: auto;
  color: inherit;
}

.components-heading.wp-block-navigation-off-canvas-editor__title {
  margin: 0;
}

.wp-block-navigation-off-canvas-editor__header {
  margin-bottom: 8px;
}

.is-menu-open .wp-block-navigation__responsive-container-content * .block-list-appender {
  margin-top: 16px;
}

@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.wp-block-navigation__loading-indicator-container {
  padding: 8px 12px;
}

.wp-block-navigation .wp-block-navigation__uncontrolled-inner-blocks-loading-indicator {
  margin-top: 0;
}

@keyframes fadeouthalf {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
.wp-block-navigation-delete-menu-button {
  width: 100%;
  justify-content: center;
  margin-bottom: 16px;
}

.components-button.is-link.wp-block-navigation-manage-menus-button {
  margin-bottom: 16px;
}

.wp-block-navigation__overlay-menu-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: #f0f0f0;
  padding: 0 24px;
  height: 64px !important;
  grid-column: span 2;
}
.wp-block-navigation__overlay-menu-preview.open {
  border-color: #e0e0e0;
  background-color: #fff;
}

.wp-block-navigation__toolbar-menu-selector.components-toolbar-group:empty {
  display: none;
}

.wp-block-navigation-placeholder__actions hr + hr {
  display: none;
}

/**
 * Navigation selector styles
 */
.wp-block-navigation__navigation-selector {
  margin-bottom: 16px;
  width: 100%;
}

.wp-block-navigation__navigation-selector-button {
  border: 1px solid;
  justify-content: space-between;
  width: 100%;
}

.wp-block-navigation__navigation-selector-button__icon {
  flex: 0 0 auto;
}

.wp-block-navigation__navigation-selector-button__label {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-block-navigation__navigation-selector-button--createnew {
  border: 1px solid;
  margin-bottom: 16px;
  width: 100%;
}

.wp-block-navigation__responsive-container-open.components-button {
  opacity: 1;
}

.wp-block-navigation__menu-inspector-controls__empty-message {
  margin-left: 24px;
}

.editor-sidebar__panel .wp-block-navigation__submenu-header {
  margin-top: 0;
  margin-bottom: 0;
}

.wp-block-navigation__submenu-accessibility-notice {
  grid-column: span 2;
}

.wp-block-navigation__overlay-selector {
  position: relative;
}

.wp-block-navigation__overlay-selector-controls {
  margin-bottom: 8px;
}

.wp-block-navigation__overlay-create-button {
  position: absolute;
  top: -4px;
  right: 0;
  z-index: 1;
}

.wp-block-navigation__overlay-preview {
  border: 1px solid #ddd;
  border-radius: 2px;
  overflow-y: auto;
  max-height: 200px;
  background: #fff;
}

.wp-block-navigation__overlay-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f0f0f0;
}

.wp-block-navigation__overlay-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 16px;
  text-align: center;
  color: #757575;
  background: #f0f0f0;
  font-style: italic;
}

.wp-block-navigation__overlay-preview-placeholder {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  animation: wp-block-navigation-overlay-preview-pulse 1.5s ease-in-out infinite;
}

@keyframes wp-block-navigation-overlay-preview-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.wp-block-navigation__deleted-overlay-warning {
  margin-top: 12px;
}

.wp-block-navigation__overlay-create-button-prominent {
  width: 100%;
  justify-content: center;
  margin-bottom: 8px;
}

.wp-block-navigation__overlay-help-text-wrapper {
  margin-top: 8px;
}

.wp-block-audio__autoplay-help-text {
  grid-column: 1/-1;
}

/**
 * Appender
 */
.wp-block-navigation .block-list-appender {
  position: relative;
}

/**
 * Submenus.
 */
.wp-block-navigation .has-child {
  cursor: pointer;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container {
  z-index: 28;
}
.wp-block-navigation .has-child:hover .wp-block-navigation__submenu-container {
  z-index: 29;
}
.wp-block-navigation .has-child.is-selected > .wp-block-navigation__submenu-container, .wp-block-navigation .has-child.has-child-selected > .wp-block-navigation__submenu-container {
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  width: auto !important;
  overflow: visible !important;
}
.wp-block-navigation .has-child.is-selected:not(.open-always) > .wp-block-navigation__submenu-container, .wp-block-navigation .has-child.has-child-selected:not(.open-always) > .wp-block-navigation__submenu-container {
  min-width: 200px !important;
}

/**
 * Navigation Items.
 */
.wp-block-navigation-item .wp-block-navigation-item__content {
  cursor: text;
}
.wp-block-navigation-item.is-editing, .wp-block-navigation-item.is-selected {
  min-width: 20px;
}
.wp-block-navigation-item .block-list-appender {
  margin-top: 16px;
  margin-right: auto;
  margin-bottom: 16px;
  margin-left: 16px;
}

.wp-block-navigation-link__invalid-item {
  color: #000;
}

/**
 * Menu item setup state. Is shown when a menu item has no URL configured.
 */
.wp-block-navigation-link__placeholder {
  position: relative;
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
.wp-block-navigation-link__placeholder .wp-block-navigation-link__placeholder-text span {
  -webkit-text-decoration: wavy underline;
          text-decoration: wavy underline;
  -webkit-text-decoration-skip-ink: none;
          text-decoration-skip-ink: none;
  text-underline-offset: 0.25rem;
}
.wp-block-navigation-link__placeholder.wp-block-navigation-item__content {
  cursor: pointer;
}

/**
* Link Control Transforms
*/
.link-control-transform {
  border-top: 1px solid #ccc;
  padding: 0 16px 8px 16px;
}

.link-control-transform__subheading {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  color: #1e1e1e;
  margin-bottom: 1.5em;
}

.link-control-transform__items {
  display: flex;
  justify-content: space-between;
}

.link-control-transform__item {
  flex-basis: 33%;
  flex-direction: column;
  gap: 8px;
  height: auto;
}

.link-ui-page-creator {
  max-width: 350px;
  min-width: auto;
  width: 90vw;
  padding-top: 8px;
}
.link-ui-page-creator__inner {
  padding: 16px;
}
.link-ui-page-creator__back {
  margin-left: 8px;
  text-transform: uppercase;
}

/**
 * Error text styling for missing entity help text.
 */
.navigation-link-control__error-text {
  color: #cc1818;
}

.navigation-link-to__action-button {
  grid-column: auto;
}
.navigation-link-to__action-button:nth-last-child(1 of .navigation-link-to__action-button):nth-child(odd of .navigation-link-to__action-button) {
  grid-column: 1/-1;
}
.navigation-link-to__action-button.navigation-link-to__action-button.navigation-link-to__action-button {
  justify-content: center;
}

.wp-block-navigation-submenu {
  display: block;
}
.wp-block-navigation-submenu .wp-block-navigation__submenu-container {
  z-index: 28;
}
.wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container {
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  width: auto !important;
  position: absolute;
  left: -1px;
  top: 100%;
}
@media (min-width: 782px) {
  .wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
    left: 100%;
    top: -1px;
  }
  .wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container::before, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container::before {
    content: "";
    position: absolute;
    right: 100%;
    height: 100%;
    display: block;
    width: 0.5em;
    background: transparent;
  }
}
.wp-block-navigation-submenu.is-selected:not(.open-always) > .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected:not(.open-always) > .wp-block-navigation__submenu-container {
  min-width: 200px !important;
}

.block-editor-block-list__block[data-type="core/nextpage"] {
  max-width: 100%;
  text-align: center;
  margin-top: 28px;
  margin-bottom: 28px;
}

.wp-block-nextpage {
  display: block;
  text-align: center;
  white-space: nowrap;
}
.wp-block-nextpage > span {
  font-size: 13px;
  position: relative;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #757575;
  border-radius: 4px;
  background: #fff;
  padding: 6px 8px;
  height: 24px;
}
.wp-block-nextpage::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  border-top: 3px dashed #ccc;
}

.wp-block-navigation.items-justified-space-between .wp-block-page-list > div,
.wp-block-navigation.items-justified-space-between .wp-block-page-list {
  display: contents;
  flex: 1;
}
.wp-block-navigation.items-justified-space-between.has-child-selected .wp-block-page-list > div, .wp-block-navigation.items-justified-space-between.has-child-selected .wp-block-page-list, .wp-block-navigation.items-justified-space-between.is-selected .wp-block-page-list > div, .wp-block-navigation.items-justified-space-between.is-selected .wp-block-page-list {
  flex: inherit;
}

.wp-block-navigation .wp-block-navigation__submenu-container > .wp-block-page-list {
  display: block;
}

.wp-block-pages-list__item__link {
  pointer-events: none;
}

.wp-block-page-list .open-on-click:focus-within > .wp-block-navigation__submenu-container {
  visibility: visible;
  opacity: 1;
  width: auto;
  height: auto;
  min-width: 200px;
}

.wp-block-page-list__loading-indicator-container {
  padding: 8px 12px;
}

:root :where(.block-editor-block-list__block[data-type="core/paragraph"].has-drop-cap:focus) {
  min-height: auto;
}

.block-editor-block-list__block[data-empty=true] [data-rich-text-placeholder] {
  opacity: 1;
}

.block-editor-block-list__block[data-empty=true] + .block-editor-block-list__block[data-empty=true]:not([data-custom-placeholder=true]) [data-rich-text-placeholder] {
  opacity: 0;
}

.block-editor-block-list__block[data-type="core/paragraph"].has-text-align-right[style*="writing-mode: vertical-rl"],
.block-editor-block-list__block[data-type="core/paragraph"].has-text-align-left[style*="writing-mode: vertical-lr"] {
  rotate: 180deg;
}

.is-zoomed-out .block-editor-block-list__block[data-empty=true] [data-rich-text-placeholder] {
  opacity: 0;
}

html[dir=rtl] .has-drop-cap:not(:focus)::first-letter {
  float: initial;
  margin-left: 0.1em;
}

.wp-block-post-author__transform {
  background: #f0f0f0;
  border-radius: 2px;
  margin: 16px;
  padding: 16px;
}

.wp-block-playlist__waveform-color-controls {
  display: grid;
  grid-column: 1/-1;
  row-gap: 0;
}

.wp-block-post-excerpt .wp-block-post-excerpt__excerpt.is-inline {
  display: inline;
}

.wp-block-pullquote.is-style-solid-color blockquote p {
  font-size: 32px;
}
.wp-block-pullquote.is-style-solid-color .wp-block-pullquote__citation {
  text-transform: none;
  font-style: normal;
}

.wp-block-pullquote__citation {
  color: inherit;
}

.wp-block-pullquote[style*=line-height] :where(p) {
  line-height: inherit;
}

.wp-block-rss li a > div {
  display: inline;
}

.wp-block-rss__placeholder-form .wp-block-rss__placeholder-input {
  flex: 1 1 auto;
}

.wp-block-rss .wp-block-rss {
  all: inherit;
  margin: 0;
  padding: 0;
}

.wp-block[data-align=center] .wp-block-search .wp-block-search__inside-wrapper {
  margin: auto;
}

.wp-block-search :where(.wp-block-search__button) {
  height: auto;
  border-radius: initial;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

:where(.wp-block-search__inside-wrapper) {
  min-width: 220px;
}

.wp-block-search__inspector-controls .components-base-control {
  margin-bottom: 0;
}

.block-editor-block-list__block[data-type="core/separator"] {
  padding-top: 0.1px;
  padding-bottom: 0.1px;
}

.blocks-shortcode__textarea {
  box-sizing: border-box;
  max-height: 250px;
  resize: none;
  font-family: Menlo, Consolas, monaco, monospace !important;
  color: #1e1e1e !important;
  background: #fff !important;
  padding: 12px !important;
  border: 1px solid #1e1e1e !important;
  box-shadow: none !important;
  border-radius: 2px !important;
  font-size: 16px !important;
}
@media (min-width: 600px) {
  .blocks-shortcode__textarea {
    font-size: 13px !important;
  }
}
.blocks-shortcode__textarea:focus {
  border-color: var(--wp-admin-theme-color) !important;
  box-shadow: 0 0 0 1px var(--wp-admin-theme-color) !important;
  outline: 2px solid transparent !important;
}

.wp-block[data-align=center] > .wp-block-site-logo,
.wp-block-site-logo.aligncenter > div {
  display: table;
  margin-left: auto;
  margin-right: auto;
}

.wp-block-site-logo a {
  pointer-events: none;
}
.wp-block-site-logo .custom-logo-link {
  cursor: inherit;
}
.wp-block-site-logo .custom-logo-link:focus {
  box-shadow: none;
}
.wp-block-site-logo img {
  display: block;
  height: auto;
  max-width: 100%;
}
.wp-block-site-logo.is-transient {
  position: relative;
}
.wp-block-site-logo.is-transient img {
  opacity: 0.3;
}
.wp-block-site-logo.is-transient .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
}

.wp-block-site-logo.wp-block-site-logo.is-default-size .components-placeholder {
  height: 60px;
  width: 60px;
}
.wp-block-site-logo.wp-block-site-logo > div,
.wp-block-site-logo.wp-block-site-logo .components-resizable-box__container {
  border-radius: inherit;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border-radius: inherit;
  min-height: 48px;
  min-width: 48px;
  height: 100%;
  width: 100%;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-form-file-upload {
  display: none;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-drop-zone__content-text {
  display: none;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-button.components-button {
  padding: 0;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  background: var(--wp-admin-theme-color);
  border-color: var(--wp-admin-theme-color);
  border-style: solid;
  color: #fff;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-button.components-button > svg {
  color: inherit;
}

.block-library-site-logo__inspector-media-replace-container {
  position: relative;
}
.block-library-site-logo__inspector-media-replace-container .block-library-site-logo__inspector-media-replace-title {
  word-break: break-all;
  white-space: normal;
  text-align: start;
  text-align-last: center;
}
.block-library-site-logo__inspector-media-replace-container img {
  width: 20px;
  min-width: 20px;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
.block-library-site-logo__inspector-media-replace-container .block-library-site-logo__inspector-readonly-logo-preview {
  padding: 6px 12px;
  display: flex;
  height: 40px;
}

.wp-block-site-tagline__placeholder {
  padding: 1em 0;
  border: 1px dashed;
}

.wp-block-site-title__placeholder {
  padding: 1em 0;
  border: 1px dashed;
}

.wp-block-social-links .wp-social-link {
  line-height: 0;
}

.wp-block-social-link-anchor {
  align-items: center;
  background: none;
  border: 0;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  font-size: inherit;
  color: currentColor;
  height: auto;
  font-weight: inherit;
  font-family: inherit;
  margin: 0;
  opacity: 1;
  padding: 0.25em;
}
.wp-block-social-link-anchor:hover {
  transform: none;
}

:root :where(.wp-block-social-links.is-style-pill-shape .wp-social-link button) {
  padding-left: 0.6666666667em;
  padding-right: 0.6666666667em;
}

:root :where(.wp-block-social-links.is-style-logos-only .wp-social-link button) {
  padding: 0;
}

.wp-block-social-link__toolbar_content_text {
  width: 250px;
}

.wp-block-social-links div.block-editor-url-input {
  display: inline-block;
  margin-left: 8px;
}

.wp-social-link:hover {
  transform: none;
}

:root :where(.wp-block-social-links) {
  padding: 0;
}

.wp-block[data-align=center] > .wp-block-social-links,
.wp-block.wp-block-social-links.aligncenter {
  justify-content: center;
}

.block-editor-block-preview__content .components-button:disabled {
  opacity: 1;
}

.wp-social-link.wp-social-link__is-incomplete {
  opacity: 0.5;
}

.wp-block-social-links .is-selected .wp-social-link__is-incomplete,
.wp-social-link.wp-social-link__is-incomplete:hover,
.wp-social-link.wp-social-link__is-incomplete:focus {
  opacity: 1;
}

.wp-block-social-links .block-list-appender {
  position: static;
}
.wp-block-social-links .block-list-appender .block-editor-inserter {
  font-size: inherit;
}
.wp-block-social-links .block-list-appender .block-editor-button-block-appender {
  height: 1.5em;
  width: 1.5em;
  font-size: inherit;
  padding: 0;
}

.block-editor-block-list__block[data-type="core/spacer"]::before {
  content: "";
  display: block;
  position: absolute;
  z-index: 1;
  width: 100%;
  min-height: 8px;
  min-width: 8px;
  height: 100%;
}

.wp-block-spacer.is-hovered .block-library-spacer__resize-container,
.block-library-spacer__resize-container.has-show-handle,
.wp-block-spacer.is-selected.custom-sizes-disabled {
  background: rgba(0, 0, 0, 0.1);
}
.is-dark-theme .wp-block-spacer.is-hovered .block-library-spacer__resize-container,
.is-dark-theme .block-library-spacer__resize-container.has-show-handle,
.is-dark-theme .wp-block-spacer.is-selected.custom-sizes-disabled {
  background: rgba(255, 255, 255, 0.15);
}

.block-library-spacer__resize-container {
  clear: both;
}
.block-library-spacer__resize-container:not(.is-resizing) {
  height: 100% !important;
  width: 100% !important;
}
.block-library-spacer__resize-container .components-resizable-box__handle::before {
  content: none;
}
.block-library-spacer__resize-container.resize-horizontal {
  margin-bottom: 0;
  height: 100% !important;
}

@media (min-width: 600px) {
  .wp-block-tab-list__mover-button {
    width: 24px;
    min-width: 0 !important;
  }
}

.wp-block[data-align=left] > .wp-block-table, .wp-block[data-align=right] > .wp-block-table, .wp-block[data-align=center] > .wp-block-table {
  height: auto;
}
.wp-block[data-align=left] > .wp-block-table table, .wp-block[data-align=right] > .wp-block-table table, .wp-block[data-align=center] > .wp-block-table table {
  width: auto;
}
.wp-block[data-align=left] > .wp-block-table td,
.wp-block[data-align=left] > .wp-block-table th, .wp-block[data-align=right] > .wp-block-table td,
.wp-block[data-align=right] > .wp-block-table th, .wp-block[data-align=center] > .wp-block-table td,
.wp-block[data-align=center] > .wp-block-table th {
  word-break: normal;
  overflow-wrap: anywhere;
}
.wp-block[data-align=center] > .wp-block-table {
  text-align: initial;
}
.wp-block[data-align=center] > .wp-block-table table {
  margin: 0 auto;
}
.wp-block-table td,
.wp-block-table th {
  border: 1px solid;
  padding: 0.5em;
}
.wp-block-table td [contenteditable=true],
.wp-block-table th [contenteditable=true] {
  overflow-wrap: inherit;
}
.wp-block-table td.is-selected,
.wp-block-table th.is-selected {
  border-color: var(--wp-admin-theme-color);
  box-shadow: inset 0 0 0 1px var(--wp-admin-theme-color);
  border-style: double;
}
.wp-block-table table.has-individual-borders > *,
.wp-block-table table.has-individual-borders tr,
.wp-block-table table.has-individual-borders th,
.wp-block-table table.has-individual-borders td {
  border-width: 1px;
  border-style: solid;
  border-color: currentColor;
}

.blocks-table__placeholder-form.blocks-table__placeholder-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
@media (min-width: 782px) {
  .blocks-table__placeholder-form.blocks-table__placeholder-form {
    flex-direction: row;
    align-items: flex-end;
  }
}

.blocks-table__placeholder-input {
  width: 112px;
}

.block-editor-template-part__selection-modal {
  z-index: 1000001;
}
.block-editor-template-part__selection-modal .block-editor-block-patterns-list {
  column-count: 2;
  column-gap: 24px;
}
@media (min-width: 1280px) {
  .block-editor-template-part__selection-modal .block-editor-block-patterns-list {
    column-count: 3;
  }
}
.block-editor-template-part__selection-modal .block-editor-block-patterns-list .block-editor-block-patterns-list__list-item {
  break-inside: avoid-column;
}

.block-library-template-part__selection-search {
  background: #fff;
  position: sticky;
  top: 0;
  padding: 16px 0;
  z-index: 2;
}

.block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-highlighted::after, .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-selected::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.is-highlighted::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.is-selected::after {
  outline-color: var(--wp-block-synced-color);
}
.block-editor-block-list__block:not(.remove-outline).wp-block-template-part.block-editor-block-list__block:not([contenteditable]):focus::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.block-editor-block-list__block:not([contenteditable]):focus::after {
  outline-color: var(--wp-block-synced-color);
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.has-editable-outline::after {
  border: none;
}

.wp-block-term-template .term-loading .term-loading-placeholder {
  width: 100%;
  height: 1.5em;
  margin-bottom: 0.25em;
  background-color: #f0f0f0;
  border-radius: 2px;
}
@media not (prefers-reduced-motion) {
  .wp-block-term-template .term-loading .term-loading-placeholder {
    animation: loadingpulse 1.5s ease-in-out infinite;
  }
}

@keyframes loadingpulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.wp-block-text-columns .block-editor-rich-text__editable:focus {
  outline: 1px solid #ddd;
}

.wp-block[data-align=center] > .wp-block-video {
  text-align: center;
}

.wp-block-video {
  position: relative;
}
.wp-block-video.is-transient video {
  opacity: 0.3;
}
.wp-block-video .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -9px;
  margin-left: -9px;
}

.block-library-video-tracks-editor {
  z-index: 159990;
}

.modal-open .block-library-video-tracks-editor {
  z-index: 99999;
}

.block-library-video-tracks-editor__track-list-track {
  padding-left: 12px;
}

.block-library-video-tracks-editor__single-track-editor-kind-select {
  max-width: 240px;
}

.block-library-video-tracks-editor__tracks-informative-message-title,
.block-library-video-tracks-editor__single-track-editor-edit-track-label {
  margin-top: 4px;
  color: #757575;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  display: block;
}

.block-library-video-tracks-editor > .components-popover__content {
  width: 360px;
}

.block-library-video-tracks-editor__track-list .components-menu-group__label,
.block-library-video-tracks-editor__add-tracks-container .components-menu-group__label {
  padding: 0;
}

.block-library-video-tracks-editor__tracks-informative-message {
  padding: 8px;
}
.block-library-video-tracks-editor__tracks-informative-message-description {
  margin-bottom: 0;
}

.block-library-query-pattern__selection-modal .block-editor-block-patterns-list {
  column-count: 2;
  column-gap: 24px;
}
@media (min-width: 1280px) {
  .block-library-query-pattern__selection-modal .block-editor-block-patterns-list {
    column-count: 3;
  }
}
.block-library-query-pattern__selection-modal .block-editor-block-patterns-list .block-editor-block-patterns-list__list-item {
  break-inside: avoid-column;
}
.block-library-query-pattern__selection-modal .block-library-query-pattern__selection-search {
  background: #fff;
  position: sticky;
  top: 0;
  padding: 16px 0;
  transform: translateY(-4px);
  margin-bottom: -4px;
  z-index: 2;
}

.block-editor-block-settings-menu__popover.is-expanded {
  overflow-y: scroll;
}
.block-editor-block-settings-menu__popover .block-library-query-pattern__selection-content {
  height: 100%;
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 600px) {
  .block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
    grid-template-columns: 1fr 1fr;
  }
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
  gap: 12px;
  min-width: 280px;
}
@media (min-width: 600px) {
  .block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
    min-width: 480px;
  }
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list__list-item {
  margin-bottom: 0;
}

.wp-block-query > .block-editor-media-placeholder.is-small {
  min-height: 60px;
}

.block-library-query-inspector__taxonomy-control-path {
  margin-inline-start: var(--wpds-dimension-gap-xs, 4px);
  font-size: var(--wpds-typography-font-size-sm, 12px);
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
}

.block-library-query-inspector__taxonomy-control-limited-count {
  padding-block: var(--wpds-dimension-padding-xs, 4px);
}

.wp-block[data-align=center] > .wp-block-query-pagination {
  justify-content: center;
}

:where(.editor-styles-wrapper) .wp-block-query-pagination {
  max-width: 100%;
}

.wp-block-query-pagination-numbers a {
  text-decoration: underline;
}
.wp-block-query-pagination-numbers .page-numbers {
  margin-right: 2px;
}
.wp-block-query-pagination-numbers .page-numbers:last-child {
  /*rtl:ignore*/
  margin-right: 0;
}

.wp-block-post-featured-image .block-editor-media-placeholder {
  z-index: 1;
  backdrop-filter: none;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder,
.wp-block-post-featured-image .components-placeholder {
  justify-content: center;
  align-items: center;
  padding: 0;
  display: flex;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-form-file-upload,
.wp-block-post-featured-image .components-placeholder .components-form-file-upload {
  display: none;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-button,
.wp-block-post-featured-image .components-placeholder .components-button {
  margin: auto;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  background: var(--wp-admin-theme-color);
  border-color: var(--wp-admin-theme-color);
  border-style: solid;
  color: #fff;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-button > svg,
.wp-block-post-featured-image .components-placeholder .components-button > svg {
  color: inherit;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder,
.wp-block-post-featured-image .components-placeholder {
  min-height: 200px;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where(.has-border-color),
.wp-block-post-featured-image .components-placeholder:where(.has-border-color),
.wp-block-post-featured-image img:where(.has-border-color) {
  border-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-top-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-top-color]),
.wp-block-post-featured-image img:where([style*=border-top-color]) {
  border-top-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-right-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-right-color]),
.wp-block-post-featured-image img:where([style*=border-right-color]) {
  border-right-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-bottom-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-bottom-color]),
.wp-block-post-featured-image img:where([style*=border-bottom-color]) {
  border-bottom-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-left-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-left-color]),
.wp-block-post-featured-image img:where([style*=border-left-color]) {
  border-left-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-width]),
.wp-block-post-featured-image img:where([style*=border-width]) {
  border-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-top-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-top-width]),
.wp-block-post-featured-image img:where([style*=border-top-width]) {
  border-top-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-right-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-right-width]),
.wp-block-post-featured-image img:where([style*=border-right-width]) {
  border-right-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-bottom-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-bottom-width]),
.wp-block-post-featured-image img:where([style*=border-bottom-width]) {
  border-bottom-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-left-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-left-width]),
.wp-block-post-featured-image img:where([style*=border-left-width]) {
  border-left-style: solid;
}
.wp-block-post-featured-image[style*=height] .components-placeholder {
  min-height: 48px;
  min-width: 48px;
  height: 100%;
  width: 100%;
}
.wp-block-post-featured-image > a {
  pointer-events: none;
}
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-button,
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-placeholder__instructions,
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-placeholder__label {
  opacity: 1;
  pointer-events: auto;
}
.wp-block-post-featured-image.is-transient {
  position: relative;
}
.wp-block-post-featured-image.is-transient img {
  opacity: 0.3;
}
.wp-block-post-featured-image.is-transient .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

div[data-type="core/post-featured-image"] img {
  max-width: 100%;
  height: auto;
  display: block;
}

.wp-block-post-comments-form * {
  pointer-events: none;
}
.wp-block-post-comments-form *.block-editor-warning * {
  pointer-events: auto;
}

/**
 * Element styles for the editor
 */
.wp-element-button {
  cursor: revert;
}
.wp-element-button[role=textbox] {
  cursor: text;
}

.block-library-poster-image__container {
  position: relative;
}
.block-library-poster-image__container:hover .block-library-poster-image__actions, .block-library-poster-image__container:focus .block-library-poster-image__actions, .block-library-poster-image__container:focus-within .block-library-poster-image__actions {
  opacity: 1;
}
.block-library-poster-image__container .block-library-poster-image__actions.block-library-poster-image__actions-select {
  opacity: 1;
  margin-top: 16px;
}
.block-library-poster-image__container .components-drop-zone__content {
  border-radius: 2px;
}
.block-library-poster-image__container .components-drop-zone .components-drop-zone__content-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}
.block-library-poster-image__container .components-drop-zone .components-drop-zone__content-inner .components-drop-zone__content-icon {
  margin: 0;
}
.block-library-poster-image__container .components-spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-top: -9px;
  margin-left: -9px;
}

.block-library-poster-image__preview {
  width: 100%;
  padding: 0;
  overflow: hidden;
  outline-offset: -1px;
  min-height: 40px;
  display: flex;
  justify-content: center;
  height: auto !important;
  outline: 1px solid rgba(0, 0, 0, 0.1);
}
.block-library-poster-image__preview .block-library-poster-image__preview-image {
  object-fit: cover;
  width: 100%;
  object-position: 50% 50%;
  aspect-ratio: 2/1;
}

.block-library-poster-image__actions:not(.block-library-poster-image__actions-select) {
  bottom: 0;
  opacity: 0;
  padding: 8px;
  position: absolute;
}
@media not (prefers-reduced-motion) {
  .block-library-poster-image__actions:not(.block-library-poster-image__actions-select) {
    transition: opacity 50ms ease-out;
  }
}
.block-library-poster-image__actions:not(.block-library-poster-image__actions-select) .block-library-poster-image__action {
  backdrop-filter: blur(16px) saturate(180%);
  background: rgba(255, 255, 255, 0.75);
}
.block-library-poster-image__actions .block-library-poster-image__action {
  flex-grow: 1;
  justify-content: center;
}

:root .editor-styles-wrapper .has-very-light-gray-background-color {
  background-color: #eee;
}
:root .editor-styles-wrapper .has-very-dark-gray-background-color {
  background-color: #313131;
}
:root .editor-styles-wrapper .has-very-light-gray-color {
  color: #eee;
}
:root .editor-styles-wrapper .has-very-dark-gray-color {
  color: #313131;
}
:root .editor-styles-wrapper {
  /* stylelint-disable @stylistic/function-comma-space-after -- We can not use spacing because of WP multi site kses rule. */
}
:root .editor-styles-wrapper .has-vivid-green-cyan-to-vivid-cyan-blue-gradient-background {
  background: linear-gradient(135deg, rgb(0, 208, 132) 0%, rgb(6, 147, 227) 100%);
}
:root .editor-styles-wrapper .has-purple-crush-gradient-background {
  background: linear-gradient(135deg, rgb(52, 226, 228) 0%, rgb(71, 33, 251) 50%, rgb(171, 29, 254) 100%);
}
:root .editor-styles-wrapper .has-hazy-dawn-gradient-background {
  background: linear-gradient(135deg, rgb(250, 172, 168) 0%, rgb(218, 208, 236) 100%);
}
:root .editor-styles-wrapper .has-subdued-olive-gradient-background {
  background: linear-gradient(135deg, rgb(250, 250, 225) 0%, rgb(103, 166, 113) 100%);
}
:root .editor-styles-wrapper .has-atomic-cream-gradient-background {
  background: linear-gradient(135deg, rgb(253, 215, 154) 0%, rgb(0, 74, 89) 100%);
}
:root .editor-styles-wrapper .has-nightshade-gradient-background {
  background: linear-gradient(135deg, rgb(51, 9, 104) 0%, rgb(49, 205, 207) 100%);
}
:root .editor-styles-wrapper .has-midnight-gradient-background {
  background: linear-gradient(135deg, rgb(2, 3, 129) 0%, rgb(40, 116, 252) 100%);
}
:root .editor-styles-wrapper {
  /* stylelint-enable @stylistic/function-comma-space-after */
}

:where(.editor-styles-wrapper) .has-regular-font-size {
  font-size: 16px;
}

:where(.editor-styles-wrapper) .has-larger-font-size {
  font-size: 42px;
}

/**
 * Editor Normalization Styles
 *
 * These are only output in the editor, but styles here are NOT prefixed .editor-styles-wrapper.
 * This allows us to create normalization styles that are easily overridden by editor styles.
 */
:where(.editor-styles-wrapper) iframe:not([frameborder]) {
  border: 0;
}`})))()}var nr;function init_editor_rtl(){return(init_editor_rtl=e((()=>{nr=`/**
 * Typography
 */
/**
 * SCSS Variables.
 *
 * Please use variables from this sheet to ensure consistency across the UI.
 * Don't add to this sheet unless you're pretty sure the value will be reused in many places.
 * For example, don't add rules to this sheet that affect block visuals. It's purely for UI.
 */
/**
 * Colors
 */
/**
 * Fonts & basic variables.
 */
/**
 * Typography
 */
/**
 * Grid System.
 * https://make.wordpress.org/design/2019/10/31/proposal-a-consistent-spacing-system-for-wordpress/
 */
/**
 * Radius scale.
 */
/**
 * Elevation scale.
 */
/**
 * Dimensions.
 */
/**
 * Mobile specific styles
 */
/**
 * Editor styles.
 */
/**
 * Block & Editor UI.
 */
/**
 * Block paddings.
 */
/**
 * React Native specific.
 * These variables do not appear to be used anywhere else.
 */
/**
 * Breakpoints & Media Queries
 */
/**
*  Converts a hex value into the rgb equivalent.
*
* @param {string} hex - the hexadecimal value to convert
* @return {string} comma separated rgb values
*/
/**
 * Long content fade mixin
 *
 * Creates a fading overlay to signify that the content is longer
 * than the space allows.
 */
/**
 * Breakpoint mixins
 */
/**
 * Focus styles.
 */
/**
 * Standard focus rings for the WordPress Design System.
 *
 * Apply \`outset-ring__focus\` inside the relevant pseudo-class at the call site,
 * e.g. \`&:focus { @include outset-ring__focus(); }\`.
 */
/**
 * Applies editor left position to the selector passed as argument
 */
/**
 * Styles that are reused verbatim in a few places
 */
/**
 * Allows users to opt-out of animations via OS-level preferences.
 */
/**
 * Reset default styles for JavaScript UI based pages.
 * This is a WP-admin agnostic reset
 */
/**
 * Reset the WP Admin page styles for Gutenberg-like pages.
 */
/**
 * Creates a checkerboard pattern background to indicate transparency.
 * @param {String} $size - The size of the squares in the checkerboard pattern. Default is 12px.
 */
.block-library-utils__media-control {
  position: relative;
}
.block-library-utils__media-control .components-drop-zone__content-icon {
  display: none;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow {
  display: block;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow button.components-button {
  color: #1e1e1e;
  border-color: #ccc;
  width: 100%;
  display: block;
  height: 40px;
  padding-left: 32px;
}
.block-library-utils__media-control .block-library-utils__media-control__replace-flow button.components-button:hover {
  color: var(--wp-admin-theme-color);
}

.block-library-utils__media-control__inspector-media-replace-title {
  word-break: break-all;
  white-space: normal;
  text-align: start;
}

.block-library-utils__media-control__inspector-image-indicator {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  background: #fff linear-gradient(45deg, transparent 48%, #ddd 48%, #ddd 52%, transparent 52%);
  background-size: cover;
  outline: 1px solid transparent;
}

.block-library-utils__media-control__reset {
  position: absolute;
  left: 0;
  top: 8px;
  margin: auto 8px auto;
  opacity: 0;
  border-radius: 2px;
}
@media not (prefers-reduced-motion) {
  .block-library-utils__media-control__reset {
    transition: opacity 0.1s ease-in-out;
  }
}
.block-library-utils__media-control:hover .block-library-utils__media-control__reset, .block-library-utils__media-control__reset:focus, .block-library-utils__media-control__reset:hover {
  opacity: 1;
}
@media (hover: none) {
  .block-library-utils__media-control__reset {
    opacity: 1;
  }
}

.wp-block-audio {
  margin-right: 0;
  margin-left: 0;
  position: relative;
}
.wp-block-audio.is-transient audio {
  opacity: 0.3;
}
.wp-block-audio .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -9px;
  margin-right: -9px;
}

.wp-block-avatar__image img {
  width: 100%;
}

.wp-block-avatar.aligncenter .components-resizable-box__container {
  margin: 0 auto;
}

.wp-block-avatar__help-text {
  grid-column: 1/-1;
}

.wp-block[data-align=center] > .wp-block-button {
  text-align: center;
  margin-right: auto;
  margin-left: auto;
}

.wp-block[data-align=right] > .wp-block-button {
  text-align: right;
}

.wp-block-button {
  position: relative;
  cursor: text;
}
.wp-block-button[data-rich-text-placeholder]::after {
  opacity: 0.8;
}

div[data-type="core/button"] {
  display: table;
}

.wp-block-buttons > .wp-block {
  margin: 0;
}
.wp-block-buttons > .wp-block-button.wp-block-button.wp-block-button.wp-block-button.wp-block-button {
  margin: 0;
}
.wp-block-buttons > .block-list-appender {
  display: inline-flex;
  align-items: center;
}
.wp-block-buttons.is-vertical > .block-list-appender .block-list-appender__toggle {
  justify-content: flex-start;
}
.wp-block-buttons > .wp-block-button:focus {
  box-shadow: none;
}
.wp-block-buttons {
  /* stylelint-disable @stylistic/indentation -- Disable the stylelint rule, otherwise this selector is ugly! */
}
.wp-block-buttons:not(.is-content-justification-space-between,
.is-content-justification-right,
.is-content-justification-left,
.is-content-justification-center) .wp-block[data-align=center] {
  /* stylelint-enable @stylistic/indentation */
  margin-right: auto;
  margin-left: auto;
  margin-top: 0;
  width: 100%;
}
.wp-block-buttons:not(.is-content-justification-space-between,
.is-content-justification-right,
.is-content-justification-left,
.is-content-justification-center) .wp-block[data-align=center] .wp-block-button {
  margin-bottom: 0;
}

.wp-block[data-align=center] > .wp-block-buttons {
  align-items: center;
  justify-content: center;
}

.wp-block[data-align=right] > .wp-block-buttons {
  justify-content: flex-end;
}

.wp-block-categories ul {
  padding-right: 2.5em;
}
.wp-block-categories ul ul {
  margin-top: 6px;
}

/* Center alignment for classic themes. */
[data-align=center] .wp-block-categories {
  text-align: center;
}

.wp-block-categories__indentation {
  padding-right: 16px;
}

.wp-block-code code {
  background: none;
}

.wp-block-columns :where(.wp-block) {
  max-width: none;
  margin-right: 0;
  margin-left: 0;
}

html :where(.wp-block-column) {
  margin-top: 0;
  margin-bottom: 0;
}

/* Styles for backwards compatibility with the legacy \`post-comments\` block */
.wp-block-post-comments, .wp-block-comments__legacy-placeholder {
  box-sizing: border-box;
  /* utility classes */
}
.wp-block-post-comments .alignleft, .wp-block-comments__legacy-placeholder .alignleft {
  float: right;
}
.wp-block-post-comments .alignright, .wp-block-comments__legacy-placeholder .alignright {
  float: left;
}
.wp-block-post-comments, .wp-block-comments__legacy-placeholder {
  /* end utility classes */
}
.wp-block-post-comments .navigation::after, .wp-block-comments__legacy-placeholder .navigation::after {
  content: "";
  display: table;
  clear: both;
}
.wp-block-post-comments .commentlist, .wp-block-comments__legacy-placeholder .commentlist {
  clear: both;
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .commentlist .comment, .wp-block-comments__legacy-placeholder .commentlist .comment {
  min-height: 2.25em;
  padding-right: 3.25em;
}
.wp-block-post-comments .commentlist .comment p, .wp-block-comments__legacy-placeholder .commentlist .comment p {
  font-size: 1em;
  line-height: 1.8;
  margin: 1em 0;
}
.wp-block-post-comments .commentlist .children, .wp-block-comments__legacy-placeholder .commentlist .children {
  list-style: none;
  margin: 0;
  padding: 0;
}
.wp-block-post-comments .comment-author, .wp-block-comments__legacy-placeholder .comment-author {
  line-height: 1.5;
}
.wp-block-post-comments .comment-author .avatar, .wp-block-comments__legacy-placeholder .comment-author .avatar {
  border-radius: 1.5em;
  display: block;
  float: right;
  height: 2.5em;
  margin-top: 0.5em;
  margin-left: 0.75em;
  width: 2.5em;
}
.wp-block-post-comments .comment-author cite, .wp-block-comments__legacy-placeholder .comment-author cite {
  font-style: normal;
}
.wp-block-post-comments .comment-meta, .wp-block-comments__legacy-placeholder .comment-meta {
  font-size: 0.875em;
  line-height: 1.5;
}
.wp-block-post-comments .comment-meta b, .wp-block-comments__legacy-placeholder .comment-meta b {
  font-weight: 400;
}
.wp-block-post-comments .comment-meta .comment-awaiting-moderation, .wp-block-comments__legacy-placeholder .comment-meta .comment-awaiting-moderation {
  margin-top: 1em;
  margin-bottom: 1em;
  display: block;
}
.wp-block-post-comments .comment-body .commentmetadata, .wp-block-comments__legacy-placeholder .comment-body .commentmetadata {
  font-size: 0.875em;
}
.wp-block-post-comments .comment-form textarea, .wp-block-comments__legacy-placeholder .comment-form textarea,
.wp-block-post-comments .comment-form input:not([type=submit]):not([type=checkbox]),
.wp-block-comments__legacy-placeholder .comment-form input:not([type=submit]):not([type=checkbox]) {
  display: block;
  box-sizing: border-box;
  width: 100%;
}
.wp-block-post-comments .comment-form-cookies-consent, .wp-block-comments__legacy-placeholder .comment-form-cookies-consent {
  display: flex;
  gap: 0.25em;
}
.wp-block-post-comments .comment-form-cookies-consent #wp-comment-cookies-consent, .wp-block-comments__legacy-placeholder .comment-form-cookies-consent #wp-comment-cookies-consent {
  margin-top: 0.35em;
}
.wp-block-post-comments .comment-reply-title, .wp-block-comments__legacy-placeholder .comment-reply-title {
  margin-bottom: 0;
}
.wp-block-post-comments .comment-reply-title :where(small), .wp-block-comments__legacy-placeholder .comment-reply-title :where(small) {
  font-size: var(--wp--preset--font-size--medium, smaller);
  margin-right: 0.5em;
}
.wp-block-post-comments .reply, .wp-block-comments__legacy-placeholder .reply {
  font-size: 0.875em;
  margin-bottom: 1.4em;
}
.wp-block-post-comments textarea, .wp-block-comments__legacy-placeholder textarea,
.wp-block-post-comments input:not([type=submit]),
.wp-block-comments__legacy-placeholder input:not([type=submit]) {
  border: 1px solid #949494;
  font-size: 1em;
  font-family: inherit;
}
.wp-block-post-comments textarea, .wp-block-comments__legacy-placeholder textarea,
.wp-block-post-comments input:not([type=submit]):not([type=checkbox]),
.wp-block-comments__legacy-placeholder input:not([type=submit]):not([type=checkbox]) {
  padding: calc(0.667em + 2px);
}

:where(.wp-block-post-comments .comment-form-comment label, .wp-block-comments__legacy-placeholder .comment-form-comment label),
:where(.wp-block-post-comments .comment-form-author label, .wp-block-comments__legacy-placeholder .comment-form-author label),
:where(.wp-block-post-comments .comment-form-email label, .wp-block-comments__legacy-placeholder .comment-form-email label),
:where(.wp-block-post-comments .comment-form-url label, .wp-block-comments__legacy-placeholder .comment-form-url label) {
  display: block;
  margin-bottom: 0.25em;
}

:where(.wp-block-post-comments input[type=submit], .wp-block-comments__legacy-placeholder input[type=submit]) {
  border: none;
}

.wp-block-comments {
  box-sizing: border-box;
}

.block-library-comments-toolbar__popover .components-popover__content {
  min-width: 230px;
}

.wp-block-comments__legacy-placeholder * {
  pointer-events: none;
}

.wp-block-comment-author-avatar__placeholder {
  border: currentColor 1px dashed;
  width: 100%;
  height: 100%;
  stroke: currentColor;
  stroke-dasharray: 3;
}

.wp-block[data-align=center] > .wp-block-comments-pagination {
  justify-content: center;
}

:where(.editor-styles-wrapper) .wp-block-comments-pagination {
  max-width: 100%;
}

.wp-block-comments-pagination > .wp-block-comments-pagination-next,
.wp-block-comments-pagination > .wp-block-comments-pagination-previous,
.wp-block-comments-pagination > .wp-block-comments-pagination-numbers {
  font-size: inherit;
}

.wp-block-comments-pagination-numbers a {
  text-decoration: underline;
}
.wp-block-comments-pagination-numbers .page-numbers {
  margin-left: 2px;
}
.wp-block-comments-pagination-numbers .page-numbers:last-child {
  margin-right: 0;
}

.wp-block-comments-title.has-background {
  padding: inherit;
}

.wp-block-cover.is-placeholder {
  padding: 0 !important;
  display: flex;
  align-items: stretch;
  min-height: 240px;
}
.wp-block-cover.is-placeholder .components-placeholder.is-large {
  justify-content: flex-start;
  z-index: 1;
}
.wp-block-cover.is-placeholder:focus::after {
  min-height: auto;
}
.wp-block-cover.components-placeholder h2 {
  color: inherit;
}
.wp-block-cover.is-transient {
  position: relative;
}
.wp-block-cover.is-transient::before {
  background-color: #fff;
  content: "";
  height: 100%;
  opacity: 0.3;
  position: absolute;
  width: 100%;
  z-index: 1;
}
.wp-block-cover.is-transient .wp-block-cover__inner-container {
  z-index: 2;
}
.wp-block-cover.is-transient .components-spinner {
  z-index: 3;
}
.wp-block-cover .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  margin: 0;
}
.wp-block-cover .wp-block-cover__inner-container {
  text-align: right;
  margin-right: 0;
  margin-left: 0;
}
.wp-block-cover .wp-block-cover__placeholder-background-options {
  width: 100%;
}
.wp-block-cover .wp-block-cover__image--placeholder-image {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

[data-align=left] > .wp-block-cover,
[data-align=right] > .wp-block-cover {
  max-width: 420px;
  width: 100%;
}

.block-library-cover__reset-button {
  margin-right: auto;
}

.block-library-cover__resize-container {
  position: absolute !important;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  min-height: 50px;
}

.components-popover.block-editor-block-popover.block-library-cover__resizable-box-popover .components-popover__content > div,
.components-popover.block-editor-block-popover.block-library-cover__resizable-box-popover .block-library-cover__resize-container {
  pointer-events: none;
  overflow: visible;
}

.block-editor-block-patterns-list__list-item .has-parallax.wp-block-cover {
  background-attachment: scroll;
}

.color-block-support-panel__inner-wrapper > :not(.block-editor-tools-panel-color-gradient-settings__item) {
  margin-top: 24px;
}

.wp-block-details summary div {
  display: inline;
}

.wp-block-embed {
  margin-right: 0;
  margin-left: 0;
  clear: both;
}
.wp-block-embed.is-loading {
  display: flex;
  justify-content: center;
}
.wp-block-embed .wp-block-embed__placeholder-input {
  flex: 1 1 auto;
}
.wp-block-embed .components-placeholder__error {
  word-break: normal;
  overflow-wrap: break-word;
}

.wp-block-post-content .wp-block-embed__learn-more a {
  color: var(--wp-admin-theme-color);
}

.block-library-embed__interactive-overlay {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  opacity: 0;
}

.wp-block[data-align=left] > .wp-block-embed,
.wp-block[data-align=right] > .wp-block-embed {
  max-width: 360px;
  width: 100%;
}
.wp-block[data-align=left] > .wp-block-embed .wp-block-embed__wrapper,
.wp-block[data-align=right] > .wp-block-embed .wp-block-embed__wrapper {
  min-width: 280px;
}

.wp-block[data-align=left] > .wp-block-file, .wp-block[data-align=right] > .wp-block-file {
  height: auto;
}
.wp-block[data-align=center] > .wp-block-file {
  text-align: center;
}
.wp-block-file {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0;
}
.wp-block-file .components-resizable-box__container {
  margin-bottom: 1em;
}
.wp-block-file .wp-block-file__preview {
  margin-bottom: 1em;
  width: 100%;
  height: 100%;
}
.wp-block-file .wp-block-file__preview-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}
.wp-block-file .wp-block-file__content-wrapper {
  flex-grow: 1;
}
.wp-block-file a {
  min-width: 1em;
}
.wp-block-file a:not(.wp-block-file__button) {
  display: inline-block;
}
.wp-block-file .wp-block-file__button-richtext-wrapper {
  display: inline-block;
  margin-right: 0.75em;
}

.block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area iframe {
  height: 50vh !important;
}
@media (min-width: 960px) {
  .block-editor-freeform-modal .block-editor-freeform-modal__content:not(.is-full-screen) {
    height: 9999rem;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .components-modal__header + div {
    height: 100%;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-tinymce {
    height: calc(100% - 36px - 16px);
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-container-body {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-width: 50vw;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .block-editor-freeform-modal .block-editor-freeform-modal__content .mce-edit-area iframe {
    flex-grow: 1;
    height: 10px !important;
  }
}
.block-editor-freeform-modal__actions {
  margin-top: 16px;
}

:root :where(figure.wp-block-gallery.is-layout-flex) {
  display: block;
}
:root :where(figure.wp-block-gallery.is-layout-flex) > .blocks-gallery-caption {
  flex: 0 0 100%;
}

:root :where(.wp-block-gallery.is-layout-grid) > .blocks-gallery-caption,
:root :where(.wp-block-gallery.is-layout-grid) > .components-placeholder,
:root :where(.wp-block-gallery.is-layout-grid) > .block-editor-media-placeholder {
  grid-column: 1/-1;
}

:root :where(figure.wp-block-gallery) .block-editor-media-placeholder.is-appender .components-placeholder__label {
  display: none;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder.is-appender .block-editor-media-placeholder__button {
  margin-bottom: 0;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder {
  margin: 0;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder .components-placeholder__label {
  display: flex;
}
:root :where(figure.wp-block-gallery) .block-editor-media-placeholder figcaption {
  z-index: 2;
}
:root :where(figure.wp-block-gallery) .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -9px;
  margin-right: -9px;
}

/**
 * Gallery inspector controls settings.
 */
.gallery-settings-buttons .components-button:first-child {
  margin-left: 8px;
}

/**
 * Deprecated css past this point. This can be removed once all galleries are migrated
 * to V2.
 */
.blocks-gallery-item figure:not(.is-selected):focus,
.blocks-gallery-item img:focus {
  outline: none;
}
.blocks-gallery-item figure.is-selected::before {
  box-shadow: 0 0 0 1px #fff inset, 0 0 0 3px var(--wp-admin-theme-color) inset;
  content: "";
  outline: 2px solid transparent;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1;
  pointer-events: none;
}
.blocks-gallery-item figure.is-transient img {
  opacity: 0.3;
}
.blocks-gallery-item .block-editor-media-placeholder {
  margin: 0;
  height: 100%;
}
.blocks-gallery-item .block-editor-media-placeholder .components-placeholder__label {
  display: flex;
}

.wp-block-gallery ul.blocks-gallery-grid {
  padding: 0;
  margin: 0;
}

@media (min-width: 600px) {
  .wp-block-update-gallery-modal {
    max-width: 480px;
  }
}

.wp-block-update-gallery-modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.wp-block-gallery__source-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.wp-block-gallery__source-settings .wp-block-gallery__source-description {
  margin: 0;
  color: #757575;
  font-size: 12px;
}
.wp-block-gallery__source-settings .components-button {
  justify-content: center;
  width: 100%;
}

.wp-block-gallery__source-notice {
  margin: 16px 0 0;
}

/**
 * Group: All Alignment Settings
 */
.wp-block-group .block-editor-block-list__insertion-point {
  right: 0;
  left: 0;
}

[data-type="core/group"].is-selected .block-list-appender {
  margin-right: 0;
  margin-left: 0;
}
[data-type="core/group"].is-selected .has-background .block-list-appender {
  margin-top: 18px;
  margin-bottom: 18px;
}

.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child {
  gap: inherit;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-default-block-appender__content,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-inserter {
  display: inherit;
  width: 100%;
  flex-direction: inherit;
  flex: 1;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child::after {
  content: "";
  display: flex;
  flex: 1 0 40px;
  pointer-events: none;
  min-height: 38px;
  border: 1px dashed currentColor;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child {
  pointer-events: none;
}
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-inserter,
.wp-block-group.is-layout-flex.block-editor-block-list__block > .block-list-appender:only-child .block-editor-button-block-appender {
  pointer-events: all;
}

.block-library-html__edit .block-library-html__preview-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  right: 0;
}

.block-library-html__no-output-marker {
  position: absolute;
  top: -4px;
  left: 100%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 4px;
  transform: translateY(-100%);
  border-radius: 2px;
  background: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  outline: 1px solid transparent;
  color: #1e1e1e;
  cursor: default;
}
.block-library-html__edit:hover > .block-library-html__no-output-marker, .block-library-html__edit.is-selected > .block-library-html__no-output-marker {
  background: var(--wp-admin-theme-color);
  box-shadow: none;
  color: #fff;
}
.is-layout-flex > .block-library-html__edit > .block-library-html__no-output-marker {
  top: 50%;
  transform: translateY(-50%);
}
.is-layout-flex:not(.is-vertical) > .block-library-html__edit > .block-library-html__no-output-marker {
  left: auto;
  right: 50%;
  margin: 0;
  transform: translate(50%, -50%);
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-left: 32px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-left: 60px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-left: 88px;
}

.block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output + .block-library-html__edit.has-no-output > .block-library-html__no-output-marker {
  margin-left: 116px;
}

.block-library-html__edit-code {
  margin: 16px;
}
.block-library-html__edit-code .block-library-html__edit-code-button {
  justify-content: center;
}

@media (min-width: 600px) {
  .block-library-html__modal:not(.is-full-screen) {
    height: 9999rem;
  }
}
.block-library-html__modal .components-modal__children-container {
  height: 100%;
}

.block-library-html__modal-tabs {
  flex: 1;
}

.block-library-html__modal-content {
  flex: 1;
}

.block-library-html__modal-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  margin: 0;
  box-sizing: border-box;
  border: 1px solid #e0e0e0;
  border-radius: 2px;
  padding: 16px;
  font-family: Menlo, Consolas, monaco, monospace;
}

.block-library-html__modal-editor {
  width: 100%;
  height: 100%;
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  resize: none;
  direction: ltr;
  overflow-x: auto;
  box-sizing: border-box;
}
.block-library-html__modal-editor:focus {
  outline: none;
  box-shadow: none;
}

.block-library-html__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  overflow-y: auto;
  flex: 1;
}
.block-library-html__preview iframe {
  height: 100%;
}

.wp-block[data-align=center] > .wp-block-icon {
  display: flex;
  justify-content: center;
}

.wp-block-icon__inserter-sidebar {
  padding-bottom: 24px;
}
@media (min-width: 782px) {
  .wp-block-icon__inserter-sidebar {
    overflow-x: visible;
    overflow-y: auto;
    position: absolute;
    top: 72px;
    right: 0;
    bottom: 0;
    width: 280px;
    padding-top: 24px;
    padding-inline: 24px;
  }
}

@media (min-width: 782px) {
  .wp-block-icon__inserter-panel {
    margin-inline-start: 280px;
  }
}

.wp-block-icon__inserter-loading {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.wp-block-icon__inserter-grid-icons-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
}

.wp-block-icon__inserter-grid-no-results {
  display: flex;
  justify-content: center;
}

.wp-block-icon__inserter-grid-icons-list-item {
  display: flex;
  flex-direction: column;
  height: auto !important;
}

.wp-block-icon__inserter-grid-icons-list-item-icon {
  padding: 12px;
}
.wp-block-icon__inserter-grid-icons-list-item-icon svg {
  display: block;
  width: 24px;
  height: 24px;
}

.wp-block-icon__inserter-grid-icons-list-item-title {
  font-size: 12px;
  padding: 4px 4px 8px;
  overflow-wrap: break-word;
}

.wp-block-icon__inserter-modal .wp-block-icon__inserter-grid-group-title {
  position: sticky;
  top: -4px;
  z-index: 1;
  padding: 12px 4px;
  margin: 0;
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
  text-transform: uppercase;
  font-size: var(--wpds-typography-font-size-sm, 12px);
  background-color: #fff;
}

.wp-block-icon__inserter-modal .wp-block-icon__inserter-grid > :first-child > .wp-block-icon__inserter-grid-group-title {
  margin-top: -4px;
}

.wp-block-icon__toolbar-content {
  width: 250px;
}

.wp-block-icon__placeholder {
  backdrop-filter: blur(100px);
}

.wp-block-image.wp-block-image .block-editor-media-placeholder.is-small {
  min-height: 60px;
}

figure.wp-block-image:not(.wp-block) {
  margin: 0;
}

.wp-block-image {
  position: relative;
}
.wp-block-image.is-transient:not(.alignwide):not(.alignfull), .wp-block-image:has(img.is-swapping-media):not(.alignwide):not(.alignfull) {
  width: fit-content;
}
.wp-block-image .is-applying img, .wp-block-image.is-transient img,
.wp-block-image img.is-swapping-media {
  opacity: 0.3;
}
.wp-block-image figcaption img {
  display: inline;
}
.wp-block-image .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  margin: 0;
}
.wp-block-image .components-resizable-box__container {
  pointer-events: none;
}
.wp-block-image .components-resizable-box__handle {
  pointer-events: auto;
}

.wp-block-image__placeholder {
  aspect-ratio: 4/3;
}
.wp-block-image__placeholder.has-illustration::before {
  background: #fff;
  opacity: 0.8;
}
.wp-block-image__placeholder .components-placeholder__illustration {
  opacity: 0.1;
}

.wp-block-image.is-selected .block-editor-media-placeholder {
  filter: none !important;
}

.block-editor-block-list__block[data-type="core/image"] .block-editor-block-toolbar .block-editor-url-input__button-modal {
  position: absolute;
  right: 0;
  left: 0;
  margin: -1px 0;
}
@media (min-width: 600px) {
  .block-editor-block-list__block[data-type="core/image"] .block-editor-block-toolbar .block-editor-url-input__button-modal {
    margin: -1px;
  }
}

[data-align=wide] > .wp-block-image img,
[data-align=full] > .wp-block-image img {
  height: auto;
  width: 100%;
}

.wp-block[data-align=left] > .wp-block-image,
.wp-block[data-align=center] > .wp-block-image,
.wp-block[data-align=right] > .wp-block-image {
  display: table;
}
.wp-block[data-align=left] > .wp-block-image > figcaption,
.wp-block[data-align=center] > .wp-block-image > figcaption,
.wp-block[data-align=right] > .wp-block-image > figcaption {
  display: table-caption;
  caption-side: bottom;
}

.wp-block[data-align=left] > .wp-block-image {
  margin-left: 1em;
  margin-right: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.wp-block[data-align=right] > .wp-block-image {
  margin-right: 1em;
  margin-left: 0;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}

.wp-block[data-align=center] > .wp-block-image {
  margin-right: auto;
  margin-left: auto;
  text-align: center;
}

.wp-block[data-align]:has(> .wp-block-image) {
  position: relative;
}

.wp-block-image__toolbar_content_textarea__container {
  padding: 8px;
}

.wp-block-image__toolbar_content_textarea {
  width: 250px;
}

.wp-block-latest-posts > li {
  overflow: hidden;
}

.wp-block-latest-posts li a > div {
  display: inline;
}

:root :where(.wp-block-latest-posts) {
  padding-right: 2.5em;
}

:root :where(.wp-block-latest-posts.is-grid),
:root :where(.wp-block-latest-posts__list) {
  padding-right: 0;
}

.wp-block-math__textarea-control textarea {
  font-family: Menlo, Consolas, monaco, monospace;
  direction: ltr;
}

.wp-block-math__learn-more {
  display: inline-block;
  margin-top: var(--wpds-dimension-gap-sm, 8px);
}

.wp-block-media-text__media {
  position: relative;
}
.wp-block-media-text__media.is-transient img {
  opacity: 0.3;
}
.wp-block-media-text__media .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -9px;
  margin-right: -9px;
}

.wp-block-media-text .__resizable_base__ {
  grid-column: 1/span 2;
  grid-row: 2;
}

.wp-block-media-text .editor-media-container__resizer {
  width: 100% !important;
}

.wp-block-media-text.is-image-fill .editor-media-container__resizer,
.wp-block-media-text.is-image-fill .components-placeholder.has-illustration,
.wp-block-media-text.is-image-fill-element .editor-media-container__resizer,
.wp-block-media-text.is-image-fill-element .components-placeholder.has-illustration {
  height: 100% !important;
}

.wp-block-media-text > .block-editor-block-list__layout > .block-editor-block-list__block {
  max-width: unset;
}

/* Make the featured image placeholder the same height as the media selection area. */
.wp-block-media-text--placeholder-image {
  min-height: 205px;
}

.block-editor-block-list__block[data-type="core/more"] {
  max-width: 100%;
  text-align: center;
  margin-top: 28px;
  margin-bottom: 28px;
}

.wp-block-more {
  display: block;
  text-align: center;
  white-space: nowrap;
}
.wp-block-more .rich-text {
  position: relative;
  font-size: 13px;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #757575;
  display: inline-flex;
  white-space: nowrap;
  text-align: center;
  background: #fff;
  padding: 10px 36px;
}
.wp-block-more::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  border-top: 3px dashed #ccc;
}

/**
 * Editor only CSS.
 */
.editor-styles-wrapper .wp-block-navigation ul {
  margin-top: 0;
  margin-bottom: 0;
  margin-right: 0;
  padding-right: 0;
}
.editor-styles-wrapper .wp-block-navigation .wp-block-navigation-item.wp-block {
  margin: revert;
}

.wp-block-navigation-item__label {
  display: inline;
}

/**
 * Submenus.
 */
.wp-block-navigation__container,
.wp-block-navigation-item {
  background-color: inherit;
}

.wp-block-navigation:not(.is-selected):not(.has-child-selected) .has-child:hover > .wp-block-navigation__submenu-container {
  opacity: 0;
  visibility: hidden;
}

.has-child.is-selected > .wp-block-navigation__submenu-container, .has-child.has-child-selected > .wp-block-navigation__submenu-container {
  display: flex;
  opacity: 1;
  visibility: visible;
}

.is-dragging-components-draggable .has-child.is-dragging-within > .wp-block-navigation__submenu-container {
  opacity: 1;
  visibility: visible;
}

.wp-block-navigation__container.block-editor-block-list__layout {
  flex-grow: 1;
}

.is-editing > .wp-block-navigation__container {
  visibility: visible;
  opacity: 1;
  display: flex;
  flex-direction: column;
}

.is-dragging-components-draggable .wp-block-navigation-link > .wp-block-navigation__container {
  opacity: 1;
  visibility: hidden;
}
.is-dragging-components-draggable .wp-block-navigation-link > .wp-block-navigation__container .block-editor-block-draggable-chip-wrapper {
  visibility: visible;
}

.is-editing > .wp-block-navigation__submenu-container > .block-list-appender {
  display: block;
  position: static;
  width: 100%;
}
.is-editing > .wp-block-navigation__submenu-container > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon {
  display: flex;
  margin-left: 0;
  margin-right: auto;
  border: 1px solid currentColor;
  background-color: transparent;
  color: #1e1e1e;
}

.wp-block-navigation__submenu-container .block-list-appender {
  display: none;
}

/**
 * Colors Selector component
 */
.block-library-colors-selector {
  width: auto;
}
.block-library-colors-selector .block-library-colors-selector__toggle {
  display: block;
  margin: 0 auto;
  padding: 3px;
  width: auto;
}
.block-library-colors-selector .block-library-colors-selector__icon-container {
  height: 30px;
  position: relative;
  margin: 0 auto;
  padding: 3px;
  display: flex;
  align-items: center;
  border-radius: 4px;
}
.block-library-colors-selector .block-library-colors-selector__state-selection {
  margin-right: auto;
  margin-left: auto;
  border-radius: 11px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  width: 22px;
  min-width: 22px;
  height: 22px;
  min-height: 22px;
  line-height: 20px;
  padding: 2px;
}
.block-library-colors-selector .block-library-colors-selector__state-selection > svg {
  min-width: auto !important;
}
.block-library-colors-selector .block-library-colors-selector__state-selection.has-text-color > svg,
.block-library-colors-selector .block-library-colors-selector__state-selection.has-text-color > svg path {
  color: inherit;
}

.block-library-colors-selector__popover .color-palette-controller-container {
  padding: 16px;
}
.block-library-colors-selector__popover .components-base-control__label {
  height: 20px;
  line-height: 20px;
}
.block-library-colors-selector__popover .component-color-indicator {
  float: left;
  margin-top: 2px;
}
.block-library-colors-selector__popover .components-panel__body-title {
  display: none;
}

.wp-block-navigation__container > .block-list-appender .block-editor-inserter__toggle.components-button.has-icon {
  display: flex;
}

/**
 * Setup state
 */
@keyframes loadingpulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.components-placeholder.wp-block-navigation-placeholder {
  outline: none;
  padding: 0;
  box-shadow: none;
  background: none;
  min-height: 0;
}
.components-placeholder.wp-block-navigation-placeholder .components-placeholder__fieldset {
  font-size: inherit;
}
.components-placeholder.wp-block-navigation-placeholder .components-placeholder__fieldset .components-button {
  margin-bottom: 0;
}
.components-placeholder.wp-block-navigation-placeholder {
  color: inherit;
}
.wp-block-navigation.is-selected .components-placeholder.wp-block-navigation-placeholder {
  color: #1e1e1e;
}

.wp-block-navigation-placeholder__preview {
  display: flex;
  align-items: center;
  min-width: 96px;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
}
.wp-block-navigation.is-selected .wp-block-navigation-placeholder__preview {
  display: none;
}
.wp-block-navigation-placeholder__preview {
  color: currentColor;
  background: transparent;
}
.wp-block-navigation-placeholder__preview::before {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  pointer-events: none;
  border: 1px dashed currentColor;
  border-radius: inherit;
}
.wp-block-navigation-placeholder__preview > svg {
  fill: currentColor;
}

.wp-block-navigation.is-vertical .is-small .components-placeholder__fieldset,
.wp-block-navigation.is-vertical .is-medium .components-placeholder__fieldset {
  min-height: 90px;
}

.wp-block-navigation.is-vertical .is-large .components-placeholder__fieldset {
  min-height: 132px;
}

.wp-block-navigation-placeholder__preview,
.wp-block-navigation-placeholder__controls {
  padding: 6px 8px;
  flex-direction: row;
  align-items: flex-start;
}

.wp-block-navigation-placeholder__controls {
  border-radius: 2px;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #1e1e1e;
  display: none;
  position: relative;
  z-index: 1;
}
.wp-block-navigation.is-selected .wp-block-navigation-placeholder__controls {
  display: flex;
}
.wp-block-navigation-placeholder__controls {
  float: right;
  width: 100%;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator,
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator + hr, .is-medium .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator,
.is-medium .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions__indicator + hr {
  display: none;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions, .wp-block-navigation.is-vertical .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions {
  flex-direction: column;
  align-items: flex-start;
}
.is-small .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions hr, .wp-block-navigation.is-vertical .wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__actions hr {
  display: none;
}
.wp-block-navigation-placeholder__controls .wp-block-navigation-placeholder__icon {
  margin-left: 12px;
  height: 36px;
}

.wp-block-navigation-placeholder__actions__indicator {
  display: flex;
  padding: 0 0 0 6px;
  align-items: center;
  justify-content: flex-start;
  line-height: 0;
  height: 36px;
  margin-right: 4px;
}
.wp-block-navigation-placeholder__actions__indicator svg {
  margin-left: 4px;
  fill: currentColor;
}

.wp-block-navigation .components-placeholder.is-medium .components-placeholder__fieldset {
  flex-direction: row !important;
}

.wp-block-navigation-placeholder__actions {
  display: flex;
  font-size: 13px;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  gap: 6px;
  align-items: center;
}
.wp-block-navigation-placeholder__actions .components-dropdown,
.wp-block-navigation-placeholder__actions > .components-button {
  margin-left: 0;
}
.wp-block-navigation-placeholder__actions {
  height: 100%;
}
.wp-block-navigation-placeholder__actions.wp-block-navigation-placeholder__actions hr {
  border: 0;
  min-height: 1px;
  min-width: 1px;
  background-color: #1e1e1e;
  margin: auto 0;
  height: 100%;
  max-height: 16px;
}

/**
 * Mobile menu.
 */
@media (min-width: 600px) {
  .wp-block-navigation__responsive-container:not(.is-menu-open) .components-button.wp-block-navigation__responsive-container-close {
    display: none;
  }
}

.wp-block-navigation__responsive-container.is-menu-open {
  position: fixed;
  top: 159px;
}
@media (min-width: 782px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    top: 97px;
  }
}
@media (min-width: 782px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    right: 36px;
  }
}
@media (min-width: 960px) {
  .wp-block-navigation__responsive-container.is-menu-open {
    right: 160px;
  }
}

.is-mobile-preview .wp-block-navigation__responsive-container.is-menu-open,
.is-tablet-preview .wp-block-navigation__responsive-container.is-menu-open {
  top: 145px;
}

.is-fullscreen-mode .wp-block-navigation__responsive-container.is-menu-open {
  right: 0;
  top: 159px;
}
@media (min-width: 782px) {
  .is-fullscreen-mode .wp-block-navigation__responsive-container.is-menu-open {
    top: 65px;
  }
}
.is-fullscreen-mode .is-mobile-preview .wp-block-navigation__responsive-container.is-menu-open,
.is-fullscreen-mode .is-tablet-preview .wp-block-navigation__responsive-container.is-menu-open {
  top: 113px;
}

body.editor-styles-wrapper .wp-block-navigation__responsive-container.is-menu-open {
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.components-button.wp-block-navigation__responsive-container-open.wp-block-navigation__responsive-container-open,
.components-button.wp-block-navigation__responsive-container-close.wp-block-navigation__responsive-container-close {
  padding: 0;
  height: auto;
  color: inherit;
}

.components-heading.wp-block-navigation-off-canvas-editor__title {
  margin: 0;
}

.wp-block-navigation-off-canvas-editor__header {
  margin-bottom: 8px;
}

.is-menu-open .wp-block-navigation__responsive-container-content * .block-list-appender {
  margin-top: 16px;
}

@keyframes fadein {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.wp-block-navigation__loading-indicator-container {
  padding: 8px 12px;
}

.wp-block-navigation .wp-block-navigation__uncontrolled-inner-blocks-loading-indicator {
  margin-top: 0;
}

@keyframes fadeouthalf {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0.5;
  }
}
.wp-block-navigation-delete-menu-button {
  width: 100%;
  justify-content: center;
  margin-bottom: 16px;
}

.components-button.is-link.wp-block-navigation-manage-menus-button {
  margin-bottom: 16px;
}

.wp-block-navigation__overlay-menu-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: #f0f0f0;
  padding: 0 24px;
  height: 64px !important;
  grid-column: span 2;
}
.wp-block-navigation__overlay-menu-preview.open {
  border-color: #e0e0e0;
  background-color: #fff;
}

.wp-block-navigation__toolbar-menu-selector.components-toolbar-group:empty {
  display: none;
}

.wp-block-navigation-placeholder__actions hr + hr {
  display: none;
}

/**
 * Navigation selector styles
 */
.wp-block-navigation__navigation-selector {
  margin-bottom: 16px;
  width: 100%;
}

.wp-block-navigation__navigation-selector-button {
  border: 1px solid;
  justify-content: space-between;
  width: 100%;
}

.wp-block-navigation__navigation-selector-button__icon {
  flex: 0 0 auto;
}

.wp-block-navigation__navigation-selector-button__label {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-block-navigation__navigation-selector-button--createnew {
  border: 1px solid;
  margin-bottom: 16px;
  width: 100%;
}

.wp-block-navigation__responsive-container-open.components-button {
  opacity: 1;
}

.wp-block-navigation__menu-inspector-controls__empty-message {
  margin-right: 24px;
}

.editor-sidebar__panel .wp-block-navigation__submenu-header {
  margin-top: 0;
  margin-bottom: 0;
}

.wp-block-navigation__submenu-accessibility-notice {
  grid-column: span 2;
}

.wp-block-navigation__overlay-selector {
  position: relative;
}

.wp-block-navigation__overlay-selector-controls {
  margin-bottom: 8px;
}

.wp-block-navigation__overlay-create-button {
  position: absolute;
  top: -4px;
  left: 0;
  z-index: 1;
}

.wp-block-navigation__overlay-preview {
  border: 1px solid #ddd;
  border-radius: 2px;
  overflow-y: auto;
  max-height: 200px;
  background: #fff;
}

.wp-block-navigation__overlay-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  background: #f0f0f0;
}

.wp-block-navigation__overlay-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 16px;
  text-align: center;
  color: #757575;
  background: #f0f0f0;
  font-style: italic;
}

.wp-block-navigation__overlay-preview-placeholder {
  width: 100%;
  height: 200px;
  background: #f0f0f0;
  animation: wp-block-navigation-overlay-preview-pulse 1.5s ease-in-out infinite;
}

@keyframes wp-block-navigation-overlay-preview-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
.wp-block-navigation__deleted-overlay-warning {
  margin-top: 12px;
}

.wp-block-navigation__overlay-create-button-prominent {
  width: 100%;
  justify-content: center;
  margin-bottom: 8px;
}

.wp-block-navigation__overlay-help-text-wrapper {
  margin-top: 8px;
}

.wp-block-audio__autoplay-help-text {
  grid-column: 1/-1;
}

/**
 * Appender
 */
.wp-block-navigation .block-list-appender {
  position: relative;
}

/**
 * Submenus.
 */
.wp-block-navigation .has-child {
  cursor: pointer;
}
.wp-block-navigation .has-child .wp-block-navigation__submenu-container {
  z-index: 28;
}
.wp-block-navigation .has-child:hover .wp-block-navigation__submenu-container {
  z-index: 29;
}
.wp-block-navigation .has-child.is-selected > .wp-block-navigation__submenu-container, .wp-block-navigation .has-child.has-child-selected > .wp-block-navigation__submenu-container {
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  width: auto !important;
  overflow: visible !important;
}
.wp-block-navigation .has-child.is-selected:not(.open-always) > .wp-block-navigation__submenu-container, .wp-block-navigation .has-child.has-child-selected:not(.open-always) > .wp-block-navigation__submenu-container {
  min-width: 200px !important;
}

/**
 * Navigation Items.
 */
.wp-block-navigation-item .wp-block-navigation-item__content {
  cursor: text;
}
.wp-block-navigation-item.is-editing, .wp-block-navigation-item.is-selected {
  min-width: 20px;
}
.wp-block-navigation-item .block-list-appender {
  margin-top: 16px;
  margin-left: auto;
  margin-bottom: 16px;
  margin-right: 16px;
}

.wp-block-navigation-link__invalid-item {
  color: #000;
}

/**
 * Menu item setup state. Is shown when a menu item has no URL configured.
 */
.wp-block-navigation-link__placeholder {
  position: relative;
  text-decoration: none !important;
  box-shadow: none !important;
  background-image: none !important;
}
.wp-block-navigation-link__placeholder .wp-block-navigation-link__placeholder-text span {
  -webkit-text-decoration: wavy underline;
          text-decoration: wavy underline;
  -webkit-text-decoration-skip-ink: none;
          text-decoration-skip-ink: none;
  text-underline-offset: 0.25rem;
}
.wp-block-navigation-link__placeholder.wp-block-navigation-item__content {
  cursor: pointer;
}

/**
* Link Control Transforms
*/
.link-control-transform {
  border-top: 1px solid #ccc;
  padding: 0 16px 8px 16px;
}

.link-control-transform__subheading {
  font-size: 11px;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  color: #1e1e1e;
  margin-bottom: 1.5em;
}

.link-control-transform__items {
  display: flex;
  justify-content: space-between;
}

.link-control-transform__item {
  flex-basis: 33%;
  flex-direction: column;
  gap: 8px;
  height: auto;
}

.link-ui-page-creator {
  max-width: 350px;
  min-width: auto;
  width: 90vw;
  padding-top: 8px;
}
.link-ui-page-creator__inner {
  padding: 16px;
}
.link-ui-page-creator__back {
  margin-right: 8px;
  text-transform: uppercase;
}

/**
 * Error text styling for missing entity help text.
 */
.navigation-link-control__error-text {
  color: #cc1818;
}

.navigation-link-to__action-button {
  grid-column: auto;
}
.navigation-link-to__action-button:nth-last-child(1 of .navigation-link-to__action-button):nth-child(odd of .navigation-link-to__action-button) {
  grid-column: 1/-1;
}
.navigation-link-to__action-button.navigation-link-to__action-button.navigation-link-to__action-button {
  justify-content: center;
}

.wp-block-navigation-submenu {
  display: block;
}
.wp-block-navigation-submenu .wp-block-navigation__submenu-container {
  z-index: 28;
}
.wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container {
  visibility: visible !important;
  opacity: 1 !important;
  height: auto !important;
  width: auto !important;
  position: absolute;
  right: -1px;
  top: 100%;
}
@media (min-width: 782px) {
  .wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container {
    right: 100%;
    top: -1px;
  }
  .wp-block-navigation-submenu.is-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container::before, .wp-block-navigation-submenu.has-child-selected > .wp-block-navigation__submenu-container .wp-block-navigation__submenu-container::before {
    content: "";
    position: absolute;
    left: 100%;
    height: 100%;
    display: block;
    width: 0.5em;
    background: transparent;
  }
}
.wp-block-navigation-submenu.is-selected:not(.open-always) > .wp-block-navigation__submenu-container, .wp-block-navigation-submenu.has-child-selected:not(.open-always) > .wp-block-navigation__submenu-container {
  min-width: 200px !important;
}

.block-editor-block-list__block[data-type="core/nextpage"] {
  max-width: 100%;
  text-align: center;
  margin-top: 28px;
  margin-bottom: 28px;
}

.wp-block-nextpage {
  display: block;
  text-align: center;
  white-space: nowrap;
}
.wp-block-nextpage > span {
  font-size: 13px;
  position: relative;
  text-transform: uppercase;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
  color: #757575;
  border-radius: 4px;
  background: #fff;
  padding: 6px 8px;
  height: 24px;
}
.wp-block-nextpage::before {
  content: "";
  position: absolute;
  top: 50%;
  right: 0;
  left: 0;
  border-top: 3px dashed #ccc;
}

.wp-block-navigation.items-justified-space-between .wp-block-page-list > div,
.wp-block-navigation.items-justified-space-between .wp-block-page-list {
  display: contents;
  flex: 1;
}
.wp-block-navigation.items-justified-space-between.has-child-selected .wp-block-page-list > div, .wp-block-navigation.items-justified-space-between.has-child-selected .wp-block-page-list, .wp-block-navigation.items-justified-space-between.is-selected .wp-block-page-list > div, .wp-block-navigation.items-justified-space-between.is-selected .wp-block-page-list {
  flex: inherit;
}

.wp-block-navigation .wp-block-navigation__submenu-container > .wp-block-page-list {
  display: block;
}

.wp-block-pages-list__item__link {
  pointer-events: none;
}

.wp-block-page-list .open-on-click:focus-within > .wp-block-navigation__submenu-container {
  visibility: visible;
  opacity: 1;
  width: auto;
  height: auto;
  min-width: 200px;
}

.wp-block-page-list__loading-indicator-container {
  padding: 8px 12px;
}

:root :where(.block-editor-block-list__block[data-type="core/paragraph"].has-drop-cap:focus) {
  min-height: auto;
}

.block-editor-block-list__block[data-empty=true] [data-rich-text-placeholder] {
  opacity: 1;
}

.block-editor-block-list__block[data-empty=true] + .block-editor-block-list__block[data-empty=true]:not([data-custom-placeholder=true]) [data-rich-text-placeholder] {
  opacity: 0;
}

.block-editor-block-list__block[data-type="core/paragraph"].has-text-align-right[style*="writing-mode: vertical-rl"],
.block-editor-block-list__block[data-type="core/paragraph"].has-text-align-left[style*="writing-mode: vertical-lr"] {
  rotate: 180deg;
}

.is-zoomed-out .block-editor-block-list__block[data-empty=true] [data-rich-text-placeholder] {
  opacity: 0;
}

html[dir=rtl] .has-drop-cap:not(:focus)::first-letter {
  float: initial;
  margin-right: 0.1em;
}

.wp-block-post-author__transform {
  background: #f0f0f0;
  border-radius: 2px;
  margin: 16px;
  padding: 16px;
}

.wp-block-playlist__waveform-color-controls {
  display: grid;
  grid-column: 1/-1;
  row-gap: 0;
}

.wp-block-post-excerpt .wp-block-post-excerpt__excerpt.is-inline {
  display: inline;
}

.wp-block-pullquote.is-style-solid-color blockquote p {
  font-size: 32px;
}
.wp-block-pullquote.is-style-solid-color .wp-block-pullquote__citation {
  text-transform: none;
  font-style: normal;
}

.wp-block-pullquote__citation {
  color: inherit;
}

.wp-block-pullquote[style*=line-height] :where(p) {
  line-height: inherit;
}

.wp-block-rss li a > div {
  display: inline;
}

.wp-block-rss__placeholder-form .wp-block-rss__placeholder-input {
  flex: 1 1 auto;
}

.wp-block-rss .wp-block-rss {
  all: inherit;
  margin: 0;
  padding: 0;
}

.wp-block[data-align=center] .wp-block-search .wp-block-search__inside-wrapper {
  margin: auto;
}

.wp-block-search :where(.wp-block-search__button) {
  height: auto;
  border-radius: initial;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

:where(.wp-block-search__inside-wrapper) {
  min-width: 220px;
}

.wp-block-search__inspector-controls .components-base-control {
  margin-bottom: 0;
}

.block-editor-block-list__block[data-type="core/separator"] {
  padding-top: 0.1px;
  padding-bottom: 0.1px;
}

.blocks-shortcode__textarea {
  box-sizing: border-box;
  max-height: 250px;
  resize: none;
  font-family: Menlo, Consolas, monaco, monospace !important;
  color: #1e1e1e !important;
  background: #fff !important;
  padding: 12px !important;
  border: 1px solid #1e1e1e !important;
  box-shadow: none !important;
  border-radius: 2px !important;
  font-size: 16px !important;
}
@media (min-width: 600px) {
  .blocks-shortcode__textarea {
    font-size: 13px !important;
  }
}
.blocks-shortcode__textarea:focus {
  border-color: var(--wp-admin-theme-color) !important;
  box-shadow: 0 0 0 1px var(--wp-admin-theme-color) !important;
  outline: 2px solid transparent !important;
}

.wp-block[data-align=center] > .wp-block-site-logo,
.wp-block-site-logo.aligncenter > div {
  display: table;
  margin-right: auto;
  margin-left: auto;
}

.wp-block-site-logo a {
  pointer-events: none;
}
.wp-block-site-logo .custom-logo-link {
  cursor: inherit;
}
.wp-block-site-logo .custom-logo-link:focus {
  box-shadow: none;
}
.wp-block-site-logo img {
  display: block;
  height: auto;
  max-width: 100%;
}
.wp-block-site-logo.is-transient {
  position: relative;
}
.wp-block-site-logo.is-transient img {
  opacity: 0.3;
}
.wp-block-site-logo.is-transient .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
  margin: 0;
}

.wp-block-site-logo.wp-block-site-logo.is-default-size .components-placeholder {
  height: 60px;
  width: 60px;
}
.wp-block-site-logo.wp-block-site-logo > div,
.wp-block-site-logo.wp-block-site-logo .components-resizable-box__container {
  border-radius: inherit;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
  border-radius: inherit;
  min-height: 48px;
  min-width: 48px;
  height: 100%;
  width: 100%;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-form-file-upload {
  display: none;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-drop-zone__content-text {
  display: none;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-button.components-button {
  padding: 0;
  margin: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  background: var(--wp-admin-theme-color);
  border-color: var(--wp-admin-theme-color);
  border-style: solid;
  color: #fff;
}
.wp-block-site-logo.wp-block-site-logo .components-placeholder .components-button.components-button > svg {
  color: inherit;
}

.block-library-site-logo__inspector-media-replace-container {
  position: relative;
}
.block-library-site-logo__inspector-media-replace-container .block-library-site-logo__inspector-media-replace-title {
  word-break: break-all;
  white-space: normal;
  text-align: start;
  text-align-last: center;
}
.block-library-site-logo__inspector-media-replace-container img {
  width: 20px;
  min-width: 20px;
  aspect-ratio: 1;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
.block-library-site-logo__inspector-media-replace-container .block-library-site-logo__inspector-readonly-logo-preview {
  padding: 6px 12px;
  display: flex;
  height: 40px;
}

.wp-block-site-tagline__placeholder {
  padding: 1em 0;
  border: 1px dashed;
}

.wp-block-site-title__placeholder {
  padding: 1em 0;
  border: 1px dashed;
}

.wp-block-social-links .wp-social-link {
  line-height: 0;
}

.wp-block-social-link-anchor {
  align-items: center;
  background: none;
  border: 0;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  font-size: inherit;
  color: currentColor;
  height: auto;
  font-weight: inherit;
  font-family: inherit;
  margin: 0;
  opacity: 1;
  padding: 0.25em;
}
.wp-block-social-link-anchor:hover {
  transform: none;
}

:root :where(.wp-block-social-links.is-style-pill-shape .wp-social-link button) {
  padding-right: 0.6666666667em;
  padding-left: 0.6666666667em;
}

:root :where(.wp-block-social-links.is-style-logos-only .wp-social-link button) {
  padding: 0;
}

.wp-block-social-link__toolbar_content_text {
  width: 250px;
}

.wp-block-social-links div.block-editor-url-input {
  display: inline-block;
  margin-right: 8px;
}

.wp-social-link:hover {
  transform: none;
}

:root :where(.wp-block-social-links) {
  padding: 0;
}

.wp-block[data-align=center] > .wp-block-social-links,
.wp-block.wp-block-social-links.aligncenter {
  justify-content: center;
}

.block-editor-block-preview__content .components-button:disabled {
  opacity: 1;
}

.wp-social-link.wp-social-link__is-incomplete {
  opacity: 0.5;
}

.wp-block-social-links .is-selected .wp-social-link__is-incomplete,
.wp-social-link.wp-social-link__is-incomplete:hover,
.wp-social-link.wp-social-link__is-incomplete:focus {
  opacity: 1;
}

.wp-block-social-links .block-list-appender {
  position: static;
}
.wp-block-social-links .block-list-appender .block-editor-inserter {
  font-size: inherit;
}
.wp-block-social-links .block-list-appender .block-editor-button-block-appender {
  height: 1.5em;
  width: 1.5em;
  font-size: inherit;
  padding: 0;
}

.block-editor-block-list__block[data-type="core/spacer"]::before {
  content: "";
  display: block;
  position: absolute;
  z-index: 1;
  width: 100%;
  min-height: 8px;
  min-width: 8px;
  height: 100%;
}

.wp-block-spacer.is-hovered .block-library-spacer__resize-container,
.block-library-spacer__resize-container.has-show-handle,
.wp-block-spacer.is-selected.custom-sizes-disabled {
  background: rgba(0, 0, 0, 0.1);
}
.is-dark-theme .wp-block-spacer.is-hovered .block-library-spacer__resize-container,
.is-dark-theme .block-library-spacer__resize-container.has-show-handle,
.is-dark-theme .wp-block-spacer.is-selected.custom-sizes-disabled {
  background: rgba(255, 255, 255, 0.15);
}

.block-library-spacer__resize-container {
  clear: both;
}
.block-library-spacer__resize-container:not(.is-resizing) {
  height: 100% !important;
  width: 100% !important;
}
.block-library-spacer__resize-container .components-resizable-box__handle::before {
  content: none;
}
.block-library-spacer__resize-container.resize-horizontal {
  margin-bottom: 0;
  height: 100% !important;
}

@media (min-width: 600px) {
  .wp-block-tab-list__mover-button {
    width: 24px;
    min-width: 0 !important;
  }
}

.wp-block[data-align=left] > .wp-block-table, .wp-block[data-align=right] > .wp-block-table, .wp-block[data-align=center] > .wp-block-table {
  height: auto;
}
.wp-block[data-align=left] > .wp-block-table table, .wp-block[data-align=right] > .wp-block-table table, .wp-block[data-align=center] > .wp-block-table table {
  width: auto;
}
.wp-block[data-align=left] > .wp-block-table td,
.wp-block[data-align=left] > .wp-block-table th, .wp-block[data-align=right] > .wp-block-table td,
.wp-block[data-align=right] > .wp-block-table th, .wp-block[data-align=center] > .wp-block-table td,
.wp-block[data-align=center] > .wp-block-table th {
  word-break: normal;
  overflow-wrap: anywhere;
}
.wp-block[data-align=center] > .wp-block-table {
  text-align: initial;
}
.wp-block[data-align=center] > .wp-block-table table {
  margin: 0 auto;
}
.wp-block-table td,
.wp-block-table th {
  border: 1px solid;
  padding: 0.5em;
}
.wp-block-table td [contenteditable=true],
.wp-block-table th [contenteditable=true] {
  overflow-wrap: inherit;
}
.wp-block-table td.is-selected,
.wp-block-table th.is-selected {
  border-color: var(--wp-admin-theme-color);
  box-shadow: inset 0 0 0 1px var(--wp-admin-theme-color);
  border-style: double;
}
.wp-block-table table.has-individual-borders > *,
.wp-block-table table.has-individual-borders tr,
.wp-block-table table.has-individual-borders th,
.wp-block-table table.has-individual-borders td {
  border-width: 1px;
  border-style: solid;
  border-color: currentColor;
}

.blocks-table__placeholder-form.blocks-table__placeholder-form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
@media (min-width: 782px) {
  .blocks-table__placeholder-form.blocks-table__placeholder-form {
    flex-direction: row;
    align-items: flex-end;
  }
}

.blocks-table__placeholder-input {
  width: 112px;
}

.block-editor-template-part__selection-modal {
  z-index: 1000001;
}
.block-editor-template-part__selection-modal .block-editor-block-patterns-list {
  column-count: 2;
  column-gap: 24px;
}
@media (min-width: 1280px) {
  .block-editor-template-part__selection-modal .block-editor-block-patterns-list {
    column-count: 3;
  }
}
.block-editor-template-part__selection-modal .block-editor-block-patterns-list .block-editor-block-patterns-list__list-item {
  break-inside: avoid-column;
}

.block-library-template-part__selection-search {
  background: #fff;
  position: sticky;
  top: 0;
  padding: 16px 0;
  z-index: 2;
}

.block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-highlighted::after, .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.is-selected::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.is-highlighted::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.is-selected::after {
  outline-color: var(--wp-block-synced-color);
}
.block-editor-block-list__block:not(.remove-outline).wp-block-template-part.block-editor-block-list__block:not([contenteditable]):focus::after,
.block-editor-block-list__block:not(.remove-outline).is-reusable.block-editor-block-list__block:not([contenteditable]):focus::after {
  outline-color: var(--wp-block-synced-color);
}

.is-outline-mode .block-editor-block-list__block:not(.remove-outline).wp-block-template-part.has-editable-outline::after {
  border: none;
}

.wp-block-term-template .term-loading .term-loading-placeholder {
  width: 100%;
  height: 1.5em;
  margin-bottom: 0.25em;
  background-color: #f0f0f0;
  border-radius: 2px;
}
@media not (prefers-reduced-motion) {
  .wp-block-term-template .term-loading .term-loading-placeholder {
    animation: loadingpulse 1.5s ease-in-out infinite;
  }
}

@keyframes loadingpulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
.wp-block-text-columns .block-editor-rich-text__editable:focus {
  outline: 1px solid #ddd;
}

.wp-block[data-align=center] > .wp-block-video {
  text-align: center;
}

.wp-block-video {
  position: relative;
}
.wp-block-video.is-transient video {
  opacity: 0.3;
}
.wp-block-video .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -9px;
  margin-right: -9px;
}

.block-library-video-tracks-editor {
  z-index: 159990;
}

.modal-open .block-library-video-tracks-editor {
  z-index: 99999;
}

.block-library-video-tracks-editor__track-list-track {
  padding-right: 12px;
}

.block-library-video-tracks-editor__single-track-editor-kind-select {
  max-width: 240px;
}

.block-library-video-tracks-editor__tracks-informative-message-title,
.block-library-video-tracks-editor__single-track-editor-edit-track-label {
  margin-top: 4px;
  color: #757575;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: var(--wpds-typography-font-weight-emphasis, 600);
  display: block;
}

.block-library-video-tracks-editor > .components-popover__content {
  width: 360px;
}

.block-library-video-tracks-editor__track-list .components-menu-group__label,
.block-library-video-tracks-editor__add-tracks-container .components-menu-group__label {
  padding: 0;
}

.block-library-video-tracks-editor__tracks-informative-message {
  padding: 8px;
}
.block-library-video-tracks-editor__tracks-informative-message-description {
  margin-bottom: 0;
}

.block-library-query-pattern__selection-modal .block-editor-block-patterns-list {
  column-count: 2;
  column-gap: 24px;
}
@media (min-width: 1280px) {
  .block-library-query-pattern__selection-modal .block-editor-block-patterns-list {
    column-count: 3;
  }
}
.block-library-query-pattern__selection-modal .block-editor-block-patterns-list .block-editor-block-patterns-list__list-item {
  break-inside: avoid-column;
}
.block-library-query-pattern__selection-modal .block-library-query-pattern__selection-search {
  background: #fff;
  position: sticky;
  top: 0;
  padding: 16px 0;
  transform: translateY(-4px);
  margin-bottom: -4px;
  z-index: 2;
}

.block-editor-block-settings-menu__popover.is-expanded {
  overflow-y: scroll;
}
.block-editor-block-settings-menu__popover .block-library-query-pattern__selection-content {
  height: 100%;
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 600px) {
  .block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
    grid-template-columns: 1fr 1fr;
  }
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
  gap: 12px;
  min-width: 280px;
}
@media (min-width: 600px) {
  .block-editor-block-settings-menu__popover .block-editor-block-patterns-list {
    min-width: 480px;
  }
}
.block-editor-block-settings-menu__popover .block-editor-block-patterns-list__list-item {
  margin-bottom: 0;
}

.wp-block-query > .block-editor-media-placeholder.is-small {
  min-height: 60px;
}

.block-library-query-inspector__taxonomy-control-path {
  margin-inline-start: var(--wpds-dimension-gap-xs, 4px);
  font-size: var(--wpds-typography-font-size-sm, 12px);
  color: var(--wpds-color-foreground-content-neutral-weak, #707070);
}

.block-library-query-inspector__taxonomy-control-limited-count {
  padding-block: var(--wpds-dimension-padding-xs, 4px);
}

.wp-block[data-align=center] > .wp-block-query-pagination {
  justify-content: center;
}

:where(.editor-styles-wrapper) .wp-block-query-pagination {
  max-width: 100%;
}

.wp-block-query-pagination-numbers a {
  text-decoration: underline;
}
.wp-block-query-pagination-numbers .page-numbers {
  margin-left: 2px;
}
.wp-block-query-pagination-numbers .page-numbers:last-child {
  margin-right: 0;
}

.wp-block-post-featured-image .block-editor-media-placeholder {
  z-index: 1;
  backdrop-filter: none;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder,
.wp-block-post-featured-image .components-placeholder {
  justify-content: center;
  align-items: center;
  padding: 0;
  display: flex;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-form-file-upload,
.wp-block-post-featured-image .components-placeholder .components-form-file-upload {
  display: none;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-button,
.wp-block-post-featured-image .components-placeholder .components-button {
  margin: auto;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  position: relative;
  background: var(--wp-admin-theme-color);
  border-color: var(--wp-admin-theme-color);
  border-style: solid;
  color: #fff;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder .components-button > svg,
.wp-block-post-featured-image .components-placeholder .components-button > svg {
  color: inherit;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder,
.wp-block-post-featured-image .components-placeholder {
  min-height: 200px;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where(.has-border-color),
.wp-block-post-featured-image .components-placeholder:where(.has-border-color),
.wp-block-post-featured-image img:where(.has-border-color) {
  border-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-top-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-top-color]),
.wp-block-post-featured-image img:where([style*=border-top-color]) {
  border-top-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-right-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-right-color]),
.wp-block-post-featured-image img:where([style*=border-right-color]) {
  border-left-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-bottom-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-bottom-color]),
.wp-block-post-featured-image img:where([style*=border-bottom-color]) {
  border-bottom-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-left-color]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-left-color]),
.wp-block-post-featured-image img:where([style*=border-left-color]) {
  border-right-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-width]),
.wp-block-post-featured-image img:where([style*=border-width]) {
  border-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-top-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-top-width]),
.wp-block-post-featured-image img:where([style*=border-top-width]) {
  border-top-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-right-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-right-width]),
.wp-block-post-featured-image img:where([style*=border-right-width]) {
  border-left-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-bottom-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-bottom-width]),
.wp-block-post-featured-image img:where([style*=border-bottom-width]) {
  border-bottom-style: solid;
}
.wp-block-post-featured-image .wp-block-post-featured-image__placeholder:where([style*=border-left-width]),
.wp-block-post-featured-image .components-placeholder:where([style*=border-left-width]),
.wp-block-post-featured-image img:where([style*=border-left-width]) {
  border-right-style: solid;
}
.wp-block-post-featured-image[style*=height] .components-placeholder {
  min-height: 48px;
  min-width: 48px;
  height: 100%;
  width: 100%;
}
.wp-block-post-featured-image > a {
  pointer-events: none;
}
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-button,
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-placeholder__instructions,
.wp-block-post-featured-image.is-selected .components-placeholder.has-illustration .components-placeholder__label {
  opacity: 1;
  pointer-events: auto;
}
.wp-block-post-featured-image.is-transient {
  position: relative;
}
.wp-block-post-featured-image.is-transient img {
  opacity: 0.3;
}
.wp-block-post-featured-image.is-transient .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  transform: translate(50%, -50%);
}

div[data-type="core/post-featured-image"] img {
  max-width: 100%;
  height: auto;
  display: block;
}

.wp-block-post-comments-form * {
  pointer-events: none;
}
.wp-block-post-comments-form *.block-editor-warning * {
  pointer-events: auto;
}

/**
 * Element styles for the editor
 */
.wp-element-button {
  cursor: revert;
}
.wp-element-button[role=textbox] {
  cursor: text;
}

.block-library-poster-image__container {
  position: relative;
}
.block-library-poster-image__container:hover .block-library-poster-image__actions, .block-library-poster-image__container:focus .block-library-poster-image__actions, .block-library-poster-image__container:focus-within .block-library-poster-image__actions {
  opacity: 1;
}
.block-library-poster-image__container .block-library-poster-image__actions.block-library-poster-image__actions-select {
  opacity: 1;
  margin-top: 16px;
}
.block-library-poster-image__container .components-drop-zone__content {
  border-radius: 2px;
}
.block-library-poster-image__container .components-drop-zone .components-drop-zone__content-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}
.block-library-poster-image__container .components-drop-zone .components-drop-zone__content-inner .components-drop-zone__content-icon {
  margin: 0;
}
.block-library-poster-image__container .components-spinner {
  position: absolute;
  top: 50%;
  right: 50%;
  margin-top: -9px;
  margin-right: -9px;
}

.block-library-poster-image__preview {
  width: 100%;
  padding: 0;
  overflow: hidden;
  outline-offset: -1px;
  min-height: 40px;
  display: flex;
  justify-content: center;
  height: auto !important;
  outline: 1px solid rgba(0, 0, 0, 0.1);
}
.block-library-poster-image__preview .block-library-poster-image__preview-image {
  object-fit: cover;
  width: 100%;
  object-position: 50% 50%;
  aspect-ratio: 2/1;
}

.block-library-poster-image__actions:not(.block-library-poster-image__actions-select) {
  bottom: 0;
  opacity: 0;
  padding: 8px;
  position: absolute;
}
@media not (prefers-reduced-motion) {
  .block-library-poster-image__actions:not(.block-library-poster-image__actions-select) {
    transition: opacity 50ms ease-out;
  }
}
.block-library-poster-image__actions:not(.block-library-poster-image__actions-select) .block-library-poster-image__action {
  backdrop-filter: blur(16px) saturate(180%);
  background: rgba(255, 255, 255, 0.75);
}
.block-library-poster-image__actions .block-library-poster-image__action {
  flex-grow: 1;
  justify-content: center;
}

:root .editor-styles-wrapper .has-very-light-gray-background-color {
  background-color: #eee;
}
:root .editor-styles-wrapper .has-very-dark-gray-background-color {
  background-color: #313131;
}
:root .editor-styles-wrapper .has-very-light-gray-color {
  color: #eee;
}
:root .editor-styles-wrapper .has-very-dark-gray-color {
  color: #313131;
}
:root .editor-styles-wrapper {
  /* stylelint-disable @stylistic/function-comma-space-after -- We can not use spacing because of WP multi site kses rule. */
}
:root .editor-styles-wrapper .has-vivid-green-cyan-to-vivid-cyan-blue-gradient-background {
  background: linear-gradient(-135deg, rgb(0, 208, 132) 0%, rgb(6, 147, 227) 100%);
}
:root .editor-styles-wrapper .has-purple-crush-gradient-background {
  background: linear-gradient(-135deg, rgb(52, 226, 228) 0%, rgb(71, 33, 251) 50%, rgb(171, 29, 254) 100%);
}
:root .editor-styles-wrapper .has-hazy-dawn-gradient-background {
  background: linear-gradient(-135deg, rgb(250, 172, 168) 0%, rgb(218, 208, 236) 100%);
}
:root .editor-styles-wrapper .has-subdued-olive-gradient-background {
  background: linear-gradient(-135deg, rgb(250, 250, 225) 0%, rgb(103, 166, 113) 100%);
}
:root .editor-styles-wrapper .has-atomic-cream-gradient-background {
  background: linear-gradient(-135deg, rgb(253, 215, 154) 0%, rgb(0, 74, 89) 100%);
}
:root .editor-styles-wrapper .has-nightshade-gradient-background {
  background: linear-gradient(-135deg, rgb(51, 9, 104) 0%, rgb(49, 205, 207) 100%);
}
:root .editor-styles-wrapper .has-midnight-gradient-background {
  background: linear-gradient(-135deg, rgb(2, 3, 129) 0%, rgb(40, 116, 252) 100%);
}
:root .editor-styles-wrapper {
  /* stylelint-enable @stylistic/function-comma-space-after */
}

:where(.editor-styles-wrapper) .has-regular-font-size {
  font-size: 16px;
}

:where(.editor-styles-wrapper) .has-larger-font-size {
  font-size: 42px;
}

/**
 * Editor Normalization Styles
 *
 * These are only output in the editor, but styles here are NOT prefixed .editor-styles-wrapper.
 * This allows us to create normalization styles that are easily overridden by editor styles.
 */
:where(.editor-styles-wrapper) iframe:not([frameborder]) {
  border: 0;
}`})))()}var rr,J;function init_editor_styles(){return(init_editor_styles=e((()=>{init_style(),init_style_rtl(),init_content(),init_content_rtl(),qt(),init_style_rtl$1(),init_theme(),init_theme_rtl(),init_editor(),init_editor_rtl(),rr=[{css:`
        body {
            font-family: Arial;
            font-size: 16px;
        }
        p {
            font-size: inherit;
            line-height: inherit;
        }
        ul,
        ol {
            margin: 0;
            padding: 0;
        }
    
        ul li,
        ol li {
            margin-bottom: initial;
        }
    
        ul {
            list-style-type: disc;
        }
    
        ol {
            list-style-type: decimal;
        }
    
        ul ul,
        ol ul {
            list-style-type: circle;
        }
    
        .wp-block {
            max-width: 700px;    
            margin-left: auto;
            margin-right: auto;
        }
        .wp-block[data-align="wide"],
        .wp-block.alignwide {
            max-width: 900px;
        }
        .wp-block[data-align="full"],
        .wp-block.alignfull {
            max-width: none;
        }
        `}],J={ltr:[{css:Jn},{css:Kt},{css:Xn},{css:$n},{css:tr},...rr],rtl:[{css:Yn},{css:Qn},{css:Zn},{css:er},{css:nr},...rr]}})))()}function EditorFullPage({direction:e=`ltr`}){let[t,n]=(0,a.useState)([]);return(0,a.useEffect)(()=>{let e=document.createElement(`style`);return e.textContent=qn,document.head.appendChild(e),()=>document.head.removeChild(e)},[]),(0,Y.jsx)(`div`,{className:`playground`,onKeyDown:e=>e.stopPropagation(),children:(0,Y.jsxs)(Ie,{value:t,onInput:n,onChange:n,children:[(0,Y.jsx)(`div`,{className:`playground__sidebar`,children:(0,Y.jsx)(me,{})}),(0,Y.jsx)(`div`,{className:`playground__content`,children:(0,Y.jsx)(De,{height:`100%`,styles:J[e]})})]})})}var Y;function init_fullpage(){return(init_fullpage=e((()=>{i(),y(),init_build_module(),init_style_lazy(),init_editor_styles(),Y=r(),EditorFullPage.__docgenInfo={description:``,methods:[],displayName:`EditorFullPage`,props:{direction:{defaultValue:{value:`'ltr'`,computed:!1},required:!1}}}})))()}var ir,ar;function init_style_module(){return(init_style_module=e((()=>{ir=`_root_1ndpv_1`,ar={root:ir}})))()}function EditorBox({direction:e=`ltr`}){let[t,n]=(0,a.useState)([]);return(0,X.jsx)(`div`,{className:ar.root,onKeyDown:e=>e.stopPropagation(),children:(0,X.jsxs)(Ie,{value:t,onInput:n,onChange:n,settings:{hasFixedToolbar:!0},children:[(0,X.jsx)(fe,{hideDragHandle:!0}),(0,X.jsx)(De,{height:`500px`,styles:J[e]})]})})}var X;function init_box(){return(init_box=e((()=>{i(),y(),init_editor_styles(),init_style_module(),X=r(),EditorBox.__docgenInfo={description:``,methods:[],displayName:`EditorBox`,props:{direction:{defaultValue:{value:`'ltr'`,computed:!1},required:!1}}}})))()}var or,sr,cr;function init_style_module$1(){return(init_style_module$1=e((()=>{or=`_root_2axv0_1`,sr=`_toolbar_2axv0_5`,cr={root:or,toolbar:sr}})))()}function EditorWithUndoRedo({direction:e=`ltr`}){let{value:t,setValue:n,hasUndo:r,hasRedo:i,undo:a,redo:o}=useStateWithHistory({blocks:[]});return(0,Z.jsx)(`div`,{className:cr.root,onKeyDown:e=>e.stopPropagation(),children:(0,Z.jsxs)(Ie,{value:t.blocks,selection:t.selection,onInput:(e,{selection:t})=>n({blocks:e,selection:t},!0),onChange:(e,{selection:t})=>n({blocks:e,selection:t},!1),settings:{hasFixedToolbar:!0},children:[(0,Z.jsxs)(`div`,{className:cr.toolbar,children:[(0,Z.jsx)(Ft,{onClick:a,disabled:!r,accessibleWhenDisabled:!0,icon:at,label:`Undo`,size:`compact`}),(0,Z.jsx)(Ft,{onClick:o,disabled:!i,accessibleWhenDisabled:!0,icon:Ye,label:`Redo`,size:`compact`}),(0,Z.jsx)(fe,{hideDragHandle:!0})]}),(0,Z.jsx)(De,{height:`100%`,styles:J[e]})]})})}var Z;function init_with_undo_redo(){return(init_with_undo_redo=e((()=>{init_use_state_with_history(),y(),Pt(),S(),init_editor_styles(),init_style_module$1(),Z=r(),EditorWithUndoRedo.__docgenInfo={description:``,methods:[],displayName:`EditorWithUndoRedo`,props:{direction:{defaultValue:{value:`'ltr'`,computed:!1},required:!1}}}})))()}var lr;function init_pattern(){return(init_pattern=e((()=>{lr=`<!-- wp:cover {"customOverlayColor":"#eb4c77","contentPosition":"center center","isDark":false,"align":"full","style":{"spacing":{"padding":{"top":"6vw","right":"6vw","bottom":"6vw","left":"6vw"},"margin":{"top":"0"}}}} -->
<div class="wp-block-cover alignfull is-light" style="margin-top:0;padding-top:6vw;padding-right:6vw;padding-bottom:6vw;padding-left:6vw"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-100 has-background-dim" style="background-color:#eb4c77"></span><div class="wp-block-cover__inner-container"><!-- wp:group {"style":{"spacing":{"blockGap":"0vw"}},"layout":{"type":"flex","flexWrap":"wrap","justifyContent":"center","verticalAlignment":"top"}} -->
<div class="wp-block-group"><!-- wp:group {"align":"wide","style":{"spacing":{"blockGap":"0px"},"layout":{"selfStretch":"fill"}},"layout":{"type":"constrained","justifyContent":"left","contentSize":"600px"}} -->
<div class="wp-block-group alignwide"><!-- wp:heading {"textAlign":"left","align":"wide","style":{"typography":{"fontSize":"100px","textTransform":"none","fontStyle":"normal","fontWeight":"500","lineHeight":"0.9"}},"textColor":"contrast"} -->
<h2 class="wp-block-heading alignwide has-text-align-left has-contrast-color has-text-color" style="font-size:100px;font-style:normal;font-weight:500;line-height:0.9;text-transform:none">Time for an adventure</h2>
<!-- /wp:heading -->

<!-- wp:spacer {"height":"24px"} -->
<div style="height:24px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:paragraph {"align":"left","textColor":"contrast"} -->
<p class="has-text-align-left has-contrast-color has-text-color">Explore our network of trails that lead through a variety of woodland habitats and observe the diverse flora that call this area home. </p>
<!-- /wp:paragraph -->

<!-- wp:spacer {"height":"60px"} -->
<div style="height:60px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"left","flexWrap":"nowrap"}} -->
<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"contrast","textColor":"base","style":{"spacing":{"padding":{"top":"24px","right":"48px","bottom":"24px","left":"48px"}},"typography":{"fontSize":"16px","fontStyle":"normal","fontWeight":"500","textTransform":"uppercase","letterSpacing":"0px"},"border":{"radius":"0px"}},"className":"is-style-fill"} -->
<div class="wp-block-button has-custom-font-size is-style-fill" style="font-size:16px;font-style:normal;font-weight:500;letter-spacing:0px;text-transform:uppercase"><a class="wp-block-button__link has-base-color has-contrast-background-color has-text-color has-background wp-element-button" style="border-radius:0px;padding-top:24px;padding-right:48px;padding-bottom:24px;padding-left:48px">Sign up</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"layout":{"selfStretch":"fit","flexSize":null},"spacing":{"blockGap":"24px"}},"layout":{"type":"flex","flexWrap":"nowrap","verticalAlignment":"top","justifyContent":"right"}} -->
<div class="wp-block-group"><!-- wp:group {"style":{"layout":{"selfStretch":"fixed","flexSize":"50%"}},"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:spacer {"height":"8vw"} -->
<div style="height:8vw" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

</div>
<!-- /wp:group -->

</div>
<!-- /wp:group --></div>
<!-- /wp:group --></div></div>
<!-- /wp:cover -->`})))()}function EnableZoomOut({zoomLevel:e}){let{setZoomLevel:t}=ur(je(oe));return(0,a.useEffect)(()=>{t(e?e/100:`auto-scaled`)},[t,e]),null}function EditorZoomOut({zoomLevel:e,direction:t=`ltr`}){let[n,r]=(0,a.useState)([]);return(0,a.useEffect)(()=>{r(f(lr))},[]),(0,Q.jsx)(`div`,{className:`editor-zoom-out`,onKeyDown:e=>e.stopPropagation(),style:{border:`1px solid gray`},children:(0,Q.jsxs)(Ie,{value:n,onInput:r,onChange:r,children:[(0,Q.jsx)(EnableZoomOut,{zoomLevel:e}),(0,Q.jsx)(De,{height:`500px`,styles:J[t],children:(0,Q.jsx)(Re,{})})]})})}var Q,ur;function init_zoom_out(){return(init_zoom_out=e((()=>{i(),Me(),y(),Oe(),te(),init_pattern(),init_editor_styles(),Q=r(),{unlock:ur}=ke(`I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.`,`@wordpress/edit-site`),EditorZoomOut.__docgenInfo={description:``,methods:[],displayName:`EditorZoomOut`,props:{direction:{defaultValue:{value:`'ltr'`,computed:!1},required:!1}}}})))()}var $,dr,_default,Box,UndoRedo,ZoomOut;function init_index_story(){return(init_index_story=e((()=>{Ge(),init_fullpage(),init_box(),init_with_undo_redo(),init_zoom_out(),$=r(),Ue(),dr={title:`Playground/Block Editor`,parameters:{sourceLink:`storybook/stories/playground`}},_default=(e,{globals:t})=>(0,$.jsx)(EditorFullPage,{direction:t.direction}),_default.parameters={sourceLink:`storybook/stories/playground/fullpage/index.jsx`},Box=(e,{globals:t})=>(0,$.jsx)(EditorBox,{direction:t.direction}),Box.parameters={sourceLink:`storybook/stories/playground/box/index.jsx`},UndoRedo=(e,{globals:t})=>(0,$.jsx)(EditorWithUndoRedo,{direction:t.direction}),UndoRedo.parameters={sourceLink:`storybook/stories/playground/with-undo-redo/index.jsx`},ZoomOut=(e,{globals:t})=>(0,$.jsx)(EditorZoomOut,{...e,direction:t.direction}),ZoomOut.parameters={sourceLink:`storybook/stories/playground/zoom-out/index.jsx`},ZoomOut.argTypes={zoomLevel:{control:{type:`range`,min:10,max:100,step:5}}},_default.__docgenInfo={description:``,methods:[],displayName:`_default`},Box.__docgenInfo={description:``,methods:[],displayName:`Box`},UndoRedo.__docgenInfo={description:``,methods:[],displayName:`UndoRedo`},ZoomOut.__docgenInfo={description:``,methods:[],displayName:`ZoomOut`},_default.parameters={..._default.parameters,docs:{..._default.parameters?.docs,source:{originalSource:`(_args, {
  globals
}) => {
  return <EditorFullPage direction={globals.direction} />;
}`,..._default.parameters?.docs?.source}}},Box.parameters={...Box.parameters,docs:{...Box.parameters?.docs,source:{originalSource:`(_args, {
  globals
}) => {
  return <EditorBox direction={globals.direction} />;
}`,...Box.parameters?.docs?.source}}},UndoRedo.parameters={...UndoRedo.parameters,docs:{...UndoRedo.parameters?.docs,source:{originalSource:`(_args, {
  globals
}) => {
  return <EditorWithUndoRedo direction={globals.direction} />;
}`,...UndoRedo.parameters?.docs?.source}}},ZoomOut.parameters={...ZoomOut.parameters,docs:{...ZoomOut.parameters?.docs,source:{originalSource:`(props, {
  globals
}) => {
  return <EditorZoomOut {...props} direction={globals.direction} />;
}`,...ZoomOut.parameters?.docs?.source}}}})))()}init_index_story();export{Box,UndoRedo,ZoomOut,_default,dr as default};