import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{n as o,t as s}from"./use-event-Cr6_a9Gc.js";import{n as c,t as l}from"./use-resize-observer-B9klA0Ns.js";import{a as u,i as d}from"./iframe-BbJPeSVw.js";import{n as f,t as p}from"./icon-BGlJFHC6.js";import{Mt as m,_c as h,n as g,ua as _}from"./build-module-DttIWYbV.js";import{n as v,t as y}from"./build-module-moyqbjZD.js";import{n as ee,t as b}from"./stack-yNRxuGKo.js";import{n as x,t as S}from"./icon-button-DVEGxPML.js";import{a as C,c as te,f as w,h as ne,i as re,l as ie,m as ae,o as oe,r as T,s as se,t as ce}from"./sortable.esm-C1hKZVjP.js";import{A as le,C as ue,D as de,E as fe,O as E,S as D,_ as O,a as pe,b as me,c as he,d as ge,f as _e,g as ve,h as ye,i as be,j as xe,k,l as Se,m as Ce,n as we,p as Te,r as Ee,s as De,t as Oe,u as A,w as ke,x as Ae,y as je}from"./drag-overlay-drop-animation-DgtHMY2U.js";var Me,j;function init_grid_item_module(){return(init_grid_item_module=e((()=>{Me=`_item_1trpz_1`,j={item:Me,"item-content":`_item-content_1trpz_5`,"is-resizing":`_is-resizing_1trpz_10`,"is-dragging":`_is-dragging_1trpz_31`,"wp-grid-item-placeholder-in":`_wp-grid-item-placeholder-in_1trpz_1`,"preview-overlay":`_preview-overlay_1trpz_75`}})))()}function getItemCursor(e,t){if(e)return`default`;if(!t)return`grab`}function GridItem({item:e,maxColumns:t,disabled:n=!1,draggable:a=!0,resizable:o=!0,verticalResizable:s=!0,interacting:c=!1,dragging:l=!1,children:u,actionableArea:f=null,onResize:p,onResizeEnd:m,resizeSnapPreview:h=null,minResizeWidthPx:g,minResizeHeightPx:_,maxResizeWidthPx:v,maxResizeHeightPx:ee,renderResizeHandle:b}){let[x,S]=(0,r.useState)(null),[te,w]=(0,r.useState)(null),ne=(0,r.useRef)(null),re=(0,r.useRef)(null),ie=n||!a,ae=n||!o,{attributes:oe,listeners:T,setNodeRef:se,setActivatorNodeRef:ce,isDragging:ue}=C({id:e.key,disabled:ie}),de=i([ne,se]),O=i([re]),pe={gridColumnEnd:`span ${e.width===`full`?t:Math.min(typeof e.width==`number`?e.width:1,t)}`,gridRowEnd:`span ${e.height||1}`},me=x!==null,he=d(j.item,ue&&j[`is-dragging`],me&&j[`is-resizing`]),handleResize=t=>{let n=re.current,r=te;if(n&&!r){let{width:e,height:t}=n.getBoundingClientRect();r={width:e,height:t},w(r)}let i={width:t.width,height:s?t.height:0};r&&(i=D(i,r,{width:g,height:s?_:void 0},{width:v,height:s?ee:void 0})),S(i),p(e.key,i)},handleResizeEnd=()=>{S(null),w(null),m()},ge=x&&te?{width:te.width+x.width,height:s?te.height+x.height:void 0}:void 0,_e=h?(0,M.jsx)(SnapPreviewOverlay,{snap:h}):null;return(0,M.jsxs)(`div`,{ref:de,className:he,style:pe,[E]:e.key,"data-wp-grid-item-resizing":me||void 0,children:[f?(0,M.jsx)(`div`,{className:le[`actionable-area-slot`],children:(0,M.jsx)(`div`,{style:{display:`contents`},inert:y(l),children:f})}):null,(0,M.jsxs)(`div`,{ref:ce,...ie?{}:oe,...T,style:{height:`100%`,cursor:getItemCursor(ie,c)},children:[(0,M.jsxs)(`div`,{ref:O,className:j[`item-content`],style:ge,children:[u,!ae&&(0,M.jsx)(fe,{itemId:e.key,verticalResizable:s,onResize:handleResize,onResizeEnd:handleResizeEnd,renderResizeHandle:b})]}),_e]})]})}function SnapPreviewOverlay({snap:e}){return(0,M.jsx)(`div`,{className:j[`preview-overlay`],style:{width:e.widthPx,height:e.heightPx??`100%`}})}var M;function init_grid_item(){return(init_grid_item=e((()=>{T(),u(),n(),a(),v(),xe(),k(),de(),init_grid_item_module(),M=t();try{GridItem.__docgenInfo={description:``,displayName:`GridItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/grid-item.tsx`,methods:[],props:{item:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`The layout item containing grid positioning information.`,name:`item`,required:!0,tags:{},type:{name:`DashboardGridLayoutItem`}},maxColumns:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`The maximum number of columns in the grid.`,name:`maxColumns`,required:!0,tags:{},type:{name:`number`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Whether drag and resize interactions are disabled.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},draggable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:"Whether the item can be dragged. Combined with `disabled`.",name:`draggable`,required:!1,tags:{},type:{name:`boolean`}},resizable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:"Whether the item can be resized. Combined with `disabled`.",name:`resizable`,required:!1,tags:{},type:{name:`boolean`}},verticalResizable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Whether the item can be resized vertically. Disabled when the
grid uses \`rowHeight: 'auto'\`, where row height is driven by
content rather than by the user.`,name:`verticalResizable`,required:!1,tags:{},type:{name:`boolean`}},interacting:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Whether any tile in the grid is currently being dragged or
resized. Drives the drag activator cursor.`,name:`interacting`,required:!1,tags:{},type:{name:`boolean`}},dragging:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:"Whether a tile drag is in progress. Mutes each tile's\n`actionableArea` with `inert` so hovers on other tiles' controls\ndo not steal the gesture.",name:`dragging`,required:!1,tags:{},type:{name:`boolean`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`The content to be displayed within the grid item.`,name:`children`,required:!0,tags:{},type:{name:`ReactNode`}},actionableArea:{defaultValue:{value:`null`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Content rendered above the draggable area that stays interactive
in edit mode, typically action buttons, menus, or links. While
a tile drag is in progress, this content is set \`inert\` so hovers
on other tiles can't steal the gesture. During resize, visibility
is controlled by grid-level CSS hooks.`,name:`actionableArea`,required:!1,tags:{},type:{name:`ReactNode`}},onResize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:"Callback fired while the item is being resized. Receives the\nitem's `key` plus the cursor offset from the gesture start in\npixels. The grid derives snapped spans from the delta and passes\nthem back through `resizeSnapPreview`.",name:`onResize`,required:!0,tags:{},type:{name:`(id: string, delta: ResizeDelta) => void`}},resizeSnapPreview:{defaultValue:{value:`null`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Snapped grid size in pixels for the resize-preview outline. The
tile content resizes continuously with the cursor; this outline
shows the span the layout will commit to on release.`,name:`resizeSnapPreview`,required:!1,tags:{},type:{name:`ResizeSnapSize | null`}},minResizeWidthPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Minimum tile width while resizing, in pixels (one column track).`,name:`minResizeWidthPx`,required:!0,tags:{},type:{name:`number`}},minResizeHeightPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Minimum tile height while resizing, in pixels (one row track).
Omitted when vertical resize is disabled.`,name:`minResizeHeightPx`,required:!1,tags:{},type:{name:`number`}},maxResizeWidthPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Maximum tile width while resizing, in pixels. Omitted when the
item declares no width limit.`,name:`maxResizeWidthPx`,required:!1,tags:{},type:{name:`number`}},maxResizeHeightPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Maximum tile height while resizing, in pixels. Omitted when
vertical resize is disabled or the item declares no height limit.`,name:`maxResizeHeightPx`,required:!1,tags:{},type:{name:`number`}},onResizeEnd:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:`Callback fired when the resize gesture ends.`,name:`onResizeEnd`,required:!0,tags:{},type:{name:`() => void`}},renderResizeHandle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`TypeLiteral`}],description:"Component forwarded to `<ResizeHandle />` to override the default\ncorner triangle. See `DashboardGridProps.renderResizeHandle`.",name:`renderResizeHandle`,required:!1,tags:{},type:{name:`ComponentType<ResizeHandleRenderProps>`}}},tags:{}}}catch{}})))()}function resolveFillWidths(e,t,n,r){let i=new Map,a=e.length,o=Array(a),s=Array(a),c=Array(a),l=Array(a),u=!1,d=!1,f=0;for(let i=0;i<a;i++){let a=t.get(e[i]);if(o[i]=a,!a)continue;if(a.width===`fill`)s[i]=`fill`,c[i]=1,u=!0;else if(a.width===`full`){let e=Math.min(r?.get(a.key)?.maxWidth??n,n);s[i]=e<n?`fixed`:`full`,c[i]=e}else s[i]=`fixed`,c[i]=typeof a.width==`number`?Math.min(a.width,n):1;let p=Math.max(1,Math.floor(a.height??1));l[i]=p,p>1&&(d=!0),f+=p}if(!u)return i;if(!d){let e=0;for(let t=0;t<a;t++){let l=o[t];if(l){if(s[t]===`full`)e=0;else{if(s[t]===`fill`){let o=r?.get(l.key),u=Math.min(o?.minWidth??1,n),d=o?.maxWidth??n;e+u>n&&(e=0);let f=0;for(let r=t+1;r<a&&s[r]===`fixed`;r++){let t=c[r];if(e+u+f+t<=n)f+=t;else break}let p=Math.min(Math.max(u,n-e-f),d);i.set(l.key,p),e+=p}else{let r=c[t];e+r>n&&(e=0),e+=r}e>=n&&(e=0)}}}return i}let p=Array(n).fill(0),m=0,h=0,findFreeRun=e=>{let t=m,r=h;place:for(;t<=f;t++)for(r=t===m?h:0;r+e<=n;){let n=-1;for(let i=0;i<e;i++)if(p[r+i]>t){n=r+i;break}if(n===-1)break place;r=n+1}return[t,r]};for(let e=0;e<a;e++){let t=o[e];if(!t)continue;let u=l[e];if(s[e]===`full`){let e=m;for(let t=0;t<n;t++)p[t]>e&&(e=p[t]);for(let t=0;t<n;t++)p[t]=e+u;m=e+u,h=0;continue}if(s[e]===`fill`){let o=r?.get(t.key),l=Math.min(o?.minWidth??1,n),d=o?.maxWidth??n,[f,g]=findFreeRun(l),_=l;for(;g+_<n&&p[g+_]<=f;)_++;let v=0;for(let t=e+1;t<a&&s[t]===`fixed`;t++){let e=c[t];if(l+v+e<=_)v+=e;else break}let y=Math.min(Math.max(l,_-v),d);i.set(t.key,y);for(let e=0;e<y;e++)p[g+e]=f+u;m=f,h=g+y;continue}let d=c[e],[f,g]=findFreeRun(d);for(let e=0;e<d;e++)p[g+e]=f+u;m=f,h=g+d}return i}var N,P;function init_grid_module(){return(init_grid_module=e((()=>{N=`_grid_19hje_1`,P={grid:N,"drag-preview-frame":`_drag-preview-frame_19hje_16`,"drag-preview-frame__lift":`_drag-preview-frame__lift_19hje_35`,"wp-grid-drag-preview-shadow-enter":`_wp-grid-drag-preview-shadow-enter_19hje_1`,"wp-grid-drag-preview-scale-enter":`_wp-grid-drag-preview-scale-enter_19hje_1`,"is-exiting":`_is-exiting_19hje_85`,"wp-grid-drag-preview-shadow-exit":`_wp-grid-drag-preview-shadow-exit_19hje_1`,"wp-grid-drag-preview-scale-exit":`_wp-grid-drag-preview-scale-exit_19hje_1`}})))()}var F,Ne,Pe,Fe,NO_SORT_STRATEGY,I;function init_dashboard_grid(){return(init_dashboard_grid=e((()=>{w(),T(),u(),l(),s(),a(),n(),init_grid_item(),Ae(),O(),Te(),ge(),A(),De(),Ee(),we(),init_grid_module(),F=t(),Ne=Oe(P[`drag-preview-frame`],P[`is-exiting`]),Pe=24,Fe=6,NO_SORT_STRATEGY=()=>null,I=(0,r.forwardRef)(function UnforwardedDashboardGrid(e,t){let{layout:n,columns:a,children:s,className:l,style:u,rowHeight:f=`auto`,minColumnWidth:p,itemLimits:m,editMode:h=!1,onChangeLayout:g,onPreviewLayout:_,renderResizeHandle:v,renderDragPreview:y,renderGridOverlay:ee,...b}=e,[x,S]=(0,r.useState)(),[C,w]=(0,r.useState)(null),[T,le]=(0,r.useState)(!1),[de,fe]=(0,r.useState)(null),E=(0,r.useRef)(void 0),D=(0,r.useRef)(null),O=(0,r.useRef)(null),ge=(0,r.useRef)(()=>{}),xe=(0,r.useRef)(new Map),[k,we]=(0,r.useState)(null),[Te,Ee]=(0,r.useState)(0),[De,Oe]=(0,r.useState)(0),[A,Ae]=(0,r.useState)(Pe),Me=c(([{contentRect:e}])=>{Ee(e.width),Oe(e.height)}),j=i([we,Me,t]);(0,r.useLayoutEffect)(()=>{if(!k)return;let{width:e,height:t}=k.getBoundingClientRect();e>0&&Ee(e),t>0&&Oe(t);let n=Number.parseFloat(window.getComputedStyle(k).columnGap);Number.isFinite(n)&&n>0&&Ae(n)},[k]);let M=(0,r.useMemo)(()=>je({columns:a,minColumnWidth:p},Te,A,Fe),[p,A,Te,a]),N=(Te-(M-1)*A)/M,I=ke(1,1,N,A,null).widthPx,L=typeof f==`number`?f:null,Ie=L===null?void 0:ke(1,1,N,A,L).heightPx??void 0,R=ye(m,N,A,L,M),Le=Ce(R,N,A,L),z=x??n,B=(0,r.useMemo)(()=>{if(R.size===0)return z;let e=!1,t=z.map(t=>{let n=R.get(t.key);if(!n)return t;let r=typeof t.width==`number`?ue(t.width,n.minWidth,n.maxWidth):t.width,i=ue(t.height??1,n.minHeight,n.maxHeight);return r===t.width&&i===(t.height??1)?t:(e=!0,{...t,width:r,height:i})});return e?t:z},[z,R]),V=(0,r.useMemo)(()=>{let e=new Map;return B.forEach(t=>e.set(t.key,t)),e},[B]),H=(0,r.useMemo)(()=>new Set(n.map(e=>e.key)),[n]),U=(0,r.useMemo)(()=>B.map((e,t)=>({item:e,index:t})).sort((e,t)=>(e.item.order??e.index)-(t.item.order??t.index)).map(({item:e})=>e.key),[B]),W=(0,r.useMemo)(()=>{let e=resolveFillWidths(U,V,M,R);if(e.size===0)return V;let t=new Map;for(let[n,r]of V){let i=e.get(n);t.set(n,i===void 0?r:{...r,width:i})}return t},[U,V,M,R]),[G,K,q,J]=(0,r.useMemo)(()=>{let e=new Map,t=new Map,n=[],i=new Map;return r.Children.forEach(s,a=>{if(!(0,r.isValidElement)(a)){n.push(a);return}let o=a.key?.toString();if(!o){n.push(a);return}let s=a,{actionableArea:c}=s.props,l=c===void 0?a:(0,r.cloneElement)(s,{actionableArea:void 0});i.set(o,l),H.has(o)?(c!==void 0&&t.set(o,c),e.set(o,l)):n.push(a)}),[e,t,n,i]},[s,H]);(0,r.useLayoutEffect)(()=>{for(let[e,t]of J)xe.current.set(e,t)},[J]);let Y=ne(ae(ie),ae(te,{coordinateGetter:re})),X=o(e=>{w(String(e.active.id)),D.current=null}),Re=o(()=>{w(null),E.current=void 0,D.current=null,O.current=null,le(!1),fe(null),S(void 0)}),Z=o(e=>{let{active:t,over:r}=e;if(!r||t.id===r.id)return;let i=t.rect.current.translated;if(!i)return;let a=i.left+i.width/2,o=i.top+i.height/2,s=D.current;if(s){let e=a-s.x,t=o-s.y;if(e*e+t*t<100)return}let c=a>r.rect.left+r.rect.width/2,l=U.indexOf(String(t.id)),u=U.indexOf(String(r.id)),d;if(d=c?l>u?u+1:u:l>u?u:u-1,d=Math.max(0,Math.min(d,U.length-1)),d===l)return;let f=me(U,l,d,e=>V.get(e)?.draggable===!1);if(f.every((e,t)=>e===U[t]))return;let p=(E.current??n).map(e=>({...e,order:f.indexOf(e.key)}));D.current={x:a,y:o},E.current=p,ge.current(),S(p),_?.(p)}),ze=o(()=>{let e=E.current;E.current=void 0,O.current=null,le(!1),fe(null),!g||!e||g(e),S(void 0)}),Q=o((e,t)=>{if(!h)return;T||le(!0);let r={width:Math.round(t.width/(N+A)),height:f===`auto`?0:Math.round(t.height/(f+A))},i=R.get(e);if(!O.current){let t=V.get(e),n=W.get(e),r;r=t?.width===`full`?i?.maxWidth??M:t?.width===`fill`?typeof n?.width==`number`?n.width:1:t?.width??1,O.current={width:r,height:t?.height??1}}let a=O.current,o=ue(a.width+r.width,i?.minWidth??1,i?.maxWidth??M),s=ue(a.height+r.height,i?.minHeight??1,i?.maxHeight??1/0);fe({id:e,snap:ke(o,s,N,A,L)});let c=E.current?.find(t=>t.key===e)??V.get(e);if(c&&c.width===o&&(c.height??1)===s)return;let l=(E.current??n).map(t=>t.key===e?{...t,width:o,height:s}:t);E.current=l,ge.current(),S(l),_?.(l)}),$=C?G.get(C):null,Be=y,Ve=C&&$?(0,F.jsx)(`div`,{className:P[`drag-preview-frame`],children:(0,F.jsx)(`div`,{className:P[`drag-preview-frame__lift`],children:Be?(0,F.jsx)(Be,{itemId:C,children:$}):$})}):null,He=ee??ve,Ue=typeof f==`number`?f:void 0,We=(0,r.useMemo)(()=>{if(Ue===void 0||De<=0)return;let e=Ue+A;return Math.max(1,Math.floor((De+A)/e))},[Ue,De,A]),Ge=(0,r.useMemo)(()=>(0,F.jsx)(He,{columns:M,rowHeight:Ue,rows:We,isActive:h}),[He,h,M,Ue,We]),Ke=(0,r.useMemo)(()=>pe([...W.values()]),[W]),qe=C??(T?de?.id:null),{captureLayoutSnapshot:Je,getPositionsBeforeLastChange:Ye}=he({container:k,enabled:h,layoutFingerprint:Ke,excludeItemKey:qe}),{exitingItems:Xe,clearExitingItem:Ze}=be({container:k,enabled:h,layoutKeys:H,getPositionsBeforeLastChange:Ye,childrenCacheRef:xe}),Qe=h;return(0,r.useLayoutEffect)(()=>{ge.current=Je},[Je]),(0,F.jsxs)(oe,{sensors:Y,onDragStart:X,onDragCancel:Re,onDragMove:Z,onDragEnd:()=>{ze(),D.current=null,w(null)},children:[(0,F.jsx)(ce,{items:U,strategy:NO_SORT_STRATEGY,children:(0,F.jsxs)(`div`,{...b,ref:j,className:d(P.grid,Qe&&_e[`layout-animating`],l),"data-wp-grid-dragging":C||void 0,"data-wp-grid-resizing":T||void 0,style:{...u,gridTemplateColumns:`repeat(${M}, minmax(0, 1fr))`,gridAutoRows:f},children:[Ge,U.map(e=>{let t=Le.get(e);return(0,F.jsx)(GridItem,{item:W.get(e),maxColumns:R.get(e)?.maxWidth??M,disabled:!h,draggable:V.get(e)?.draggable!==!1,resizable:V.get(e)?.resizable!==!1,verticalResizable:f!==`auto`,interacting:C!==null||T,dragging:C!==null,onResize:Q,onResizeEnd:ze,resizeSnapPreview:de?.id===e?de.snap:null,minResizeWidthPx:t?.minWidthPx??I,minResizeHeightPx:t?.minHeightPx??Ie,maxResizeWidthPx:t?.maxWidthPx,maxResizeHeightPx:t?.maxHeightPx??void 0,actionableArea:K.get(e),renderResizeHandle:v,children:G.get(e)},e)}),q,Xe.map(({key:e,rect:t,child:n})=>(0,F.jsx)(Se,{itemKey:e,rect:t,onAnimationEnd:()=>Ze(e),children:n},`exiting-${e}`))]})}),(0,F.jsx)(se,{dropAnimation:Ne,children:Ve})]})});try{I.__docgenInfo={description:`2D packed dashboard grid with drag-to-reorder and resize handles.
Supports fixed-column and responsive modes, \`number | 'fill' | 'full'\`
widths, and multi-row tiles.

Each child's \`key\` must match an entry in the \`layout\` array;
children without a match render at the end of the grid without
explicit placement and fall through CSS Grid's auto-flow.`,displayName:`DashboardGrid`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/index.tsx`,methods:[],props:{layout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Array of layout items.`,name:`layout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!0,tags:{},type:{name:`DashboardGridLayoutItem[]`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:"Grid children. Each child must carry a `key` that matches an\nentry in `layout`; children without a match render at the end\nof the grid without explicit placement and fall through CSS\nGrid's auto-flow.",name:`children`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!0,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Additional CSS class on the grid root.`,name:`className`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Inline styles applied to the grid root. Merged underneath the
grid's own layout styles, so the layout (\`gridTemplateColumns\`,
\`gridAutoRows\`) always wins. The gap between tiles is owned by
the design-system gap token and is not configurable per
instance; override it via a theme or density change.`,name:`style`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`CSSProperties`}},rowHeight:{defaultValue:{value:`'auto'`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:"Height of each row in pixels, or `'auto'` to let the tallest\ntile in the row size it.",name:`rowHeight`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`number | "auto"`}},editMode:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Whether the grid is in edit mode (allows dragging and
repositioning items).`,name:`editMode`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`boolean`}},onChangeLayout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Callback fired when the user commits a drag or resize. Receives
the resulting layout.`,name:`onChangeLayout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`((newLayout: DashboardGridLayoutItem[]) => void)`}},onPreviewLayout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Callback fired continuously during a drag or resize interaction
with the in-progress layout. Useful for live feedback in the
surface (e.g., displaying the current width/position). The final
committed layout is still emitted via \`onChangeLayout\`.`,name:`onPreviewLayout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`((previewLayout: DashboardGridLayoutItem[]) => void)`}},renderResizeHandle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:"Override the default corner-triangle resize handle with a custom\ncomponent. The grid still owns the gesture (dnd-kit `<DndContext>`,\nthrottled delta loop) and passes the wiring to the consumer:\nspread `listeners` and `attributes` and assign `ref` on the\nelement that should receive the gesture. Use `disabled` and\n`verticalResizable` to adapt the visual to context.",name:`renderResizeHandle`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`ComponentType<ResizeHandleRenderProps>`}},renderDragPreview:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Custom wrapper for the dragged-clone visual mounted inside
\`<DragOverlay>\`. The surface always wraps the clone with a thin
functional frame (lift scale, grabbing cursor, pointer pass-
through) and mounts this component inside it; the consumer
owns the visual chrome (shadow, radius, padding).

When omitted, the cloned children render directly inside the
functional frame so any chrome the consumer applied to the
persistent tile carries through unchanged.

Token-only adjustments (lift scale, placeholder opacity,
outline color, placeholder radius) flow through CSS custom
properties documented in the README.`,name:`renderDragPreview`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`ComponentType<DragPreviewRenderProps>`}},renderGridOverlay:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Override the default edit-mode overlay (row-marker tiles per
column) with a custom component. The grid supplies the resolved
column count, row height, and row count; the consumer is
responsible for the visual.

