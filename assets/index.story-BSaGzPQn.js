import{n as e,r as t}from"./rolldown-runtime-Db01ssZC.js";import{t as n}from"./jsx-runtime-BxZPLZy3.js";import{n as r,t as i}from"./react-Cd8OJmTE.js";import{n as a,t as o}from"./create-interpolate-element-Bfzztl6e.js";import{n as s,r as c,t as l}from"./build-module-CqL0UdL5.js";import{E as u,Fl as d,Kr as ee,Lc as te,Pt as ne,Wi as re,Xr as ie,cn as ae,jc as oe,ls as se,n as ce,pl as le}from"./build-module-trvfBEgq.js";import{i as ue,n as de,r as fe,t as pe}from"./content-DqHWrl1x.js";import{i as me,n as he,r as ge,t as _e}from"./title-CARphxze.js";import{n as ve,t as ye}from"./full-bleed-DdGfxZU2.js";import{n as be,t as f}from"./stack-yNRxuGKo.js";import{d as p,f as xe}from"./input-control-DKm8NPKG.js";import{n as Se,t as Ce}from"./button-D7FKMz7R.js";import{n as we,t as Te}from"./component-XMwl5yne.js";import{_ as m,d as h,f as g,p as _,x as v}from"./field-types-DgHUDkZS.js";import{n as y,t as b}from"./filter-sort-and-paginate-HtsktlwS.js";import{n as x,t as S}from"./dataviews--WFcbCDy.js";import{i as C,n as w,r as T,t as E}from"./fixtures-DlQvCY8e.js";var D,Ee,De,Oe,ke,LayoutActivityComponent;function init_layout_activity(){return(init_layout_activity=e((()=>{r(),ce(),Se(),xe(),be(),x(),v(),y(),D=n(),Ee={status:oe,payment:ie,email:se,fulfillment:le,shipping:ae,review:ne},De=[{id:13,name:{title:`Customer Review Received`,description:`Customer left a 5-star review: "Great product and fast shipping!"`},type:`review`,categories:[`Review`,`Customer`],date:`2025-01-22`,datetime:`2025-01-22T19:45:33Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:1,name:{title:`Order Created`,description:`Order #2502 was created.`},type:`status`,categories:[`Order`,`Status`],date:`2025-01-15`,datetime:`2025-01-15T09:23:15Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:2,name:{title:`Payment Received`,description:`Payment through Credit Card accepted.`},type:`payment`,categories:[`Payment`,`Credit Card`],date:`2025-01-15`,datetime:`2025-01-15T09:23:47Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:3,name:{title:`Order Confirmation Sent`,description:`Order confirmation #1259 sent to buzz.lightyear@fictional-store.test`},type:`email`,categories:[`Email`,`Communication`],date:`2025-01-15`,datetime:`2025-01-15T09:24:02Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:4,name:{title:`Private Note Added`,description:`Buyer has requested to wait a couple days to send the order, they are not going to be home until the weekend.`},type:`note`,categories:[`Note`,`Internal`],date:`2025-01-15`,datetime:`2025-01-15T14:32:18Z`,email:`store.admin@fictional-store.test`,orderNumber:`#2502`},{id:5,name:{title:`Status Changed to Processing`,description:`Order status automatically changed from pending to processing.`},type:`status`,categories:[`Order`,`Status`],date:`2025-01-15`,datetime:`2025-01-15T14:35:00Z`,orderNumber:`#2502`},{id:6,name:{title:`Customer Note Added`,description:`Customer added note: "Please leave the package at the back door. Thank you!"`},type:`note`,categories:[`Note`,`Customer`],date:`2025-01-16`,datetime:`2025-01-16T08:15:42Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:7,name:{title:`Items Packed`,description:`All items have been packed and are ready for shipment.`},type:`fulfillment`,categories:[`Fulfillment`,`Warehouse`],date:`2025-01-18`,datetime:`2025-01-18T10:22:33Z`,orderNumber:`#2502`},{id:8,name:{title:`Shipping Label Created`,description:`Shipping label created with USPS Priority Mail. Tracking #9400111899562854217803`},type:`shipping`,categories:[`Shipping`,`USPS`],date:`2025-01-18`,datetime:`2025-01-18T11:05:14Z`,orderNumber:`#2502`},{id:9,name:{title:`Order Shipped`,description:`Order has been shipped via USPS Priority Mail. Expected delivery: Jan 20, 2025`},type:`shipping`,categories:[`Shipping`,`Status`],date:`2025-01-18`,datetime:`2025-01-18T16:42:09Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:10,name:{title:`Shipment Notification Sent`,description:`Shipment notification email with tracking information sent to customer.`},type:`email`,categories:[`Email`,`Communication`],date:`2025-01-18`,datetime:`2025-01-18T16:42:25Z`,email:`buzz.lightyear@fictional-store.test`,orderNumber:`#2502`},{id:11,name:{title:`Package Out for Delivery`,description:`Package is out for delivery with carrier. Delivery expected today.`},type:`shipping`,categories:[`Shipping`,`Tracking`],date:`2025-01-20`,datetime:`2025-01-20T08:15:00Z`,orderNumber:`#2502`},{id:12,name:{title:`Order Delivered`,description:`Order successfully delivered and left at back door.`},type:`status`,categories:[`Order`,`Status`,`Delivered`],date:`2025-01-20`,datetime:`2025-01-20T14:32:51Z`,orderNumber:`#2502`},{id:14,name:{title:`Order Created`,description:`Order #2503 was created.`},type:`status`,categories:[`Order`,`Status`],date:`2025-01-16`,datetime:`2025-01-16T10:15:30Z`,email:`woody.pride@fictional-store.test`,orderNumber:`#2503`},{id:15,name:{title:`Payment Received`,description:`Payment through PayPal accepted.`},type:`payment`,categories:[`Payment`,`PayPal`],date:`2025-01-16`,datetime:`2025-01-16T10:16:05Z`,email:`woody.pride@fictional-store.test`,orderNumber:`#2503`},{id:16,name:{title:`Order Confirmation Sent`,description:`Order confirmation #1260 sent to woody.pride@fictional-store.test`},type:`email`,categories:[`Email`,`Communication`],date:`2025-01-16`,datetime:`2025-01-16T10:16:18Z`,email:`woody.pride@fictional-store.test`,orderNumber:`#2503`},{id:17,name:{title:`Order Created`,description:`Order #2501 was created.`},type:`status`,categories:[`Order`,`Status`],date:`2025-01-14`,datetime:`2025-01-14T14:22:45Z`,email:`rex.green@fictional-store.test`,orderNumber:`#2501`},{id:18,name:{title:`Payment Received`,description:`Payment through Stripe accepted.`},type:`payment`,categories:[`Payment`,`Stripe`],date:`2025-01-14`,datetime:`2025-01-14T14:23:12Z`,email:`rex.green@fictional-store.test`,orderNumber:`#2501`},{id:19,name:{title:`Order Shipped`,description:`Order has been shipped via FedEx Ground. Expected delivery: Jan 18, 2025`},type:`shipping`,categories:[`Shipping`,`Status`],date:`2025-01-15`,datetime:`2025-01-15T11:30:00Z`,email:`rex.green@fictional-store.test`,orderNumber:`#2501`},{id:20,name:{title:`Order Delivered`,description:`Order successfully delivered and signed for.`},type:`status`,categories:[`Order`,`Status`,`Delivered`],date:`2025-01-18`,datetime:`2025-01-18T13:45:22Z`,orderNumber:`#2501`},{id:21,name:{title:`Order Created`,description:`Order #2504 was created.`},type:`status`,categories:[`Order`,`Status`],date:`2025-01-17`,datetime:`2025-01-17T16:40:15Z`,email:`jessie.cowgirl@fictional-store.test`,orderNumber:`#2504`},{id:22,name:{title:`Payment Received`,description:`Payment through Apple Pay accepted.`},type:`payment`,categories:[`Payment`,`Apple Pay`],date:`2025-01-17`,datetime:`2025-01-17T16:40:42Z`,email:`jessie.cowgirl@fictional-store.test`,orderNumber:`#2504`},{id:23,name:{title:`Private Note Added`,description:`Customer requested gift wrapping with a personalized note.`},type:`note`,categories:[`Note`,`Internal`],date:`2025-01-17`,datetime:`2025-01-17T17:15:00Z`,email:`store.admin@fictional-store.test`,orderNumber:`#2504`}],Oe=[{label:`Icon`,id:`icon`,type:`media`,render:({item:e})=>(0,D.jsx)(d,{icon:Ee[e.type]||ee}),enableSorting:!1},{label:`Order`,id:`orderNumber`,type:`text`,enableHiding:!0,enableSorting:!1},{label:`Title`,id:`title`,type:`text`,enableHiding:!0,enableGlobalSearch:!0,getValue:({item:e})=>e.name.title,enableSorting:!1,filterBy:{operators:[`contains`,`notContains`,`startsWith`]}},{label:`Description`,id:`description`,type:`text`,enableSorting:!1,enableGlobalSearch:!0,getValue:({item:e})=>e.name.description,filterBy:{operators:[`contains`,`notContains`,`startsWith`]}},{id:`date`,label:`Date`,type:`date`,enableSorting:!1,render:({item:e})=>(0,D.jsx)(`span`,{children:new Date(e.date).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`})})},{id:`time`,label:`Time`,type:`datetime`,enableSorting:!1,getValue:({item:e})=>e.datetime,render:({item:e})=>(0,D.jsx)(`span`,{children:new Date(e.datetime).toLocaleTimeString(`en-US`,{hour:`numeric`,minute:`2-digit`,hour12:!0})})},{id:`datetime`,label:`Datetime`,type:`datetime`,enableSorting:!1,render:({item:e})=>(0,D.jsxs)(`span`,{children:[new Date(e.datetime).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`}),` `,new Date(e.datetime).toLocaleTimeString(`en-US`,{hour:`numeric`,minute:`2-digit`,hour12:!0})]})},{label:`Type`,id:`type`,enableHiding:!1,enableSorting:!1,elements:[{value:`status`,label:`Status`},{value:`payment`,label:`Payment`},{value:`email`,label:`Email`},{value:`note`,label:`Note`},{value:`fulfillment`,label:`Fulfillment`},{value:`shipping`,label:`Shipping`},{value:`review`,label:`Review`}],filterBy:{operators:[`is`,`isNot`]}},{label:`Email`,id:`email`,type:`email`,enableSorting:!1},{label:`Categories`,id:`categories`,header:(0,D.jsxs)(f,{direction:`row`,gap:`sm`,justify:`start`,align:`center`,children:[(0,D.jsx)(d,{icon:te}),(0,D.jsx)(`span`,{style:{minWidth:0},children:`Categories`})]}),elements:[{value:`Order`,label:`Order`},{value:`Status`,label:`Status`},{value:`Payment`,label:`Payment`},{value:`Credit Card`,label:`Credit Card`},{value:`Email`,label:`Email`},{value:`Communication`,label:`Communication`},{value:`Note`,label:`Note`},{value:`Internal`,label:`Internal`},{value:`Customer`,label:`Customer`},{value:`Fulfillment`,label:`Fulfillment`},{value:`Warehouse`,label:`Warehouse`},{value:`Shipping`,label:`Shipping`},{value:`USPS`,label:`USPS`},{value:`Tracking`,label:`Tracking`},{value:`Delivered`,label:`Delivered`},{value:`Review`,label:`Review`}],type:`array`,enableGlobalSearch:!0,enableSorting:!1}],ke=[{id:`view-note`,label:`View`,isPrimary:!0,icon:re,isEligible:e=>e.type===`note`,callback:e=>{let t=e[0];alert(`View item: "${t.name.title}"\n\n${t.name.description}`)}},{id:`delete-note`,label:`Delete`,icon:u,isEligible:e=>e.type===`note`,modalHeader:e=>e.length>1?`Delete ${e.length} items`:`Delete ${e[0].name.title}`,modalFocusOnMount:`firstContentElement`,supportsBulk:!0,RenderModal:({items:e,closeModal:t})=>{let n=e.length>1?`Are you sure you want to delete ${e.length} items?`:`Are you sure you want to delete "${e[0].name.title}"?`,onSubmit=()=>{let n=e[0];alert(`Delete note: "${n.name.title}"\n\n${n.name.description}`),t?.()};return(0,D.jsxs)(f,{direction:`column`,gap:`xl`,children:[(0,D.jsx)(p,{children:n}),(0,D.jsxs)(f,{direction:`row`,gap:`sm`,justify:`right`,children:[(0,D.jsx)(Ce,{__next40pxDefaultSize:!0,variant:`tertiary`,onClick:t,children:`Cancel`}),(0,D.jsx)(Ce,{__next40pxDefaultSize:!0,variant:`primary`,onClick:onSubmit,children:`Delete`})]})]})}}],LayoutActivityComponent=({backgroundColor:e,fullWidth:t=!1,hasClickableItems:n=!0,groupBy:r=!0,groupByLabel:a=!0,perPageSizes:o=[10,25,50,100],showMedia:s=!0})=>{let[c,l]=(0,i.useState)({type:h,search:``,page:1,perPage:20,filters:[],fields:[`time`,`categories`,`orderNumber`],titleField:`title`,descriptionField:`description`,mediaField:`icon`,showMedia:s,sort:{field:`datetime`,direction:`asc`},groupBy:r?{field:`date`,direction:`asc`,showLabel:a}:void 0});(0,i.useEffect)(()=>{l(e=>({...e,groupBy:r?{field:`date`,direction:`asc`,showLabel:a}:void 0,showMedia:s}))},[s,r,a]);let{data:u,paginationInfo:d}=(0,i.useMemo)(()=>b(De,c,Oe),[c]);return(0,D.jsx)(`div`,{style:{height:`100%`,maxWidth:t?void 0:`400px`,"--wp-dataviews-color-background":e},children:(0,D.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:d,data:u,view:c,fields:Oe,onChangeView:l,actions:ke,isItemClickable:()=>n,defaultLayouts:{[h]:{sort:{field:`datetime`,direction:`asc`}}},config:{perPageSizes:o}})})};try{LayoutActivityComponent.__docgenInfo={description:``,displayName:`layoutactivity`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,methods:[],props:{backgroundColor:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`backgroundColor`,required:!1,tags:{},type:{name:`string`}},fullWidth:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`fullWidth`,required:!1,tags:{},type:{name:`boolean`}},hasClickableItems:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`hasClickableItems`,required:!1,tags:{},type:{name:`boolean`}},groupBy:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`groupBy`,required:!1,tags:{},type:{name:`boolean`}},groupByLabel:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`groupByLabel`,required:!1,tags:{},type:{name:`boolean`}},perPageSizes:{defaultValue:{value:`[ 10, 25, 50, 100 ]`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`perPageSizes`,required:!1,tags:{},type:{name:`number[]`}},showMedia:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-activity.tsx`,name:`TypeLiteral`}],description:``,name:`showMedia`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var O,LayoutTableComponent$2;function init_layout_table(){return(init_layout_table=e((()=>{r(),x(),v(),y(),C(),O=n(),LayoutTableComponent$2=({backgroundColor:e,hasClickableItems:t=!0,groupBy:n=!1,groupByLabel:r=!0,perPageSizes:a=[10,25,50,100],showMedia:o=!0})=>{let[s,c]=(0,i.useState)({type:m,search:``,page:1,perPage:10,layout:{},filters:[],fields:[`categories`],titleField:`title`,descriptionField:`description`,mediaField:`image`,showMedia:o});(0,i.useEffect)(()=>{c(e=>({...e,groupBy:n?{field:`type`,direction:`asc`,showLabel:r}:void 0,showMedia:o}))},[n,r,o]);let{data:l,paginationInfo:u}=(0,i.useMemo)(()=>b(w,s,T),[s]);return(0,O.jsx)(`div`,{style:{height:`100%`,"--wp-dataviews-color-background":e},children:(0,O.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:u,data:l,view:s,fields:T,onChangeView:c,actions:E,renderItemLink:({item:e,...t})=>(0,O.jsx)(`button`,{style:{background:`none`,border:`none`,padding:0},onClick:()=>{alert(`Clicked: `+e.name.title)},...t}),isItemClickable:()=>t,defaultLayouts:{[m]:!0},config:{perPageSizes:a}})})};try{LayoutTableComponent$2.__docgenInfo={description:``,displayName:`LayoutTableComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,methods:[],props:{backgroundColor:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`backgroundColor`,required:!1,tags:{},type:{name:`string`}},hasClickableItems:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`hasClickableItems`,required:!1,tags:{},type:{name:`boolean`}},groupBy:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`groupBy`,required:!1,tags:{},type:{name:`boolean`}},groupByLabel:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`groupByLabel`,required:!1,tags:{},type:{name:`boolean`}},perPageSizes:{defaultValue:{value:`[ 10, 25, 50, 100 ]`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`perPageSizes`,required:!1,tags:{},type:{name:`number[]`}},showMedia:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-table.tsx`,name:`TypeLiteral`}],description:``,name:`showMedia`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var k,LayoutTableComponent$1;function init_layout_grid(){return(init_layout_grid=e((()=>{r(),x(),v(),y(),C(),k=n(),LayoutTableComponent$1=({backgroundColor:e,hasClickableItems:t=!0,groupBy:n=!1,groupByLabel:r=!0,mediaFit:a=`cover`,mediaFitControl:o=!0,perPageSizes:s=[10,25,50,100],showMedia:c=!0})=>{let[l,u]=(0,i.useState)({type:g,search:``,page:1,perPage:10,filters:[],fields:[`categories`],titleField:`title`,descriptionField:`description`,mediaField:`image`,showMedia:c,layout:{mediaFit:a}});(0,i.useEffect)(()=>{u(e=>({...e,groupBy:n?{field:`type`,direction:`asc`,showLabel:r}:void 0,showMedia:c,layout:{...e.layout,mediaFit:a}}))},[n,r,a,c]);let{data:d,paginationInfo:ee}=(0,i.useMemo)(()=>b(w,l,T),[l]);return(0,k.jsx)(`div`,{style:{height:`100%`,"--wp-dataviews-color-background":e},children:(0,k.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:ee,data:d,view:l,fields:T,onChangeView:u,actions:E,renderItemLink:({item:e,...t})=>(0,k.jsx)(`button`,{style:{background:`none`,border:`none`,padding:0},onClick:()=>{alert(`Clicked: `+e.name.title)},...t}),isItemClickable:()=>t,defaultLayouts:{[g]:!0},config:{perPageSizes:s,mediaFitControl:o}})})};try{LayoutTableComponent$1.__docgenInfo={description:``,displayName:`LayoutTableComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,methods:[],props:{backgroundColor:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`backgroundColor`,required:!1,tags:{},type:{name:`string`}},hasClickableItems:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`hasClickableItems`,required:!1,tags:{},type:{name:`boolean`}},groupBy:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`groupBy`,required:!1,tags:{},type:{name:`boolean`}},groupByLabel:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`groupByLabel`,required:!1,tags:{},type:{name:`boolean`}},mediaFit:{defaultValue:{value:`cover`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`mediaFit`,required:!1,tags:{},type:{name:`enum`,raw:`MediaFit`,value:[{value:`"cover"`},{value:`"contain"`}]}},mediaFitControl:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`mediaFitControl`,required:!1,tags:{},type:{name:`boolean`}},perPageSizes:{defaultValue:{value:`[ 10, 25, 50, 100 ]`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`perPageSizes`,required:!1,tags:{},type:{name:`number[]`}},showMedia:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-grid.tsx`,name:`TypeLiteral`}],description:``,name:`showMedia`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var A,LayoutTableComponent;function init_layout_list(){return(init_layout_list=e((()=>{r(),x(),v(),y(),C(),A=n(),LayoutTableComponent=({backgroundColor:e,fullWidth:t=!1,hasClickableItems:n=!0,groupBy:r=!1,groupByLabel:a=!0,perPageSizes:o=[10,25,50,100],showMedia:s=!0})=>{let[c,l]=(0,i.useState)({type:_,search:``,page:1,perPage:10,filters:[],fields:[`categories`],titleField:`title`,descriptionField:`description`,mediaField:`image`,showMedia:s});(0,i.useEffect)(()=>{l(e=>({...e,groupBy:r?{field:`type`,direction:`asc`,showLabel:a}:void 0,showMedia:s}))},[r,a,s]);let{data:u,paginationInfo:d}=(0,i.useMemo)(()=>b(w,c,T),[c]);return(0,A.jsx)(`div`,{style:{height:`100%`,maxWidth:t?void 0:`400px`,"--wp-dataviews-color-background":e},children:(0,A.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:d,data:u,view:c,fields:T,onChangeView:l,actions:E,renderItemLink:({item:e,...t})=>(0,A.jsx)(`button`,{style:{background:`none`,border:`none`,padding:0},onClick:()=>{alert(`Clicked: `+e.name.title)},...t}),isItemClickable:()=>n,defaultLayouts:{[_]:!0},config:{perPageSizes:o}})})};try{LayoutTableComponent.__docgenInfo={description:``,displayName:`LayoutTableComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,methods:[],props:{backgroundColor:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`backgroundColor`,required:!1,tags:{},type:{name:`string`}},fullWidth:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`fullWidth`,required:!1,tags:{},type:{name:`boolean`}},hasClickableItems:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`hasClickableItems`,required:!1,tags:{},type:{name:`boolean`}},groupBy:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`groupBy`,required:!1,tags:{},type:{name:`boolean`}},groupByLabel:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`groupByLabel`,required:!1,tags:{},type:{name:`boolean`}},perPageSizes:{defaultValue:{value:`[ 10, 25, 50, 100 ]`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`perPageSizes`,required:!1,tags:{},type:{name:`number[]`}},showMedia:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-list.tsx`,name:`TypeLiteral`}],description:``,name:`showMedia`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}function PosterGrid({items:e}){return(0,j.jsx)(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(auto-fill, minmax(280px, 1fr))`,gap:`16px`,padding:`16px 0`},children:e.map(e=>(0,j.jsx)(`div`,{style:{position:`relative`,aspectRatio:`4 / 3`,borderRadius:`8px`,overflow:`hidden`,backgroundImage:`url(${e.image})`,backgroundSize:`cover`,backgroundPosition:`center`},children:(0,j.jsxs)(`div`,{style:{position:`absolute`,bottom:0,left:0,right:0,padding:`48px 16px 16px`,background:`linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)`,color:`white`},children:[(0,j.jsx)(`h3`,{style:{margin:`0 0 4px`,fontSize:`18px`,fontWeight:`var(--wpds-typography-font-weight-emphasis, 600)`,textShadow:`0 1px 2px rgba(0,0,0,0.5)`},children:e.name.title}),(0,j.jsx)(`p`,{style:{margin:`0 0 8px`,fontSize:`13px`,opacity:.9,overflow:`hidden`,textOverflow:`ellipsis`,whiteSpace:`nowrap`},children:e.name.description}),(0,j.jsx)(`div`,{style:{display:`flex`,gap:`6px`},children:e.categories.slice(0,2).map(e=>(0,j.jsx)(`span`,{style:{fontSize:`11px`,padding:`2px 8px`,borderRadius:`4px`,backgroundColor:`rgba(255,255,255,0.2)`},children:e},e))})]})},e.id))})}var j,LayoutCustomComponent;function init_layout_custom(){return(init_layout_custom=e((()=>{r(),x(),y(),C(),v(),j=n(),LayoutCustomComponent=({containerHeight:e})=>{let[t,n]=(0,i.useState)({type:m,search:``,page:1,perPage:6,filters:[],fields:[]}),{data:r,paginationInfo:a}=(0,i.useMemo)(()=>b(w,t,T),[t]);return(0,j.jsxs)(S,{getItemId:e=>e.id.toString(),paginationInfo:a,data:r,view:t,fields:T,onChangeView:n,defaultLayouts:{table:!0},children:[(0,j.jsxs)(`div`,{style:{padding:`2px`,height:e},children:[(0,j.jsx)(S.Search,{}),(0,j.jsx)(PosterGrid,{items:r})]}),(0,j.jsx)(S.Pagination,{})]})};try{LayoutCustomComponent.__docgenInfo={description:`Demonstrates a custom poster/hero layout using free composition.

This story shows how to:
- Use \`<DataViews>\` as a context provider with custom children
- Render a completely custom layout (poster grid) instead of \`<DataViews.Layout />\`
- Still leverage DataViews sub-components for search and pagination`,displayName:`LayoutCustomComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/layout-custom.tsx`,methods:[],props:{containerHeight:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/layout-custom.tsx`,name:`TypeLiteral`}],description:``,name:`containerHeight`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}function sortByHierarchy(e,t){let{data:n}=b(e,{...t,page:void 0,perPage:void 0},T),r=n;if(t.showLevels){let e=new Map;n.forEach(t=>{e.set(t.parent,[...e.get(t.parent)??[],t])}),r=[];let visit=t=>{(e.get(t)??[]).forEach(e=>{r.push(e),visit(e.id)}),e.delete(t)};visit(null),Array.from(e.keys()).forEach(visit)}let i=t.page??1,a=t.perPage??r.length;return{data:r.slice((i-1)*a,i*a),paginationInfo:{totalItems:r.length,totalPages:Math.ceil(r.length/a)}}}var Ae,HierarchicalLevelsComponent;function init_hierarchical_levels(){return(init_hierarchical_levels=e((()=>{r(),x(),v(),y(),C(),Ae=n(),HierarchicalLevelsComponent=({showLevels:e=!0})=>{let[t,n]=(0,i.useState)({type:m,search:``,page:1,perPage:50,layout:{},filters:[],fields:[`type`,`parent`],sort:{field:`title`,direction:`asc`},titleField:`title`,mediaField:`image`,showLevels:!0});(0,i.useEffect)(()=>{n(t=>({...t,showLevels:e}))},[e]);let{data:r,paginationInfo:a}=sortByHierarchy(w,t);return(0,Ae.jsx)(S,{getItemId:e=>e.id.toString(),getItemLevel:e=>e.level,data:r,paginationInfo:a,view:t,onChangeView:n,fields:T,defaultLayouts:{table:!0}})};try{HierarchicalLevelsComponent.__docgenInfo={description:``,displayName:`hierarchicallevels`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/hierarchical-levels.tsx`,methods:[],props:{showLevels:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/hierarchical-levels.tsx`,name:`TypeLiteral`}],description:``,name:`showLevels`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var M,InfiniteScroll$1;function init_infinite_scroll(){return(init_infinite_scroll=e((()=>{r(),x(),v(),y(),C(),M=n(),InfiniteScroll$1=()=>{let[e,t]=(0,i.useState)({type:g,search:``,startPosition:1,perPage:15,filters:[],fields:[`satellites`],titleField:`title`,descriptionField:`description`,mediaField:`image`,infiniteScrollEnabled:!0}),{data:n,paginationInfo:r}=(0,i.useMemo)(()=>b(w,e,T),[e]);return(0,M.jsxs)(M.Fragment,{children:[(0,M.jsx)(`style`,{children:`
			.dataviews-wrapper {
				height: 750px;
				overflow: auto;
			}
		`}),(0,M.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:r,data:n,view:e,fields:T,onChangeView:t,actions:E,defaultLayouts:{[m]:!0,[g]:!0,[_]:!0,[h]:!0}})]})}})))()}var N,P,F,je,AsyncInfiniteScroll$1;function init_async_infinite_scroll(){return(init_async_infinite_scroll=e((()=>{r(),x(),v(),y(),C(),N=n(),P=Array.from({length:8},(e,t)=>w.map(e=>({...e,id:e.id+t*1e3,name:{...e.name,title:`${e.name.title} #${t+1}`}}))).flat(),F=20,je=800,AsyncInfiniteScroll$1=()=>{let[e,t]=(0,i.useState)({type:_,search:``,startPosition:1,perPage:F,filters:[],fields:[`satellites`],titleField:`title`,descriptionField:`description`,mediaField:`image`,infiniteScrollEnabled:!0}),[n,r]=(0,i.useState)(F),[a,o]=(0,i.useState)(!1),s=e.startPosition??1,c=e.perPage??F,l=Math.min(s-1+c,P.length);(0,i.useEffect)(()=>{if(l<=n)return;o(!0);let e=setTimeout(()=>{r(l),o(!1)},je);return()=>clearTimeout(e)},[l,n]);let u=(0,i.useMemo)(()=>P.slice(0,n),[n]),{data:d,paginationInfo:ee}=(0,i.useMemo)(()=>b(u,e,T),[u,e]),te=(0,i.useMemo)(()=>({...ee,totalItems:P.length}),[ee]);return(0,N.jsxs)(`div`,{style:{height:`100%`},children:[(0,N.jsx)(`style`,{children:`
			.dataviews-wrapper {
				height: 100%;
				overflow: auto;
			}
		`}),(0,N.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:te,data:d,view:e,fields:T,onChangeView:t,isLoading:a,actions:E,defaultLayouts:{[m]:!0,[g]:!0,[_]:!0}})]})};try{AsyncInfiniteScroll$1.__docgenInfo={description:"A realistic network-backed infinite-scroll consumer: the hook advances\n`view.startPosition`, and the consumer fetches that window asynchronously\n(toggling `isLoading`) while reporting the true server total.",displayName:`asyncinfinitescroll`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/async-infinite-scroll.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var I,WithCardComponent;function init_with_card(){return(init_with_card=e((()=>{r(),ue(),me(),he(),de(),ve(),x(),v(),y(),C(),I=n(),WithCardComponent=({containerHeight:e})=>{let[t,n]=(0,i.useState)({type:m,search:``,page:1,perPage:10,layout:{},filters:[],fields:[`categories`],titleField:`title`,descriptionField:`description`,mediaField:`image`}),{data:r,paginationInfo:a}=(0,i.useMemo)(()=>b(w,t,T),[t]);return(0,I.jsxs)(fe,{children:[(0,I.jsx)(ge,{children:(0,I.jsx)(_e,{children:`Header`})}),(0,I.jsx)(pe,{style:{height:e,minHeight:0},children:(0,I.jsx)(ye,{children:(0,I.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:a,data:r,view:t,fields:T,onChangeView:n,actions:E.filter(e=>!e.supportsBulk),defaultLayouts:{[m]:!0,[g]:!0,[_]:!0,[h]:!0}})})})]})};try{WithCardComponent.__docgenInfo={description:``,displayName:`withcard`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/with-card.tsx`,methods:[],props:{containerHeight:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/with-card.tsx`,name:`TypeLiteral`}],description:``,name:`containerHeight`,required:!0,tags:{},type:{name:`string`}}},tags:{}}}catch{}})))()}var Me,Ne,Pe,L;function init_style_module(){return(init_style_module=e((()=>{Me=`_heading_13eda_1`,Ne=`_header_13eda_2`,Pe=`_empty_13eda_13`,L={heading:Me,header:Ne,empty:Pe}})))()}function PlanetOverview({planets:e}){let t=e.reduce((e,t)=>e+t.satellites,0);return(0,R.jsxs)(R.Fragment,{children:[(0,R.jsx)(Te,{className:L.heading,level:2,children:s(`Solar System numbers`)}),(0,R.jsx)(`div`,{className:L.header,children:(0,R.jsxs)(f,{direction:`column`,gap:`lg`,children:[(0,R.jsxs)(f,{direction:`row`,justify:`start`,gap:`sm`,children:[(0,R.jsx)(S.Search,{label:s(`Search content`)}),(0,R.jsx)(S.FiltersToggle,{}),(0,R.jsxs)(f,{direction:`row`,justify:`end`,gap:`sm`,style:{flex:1},children:[(0,R.jsx)(S.ViewConfig,{}),(0,R.jsx)(S.LayoutSwitcher,{})]})]}),(0,R.jsx)(S.FiltersToggled,{}),(0,R.jsx)(fe,{children:(0,R.jsx)(pe,{children:(0,R.jsxs)(f,{direction:`column`,gap:`sm`,children:[(0,R.jsx)(p,{size:18,as:`p`,children:o(c(`<PlanetsNumber /> planet`,`<PlanetsNumber /> planets`,e.length),{PlanetsNumber:(0,R.jsxs)(`strong`,{children:[e.length,` `]})})}),(0,R.jsx)(p,{size:18,as:`p`,children:o(c(`<SatellitesNumber /> moon`,`<SatellitesNumber /> moons`,t),{SatellitesNumber:(0,R.jsxs)(`strong`,{children:[t,` `]})})})]})})}),(0,R.jsx)(fe,{style:{width:`100%`},children:(0,R.jsx)(pe,{children:(0,R.jsx)(f,{direction:`row`,justify:`space-between`,align:`center`,gap:`sm`,children:(0,R.jsx)(S.Footer,{})})})})]})}),(0,R.jsx)(S.Layout,{})]})}var R,FreeCompositionComponent;function init_free_composition(){return(init_free_composition=e((()=>{r(),a(),we(),xe(),Se(),l(),ue(),de(),be(),x(),y(),C(),v(),init_style_module(),R=n(),FreeCompositionComponent=()=>{let[e,t]=(0,i.useState)({type:m,search:``,page:1,perPage:20,layout:{enableMoving:!1},filters:[],fields:[`categories`],titleField:`title`,descriptionField:`description`,mediaField:`image`}),{data:n,paginationInfo:r}=(0,i.useMemo)(()=>b(w,e,T),[e]),a=n.filter(e=>e.categories.includes(`Planet`));return(0,R.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:r,data:n,view:e,fields:T,actions:E,onChangeView:t,defaultLayouts:{table:!0,grid:!0},empty:(0,R.jsxs)(f,{direction:`column`,gap:`sm`,justify:`space-around`,align:`center`,className:L.empty,children:[(0,R.jsx)(p,{size:18,as:`p`,children:`No planets`}),(0,R.jsx)(p,{variant:`muted`,children:`Try a different search because “${e.search}” returned no results.`}),(0,R.jsx)(Ce,{variant:`secondary`,__next40pxDefaultSize:!0,children:`Create new planet`})]}),children:(0,R.jsx)(PlanetOverview,{planets:a})})};try{FreeCompositionComponent.__docgenInfo={description:"Demonstrates how to build a custom layout using DataViews sub-components.\n\nInstead of using the default DataViews UI, this story shows how to:\n- Use `<DataViews>` as a context provider (wrapping custom children)\n- Compose your own layout with built-in sub-components:\n  - `<DataViews.Search />` - Search input\n  - `<DataViews.FiltersToggle />` - Button to show/hide filters\n  - `<DataViews.FiltersToggled />` - The filter UI itself\n  - `<DataViews.Pagination />` - Page navigation\n  - `<DataViews.ViewConfig />` - View settings (columns, density, etc.)\n  - `<DataViews.LayoutSwitcher />` - Switch between table/grid/list views\n  - `<DataViews.Footer />` - Item count and pagination\n  - `<DataViews.Layout />` - The data display (table, grid, etc.)\n\nThis pattern is useful when you need full control over the UI layout\nwhile still leveraging DataViews' data management and state handling.",displayName:`FreeCompositionComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/free-composition.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var z,MinimalUIComponent;function init_minimal_ui(){return(init_minimal_ui=e((()=>{r(),x(),y(),C(),v(),z=n(),MinimalUIComponent=({layout:e=`table`})=>{let[t,n]=(0,i.useState)({type:m,search:``,page:1,perPage:10,layout:{enableMoving:!1},filters:[],fields:[`title`,`description`,`categories`]}),{data:r,paginationInfo:a}=(0,i.useMemo)(()=>b(w,t,T),[t]),o=T.map(e=>({...e,enableSorting:!1,enableHiding:!1,filterBy:!1}));return(0,i.useEffect)(()=>{n(t=>({...t,type:e}))},[e]),(0,z.jsxs)(S,{getItemId:e=>e.id.toString(),paginationInfo:a,data:r,view:t,fields:o,onChangeView:n,defaultLayouts:{[e]:!0},children:[(0,z.jsx)(S.Layout,{}),(0,z.jsx)(S.Footer,{})]})};try{MinimalUIComponent.__docgenInfo={description:``,displayName:`minimalui`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/minimal-ui.tsx`,methods:[],props:{layout:{defaultValue:{value:`table`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/minimal-ui.tsx`,name:`TypeLiteral`}],description:``,name:`layout`,required:!1,tags:{},type:{name:`enum`,raw:`"table" | "list" | "grid"`,value:[{value:`"table"`},{value:`"list"`},{value:`"grid"`}]}}},tags:{}}}catch{}})))()}var B,PlanetIllustration,CustomEmptyComponent,EmptyComponent;function init_empty(){return(init_empty=e((()=>{r(),xe(),be(),x(),v(),C(),B=n(),PlanetIllustration=()=>(0,B.jsxs)(`svg`,{width:`120`,height:`120`,viewBox:`0 0 120 120`,fill:`none`,style:{opacity:.6},children:[(0,B.jsx)(`circle`,{cx:`60`,cy:`60`,r:`35`,fill:`#9ca3af`}),(0,B.jsx)(`ellipse`,{cx:`60`,cy:`60`,rx:`55`,ry:`12`,stroke:`#9ca3af`,strokeWidth:`3`,fill:`none`})]}),CustomEmptyComponent=()=>(0,B.jsxs)(f,{direction:`column`,align:`center`,justify:`center`,gap:`md`,children:[(0,B.jsx)(PlanetIllustration,{}),(0,B.jsx)(p,{children:`No celestial bodies found`})]}),EmptyComponent=({customEmpty:e,isLoading:t})=>{let[n,r]=(0,i.useState)({type:m,search:``,page:1,perPage:10,layout:{},filters:[],fields:[`title`,`description`,`categories`]});return(0,B.jsx)(`div`,{style:{display:`flex`,flexDirection:`column`,height:`100%`},children:(0,B.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:{totalItems:0,totalPages:0},data:[],view:n,fields:T,onChangeView:r,actions:E,defaultLayouts:{[m]:!0,[g]:!0,[_]:!0,[h]:!0},isLoading:t,empty:e?(0,B.jsx)(CustomEmptyComponent,{}):void 0})})};try{EmptyComponent.__docgenInfo={description:``,displayName:`empty`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/empty.tsx`,methods:[],props:{customEmpty:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/empty.tsx`,name:`TypeLiteral`}],description:``,name:`customEmpty`,required:!1,tags:{},type:{name:`boolean`}},isLoading:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/empty.tsx`,name:`TypeLiteral`}],description:``,name:`isLoading`,required:!1,tags:{},type:{name:`boolean`}}},tags:{}}}catch{}})))()}var Fe,Ie,LargePageCountComponent;function init_large_page_count(){return(init_large_page_count=e((()=>{r(),x(),v(),Fe=n(),Ie=[{id:`title`,label:`Title`,type:`text`}],LargePageCountComponent=({totalItems:e=1453038})=>{let[t,n]=(0,i.useState)({type:m,page:1,perPage:20,fields:[],titleField:`title`}),r=t.page??1,a=t.perPage??20,{data:o,paginationInfo:s}=(0,i.useMemo)(()=>{let t=(r-1)*a+1,n=Math.max(0,Math.min(a,e-t+1));return{data:Array.from({length:n},(e,n)=>({id:t+n,title:`Item ${t+n}`})),paginationInfo:{totalItems:e,totalPages:Math.ceil(e/a)}}},[r,a,e]);return(0,Fe.jsx)(S,{getItemId:e=>e.id.toString(),paginationInfo:s,data:o,view:t,fields:Ie,onChangeView:n})};try{LargePageCountComponent.__docgenInfo={description:"A dataset far too large to hold in memory, the way a server-backed consumer\nreports it: `paginationInfo` carries the totals and `data` holds only the\ncurrent page. Above 100 pages the footer offers a page number input instead\nof a select listing every page.",displayName:`LargePageCountComponent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/large-page-count.tsx`,methods:[],props:{totalItems:{defaultValue:{value:`1453038`},declarations:[{fileName:`gutenberg/packages/dataviews/src/dataviews/stories/large-page-count.tsx`,name:`TypeLiteral`}],description:``,name:`totalItems`,required:!1,tags:{},type:{name:`number`}}},tags:{}}}catch{}})))()}var Le=t({AsyncInfiniteScroll:()=>Q,Empty:()=>q,FreeComposition:()=>Y,HierarchicalLevels:()=>K,InfiniteScroll:()=>Z,LargePageCount:()=>$,LayoutActivity:()=>W,LayoutCustom:()=>G,LayoutGrid:()=>H,LayoutList:()=>U,LayoutTable:()=>V,MinimalUI:()=>J,WithCard:()=>X,default:()=>ze}),Re,ze,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{x(),init_layout_activity(),init_layout_table(),init_layout_grid(),init_layout_list(),init_layout_custom(),init_hierarchical_levels(),init_infinite_scroll(),init_async_infinite_scroll(),init_with_card(),init_free_composition(),init_minimal_ui(),init_empty(),init_large_page_count(),Re=n(),ze={tags:[`manifest`],id:`dataviews-dataviews`,title:`Design System/DataViews/DataViews`,component:S,args:{containerHeight:`auto`},argTypes:{containerHeight:{control:`select`,options:[`auto`,`600px`,`80vh`],description:`Height of the container`}},parameters:{layout:`fullscreen`},decorators:[(e,{args:t,parameters:n})=>(0,Re.jsx)(`div`,{style:{padding:`1rem`},children:(0,Re.jsx)(`div`,{style:{height:n.containerHeight??t.containerHeight,minHeight:0},children:(0,Re.jsx)(e,{containerHeight:t.containerHeight})})})]},V={render:LayoutTableComponent$2,args:{groupBy:!1,groupByLabel:!0,hasClickableItems:!0,perPageSizes:[10,25,50,100],showMedia:!0},argTypes:{backgroundColor:{control:`color`,description:`Background color of the DataViews component`},groupBy:{control:`boolean`,description:`Whether items are grouped by field`},groupByLabel:{control:`boolean`,description:`Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")`},hasClickableItems:{control:`boolean`,description:`Are the items clickable`},perPageSizes:{control:`object`,description:`Array of available page sizes`},showMedia:{control:`boolean`,description:`Whether to display the media field`}}},H={parameters:{a11y:{test:`todo`}},render:LayoutTableComponent$1,args:{groupBy:!1,groupByLabel:!0,hasClickableItems:!0,mediaFit:`cover`,mediaFitControl:!0,perPageSizes:[10,25,50,100],showMedia:!0},argTypes:{backgroundColor:{control:`color`,description:`Background color of the DataViews component`},groupBy:{control:`boolean`,description:`Whether items are grouped by field`},groupByLabel:{control:`boolean`,description:`Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")`},hasClickableItems:{control:`boolean`,description:`Are the items clickable`},mediaFit:{control:`select`,options:[`cover`,`contain`],description:`How the media field fills the preview box: cropped to fill it ("cover") or fitted inside it ("contain"), letterboxing the media so its own aspect ratio stays visible`},mediaFitControl:{control:`boolean`,description:`Whether the view options offer the "Original aspect ratio" toggle, letting users switch the media fit themselves`},perPageSizes:{control:`object`,description:`Array of available page sizes`},showMedia:{control:`boolean`,description:`Whether to display the media field`}}},U={render:LayoutTableComponent,args:{fullWidth:!1,groupBy:!1,groupByLabel:!0,hasClickableItems:!0,perPageSizes:[10,25,50,100],showMedia:!0},argTypes:{backgroundColor:{control:`color`,description:`Background color of the DataViews component`},fullWidth:{control:`boolean`,description:`Whether to use full width or a contained layout (400px)`},groupBy:{control:`boolean`,description:`Whether items are grouped by field`},groupByLabel:{control:`boolean`,description:`Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")`},hasClickableItems:{control:`boolean`,description:`Are the items clickable`},perPageSizes:{control:`object`,description:`Array of available page sizes`},showMedia:{control:`boolean`,description:`Whether to display the media field`}}},W={render:LayoutActivityComponent,args:{fullWidth:!1,groupBy:!1,groupByLabel:!0,hasClickableItems:!0,perPageSizes:[10,25,50,100],showMedia:!0},argTypes:{backgroundColor:{control:`color`,description:`Background color of the DataViews component`},fullWidth:{control:`boolean`,description:`Whether to use full width or a contained layout (400px)`},groupBy:{control:`boolean`,description:`Whether items are grouped by field`},groupByLabel:{control:`boolean`,description:`Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")`},hasClickableItems:{control:`boolean`,description:`Are the items clickable`},perPageSizes:{control:`object`,description:`Array of available page sizes`},showMedia:{control:`boolean`,description:`Whether to display the media field`}}},G={render:LayoutCustomComponent},K={render:HierarchicalLevelsComponent,args:{showLevels:!0},argTypes:{showLevels:{control:`boolean`,description:"Whether the table indents each item by its level (`view.showLevels`). When enabled, each item is placed below its parent; when disabled, items follow the sort order only"}}},q={render:EmptyComponent,args:{customEmpty:!1,isLoading:!1},argTypes:{customEmpty:{control:`boolean`,description:`Use custom empty state with planet illustration`},isLoading:{control:`boolean`,description:`Show loading state`}}},J={parameters:{a11y:{test:`todo`}},render:MinimalUIComponent,argTypes:{layout:{control:`select`,options:[`table`,`list`,`grid`,`activity`],defaultValue:`table`}}},Y={render:FreeCompositionComponent},X={render:WithCardComponent},Z={render:InfiniteScroll$1,parameters:{containerHeight:`600px`},argTypes:{containerHeight:{control:!1,table:{disable:!0}}}},Q={render:AsyncInfiniteScroll$1,parameters:{a11y:{test:`todo`},containerHeight:`calc(100vh - 2rem)`},argTypes:{containerHeight:{control:!1,table:{disable:!0}}}},$={render:LargePageCountComponent,args:{totalItems:1453038},argTypes:{totalItems:{control:`number`,description:`Number of items the dataset reports. At 20 per page, the default makes 72,652 pages`}}};try{Q.__docgenInfo={description:`Infinite scroll where pages load asynchronously (with \`isLoading\`), like a
real network-backed consumer that fetches one window at a time. Reproduces
the scroll-position jump that the synchronous story does not.`,displayName:`AsyncInfiniteScroll`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:`A server-backed dataset with tens of thousands of pages. Above 100 pages the
footer offers a page number input instead of a select listing every page.`,displayName:`LargePageCount`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/dataviews/src/dataviews/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  render: LayoutTableComponent,
  args: {
    groupBy: false,
    groupByLabel: true,
    hasClickableItems: true,
    perPageSizes: [10, 25, 50, 100],
    showMedia: true
  },
  argTypes: {
    backgroundColor: {
      control: 'color',
      description: 'Background color of the DataViews component'
    },
    groupBy: {
      control: 'boolean',
      description: 'Whether items are grouped by field'
    },
    groupByLabel: {
      control: 'boolean',
      description: 'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")'
    },
    hasClickableItems: {
      control: 'boolean',
      description: 'Are the items clickable'
    },
    perPageSizes: {
      control: 'object',
      description: 'Array of available page sizes'
    },
    showMedia: {
      control: 'boolean',
      description: 'Whether to display the media field'
    }
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Grid media buttons lack names (button-name).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  render: LayoutGridComponent,
  args: {
    groupBy: false,
    groupByLabel: true,
    hasClickableItems: true,
    mediaFit: 'cover',
    mediaFitControl: true,
    perPageSizes: [10, 25, 50, 100],
    showMedia: true
  },
  argTypes: {
    backgroundColor: {
      control: 'color',
      description: 'Background color of the DataViews component'
    },
    groupBy: {
      control: 'boolean',
      description: 'Whether items are grouped by field'
    },
    groupByLabel: {
      control: 'boolean',
      description: 'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")'
    },
    hasClickableItems: {
      control: 'boolean',
      description: 'Are the items clickable'
    },
    mediaFit: {
      control: 'select',
      options: ['cover', 'contain'],
      description: 'How the media field fills the preview box: cropped to fill it ("cover") or fitted inside it ("contain"), letterboxing the media so its own aspect ratio stays visible'
    },
    mediaFitControl: {
      control: 'boolean',
      description: 'Whether the view options offer the "Original aspect ratio" toggle, letting users switch the media fit themselves'
    },
    perPageSizes: {
      control: 'object',
      description: 'Array of available page sizes'
    },
    showMedia: {
      control: 'boolean',
      description: 'Whether to display the media field'
    }
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  render: LayoutListComponent,
  args: {
    fullWidth: false,
    groupBy: false,
    groupByLabel: true,
    hasClickableItems: true,
    perPageSizes: [10, 25, 50, 100],
    showMedia: true
  },
  argTypes: {
    backgroundColor: {
      control: 'color',
      description: 'Background color of the DataViews component'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether to use full width or a contained layout (400px)'
    },
    groupBy: {
      control: 'boolean',
      description: 'Whether items are grouped by field'
    },
    groupByLabel: {
      control: 'boolean',
      description: 'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")'
    },
    hasClickableItems: {
      control: 'boolean',
      description: 'Are the items clickable'
    },
    perPageSizes: {
      control: 'object',
      description: 'Array of available page sizes'
    },
    showMedia: {
      control: 'boolean',
      description: 'Whether to display the media field'
    }
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  render: LayoutActivityComponent,
  args: {
    fullWidth: false,
    groupBy: false,
    groupByLabel: true,
    hasClickableItems: true,
    perPageSizes: [10, 25, 50, 100],
    showMedia: true
  },
  argTypes: {
    backgroundColor: {
      control: 'color',
      description: 'Background color of the DataViews component'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Whether to use full width or a contained layout (400px)'
    },
    groupBy: {
      control: 'boolean',
      description: 'Whether items are grouped by field'
    },
    groupByLabel: {
      control: 'boolean',
      description: 'Whether to show the groupBy field label in headers (e.g., "Date: Dec 15" vs just "Dec 15")'
    },
    hasClickableItems: {
      control: 'boolean',
      description: 'Are the items clickable'
    },
    perPageSizes: {
      control: 'object',
      description: 'Array of available page sizes'
    },
    showMedia: {
      control: 'boolean',
      description: 'Whether to display the media field'
    }
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  render: LayoutCustomComponent
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: HierarchicalLevelsComponent,
  args: {
    showLevels: true
  },
  argTypes: {
    showLevels: {
      control: 'boolean',
      description: 'Whether the table indents each item by its level (\`view.showLevels\`). When enabled, each item is placed below its parent; when disabled, items follow the sort order only'
    }
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: EmptyComponent,
  args: {
    customEmpty: false,
    isLoading: false
  },
  argTypes: {
    customEmpty: {
      control: 'boolean',
      description: 'Use custom empty state with planet illustration'
    },
    isLoading: {
      control: 'boolean',
      description: 'Show loading state'
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Scroll region is not keyboard-accessible (scrollable-region-focusable).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  render: MinimalUIComponent,
  argTypes: {
    layout: {
      control: 'select',
      options: ['table', 'list', 'grid', 'activity'],
      defaultValue: 'table'
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  render: FreeCompositionComponent
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  render: WithCardComponent
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: InfiniteScrollComponent,
  parameters: {
    containerHeight: '600px'
  },
  argTypes: {
    containerHeight: {
      control: false,
      table: {
        disable: true
      }
    }
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  render: AsyncInfiniteScrollComponent,
  parameters: {
    // FIXME: List items lack a required parent (aria-required-parent).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    },
    // Fill the viewport so the list bottom is the window bottom.
    containerHeight: 'calc(100vh - 2rem)'
  },
  argTypes: {
    containerHeight: {
      control: false,
      table: {
        disable: true
      }
    }
  }
}`,...Q.parameters?.docs?.source},description:{story:`Infinite scroll where pages load asynchronously (with \`isLoading\`), like a
real network-backed consumer that fetches one window at a time. Reproduces
the scroll-position jump that the synchronous story does not.`,...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: LargePageCountComponent,
  args: {
    totalItems: 1453038
  },
  argTypes: {
    totalItems: {
      control: 'number',
      description: 'Number of items the dataset reports. At 20 per page, the default makes 72,652 pages'
    }
  }
}`,...$.parameters?.docs?.source},description:{story:`A server-backed dataset with tens of thousands of pages. Above 100 pages the
footer offers a page number input instead of a select listing every page.`,...$.parameters?.docs?.description}}}})))()}export{init_index_story as n,Le as t};