The overlay only renders when \`editMode\` is true. When omitted,
the package's default visual is used.`,name:`renderGridOverlay`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`ComponentType<GridOverlayRenderProps>`}},columns:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:"Column count, used as a cap. A number applies at every width; a\n`ColumnSteps` map applies a count from each container width up, and\nan `'auto'` step lifts the cap from its width up.\nDefaults to six when neither `columns` nor `minColumnWidth` is set;\nwith `minColumnWidth` set it can resolve lower on narrow containers.",name:`columns`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`number | ColumnSteps`}},minColumnWidth:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:`Per-tile minimum width in pixels. Enables responsive mode: the
column count derives from container width, floored by this value,
down to 1.`,name:`minColumnWidth`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`number`}},itemLimits:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`}],description:"Per-item size limits in pixels, keyed by layout item key. Width\nbounds saturate at the column count; `'full'` and `'fill'` widths\nrespect a maximum.",name:`itemLimits`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-grid/types.ts`,name:`DashboardGridProps`},required:!1,tags:{},type:{name:`Record<string, GridItemLimits>`}}},tags:{example:`\`\`\`jsx
const layout = [
  { key: 'a', width: 2 },
  { key: 'b', width: 'fill' },
  { key: 'c', width: 'full' },
];

<DashboardGrid
  layout={ layout }
  columns={ 6 }
  editMode
  onChangeLayout={ setLayout }
>
  <div key="a">A</div>
  <div key="b">B</div>
  <div key="c">C</div>
</DashboardGrid>
\`\`\``,param:"props Component props.\nref Forwarded to the grid's root `<div>`."}}}catch{}})))()}function Tile({tone:e,children:t,actionableArea:n,...r}){return(0,L.jsx)(`div`,{...r,style:{backgroundColor:R[e],color:Le[e],padding:`20px`,display:`flex`,alignItems:`center`,justifyContent:`center`,height:`100%`,boxSizing:`border-box`,fontFamily:`var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`,...r?.style},children:t})}function TileActions({isFill:e,isFull:t,onToggleFill:n,onToggleFull:r,onRemove:i}){return(0,L.jsxs)(`div`,{style:{position:`absolute`,display:`flex`,gap:4,top:4,right:4,zIndex:2},children:[(0,L.jsx)(S,{size:`small`,variant:`solid`,tone:e?`brand`:`neutral`,icon:_,label:`Fill available width`,"aria-pressed":e,onClick:n}),(0,L.jsx)(S,{size:`small`,variant:`solid`,tone:t?`brand`:`neutral`,icon:m,label:`Full width`,"aria-pressed":t,onClick:r}),(0,L.jsx)(S,{size:`small`,variant:`solid`,tone:`neutral`,icon:h,label:`Remove`,onClick:i})]})}function formatTileLabel(e){let t;t=e.width===`fill`?`width: "fill"`:e.width===`full`?`width: "full"`:`width: ${e.width??1}`;let n=(e.height??1)>1?`, height: ${e.height}`:``;return t+n}function LayoutStatePanel({label:e,layout:t,tone:n}){return(0,L.jsxs)(b,{direction:`column`,gap:`sm`,style:{width:280,padding:16,background:z[n],border:`1px solid ${V[n]}`,borderRadius:8,fontFamily:`var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)`,fontSize:12,color:B[n]},children:[(0,L.jsx)(`strong`,{style:{fontFamily:`var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif)`,fontSize:11,textTransform:`uppercase`,letterSpacing:`0.04em`},children:e}),(0,L.jsx)(`pre`,{style:{margin:0,overflow:`auto`,lineHeight:1.5},children:JSON.stringify(t,null,2)})]})}function TileControls({title:e}){let t=(0,r.useId)();return(0,L.jsxs)(b,{direction:`column`,gap:`sm`,align:`flex-start`,children:[(0,L.jsx)(`strong`,{children:e}),(0,L.jsx)(`a`,{href:`#details`,children:`Details`}),(0,L.jsx)(`button`,{type:`button`,children:`Refresh`}),(0,L.jsxs)(`label`,{htmlFor:t,children:[`Metric`,` `,(0,L.jsxs)(`select`,{id:t,children:[(0,L.jsx)(`option`,{children:`Views`}),(0,L.jsx)(`option`,{children:`Clicks`})]})]})]})}function CustomResizeHandle({ref:e,listeners:t,attributes:n,isResizing:r}){return(0,L.jsx)(`div`,{ref:e,...t,...n,style:{position:`absolute`,bottom:0,insetInlineEnd:0,display:`flex`,cursor:`nwse-resize`,opacity:r?.5:1,transition:`opacity 120ms ease`},children:(0,L.jsx)(p,{icon:ze,size:16})})}function CustomDragPreview({children:e}){return(0,L.jsx)(`div`,{style:{height:`100%`},children:e})}function NumberedOverlay({columns:e,isActive:t}){return(0,L.jsx)(`div`,{"aria-hidden":!0,style:{position:`absolute`,inset:0,display:`grid`,gridTemplateColumns:`repeat(${e}, minmax(0, 1fr))`,gap:`var(--wpds-dimension-gap-xl, 24px)`,pointerEvents:`none`,opacity:+!!t,visibility:t?`visible`:`hidden`,transition:t?`opacity 200ms ease, visibility 0s linear 0s`:`opacity 200ms ease, visibility 0s linear 200ms`,backgroundImage:`repeating-linear-gradient(135deg, color-mix(in srgb, var(--wpds-color-background-surface-info, #deebfa) 24%, transparent) 0 6px, transparent 6px 12px)`},children:Array.from({length:e}).map((e,t)=>(0,L.jsx)(`div`,{style:{outline:`1px dashed var(--wpds-color-stroke-surface-info, #adc6e2)`,backgroundColor:`color-mix(in srgb, var(--wpds-color-background-surface-info, #deebfa) 10%, transparent)`,position:`relative`},children:(0,L.jsx)(`span`,{style:{position:`absolute`,top:4,insetInlineStart:4,fontSize:10,padding:`1px 6px`,borderRadius:2,background:`var(--wpds-color-background-surface-info, #deebfa)`,color:`var(--wpds-color-foreground-content-info, #001b4f)`,fontFamily:`var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)`},children:t+1})},t))})}var L,Ie,R,Le,z,B,V,H,U,W,G,K,q,J,Y,X,Re,Z,ze,Q,$;function init_index_story(){return(init_index_story=e((()=>{n(),g(),f(),x(),ee(),init_dashboard_grid(),L=t(),Ie={id:`grid-dashboardgrid`,title:`Widgets/Grid/DashboardGrid`,component:I,tags:[`status-experimental`],args:{columns:6,rowHeight:80,editMode:!1},argTypes:{children:{control:!1},columns:{control:{type:`number`,min:1,max:24,step:1},description:"Column count, or the cap when `minColumnWidth` is set."},minColumnWidth:{control:{type:`number`,min:80,max:600,step:8},description:`Per-column floor in pixels. Lowers the count on narrow containers, down to one.`},rowHeight:{control:{type:`number`,min:24,max:400,step:4},description:"Row height in pixels, or `auto`."},editMode:{control:{type:`boolean`},description:`Enables drag-to-reorder and resize.`},className:{control:{type:`text`}},onChangeLayout:{action:`onChangeLayout`},onPreviewLayout:{action:`onPreviewLayout`}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`This package is under heavy development and likely to change.`}}},R={brand:`var(--wpds-color-background-surface-brand, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 9%, white))`,info:`var(--wpds-color-background-surface-info, #deebfa)`,success:`var(--wpds-color-background-surface-success, #c2f8ca)`,warning:`var(--wpds-color-background-surface-warning, #fde6be)`,error:`var(--wpds-color-background-surface-error, #fae5e1)`,neutral:`var(--wpds-color-background-surface-neutral-weak, #f4f4f4)`},Le={brand:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`,info:`var(--wpds-color-foreground-content-info, #001b4f)`,success:`var(--wpds-color-foreground-content-success, #002900)`,warning:`var(--wpds-color-foreground-content-warning, #2e1900)`,error:`var(--wpds-color-foreground-content-error, #470000)`,neutral:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},z={warning:`var(--wpds-color-background-surface-warning, #fde6be)`,success:`var(--wpds-color-background-surface-success, #c2f8ca)`},B={warning:`var(--wpds-color-foreground-content-warning, #2e1900)`,success:`var(--wpds-color-foreground-content-success, #002900)`},V={warning:`var(--wpds-color-stroke-surface-warning, #e1bd7c)`,success:`var(--wpds-color-stroke-surface-success, #92d39d)`},H={args:{layout:[{key:`a`,width:1},{key:`b`,width:3},{key:`c`,width:2},{key:`d`,width:4},{key:`e`,width:2}],columns:6,children:[(0,L.jsx)(Tile,{tone:`brand`,children:`width: 1`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`width: 3`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`width: 2`},`c`),(0,L.jsx)(Tile,{tone:`warning`,children:`width: 4`},`d`),(0,L.jsx)(Tile,{tone:`error`,children:`width: 2`},`e`)]}},U={args:{layout:[{key:`pinned`,width:2,draggable:!1},{key:`a`,width:2},{key:`b`,width:2}],columns:6,rowHeight:160,children:[(0,L.jsx)(Tile,{tone:`neutral`,children:(0,L.jsx)(TileControls,{title:`Pinned`})},`pinned`),(0,L.jsx)(Tile,{tone:`info`,children:(0,L.jsx)(TileControls,{title:`Tile`})},`a`),(0,L.jsx)(Tile,{tone:`success`,children:(0,L.jsx)(TileControls,{title:`Tile`})},`b`)]}},W={args:{columns:4,minColumnWidth:240,rowHeight:96,layout:[{key:`a`,width:1},{key:`b`,width:`fill`},{key:`c`,width:1,height:2},{key:`d`,width:1},{key:`e`,width:`fill`},{key:`f`,width:`full`}],children:[(0,L.jsx)(Tile,{tone:`brand`,children:`1`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`fill`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`1 · 2 rows`},`c`),(0,L.jsx)(Tile,{tone:`warning`,children:`1`},`d`),(0,L.jsx)(Tile,{tone:`error`,children:`fill`},`e`),(0,L.jsx)(Tile,{tone:`neutral`,children:`full`},`f`)]}},G={argTypes:{columns:{control:`object`}},args:{columns:{0:1,600:2,960:4},rowHeight:96,layout:[{key:`fixed-1`,width:1,height:1},{key:`fixed-2`,width:2,height:2},{key:`fill-1`,width:`fill`},{key:`fixed-3`,width:1,height:1},{key:`fixed-4`,width:1,height:2},{key:`fixed-5`,width:2,height:1},{key:`fill-2`,width:`fill`},{key:`full-1`,width:`full`}],children:[(0,L.jsxs)(Tile,{tone:`brand`,children:[`width: `,(0,L.jsx)(`strong`,{children:`1`}),` · height: `,(0,L.jsx)(`strong`,{children:`1`})]},`fixed-1`),(0,L.jsxs)(Tile,{tone:`info`,children:[`width: `,(0,L.jsx)(`strong`,{children:`2`}),` · height: `,(0,L.jsx)(`strong`,{children:`2`})]},`fixed-2`),(0,L.jsxs)(Tile,{tone:`info`,children:[`width: `,(0,L.jsx)(`strong`,{children:`fill`})]},`fill-1`),(0,L.jsxs)(Tile,{tone:`success`,children:[`width: `,(0,L.jsx)(`strong`,{children:`1`}),` · height: `,(0,L.jsx)(`strong`,{children:`1`})]},`fixed-3`),(0,L.jsxs)(Tile,{tone:`warning`,children:[`width: `,(0,L.jsx)(`strong`,{children:`1`}),` · height: `,(0,L.jsx)(`strong`,{children:`2`})]},`fixed-4`),(0,L.jsxs)(Tile,{tone:`error`,children:[`width: `,(0,L.jsx)(`strong`,{children:`2`}),` · height: `,(0,L.jsx)(`strong`,{children:`1`})]},`fixed-5`),(0,L.jsxs)(Tile,{tone:`error`,children:[`width: `,(0,L.jsx)(`strong`,{children:`fill`})]},`fill-2`),(0,L.jsxs)(Tile,{tone:`neutral`,children:[`width: `,(0,L.jsx)(`strong`,{children:`full`})]},`full-1`)]}},K={argTypes:{columns:{control:`object`}},args:{...G.args,columns:{0:1,600:2,960:`auto`},minColumnWidth:240}},q={args:{layout:[{key:`left`,width:1},{key:`fill`,width:`fill`},{key:`right`,width:2},{key:`solo`,width:`fill`}],columns:6,children:[(0,L.jsx)(Tile,{tone:`brand`,children:`width: 1`},`left`),(0,L.jsx)(Tile,{tone:`info`,children:`width: "fill"`},`fill`),(0,L.jsx)(Tile,{tone:`success`,children:`width: 2`},`right`),(0,L.jsx)(Tile,{tone:`warning`,children:`width: "fill" (alone in row)`},`solo`)]}},J={args:{layout:[{key:`a`,width:2},{key:`b`,width:4},{key:`hero`,width:`full`,height:1},{key:`c`,width:3},{key:`d`,width:3}],columns:6,children:[(0,L.jsx)(Tile,{tone:`brand`,children:`width: 2`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`width: 4`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`width: "full"`},`hero`),(0,L.jsx)(Tile,{tone:`warning`,children:`width: 3`},`c`),(0,L.jsx)(Tile,{tone:`error`,children:`width: 3`},`d`)]}},Y={args:{layout:[{key:`a`,width:2,height:2,order:1},{key:`b`,width:2,height:1,order:2},{key:`c`,width:2,height:3,order:3},{key:`d`,width:4,height:1,order:4},{key:`e`,width:2,height:1,order:5}],columns:6,rowHeight:80,children:[(0,L.jsx)(Tile,{tone:`brand`,children:`2 cols × 2 rows`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`2 cols × 1 row`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`2 cols × 3 rows`},`c`),(0,L.jsx)(Tile,{tone:`warning`,children:`4 cols × 1 row`},`d`),(0,L.jsx)(Tile,{tone:`error`,children:`2 cols × 1 row`},`e`)]}},X={parameters:{a11y:{test:`todo`}},args:{columns:12,rowHeight:80,editMode:!0},render:function EditModeStory(e){let[t,n]=(0,r.useState)([{key:`fixed-1`,width:1,height:1,order:1,draggable:!1,tone:`success`},{key:`fixed-1-1`,width:5,height:1,order:2,tone:`info`},{key:`fixed-2`,width:5,height:1,order:3,tone:`brand`},{key:`full`,width:`full`,height:1,order:4,tone:`neutral`},{key:`fixed-3`,width:2,height:1,order:5,tone:`warning`},{key:`fixed-4`,width:2,height:1,order:6,tone:`error`}]),[i,a]=(0,r.useState)(null),o=t.map(({tone:e,...t})=>t),onChangeLayout=e=>{n(e.map(e=>{let n=t.find(t=>t.key===e.key);return{...e,tone:n?.tone??`neutral`}})),a(null)},removeTile=e=>{n(t.filter(t=>t.key!==e))},toggleFill=e=>{n(t.map(t=>t.key===e?{...t,width:t.width===`fill`?void 0:`fill`}:t))},toggleFull=e=>{n(t.map(t=>t.key===e?{...t,width:t.width===`full`?void 0:`full`}:t))},s=(0,r.useMemo)(()=>t.map(e=>(0,L.jsx)(Tile,{tone:e.tone,actionableArea:(0,L.jsx)(TileActions,{isFill:e.width===`fill`,isFull:e.width===`full`,onToggleFill:()=>toggleFill(e.key),onToggleFull:()=>toggleFull(e.key),onRemove:()=>removeTile(e.key)}),children:formatTileLabel(e)},e.key)),[t]);return(0,L.jsxs)(b,{direction:`row`,gap:`lg`,align:`flex-start`,children:[(0,L.jsx)(`div`,{style:{width:`800px`},children:(0,L.jsx)(I,{...e,layout:o,onChangeLayout,onPreviewLayout:a,children:s})}),(0,L.jsx)(LayoutStatePanel,{label:i?`Staging`:`Committed`,layout:i??o,tone:i?`warning`:`success`})]})}},Re={floor:`min 320 × 200 px`,ceiling:`max 500 × 400 px`,ranged:`min 200, max 600 wide`,bounded:`min 300 × 160, max 600 × 320 px`},Z={name:`Per-Item Size Limits`,parameters:{a11y:{test:`todo`}},args:{columns:12,rowHeight:80,editMode:!0,itemLimits:{floor:{minWidth:320,minHeight:200},ceiling:{maxWidth:500,maxHeight:400},ranged:{minWidth:200,maxWidth:600},bounded:{minWidth:300,minHeight:160,maxWidth:600,maxHeight:320}}},render:function SizeLimitsRender(e){let[t,n]=(0,r.useState)([{key:`floor`,width:4,height:2,order:1,tone:`info`},{key:`ceiling`,width:2,height:2,order:2,tone:`warning`},{key:`ranged`,width:3,height:1,order:3,tone:`brand`},{key:`bounded`,width:2,height:1,order:4,tone:`success`},{key:`free`,width:3,height:1,order:5,tone:`neutral`}]),[i,a]=(0,r.useState)(null),o=t.map(({tone:e,...t})=>t),onChangeLayout=e=>{n(e.map(e=>{let n=t.find(t=>t.key===e.key);return{...e,tone:n?.tone??`neutral`}})),a(null)},removeTile=e=>{n(t.filter(t=>t.key!==e))},toggleFill=e=>{n(t.map(t=>t.key===e?{...t,width:t.width===`fill`?void 0:`fill`}:t))},toggleFull=e=>{n(t.map(t=>t.key===e?{...t,width:t.width===`full`?void 0:`full`}:t))},s=(0,r.useMemo)(()=>t.map(e=>(0,L.jsx)(Tile,{tone:e.tone,actionableArea:(0,L.jsx)(TileActions,{isFill:e.width===`fill`,isFull:e.width===`full`,onToggleFill:()=>toggleFill(e.key),onToggleFull:()=>toggleFull(e.key),onRemove:()=>removeTile(e.key)}),children:(0,L.jsxs)(`span`,{style:{textAlign:`center`},children:[formatTileLabel(e),(0,L.jsx)(`br`,{}),Re[e.key]??`no limits`]})},e.key)),[t]);return(0,L.jsxs)(b,{direction:`row`,gap:`lg`,align:`flex-start`,children:[(0,L.jsx)(`div`,{style:{width:`800px`},children:(0,L.jsx)(I,{...e,layout:o,onChangeLayout,onPreviewLayout:a,children:s})}),(0,L.jsx)(LayoutStatePanel,{label:i?`Staging`:`Committed`,layout:i??o,tone:i?`warning`:`success`})]})}},ze=(0,L.jsxs)(`svg`,{xmlns:`http://www.w3.org/2000/svg`,viewBox:`0 0 24 24`,"aria-hidden":`true`,children:[(0,L.jsx)(`path`,{d:`M0 24L24 0`,stroke:`currentColor`,strokeWidth:`3`,strokeLinecap:`round`,fill:`none`}),(0,L.jsx)(`polygon`,{points:`24,24 10,24 24,10`,fill:`currentColor`})]}),Q={parameters:{a11y:{test:`todo`}},args:{columns:6,rowHeight:80,editMode:!0,layout:[{key:`a`,width:2,height:1},{key:`b`,width:4,height:1},{key:`c`,width:3,height:2},{key:`d`,width:3,height:1},{key:`e`,width:3,height:1}]},render:function CustomizationRender(e){let[t,n]=(0,r.useState)(e.layout),i=(0,r.useMemo)(()=>[(0,L.jsx)(Tile,{tone:`brand`,children:`A`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`B`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`C`},`c`),(0,L.jsx)(Tile,{tone:`warning`,children:`D`},`d`),(0,L.jsx)(Tile,{tone:`error`,children:`E`},`e`)],[]);return(0,L.jsx)(`div`,{style:{"--wp-grid-drag-preview-scale":`1.08`,"--wp-grid-placeholder-opacity":`0.2`,"--wp-grid-placeholder-outline-color":`var(--wpds-color-foreground-content-warning, #2e1900)`,"--wp-grid-placeholder-radius":`12px`},children:(0,L.jsx)(I,{...e,layout:t,onChangeLayout:n,renderResizeHandle:CustomResizeHandle,renderDragPreview:CustomDragPreview,children:i})})}},$={parameters:{a11y:{test:`todo`}},name:`Custom Grid Overlay`,args:{columns:12,rowHeight:80,editMode:!0,layout:[{key:`a`,width:3,height:1},{key:`b`,width:5,height:1},{key:`c`,width:4,height:1},{key:`d`,width:2,height:2},{key:`e`,width:6,height:1}]},render:function CustomGridOverlayRender(e){let[t,n]=(0,r.useState)(e.layout),i=(0,r.useMemo)(()=>[(0,L.jsx)(Tile,{tone:`brand`,children:`A`},`a`),(0,L.jsx)(Tile,{tone:`info`,children:`B`},`b`),(0,L.jsx)(Tile,{tone:`success`,children:`C`},`c`),(0,L.jsx)(Tile,{tone:`warning`,children:`D`},`d`),(0,L.jsx)(Tile,{tone:`error`,children:`E`},`e`)],[]);return(0,L.jsx)(I,{...e,layout:t,onChangeLayout:n,renderGridOverlay:NumberedOverlay,children:i})}};try{H.__docgenInfo={description:"Static grid with a fixed number of columns. Each item declares its\ncolumn span via `width`. Items flow left-to-right and wrap to new\nrows as the total exceeds `columns`.",displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:"Tiles with their own links, buttons and form controls. The a11y addon checks that the grid does not wrap them in drag semantics. In edit mode, the first tile is pinned (`draggable: false`) and its controls keep their semantics.",displayName:`InteractiveContent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{W.__docgenInfo={description:"`columns` and `minColumnWidth` compose. `columns` alone fixes the count.\n`minColumnWidth` alone fits as many columns of at least that width as\nthe container allows. Together, `columns` caps what the floor fits:\nup to four columns here, none narrower than 240px, down to one. The\nlayout mixes fixed, `fill`, `full` and two-row tiles so the repacking\nis visible at every count: a `fill` takes the free run of the row it\nlands in, and the tall tile's shadow shortens the runs below it. Open\nthe story full screen and resize the browser to walk the counts.",displayName:`Columns`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{G.__docgenInfo={description:"`columns` as a map: one column from 0px, two from 600px, four from\n960px. The count steps at those container widths regardless of how\nwide each column ends up; add `minColumnWidth` to lower it further.",displayName:`ColumnSteps`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{K.__docgenInfo={description:`A step can be \`'auto'\`: from that width up there is no cap and the
floor alone decides the count. Here the steps fix one and two columns
below 960px, and 240px columns fill the container above it.`,displayName:`ColumnStepsWithFloor`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{q.__docgenInfo={description:`A \`width: 'fill'\` item expands to cover the remaining columns in
its row. Mix it with fixed-width items on either side to build
sidebar-like layouts that adapt to the column count.`,displayName:`FillWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:"A `width: 'full'` item spans every column (`grid-column: 1 / -1`),\nforcing a row break around it. Useful for dividers, hero banners,\nor embedded content that should always take the full width.",displayName:`FullWidth`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:"Numeric `rowHeight` lets items span multiple rows via `height`.\nCombined with `width`, this produces tile-based dashboards where\neach cell can be tuned independently.",displayName:`RowHeight`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:"Edit mode with drag, resize, and all width modes. While `editMode`\nis on, `<DashboardGrid />` paints its default overlay behind the\ntiles to visualize the underlying template: rounded row-marker\ntiles in each column when `rowHeight` is numeric. The overlay\ndisappears when `editMode` flips back to `false`.\n\nTheme the default look in place via `--wp-grid-overlay-tile-bg`,\nor replace the visual wholesale by passing `renderGridOverlay`.\nSee the `Custom Grid Overlay` story for a full override example.\n\nA state panel shows the raw layout JSON. Drag items to reorder;\nresize from the bottom-right handle. Keyboard sensor is enabled:\nuse Tab to focus an item, Space to grab, arrow keys to move, Space\nto drop.",displayName:`EditMode`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Z.__docgenInfo={description:"Per-item size limits via `itemLimits`, in pixels: a floor, a ceiling,\na width range, and a tile bounded on both axes. Constrained tiles pin\nat their bounds while the pointer overshoots, and release commits\nspans inside the limits. `'full'` and `'fill'` stop at the tile's\nmaximum span; the per-tile toggles exercise both.",displayName:`SizeLimits`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Q.__docgenInfo={description:`Exercises the three customization vectors on a single grid:

1. \`renderResizeHandle\` swaps the default corner triangle for a
   custom diagonal-arrow icon.
2. \`renderDragPreview\` wraps the dragged clone (here only for the
   height chain; lift and shadow stay on the grid frame).
3. CSS custom properties on an ancestor retheme the lift scale,
   placeholder opacity, placeholder outline color, and placeholder
   border-radius without touching the package.

Toggle \`editMode\`, then drag and resize a tile to see all three
respond.`,displayName:`Customization`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{$.__docgenInfo={description:"Replaces the package's default edit-mode overlay with a custom\nvisual through the `renderGridOverlay` prop. The grid mounts the\nsupplied component as a sibling behind the tiles whenever\n`editMode` is on, passing the resolved `{ columns, rowHeight }`\nso the override can reproduce the column and row tracks\npixel-accurately without re-deriving them.\n\nHere the override (see `NumberedOverlay` above) swaps the warning\ntone for info, drops the row dividers, and labels each column\ntrack with its index. Pass `renderGridOverlay={ () => null }` to\nsuppress the overlay entirely while keeping `editMode` interactions\non.",displayName:`CustomGridOverlayStory`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-grid/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    layout: [{
      key: 'a',
      width: 1
    }, {
      key: 'b',
      width: 3
    }, {
      key: 'c',
      width: 2
    }, {
      key: 'd',
      width: 4
    }, {
      key: 'e',
      width: 2
    }],
    columns: 6,
    children: [<Tile key="a" tone="brand">
                width: 1
            </Tile>, <Tile key="b" tone="info">
                width: 3
            </Tile>, <Tile key="c" tone="success">
                width: 2
            </Tile>, <Tile key="d" tone="warning">
                width: 4
            </Tile>, <Tile key="e" tone="error">
                width: 2
            </Tile>]
  }
}`,...H.parameters?.docs?.source},description:{story:"Static grid with a fixed number of columns. Each item declares its\ncolumn span via `width`. Items flow left-to-right and wrap to new\nrows as the total exceeds `columns`.",...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    layout: [{
      key: 'pinned',
      width: 2,
      draggable: false
    }, {
      key: 'a',
      width: 2
    }, {
      key: 'b',
      width: 2
    }],
    columns: 6,
    rowHeight: 160,
    children: [<Tile key="pinned" tone="neutral">
                <TileControls title="Pinned" />
            </Tile>, <Tile key="a" tone="info">
                <TileControls title="Tile" />
            </Tile>, <Tile key="b" tone="success">
                <TileControls title="Tile" />
            </Tile>]
  }
}`,...U.parameters?.docs?.source},description:{story:"Tiles with their own links, buttons and form controls. The a11y addon checks that the grid does not wrap them in drag semantics. In edit mode, the first tile is pinned (`draggable: false`) and its controls keep their semantics.",...U.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 4,
    minColumnWidth: 240,
    rowHeight: 96,
    layout: [{
      key: 'a',
      width: 1
    }, {
      key: 'b',
      width: 'fill'
    }, {
      key: 'c',
      width: 1,
      height: 2
    }, {
      key: 'd',
      width: 1
    }, {
      key: 'e',
      width: 'fill'
    }, {
      key: 'f',
      width: 'full'
    }],
    children: [<Tile key="a" tone="brand">
                1
            </Tile>, <Tile key="b" tone="info">
                fill
            </Tile>, <Tile key="c" tone="success">
                1 · 2 rows
            </Tile>, <Tile key="d" tone="warning">
                1
            </Tile>, <Tile key="e" tone="error">
                fill
            </Tile>, <Tile key="f" tone="neutral">
                full
            </Tile>]
  }
}`,...W.parameters?.docs?.source},description:{story:"`columns` and `minColumnWidth` compose. `columns` alone fixes the count.\n`minColumnWidth` alone fits as many columns of at least that width as\nthe container allows. Together, `columns` caps what the floor fits:\nup to four columns here, none narrower than 240px, down to one. The\nlayout mixes fixed, `fill`, `full` and two-row tiles so the repacking\nis visible at every count: a `fill` takes the free run of the row it\nlands in, and the tall tile's shadow shortens the runs below it. Open\nthe story full screen and resize the browser to walk the counts.",...W.parameters?.docs?.description}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  argTypes: {
    columns: {
      control: 'object'
    }
  },
  args: {
    columns: {
      0: 1,
      600: 2,
      960: 4
    },
    rowHeight: 96,
    layout: [{
      key: 'fixed-1',
      width: 1,
      height: 1
    }, {
      key: 'fixed-2',
      width: 2,
      height: 2
    }, {
      key: 'fill-1',
      width: 'fill'
    }, {
      key: 'fixed-3',
      width: 1,
      height: 1
    }, {
      key: 'fixed-4',
      width: 1,
      height: 2
    }, {
      key: 'fixed-5',
      width: 2,
      height: 1
    }, {
      key: 'fill-2',
      width: 'fill'
    }, {
      key: 'full-1',
      width: 'full'
    }],
    children: [<Tile key="fixed-1" tone="brand">
                width: <strong>1</strong> · height: <strong>1</strong>
            </Tile>, <Tile key="fixed-2" tone="info">
                width: <strong>2</strong> · height: <strong>2</strong>
            </Tile>, <Tile key="fill-1" tone="info">
                width: <strong>fill</strong>
            </Tile>, <Tile key="fixed-3" tone="success">
                width: <strong>1</strong> · height: <strong>1</strong>
            </Tile>, <Tile key="fixed-4" tone="warning">
                width: <strong>1</strong> · height: <strong>2</strong>
            </Tile>, <Tile key="fixed-5" tone="error">
                width: <strong>2</strong> · height: <strong>1</strong>
            </Tile>, <Tile key="fill-2" tone="error">
                width: <strong>fill</strong>
            </Tile>, <Tile key="full-1" tone="neutral">
                width: <strong>full</strong>
            </Tile>]
  }
}`,...G.parameters?.docs?.source},description:{story:"`columns` as a map: one column from 0px, two from 600px, four from\n960px. The count steps at those container widths regardless of how\nwide each column ends up; add `minColumnWidth` to lower it further.",...G.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  argTypes: {
    columns: {
      control: 'object'
    }
  },
  args: {
    ...ColumnSteps.args,
    columns: {
      0: 1,
      600: 2,
      960: 'auto'
    },
    minColumnWidth: 240
  }
}`,...K.parameters?.docs?.source},description:{story:`A step can be \`'auto'\`: from that width up there is no cap and the
floor alone decides the count. Here the steps fix one and two columns
below 960px, and 240px columns fill the container above it.`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  args: {
    layout: [{
      key: 'left',
      width: 1
    }, {
      key: 'fill',
      width: 'fill'
    }, {
      key: 'right',
      width: 2
    }, {
      key: 'solo',
      width: 'fill'
    }],
    columns: 6,
    children: [<Tile key="left" tone="brand">
                width: 1
            </Tile>, <Tile key="fill" tone="info">
                width: &quot;fill&quot;
            </Tile>, <Tile key="right" tone="success">
                width: 2
            </Tile>, <Tile key="solo" tone="warning">
                width: &quot;fill&quot; (alone in row)
            </Tile>]
  }
}`,...q.parameters?.docs?.source},description:{story:`A \`width: 'fill'\` item expands to cover the remaining columns in
its row. Mix it with fixed-width items on either side to build
sidebar-like layouts that adapt to the column count.`,...q.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  args: {
    layout: [{
      key: 'a',
      width: 2
    }, {
      key: 'b',
      width: 4
    }, {
      key: 'hero',
      width: 'full',
      height: 1
    }, {
      key: 'c',
      width: 3
    }, {
      key: 'd',
      width: 3
    }],
    columns: 6,
    children: [<Tile key="a" tone="brand">
                width: 2
            </Tile>, <Tile key="b" tone="info">
                width: 4
            </Tile>, <Tile key="hero" tone="success">
                width: &quot;full&quot;
            </Tile>, <Tile key="c" tone="warning">
                width: 3
            </Tile>, <Tile key="d" tone="error">
                width: 3
            </Tile>]
  }
}`,...J.parameters?.docs?.source},description:{story:"A `width: 'full'` item spans every column (`grid-column: 1 / -1`),\nforcing a row break around it. Useful for dividers, hero banners,\nor embedded content that should always take the full width.",...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  args: {
    layout: [{
      key: 'a',
      width: 2,
      height: 2,
      order: 1
    }, {
      key: 'b',
      width: 2,
      height: 1,
      order: 2
    }, {
      key: 'c',
      width: 2,
      height: 3,
      order: 3
    }, {
      key: 'd',
      width: 4,
      height: 1,
      order: 4
    }, {
      key: 'e',
      width: 2,
      height: 1,
      order: 5
    }],
    columns: 6,
    rowHeight: 80,
    children: [<Tile key="a" tone="brand">
                2 cols × 2 rows
            </Tile>, <Tile key="b" tone="info">
                2 cols × 1 row
            </Tile>, <Tile key="c" tone="success">
                2 cols × 3 rows
            </Tile>, <Tile key="d" tone="warning">
                4 cols × 1 row
            </Tile>, <Tile key="e" tone="error">
                2 cols × 1 row
            </Tile>]
  }
}`,...Y.parameters?.docs?.source},description:{story:"Numeric `rowHeight` lets items span multiple rows via `height`.\nCombined with `width`, this produces tile-based dashboards where\neach cell can be tuned independently.",...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 12,
    rowHeight: 80,
    editMode: true
  },
  render: function EditModeStory(args) {
    const initialLayout: (DashboardGridLayoutItem & {
      tone: Tone;
    })[] = [{
      key: 'fixed-1',
      width: 1,
      height: 1,
      order: 1,
      draggable: false,
      tone: 'success'
    }, {
      key: 'fixed-1-1',
      width: 5,
      height: 1,
      order: 2,
      tone: 'info'
    }, {
      key: 'fixed-2',
      width: 5,
      height: 1,
      order: 3,
      tone: 'brand'
    }, {
      key: 'full',
      width: 'full',
      height: 1,
      order: 4,
      tone: 'neutral'
    }, {
      key: 'fixed-3',
      width: 2,
      height: 1,
      order: 5,
      tone: 'warning'
    }, {
      key: 'fixed-4',
      width: 2,
      height: 1,
      order: 6,
      tone: 'error'
    }];
    const [tiles, setTiles] = useState(initialLayout);
    const [previewLayout, setPreviewLayout] = useState<DashboardGridLayoutItem[] | null>(null);
    const layout: DashboardGridLayoutItem[] = tiles.map(({
      tone: _tone,
      ...item
    }) => item);
    const onChangeLayout = (next: DashboardGridLayoutItem[]) => {
      setTiles(next.map(item => {
        const existing = tiles.find(t => t.key === item.key);
        return {
          ...item,
          tone: existing?.tone ?? 'neutral'
        };
      }));
      setPreviewLayout(null);
    };
    const removeTile = (key: string) => {
      setTiles(tiles.filter(tile => tile.key !== key));
    };
    const toggleFill = (key: string) => {
      setTiles(tiles.map(tile => tile.key === key ? {
        ...tile,
        width: tile.width === 'fill' ? undefined : 'fill'
      } : tile));
    };
    const toggleFull = (key: string) => {
      setTiles(tiles.map(tile => tile.key === key ? {
        ...tile,
        width: tile.width === 'full' ? undefined : 'full'
      } : tile));
    };

    // Memoize the Tile elements so the grid's \`children\` prop keeps
    // a stable reference across parent re-renders driven by
    // onPreviewLayout. Without this, every preview tick produces a
    // fresh array of elements and the grid's children walk has to
    // re-run on each frame of a resize gesture.
    const tileElements = useMemo(() => tiles.map(tile => <Tile key={tile.key} tone={tile.tone} actionableArea={<TileActions isFill={tile.width === 'fill'} isFull={tile.width === 'full'} onToggleFill={() => toggleFill(tile.key)} onToggleFull={() => toggleFull(tile.key)} onRemove={() => removeTile(tile.key)} />}>
                        {formatTileLabel(tile)}
                    </Tile>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tiles]);
    return <Stack direction="row" gap="lg" align="flex-start">
                <div style={{
        width: '800px'
      }}>
                    <DashboardGrid {...args} layout={layout} onChangeLayout={onChangeLayout} onPreviewLayout={setPreviewLayout}>
                        {tileElements}
                    </DashboardGrid>
                </div>

                <LayoutStatePanel label={previewLayout ? 'Staging' : 'Committed'} layout={previewLayout ?? layout} tone={previewLayout ? 'warning' : 'success'} />
            </Stack>;
  }
}`,...X.parameters?.docs?.source},description:{story:"Edit mode with drag, resize, and all width modes. While `editMode`\nis on, `<DashboardGrid />` paints its default overlay behind the\ntiles to visualize the underlying template: rounded row-marker\ntiles in each column when `rowHeight` is numeric. The overlay\ndisappears when `editMode` flips back to `false`.\n\nTheme the default look in place via `--wp-grid-overlay-tile-bg`,\nor replace the visual wholesale by passing `renderGridOverlay`.\nSee the `Custom Grid Overlay` story for a full override example.\n\nA state panel shows the raw layout JSON. Drag items to reorder;\nresize from the bottom-right handle. Keyboard sensor is enabled:\nuse Tab to focus an item, Space to grab, arrow keys to move, Space\nto drop.",...X.parameters?.docs?.description}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: 'Per-Item Size Limits',
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 12,
    rowHeight: 80,
    editMode: true,
    itemLimits: {
      floor: {
        minWidth: 320,
        minHeight: 200
      },
      ceiling: {
        maxWidth: 500,
        maxHeight: 400
      },
      ranged: {
        minWidth: 200,
        maxWidth: 600
      },
      bounded: {
        minWidth: 300,
        minHeight: 160,
        maxWidth: 600,
        maxHeight: 320
      }
    }
  },
  render: function SizeLimitsRender(args) {
    const initialLayout: (DashboardGridLayoutItem & {
      tone: Tone;
    })[] = [{
      key: 'floor',
      width: 4,
      height: 2,
      order: 1,
      tone: 'info'
    }, {
      key: 'ceiling',
      width: 2,
      height: 2,
      order: 2,
      tone: 'warning'
    }, {
      key: 'ranged',
      width: 3,
      height: 1,
      order: 3,
      tone: 'brand'
    }, {
      key: 'bounded',
      width: 2,
      height: 1,
      order: 4,
      tone: 'success'
    }, {
      key: 'free',
      width: 3,
      height: 1,
      order: 5,
      tone: 'neutral'
    }];
    const [tiles, setTiles] = useState(initialLayout);
    const [previewLayout, setPreviewLayout] = useState<DashboardGridLayoutItem[] | null>(null);
    const layout: DashboardGridLayoutItem[] = tiles.map(({
      tone: _tone,
      ...item
    }) => item);
    const onChangeLayout = (next: DashboardGridLayoutItem[]) => {
      setTiles(next.map(item => {
        const existing = tiles.find(t => t.key === item.key);
        return {
          ...item,
          tone: existing?.tone ?? 'neutral'
        };
      }));
      setPreviewLayout(null);
    };
    const removeTile = (key: string) => {
      setTiles(tiles.filter(tile => tile.key !== key));
    };
    const toggleFill = (key: string) => {
      setTiles(tiles.map(tile => tile.key === key ? {
        ...tile,
        width: tile.width === 'fill' ? undefined : 'fill'
      } : tile));
    };
    const toggleFull = (key: string) => {
      setTiles(tiles.map(tile => tile.key === key ? {
        ...tile,
        width: tile.width === 'full' ? undefined : 'full'
      } : tile));
    };
    const tileElements = useMemo(() => tiles.map(tile => <Tile key={tile.key} tone={tile.tone} actionableArea={<TileActions isFill={tile.width === 'fill'} isFull={tile.width === 'full'} onToggleFill={() => toggleFill(tile.key)} onToggleFull={() => toggleFull(tile.key)} onRemove={() => removeTile(tile.key)} />}>
                        <span style={{
        textAlign: 'center'
      }}>
                            {formatTileLabel(tile)}
                            <br />
                            {LIMIT_LABELS[tile.key] ?? 'no limits'}
                        </span>
                    </Tile>),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tiles]);
    return <Stack direction="row" gap="lg" align="flex-start">
                <div style={{
        width: '800px'
      }}>
                    <DashboardGrid {...args} layout={layout} onChangeLayout={onChangeLayout} onPreviewLayout={setPreviewLayout}>
                        {tileElements}
                    </DashboardGrid>
                </div>

                <LayoutStatePanel label={previewLayout ? 'Staging' : 'Committed'} layout={previewLayout ?? layout} tone={previewLayout ? 'warning' : 'success'} />
            </Stack>;
  }
}`,...Z.parameters?.docs?.source},description:{story:"Per-item size limits via `itemLimits`, in pixels: a floor, a ceiling,\na width range, and a tile bounded on both axes. Constrained tiles pin\nat their bounds while the pointer overshoots, and release commits\nspans inside the limits. `'full'` and `'fill'` stop at the tile's\nmaximum span; the per-tile toggles exercise both.",...Z.parameters?.docs?.description}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 6,
    rowHeight: 80,
    editMode: true,
    layout: [{
      key: 'a',
      width: 2,
      height: 1
    }, {
      key: 'b',
      width: 4,
      height: 1
    }, {
      key: 'c',
      width: 3,
      height: 2
    }, {
      key: 'd',
      width: 3,
      height: 1
    }, {
      key: 'e',
      width: 3,
      height: 1
    }]
  },
  render: function CustomizationRender(args) {
    const [layout, setLayout] = useState<DashboardGridLayoutItem[]>(args.layout);
    const tiles = useMemo(() => [<Tile key="a" tone="brand">
                    A
                </Tile>, <Tile key="b" tone="info">
                    B
                </Tile>, <Tile key="c" tone="success">
                    C
                </Tile>, <Tile key="d" tone="warning">
                    D
                </Tile>, <Tile key="e" tone="error">
                    E
                </Tile>], []);
    const customTokens = {
      '--wp-grid-drag-preview-scale': '1.08',
      '--wp-grid-placeholder-opacity': '0.2',
      '--wp-grid-placeholder-outline-color': 'var(--wpds-color-foreground-content-warning)',
      '--wp-grid-placeholder-radius': '12px'
    } as React.CSSProperties;
    return <div style={customTokens}>
                <DashboardGrid {...args} layout={layout} onChangeLayout={setLayout} renderResizeHandle={CustomResizeHandle} renderDragPreview={CustomDragPreview}>
                    {tiles}
                </DashboardGrid>
            </div>;
  }
}`,...Q.parameters?.docs?.source},description:{story:`Exercises the three customization vectors on a single grid:

1. \`renderResizeHandle\` swaps the default corner triangle for a
   custom diagonal-arrow icon.
2. \`renderDragPreview\` wraps the dragged clone (here only for the
   height chain; lift and shadow stay on the grid frame).
3. CSS custom properties on an ancestor retheme the lift scale,
   placeholder opacity, placeholder outline color, and placeholder
   border-radius without touching the package.

Toggle \`editMode\`, then drag and resize a tile to see all three
respond.`,...Q.parameters?.docs?.description}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  name: 'Custom Grid Overlay',
  args: {
    columns: 12,
    rowHeight: 80,
    editMode: true,
    layout: [{
      key: 'a',
      width: 3,
      height: 1
    }, {
      key: 'b',
      width: 5,
      height: 1
    }, {
      key: 'c',
      width: 4,
      height: 1
    }, {
      key: 'd',
      width: 2,
      height: 2
    }, {
      key: 'e',
      width: 6,
      height: 1
    }]
  },
  render: function CustomGridOverlayRender(args) {
    const [layout, setLayout] = useState<DashboardGridLayoutItem[]>(args.layout);
    const tiles = useMemo(() => [<Tile key="a" tone="brand">
                    A
                </Tile>, <Tile key="b" tone="info">
                    B
                </Tile>, <Tile key="c" tone="success">
                    C
                </Tile>, <Tile key="d" tone="warning">
                    D
                </Tile>, <Tile key="e" tone="error">
                    E
                </Tile>], []);
    return <DashboardGrid {...args} layout={layout} onChangeLayout={setLayout} renderGridOverlay={NumberedOverlay}>
                {tiles}
            </DashboardGrid>;
  }
}`,...$.parameters?.docs?.source},description:{story:"Replaces the package's default edit-mode overlay with a custom\nvisual through the `renderGridOverlay` prop. The grid mounts the\nsupplied component as a sibling behind the tiles whenever\n`editMode` is on, passing the resolved `{ columns, rowHeight }`\nso the override can reproduce the column and row tracks\npixel-accurately without re-deriving them.\n\nHere the override (see `NumberedOverlay` above) swaps the warning\ntone for info, drops the row dividers, and labels each column\ntrack with its index. Pass `renderGridOverlay={ () => null }` to\nsuppress the overlay entirely while keeping `editMode` interactions\non.",...$.parameters?.docs?.description}}}})))()}init_index_story();export{G as ColumnSteps,K as ColumnStepsWithFloor,W as Columns,$ as CustomGridOverlayStory,Q as Customization,H as Default,X as EditMode,q as FillWidth,J as FullWidth,U as InteractiveContent,Y as RowHeight,Z as SizeLimits,Ie as default};