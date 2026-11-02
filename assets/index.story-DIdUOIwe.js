import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./use-merge-refs-BNmiIksj.js";import{n as o,t as s}from"./use-event-Cr6_a9Gc.js";import{n as c,t as l}from"./use-resize-observer-B9klA0Ns.js";import{a as u,i as d}from"./iframe-y9psNcyg.js";import{n as f,t as p}from"./build-module-moyqbjZD.js";import{a as ee,c as m,f as h,h as te,i as ne,l as re,m as g,o as _,r as v,s as ie,t as ae}from"./sortable.esm-C1hKZVjP.js";import{A as oe,C as y,D as b,E as se,O as x,S as ce,_ as le,a as ue,b as de,c as fe,d as pe,f as me,g as he,h as ge,i as _e,j as S,k as C,l as ve,m as ye,n as w,o as be,p as T,r as E,s as D,t as O,u as k,w as xe,x as A,y as Se}from"./drag-overlay-drop-animation-8qf4nTD9.js";var j,M;function init_lanes_item_module(){return(init_lanes_item_module=e((()=>{j=`_item_1tsoe_1`,M={item:j,"item-content":`_item-content_1tsoe_5`,"is-resizing":`_is-resizing_1tsoe_10`,"is-dragging":`_is-dragging_1tsoe_31`,"wp-grid-item-placeholder-in":`_wp-grid-item-placeholder-in_1tsoe_1`,"preview-overlay":`_preview-overlay_1tsoe_75`}})))()}function getItemCursor(e,t){if(e)return`default`;if(!t)return`grab`}function LanesItem({itemKey:e,placementStyle:t,disabled:n=!1,draggable:a=!0,resizable:o=!0,interacting:s=!1,children:c,actionableArea:l=null,onResize:u,onResizeEnd:f,resizeSnapPreview:m=null,minResizeWidthPx:h,maxResizeWidthPx:te,renderResizeHandle:ne,dragging:re=!1}){let[g,_]=(0,r.useState)(null),[v,ie]=(0,r.useState)(null),ae=(0,r.useRef)(null),y=(0,r.useRef)(null),b=n||!a,le=n||!o,{attributes:ue,listeners:de,setNodeRef:fe,setActivatorNodeRef:pe,isDragging:me}=ee({id:e,disabled:b}),he=i([ae,fe]),ge=i([y]),_e={...t,alignSelf:`start`},S=g!==null,C=d(M.item,me&&M[`is-dragging`],S&&M[`is-resizing`]),handleResize=t=>{let n=y.current,r=v;if(n&&!r){let{width:e,height:t}=n.getBoundingClientRect();r={width:e,height:t},ie(r)}let i={width:t.width,height:0};r&&(i=ce(i,r,{width:h},{width:te})),_(i),u(e,i)},handleResizeEnd=()=>{_(null),ie(null),f()},ve=g&&v?{width:v.width+g.width}:void 0,ye=m?(0,N.jsx)(`div`,{className:M[`preview-overlay`],style:{width:m.widthPx,height:m.heightPx??`100%`}}):null;return(0,N.jsxs)(`div`,{ref:he,className:C,style:_e,[x]:e,"data-wp-grid-item-resizing":S||void 0,children:[l?(0,N.jsx)(`div`,{className:oe[`actionable-area-slot`],children:(0,N.jsx)(`div`,{style:{display:`contents`},inert:p(re),children:l})}):null,(0,N.jsxs)(`div`,{ref:pe,...b?{}:ue,...de,style:{height:`100%`,cursor:getItemCursor(b,s)},children:[(0,N.jsxs)(`div`,{ref:ge,className:M[`item-content`],style:ve,children:[c,!le&&(0,N.jsx)(se,{itemId:e,verticalResizable:!1,onResize:handleResize,onResizeEnd:handleResizeEnd,renderResizeHandle:ne})]}),ye]})]})}var N;function init_lanes_item(){return(init_lanes_item=e((()=>{v(),u(),n(),a(),f(),S(),b(),C(),init_lanes_item_module(),N=t();try{LanesItem.__docgenInfo={description:``,displayName:`LanesItem`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,methods:[],props:{itemKey:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Item key. Forwarded to dnd-kit and emitted as the
\`data-wp-grid-item-key\` attribute the hook reads to map measured DOM
nodes back to logical items.`,name:`itemKey`,required:!0,tags:{},type:{name:`string`}},placementStyle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:"Inline placement style produced by `useLanePlacement`. On native\n(`display: grid-lanes`), only `gridColumn: span N`. While\npolyfilling, also `gridColumnStart` / `gridRowStart` /\n`gridRowEnd: span N`.",name:`placementStyle`,required:!0,tags:{},type:{name:`CSSProperties`}},disabled:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Whether drag and resize interactions are disabled.`,name:`disabled`,required:!1,tags:{},type:{name:`boolean`}},draggable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:"Whether the item can be dragged. Combined with `disabled`.",name:`draggable`,required:!1,tags:{},type:{name:`boolean`}},resizable:{defaultValue:{value:`true`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:"Whether the item can be resized. Combined with `disabled`.",name:`resizable`,required:!1,tags:{},type:{name:`boolean`}},interacting:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Whether any tile in the surface is currently being dragged or
resized. Drives the drag activator cursor.`,name:`interacting`,required:!1,tags:{},type:{name:`boolean`}},dragging:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:"Whether a tile drag is in progress. Mutes each tile's\n`actionableArea` with `inert` so hovers on other tiles' controls\ndo not steal the gesture.",name:`dragging`,required:!1,tags:{},type:{name:`boolean`}},actionableArea:{defaultValue:{value:`null`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:``,name:`actionableArea`,required:!1,tags:{},type:{name:`ReactNode`}},onResize:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:``,name:`onResize`,required:!0,tags:{},type:{name:`(id: string, delta: ResizeDelta) => void`}},resizeSnapPreview:{defaultValue:{value:`null`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Snapped column span in pixels for the resize-preview outline.`,name:`resizeSnapPreview`,required:!1,tags:{},type:{name:`ResizeSnapSize | null`}},minResizeWidthPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Minimum tile width while resizing, in pixels (one column track).`,name:`minResizeWidthPx`,required:!0,tags:{},type:{name:`number`}},maxResizeWidthPx:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:`Maximum tile width while resizing, in pixels. Omitted when the
item declares no width limit.`,name:`maxResizeWidthPx`,required:!1,tags:{},type:{name:`number`}},onResizeEnd:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:``,name:`onResizeEnd`,required:!0,tags:{},type:{name:`() => void`}},renderResizeHandle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/lanes-item.tsx`,name:`TypeLiteral`}],description:``,name:`renderResizeHandle`,required:!1,tags:{},type:{name:`ComponentType<ResizeHandleRenderProps>`}}},tags:{}}}catch{}})))()}function clampSpan$1(e,t){return Number.isFinite(e)?Math.max(1,Math.min(Math.floor(e),t)):1}function clampLane(e,t,n){return Number.isFinite(e)?Math.max(0,Math.min(Math.floor(e),n-t)):0}function maxBaselineAcross(e,t,n){let r=0;for(let i=t;i<t+n;i++)e[i]>r&&(r=e[i]);return r}function computeLanePlacements(e){let t=Math.max(1,Math.floor(e.lanes)),n=Math.max(0,e.gap),r=Math.max(0,e.flowTolerance),i=Array(t).fill(0),a=new Map,o=[],s=[];for(let t of e.items)t.lane===void 0?s.push(t):o.push(t);for(let e of o){let r=clampSpan$1(e.span,t),o=clampLane(e.lane,r,t),s=maxBaselineAcross(i,o,r),c=s===0?0:s+n,l=Math.max(0,e.height);a.set(e.key,{key:e.key,lane:o,top:c,span:r});let u=c+l;for(let e=o;e<o+r;e++)i[e]=u}for(let e of s){let o=clampSpan$1(e.span,t),s=0,c=1/0;for(let e=0;e<=t-o;e++){let t=maxBaselineAcross(i,e,o);c-t>r&&(c=t,s=e)}let l=c===0?0:c+n,u=Math.max(0,e.height);a.set(e.key,{key:e.key,lane:s,top:l,span:o});let d=l+u;for(let e=s;e<s+o;e++)i[e]=d}let c=0;for(let e of i)e>c&&(c=e);return{placements:a,totalHeight:c}}function supportsGridLanes(){return typeof CSS>`u`||!CSS.supports?!1:CSS.supports(`display`,`grid-lanes`)}function clampSpan(e){return typeof e!=`number`||!Number.isFinite(e)?1:Math.max(1,Math.floor(e))}function useLanePlacement(e,t){let[n]=(0,r.useState)(()=>!supportsGridLanes()),[i,a]=(0,r.useState)(()=>new Map),o=(0,r.useMemo)(()=>{let e=new Map;for(let n of t.items)e.set(n.key,{gridColumn:`span ${clampSpan(n.span)}`});return e},[t.items]),s=(0,r.useMemo)(()=>t.items.map(e=>`${e.key}/${e.span??1}/${e.lane??``}`).join(`\0`),[t.items]),c=(0,r.useMemo)(()=>t.items,[s]),{lanes:l,gap:u,flowTolerance:d,rowUnit:f}=t;return(0,r.useLayoutEffect)(()=>{if(!n||!e||typeof ResizeObserver>`u`)return;let t=new Map,r=new Set,i=!1,o=null,recompute=()=>{o!==null||i||(o=requestAnimationFrame(()=>{if(o=null,i)return;let e=computeLanePlacements({items:c.map(e=>({key:e.key,span:clampSpan(e.span),lane:e.lane,height:t.get(e.key)??0})),lanes:l,gap:u,flowTolerance:d}),n=Math.max(1,f??P),r=new Map;for(let i of c){let a=e.placements.get(i.key);if(!a)continue;let o=t.get(i.key)??0,s=Math.floor(a.top/n)+1,c=Math.max(1,Math.ceil(o/n));r.set(i.key,{gridColumnStart:a.lane+1,gridColumnEnd:`span ${a.span}`,gridRowStart:s,gridRowEnd:`span ${c}`})}a(r)}))},s=new ResizeObserver(e=>{let n=!1;for(let r of e){let e=r.target.getAttribute(x);if(!e)continue;let i=r.contentRect.height;t.get(e)!==i&&(t.set(e,i),n=!0)}n&&recompute()}),refreshObserved=()=>{let n=e.querySelectorAll(`[${x}]`);for(let e of n)if(!r.has(e)){r.add(e),s.observe(e);let n=e.getAttribute(x);if(n){let r=e.getBoundingClientRect();t.set(n,r.height)}}for(let t of r)e.contains(t)||(s.unobserve(t),r.delete(t))},p=typeof MutationObserver<`u`?new MutationObserver(()=>{refreshObserved(),recompute()}):null;return p&&p.observe(e,{childList:!0,subtree:!0,attributes:!0,attributeFilter:[x]}),refreshObserved(),recompute(),()=>{i=!0,o!==null&&cancelAnimationFrame(o),s.disconnect(),p?.disconnect()}},[e,n,l,u,d,f,c]),n?i.size===0?{itemStyles:o,isPolyfilled:!0}:{itemStyles:i,isPolyfilled:!0}:{itemStyles:o,isPolyfilled:!1}}var P;function init_use_lane_placement(){return(init_use_lane_placement=e((()=>{n(),C(),P=4})))()}var F,I;function init_lanes_module(){return(init_lanes_module=e((()=>{F=`_lanes_1iffx_1`,I={lanes:F,"drag-preview-frame":`_drag-preview-frame_1iffx_34`,"drag-preview-frame__lift":`_drag-preview-frame__lift_1iffx_53`,"wp-grid-drag-preview-shadow-enter":`_wp-grid-drag-preview-shadow-enter_1iffx_1`,"wp-grid-drag-preview-scale-enter":`_wp-grid-drag-preview-scale-enter_1iffx_1`,"is-exiting":`_is-exiting_1iffx_103`,"wp-grid-drag-preview-shadow-exit":`_wp-grid-drag-preview-shadow-exit_1iffx_1`,"wp-grid-drag-preview-scale-exit":`_wp-grid-drag-preview-scale-exit_1iffx_1`}})))()}var L,Ce,we,Te,NO_SORT_STRATEGY,R;function init_dashboard_lanes(){return(init_dashboard_lanes=e((()=>{h(),v(),u(),l(),s(),a(),n(),init_lanes_item(),init_use_lane_placement(),A(),le(),T(),pe(),k(),D(),E(),w(),init_lanes_module(),L=t(),Ce=O(I[`drag-preview-frame`],I[`is-exiting`]),we=24,Te=6,NO_SORT_STRATEGY=()=>null,R=(0,r.forwardRef)(function UnforwardedDashboardLanes(e,t){let{layout:n,columns:a,children:s,className:l,style:u,flowTolerance:f=16,rowUnit:p=4,minColumnWidth:ee,itemLimits:h,editMode:v=!1,onChangeLayout:oe,onPreviewLayout:b,renderResizeHandle:se,renderDragPreview:x,renderGridOverlay:ce,...le}=e,[pe,S]=(0,r.useState)(),[C,w]=(0,r.useState)(null),[T,E]=(0,r.useState)(!1),[D,O]=(0,r.useState)(null),k=(0,r.useRef)(void 0),A=(0,r.useRef)(null),j=(0,r.useRef)(null),M=(0,r.useRef)(()=>{}),N=(0,r.useRef)(new Map),P=pe??n,[F,R]=(0,r.useState)(null),[z,B]=(0,r.useState)(0),[V,Ee]=(0,r.useState)(we),H=c(([{contentRect:e}])=>{B(e.width)}),U=i([R,H,t]);(0,r.useLayoutEffect)(()=>{if(!F)return;let{width:e}=F.getBoundingClientRect();e>0&&B(e);let t=Number.parseFloat(window.getComputedStyle(F).columnGap);Number.isFinite(t)&&t>0&&Ee(t)},[F]);let W=(0,r.useMemo)(()=>Se({columns:a,minColumnWidth:ee},z,V,Te),[ee,V,z,a]),G=(z-(W-1)*V)/W,K=xe(1,1,G,V,null).widthPx,q=ge(h,G,V,null,W),J=ye(q,G,V,null),Y=(0,r.useMemo)(()=>{let e=new Map;return P.forEach(t=>e.set(t.key,t)),e},[P]),X=(0,r.useMemo)(()=>new Set(n.map(e=>e.key)),[n]),Z=(0,r.useMemo)(()=>P.map((e,t)=>({item:e,index:t})).sort((e,t)=>(e.item.order??e.index)-(t.item.order??t.index)).map(({item:e})=>e.key),[P]),Q=(0,r.useMemo)(()=>{let e=new Map;for(let[t,n]of Y){let r=typeof n.width==`number`?Math.max(1,Math.min(n.width,W)):1,i=q.get(t);e.set(t,i?y(r,i.minWidth,i.maxWidth):r)}return e},[Y,W,q]),{itemStyles:De}=useLanePlacement(F,{items:(0,r.useMemo)(()=>Z.map(e=>({key:e,span:Q.get(e)??1,lane:Y.get(e)?.lane})),[Z,Y,Q]),lanes:W,gap:V,flowTolerance:f,rowUnit:p}),[Oe,ke,Ae,je]=(0,r.useMemo)(()=>{let e=new Map,t=new Map,n=[],i=new Map;return r.Children.forEach(s,a=>{if(!(0,r.isValidElement)(a)){n.push(a);return}let o=a.key?.toString();if(!o){n.push(a);return}let{actionableArea:s}=a.props,c=s===void 0?a:(0,r.cloneElement)(a,{actionableArea:void 0});i.set(o,c),X.has(o)?(s!==void 0&&t.set(o,s),e.set(o,c)):n.push(a)}),[e,t,n,i]},[s,X]);(0,r.useLayoutEffect)(()=>{for(let[e,t]of je)N.current.set(e,t)},[je]);let Me=te(g(re),g(m,{coordinateGetter:ne})),Ne=o(e=>{w(String(e.active.id)),A.current=null}),Pe=o(()=>{w(null),k.current=void 0,A.current=null,j.current=null,E(!1),O(null),S(void 0)}),Fe=o(e=>{let{active:t,over:n}=e;if(!n||t.id===n.id)return;let r=t.rect.current.translated;if(!r)return;let i=r.left+r.width/2,a=r.top+r.height/2,o=A.current;if(o){let e=i-o.x,t=a-o.y;if(e*e+t*t<100)return}let s=i>n.rect.left+n.rect.width/2,c=Z.indexOf(String(t.id)),l=Z.indexOf(String(n.id)),u;if(u=s?c>l?l+1:l:c>l?l:l-1,u=Math.max(0,Math.min(u,Z.length-1)),u===c)return;let d=de(Z,c,u,e=>Y.get(e)?.draggable===!1);if(d.every((e,t)=>e===Z[t]))return;let f=new Map;d.forEach((e,t)=>{f.set(e,t)});let p=P.map(e=>({...e,order:f.get(e.key)??0}));A.current={x:i,y:a},k.current=p,M.current(),S(p),b?.(p)}),Ie=o(()=>{let e=k.current;k.current=void 0,j.current=null,E(!1),O(null),!oe||!e||oe(e),S(void 0)}),Le=o((e,t)=>{if(!v)return;T||E(!0);let n=Math.round(t.width/(G+V));j.current===null&&(j.current=Q.get(e)??1);let r=j.current,i=q.get(e),a=y(r+n,i?.minWidth??1,i?.maxWidth??W);if(O({id:e,snap:xe(a,1,G,V,null)}),(k.current?.find(t=>t.key===e)?.width??Q.get(e))===a)return;let o=P.map(t=>t.key===e?{...t,width:a}:t);k.current=o,M.current(),S(o),b?.(o)}),Re=C!==null||T,$=C?Oe.get(C):null,ze=x,Be=C&&$?(0,L.jsx)(`div`,{className:I[`drag-preview-frame`],children:(0,L.jsx)(`div`,{className:I[`drag-preview-frame__lift`],children:ze?(0,L.jsx)(ze,{itemId:C,children:$}):$})}):null,Ve=ce??he,He=(0,r.useMemo)(()=>(0,L.jsx)(Ve,{columns:W,isActive:v}),[Ve,v,W]),Ue=(0,r.useMemo)(()=>`${ue(P)}\0${be(De)}`,[P,De]),We=C??(T?D?.id:null),{captureLayoutSnapshot:Ge,getPositionsBeforeLastChange:Ke}=fe({container:F,enabled:v,layoutFingerprint:Ue,excludeItemKey:We}),{exitingItems:qe,clearExitingItem:Je}=_e({container:F,enabled:v,layoutKeys:X,getPositionsBeforeLastChange:Ke,childrenCacheRef:N}),Ye=v;return(0,r.useLayoutEffect)(()=>{M.current=Ge},[Ge]),(0,L.jsxs)(_,{sensors:Me,onDragStart:Ne,onDragCancel:Pe,onDragMove:Fe,onDragEnd:()=>{Ie(),A.current=null,w(null)},children:[(0,L.jsx)(ae,{items:Z,strategy:NO_SORT_STRATEGY,children:(0,L.jsxs)(`div`,{...le,ref:U,className:d(I.lanes,Ye&&me[`layout-animating`],l),"data-wp-grid-dragging":C||void 0,"data-wp-grid-resizing":T||void 0,style:{...u,gridTemplateColumns:`repeat(${W}, minmax(0, 1fr))`,"--wp-grid-lane-row-unit":`${Math.max(1,p)}px`},children:[He,Z.map(e=>{let t=Oe.get(e);if(!t)return null;let n=J.get(e);return(0,L.jsx)(LanesItem,{itemKey:e,placementStyle:De.get(e)??{},disabled:!v,draggable:Y.get(e)?.draggable!==!1,resizable:Y.get(e)?.resizable!==!1,interacting:Re,dragging:C!==null,onResize:Le,onResizeEnd:Ie,resizeSnapPreview:D?.id===e?D.snap:null,minResizeWidthPx:n?.minWidthPx??K,maxResizeWidthPx:n?.maxWidthPx,actionableArea:ke.get(e),renderResizeHandle:se,children:t},e)}),Ae,qe.map(({key:e,rect:t,child:n})=>(0,L.jsx)(ve,{itemKey:e,rect:t,onAnimationEnd:()=>Je(e),children:n},`exiting-${e}`))]})}),(0,L.jsx)(ie,{dropAnimation:Ce,children:Be})]})});try{R.__docgenInfo={description:"Masonry-style surface aligned with `display: grid-lanes`. Items\ndeclare a column span; heights are driven by content; placement\nfollows the source-ordered, shortest-lane algorithm with\n`flow-tolerance` tiebreaking.\n\nOn browsers that support `display: grid-lanes` natively, the\ncomponent emits the spec's CSS and lets the engine handle layout.\nOtherwise, `useLanePlacement` measures item heights and assigns\nexplicit `grid-column-start` / `grid-row-start` values that\napproximate the same result inside CSS Grid.\n\nEach child's `key` must match an entry in the `layout` array;\nchildren without a match render at the end of the surface without\nexplicit placement and fall through the lanes auto-flow.",displayName:`DashboardLanes`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/index.tsx`,methods:[],props:{layout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Array of layout items.`,name:`layout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!0,tags:{},type:{name:`DashboardLanesLayoutItem[]`}},children:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:"Surface children. Each child must carry a `key` matching an\nentry in `layout`; children without a match render at the end\nof the surface without explicit placement and fall through the\nlanes auto-flow.",name:`children`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!0,tags:{},type:{name:`ReactNode`}},className:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Additional CSS class on the surface root.`,name:`className`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`string`}},style:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Inline styles on the surface root. Merged underneath the
surface's own layout styles, so \`display\` and
\`gridTemplateColumns\` always win. The gap between tiles is
owned by the design-system gap token and is not configurable
per instance; override it via a theme or density change.`,name:`style`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`CSSProperties`}},flowTolerance:{defaultValue:{value:`16`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`\`flow-tolerance\` value in pixels. When two candidate lanes
differ in baseline by no more than this, the earlier lane wins
to preserve source order. Larger values keep tiles closer to
reading order at the cost of bigger empty regions.`,name:`flowTolerance`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`number`}},rowUnit:{defaultValue:{value:`4`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:"Snap unit for the polyfill's `grid-row-start` / `grid-row-end:\nspan N` math. Smaller values produce sharper placement at the\ncost of a larger implicit row count. Ignored on browsers with\nnative `display: grid-lanes` support.",name:`rowUnit`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`number`}},editMode:{defaultValue:{value:`false`},declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Whether the surface is in edit mode (drag-to-reorder, resize).`,name:`editMode`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`boolean`}},onChangeLayout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Fired when the user commits a drag or resize.`,name:`onChangeLayout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`((newLayout: DashboardLanesLayoutItem[]) => void)`}},onPreviewLayout:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:"Fired continuously during a gesture with the in-progress\nlayout. The committed result still emits via `onChangeLayout`.",name:`onPreviewLayout`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`((previewLayout: DashboardLanesLayoutItem[]) => void)`}},renderResizeHandle:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Override the default corner resize handle. See \`DashboardGrid\`
for the full contract; on lanes the handle is horizontal-only
because heights are content-driven.`,name:`renderResizeHandle`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`ComponentType<ResizeHandleRenderProps>`}},renderDragPreview:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Custom wrapper for the dragged-clone visual mounted inside
\`<DragOverlay>\`. The surface always wraps the clone with a thin
functional frame (lift scale, grabbing cursor, pointer pass-
through) and mounts this component inside it; the consumer
owns the visual chrome (shadow, radius, padding).

When omitted, the cloned children render directly inside the
functional frame so any chrome the consumer applied to the
persistent tile carries through unchanged.

Token-only adjustments (lift scale, placeholder opacity,
outline color, placeholder radius) flow through CSS custom
properties documented in the README.`,name:`renderDragPreview`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`ComponentType<DragPreviewRenderProps>`}},renderGridOverlay:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Override the default edit-mode overlay (empty column tracks) with
a custom component. Lanes are content-driven vertically, so no
\`rowHeight\` or \`rows\` is supplied and the default visual paints
columns only.

The overlay only renders when \`editMode\` is true. When omitted,
the package's default visual is used.`,name:`renderGridOverlay`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`ComponentType<GridOverlayRenderProps>`}},columns:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:"Lane count, used as a cap. A number applies at every width; a\n`ColumnSteps` map applies a count from each container width up, and\nan `'auto'` step lifts the cap from its width up.\nDefaults to six when neither `columns` nor `minColumnWidth` is set;\nwith `minColumnWidth` set it can resolve lower on narrow containers.",name:`columns`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`number | ColumnSteps`}},minColumnWidth:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Per-tile minimum width in pixels. Enables responsive mode: the
lane count derives from container width, floored by this value,
down to 1.`,name:`minColumnWidth`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`number`}},itemLimits:{defaultValue:null,declarations:[{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`}],description:`Per-item width limits in pixels, keyed by layout item key. Lane
heights are content-driven, so there is no height axis.`,name:`itemLimits`,parent:{fileName:`gutenberg/packages/grid/src/dashboard-lanes/types.ts`,name:`DashboardLanesProps`},required:!1,tags:{},type:{name:`Record<string, GridItemWidthLimits>`}}},tags:{example:`\`\`\`jsx
<DashboardLanes
    layout={ [
        { key: 'a' },
        { key: 'b', width: 2 },
        { key: 'c' },
    ] }
    columns={ 3 }
    editMode
    onChangeLayout={ setLayout }
>
    <Tile key="a">A</Tile>
    <Tile key="b">B</Tile>
    <Tile key="c">C</Tile>
</DashboardLanes>
\`\`\``,param:"props Component props.\nref Forwarded to the surface's root `<div>`."}}}catch{}})))()}function Tile({tone:e,height:t,index:n,children:r,...i}){return(0,z.jsxs)(`div`,{...i,style:{backgroundColor:V[e],color:Ee[e],padding:`12px 16px`,display:`flex`,alignItems:`flex-end`,justifyContent:`center`,position:`relative`,overflow:`hidden`,height:t,boxSizing:`border-box`,fontFamily:`var(--wpds-typography-font-family-body, -apple-system, system-ui, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`,borderRadius:6,...i?.style},children:[n!==void 0&&(0,z.jsx)(`span`,{"aria-hidden":!0,style:{position:`absolute`,inset:0,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:`3rem`,fontWeight:700,opacity:.3,pointerEvents:`none`,userSelect:`none`},children:n}),r&&(0,z.jsx)(`span`,{style:{position:`relative`},children:r})]})}function TileControls({title:e}){let t=(0,r.useId)();return(0,z.jsxs)(`span`,{style:{display:`flex`,flexDirection:`column`,alignItems:`flex-start`,gap:8},children:[(0,z.jsx)(`strong`,{children:e}),(0,z.jsx)(`a`,{href:`#details`,children:`Details`}),(0,z.jsx)(`button`,{type:`button`,children:`Refresh`}),(0,z.jsxs)(`label`,{htmlFor:t,children:[`Metric`,` `,(0,z.jsxs)(`select`,{id:t,children:[(0,z.jsx)(`option`,{children:`Views`}),(0,z.jsx)(`option`,{children:`Clicks`})]})]})]})}function NumberedLanesOverlay({columns:e,isActive:t}){return(0,z.jsx)(`div`,{"aria-hidden":!0,style:{position:`absolute`,inset:0,display:`grid`,gridTemplateColumns:`repeat(${e}, minmax(0, 1fr))`,gap:`var(--wpds-dimension-gap-xl, 24px)`,pointerEvents:`none`,opacity:+!!t,visibility:t?`visible`:`hidden`,transition:t?`opacity 200ms ease, visibility 0s linear 0s`:`opacity 200ms ease, visibility 0s linear 200ms`,backgroundImage:`repeating-linear-gradient(135deg, color-mix(in srgb, var(--wpds-color-background-surface-info, #deebfa) 24%, transparent) 0 6px, transparent 6px 12px)`},children:Array.from({length:e}).map((e,t)=>(0,z.jsx)(`div`,{style:{outline:`1px dashed var(--wpds-color-stroke-surface-info, #adc6e2)`,backgroundColor:`color-mix(in srgb, var(--wpds-color-background-surface-info, #deebfa) 10%, transparent)`,position:`relative`},children:(0,z.jsx)(`span`,{style:{position:`absolute`,top:4,insetInlineStart:4,fontSize:10,padding:`1px 6px`,borderRadius:2,background:`var(--wpds-color-background-surface-info, #deebfa)`,color:`var(--wpds-color-foreground-content-info, #001b4f)`,fontFamily:`var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)`},children:t+1})},t))})}var z,B,V,Ee,H,U,W,G,K,q,J,Y,X;function init_index_story(){return(init_index_story=e((()=>{n(),init_dashboard_lanes(),z=t(),B={id:`grid-dashboardlanes`,title:`Widgets/Grid/DashboardLanes`,component:R,tags:[`status-experimental`],args:{columns:4,flowTolerance:16,rowUnit:4,editMode:!1},argTypes:{children:{control:!1},columns:{control:{type:`number`,min:1,max:12,step:1},description:"Lane count, or the cap when `minColumnWidth` is set."},minColumnWidth:{control:{type:`number`,min:80,max:600,step:8},description:`Per-lane floor in pixels. Lowers the count on narrow containers, down to one.`},flowTolerance:{control:{type:`number`,min:0,max:64,step:1},description:`Pixel tolerance for source-order tiebreaking when two lanes have similar baselines.`},rowUnit:{control:{type:`number`,min:1,max:16,step:1},description:"Polyfill snap unit (px). Ignored on browsers with native `display: grid-lanes` support."},editMode:{control:{type:`boolean`},description:`Enables drag-to-reorder and horizontal resize.`},onChangeLayout:{action:`onChangeLayout`},onPreviewLayout:{action:`onPreviewLayout`}},parameters:{componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:`This package is under heavy development and likely to change.`}}},V={brand:`var(--wpds-color-background-surface-brand, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 9%, white))`,info:`var(--wpds-color-background-surface-info, #deebfa)`,success:`var(--wpds-color-background-surface-success, #c2f8ca)`,warning:`var(--wpds-color-background-surface-warning, #fde6be)`,error:`var(--wpds-color-background-surface-error, #fae5e1)`,neutral:`var(--wpds-color-background-surface-neutral-weak, #f4f4f4)`},Ee={brand:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`,info:`var(--wpds-color-foreground-content-info, #001b4f)`,success:`var(--wpds-color-foreground-content-success, #002900)`,warning:`var(--wpds-color-foreground-content-warning, #2e1900)`,error:`var(--wpds-color-foreground-content-error, #470000)`,neutral:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},H={args:{columns:4,layout:[{key:`a`},{key:`b`},{key:`c`},{key:`d`},{key:`e`},{key:`f`},{key:`g`},{key:`h`}],children:[(0,z.jsx)(Tile,{tone:`brand`,height:120,index:1,children:`120px`},`a`),(0,z.jsx)(Tile,{tone:`info`,height:200,index:2,children:`200px`},`b`),(0,z.jsx)(Tile,{tone:`success`,height:80,index:3,children:`80px`},`c`),(0,z.jsx)(Tile,{tone:`warning`,height:160,index:4,children:`160px`},`d`),(0,z.jsx)(Tile,{tone:`error`,height:100,index:5,children:`100px`},`e`),(0,z.jsx)(Tile,{tone:`neutral`,height:240,index:6,children:`240px`},`f`),(0,z.jsx)(Tile,{tone:`brand`,height:140,index:7,children:`140px`},`g`),(0,z.jsx)(Tile,{tone:`info`,height:90,index:8,children:`90px`},`h`)]}},U={args:{columns:3,layout:[{key:`pinned`,draggable:!1},{key:`a`},{key:`b`}],children:[(0,z.jsx)(Tile,{tone:`neutral`,height:180,children:(0,z.jsx)(TileControls,{title:`Pinned`})},`pinned`),(0,z.jsx)(Tile,{tone:`info`,height:180,children:(0,z.jsx)(TileControls,{title:`Tile`})},`a`),(0,z.jsx)(Tile,{tone:`success`,height:180,children:(0,z.jsx)(TileControls,{title:`Tile`})},`b`)]}},W={parameters:{a11y:{test:`todo`}},args:{columns:4,minColumnWidth:200,layout:[{key:`a`},{key:`b`},{key:`c`},{key:`d`},{key:`e`},{key:`f`}],children:[(0,z.jsx)(Tile,{tone:`brand`,height:120,index:1},`a`),(0,z.jsx)(Tile,{tone:`info`,height:200,index:2},`b`),(0,z.jsx)(Tile,{tone:`success`,height:80,index:3},`c`),(0,z.jsx)(Tile,{tone:`warning`,height:160,index:4},`d`),(0,z.jsx)(Tile,{tone:`error`,height:100,index:5},`e`),(0,z.jsx)(Tile,{tone:`neutral`,height:240,index:6},`f`)]}},G={parameters:{a11y:{test:`todo`}},argTypes:{columns:{control:`object`}},args:{columns:{0:1,600:2,960:4},layout:[{key:`fixed-1`,width:1},{key:`fixed-2`,width:2},{key:`fill-1`,width:2},{key:`fixed-3`,width:1},{key:`fixed-4`,width:1},{key:`fixed-5`,width:2},{key:`fill-2`,width:3},{key:`full-1`,width:1}],children:[(0,z.jsxs)(Tile,{tone:`brand`,height:120,index:1,children:[`width: `,(0,z.jsx)(`strong`,{children:`1`})]},`fixed-1`),(0,z.jsxs)(Tile,{tone:`info`,height:200,index:2,children:[`width: `,(0,z.jsx)(`strong`,{children:`2`})]},`fixed-2`),(0,z.jsxs)(Tile,{tone:`success`,height:80,index:3,children:[`width: `,(0,z.jsx)(`strong`,{children:`2`})]},`fill-1`),(0,z.jsxs)(Tile,{tone:`warning`,height:160,index:4,children:[`width: `,(0,z.jsx)(`strong`,{children:`1`})]},`fixed-3`),(0,z.jsxs)(Tile,{tone:`error`,height:100,index:5,children:[`width: `,(0,z.jsx)(`strong`,{children:`1`})]},`fixed-4`),(0,z.jsxs)(Tile,{tone:`neutral`,height:240,index:6,children:[`width: `,(0,z.jsx)(`strong`,{children:`2`})]},`fixed-5`),(0,z.jsxs)(Tile,{tone:`neutral`,height:240,index:7,children:[`width: `,(0,z.jsx)(`strong`,{children:`3`})]},`fill-2`),(0,z.jsxs)(Tile,{tone:`neutral`,height:240,index:8,children:[`width: `,(0,z.jsx)(`strong`,{children:`1`})]},`full-1`)]}},K={parameters:G.parameters,argTypes:{columns:{control:`object`}},args:{...G.args,columns:{0:1,600:2,960:`auto`},minColumnWidth:200}},q={parameters:{a11y:{test:`todo`}},args:{columns:4,layout:[{key:`a`},{key:`wide`,width:2},{key:`b`},{key:`c`},{key:`d`},{key:`taller-wide`,width:2},{key:`e`}],children:[(0,z.jsx)(Tile,{tone:`brand`,height:120,index:1},`a`),(0,z.jsx)(Tile,{tone:`info`,height:100,index:2,children:`span 2`},`wide`),(0,z.jsx)(Tile,{tone:`success`,height:80,index:3},`b`),(0,z.jsx)(Tile,{tone:`warning`,height:200,index:4},`c`),(0,z.jsx)(Tile,{tone:`error`,height:90,index:5},`d`),(0,z.jsx)(Tile,{tone:`neutral`,height:160,index:6,children:`span 2`},`taller-wide`),(0,z.jsx)(Tile,{tone:`brand`,height:110,index:7},`e`)]}},J={parameters:{a11y:{test:`todo`}},args:{columns:4,editMode:!0},render:function EditModeStory(e){let[t,n]=(0,r.useState)([{key:`a`,draggable:!1,tone:`brand`,height:120,label:`pinned`},{key:`b`,tone:`info`,height:200,label:`200px`},{key:`wide`,width:2,tone:`success`,height:100,label:`span 2`},{key:`c`,tone:`warning`,height:160,label:`160px`},{key:`d`,tone:`error`,height:90,label:`90px`},{key:`e`,tone:`neutral`,height:240,label:`240px`},{key:`f`,tone:`brand`,height:140,label:`140px`}]),i=t.map(({tone:e,height:t,label:n,...r})=>r),onChangeLayout=e=>{n(e.map(e=>{let n=t.find(t=>t.key===e.key);return{...e,tone:n?.tone??`neutral`,height:n?.height??100,label:n?.label??e.key}}))},a=(0,r.useMemo)(()=>t.map((e,t)=>(0,z.jsx)(Tile,{tone:e.tone,height:e.height,index:t+1,children:e.label},e.key)),[t]);return(0,z.jsx)(R,{...e,layout:i,onChangeLayout,children:a})}},Y={name:`Per-Item Size Limits`,parameters:{a11y:{test:`todo`}},args:{columns:12,editMode:!0,itemLimits:{min:{minWidth:360},max:{maxWidth:500},ranged:{minWidth:300,maxWidth:500}}},render:function SizeLimitsStory(e){let[t,n]=(0,r.useState)([{key:`min`,width:2,tone:`info`,height:140,label:`min 360px wide`},{key:`max`,width:3,tone:`warning`,height:120,label:`max 500px wide`},{key:`ranged`,width:2,tone:`brand`,height:150,label:`min 300, max 500px wide`},{key:`free-a`,width:3,tone:`neutral`,height:180,label:`no limits`},{key:`free-b`,width:2,tone:`neutral`,height:100,label:`no limits`},{key:`free-c`,width:3,tone:`neutral`,height:160,label:`no limits`}]),i=t.map(({tone:e,height:t,label:n,...r})=>r),onChangeLayout=e=>{n(e.map(e=>{let n=t.find(t=>t.key===e.key);return{...e,tone:n?.tone??`neutral`,height:n?.height??100,label:n?.label??e.key}}))},a=(0,r.useMemo)(()=>t.map(e=>(0,z.jsx)(Tile,{tone:e.tone,height:e.height,children:e.label},e.key)),[t]);return(0,z.jsx)(R,{...e,layout:i,onChangeLayout,children:a})}},X={parameters:{a11y:{test:`todo`}},name:`Custom Grid Overlay`,args:{columns:4,editMode:!0},render:function CustomGridOverlayRender(e){let[t,n]=(0,r.useState)([{key:`a`,tone:`brand`,height:140,label:`140px`},{key:`b`,tone:`info`,height:200,label:`200px`},{key:`wide`,width:2,tone:`success`,height:120,label:`span 2`},{key:`c`,tone:`warning`,height:180,label:`180px`},{key:`d`,tone:`error`,height:100,label:`100px`},{key:`e`,tone:`neutral`,height:220,label:`220px`}]),i=t.map(({tone:e,height:t,label:n,...r})=>r),onChangeLayout=e=>{n(e.map(e=>{let n=t.find(t=>t.key===e.key);return{...e,tone:n?.tone??`neutral`,height:n?.height??100,label:n?.label??e.key}}))},a=(0,r.useMemo)(()=>t.map((e,t)=>(0,z.jsx)(Tile,{tone:e.tone,height:e.height,index:t+1,children:e.label},e.key)),[t]);return(0,z.jsx)(R,{...e,layout:i,onChangeLayout,renderGridOverlay:NumberedLanesOverlay,children:a})}};try{H.__docgenInfo={description:`Mixed-height tiles in a fixed lane count. Items pack from
left-to-right by source order, falling into whichever lane has
the lowest baseline at the moment of placement.`,displayName:`Default`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{U.__docgenInfo={description:"Tiles with their own links, buttons and form controls. The a11y addon checks that the lanes do not wrap them in drag semantics. In edit mode, the first tile is pinned (`draggable: false`) and its controls keep their semantics.",displayName:`InteractiveContent`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{W.__docgenInfo={description:"`columns` and `minColumnWidth` compose. `columns` alone fixes the lane\ncount. `minColumnWidth` alone fits as many lanes of at least that width\nas the container allows. Together, `columns` caps what the floor fits:\nup to four lanes here, none narrower than 200px, down to one. Open the\nstory full screen and resize the browser to walk the counts.",displayName:`Columns`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{G.__docgenInfo={description:"`columns` as a map: one lane from 0px, two from 600px, four from\n960px. The count steps at those container widths regardless of how\nwide each lane ends up; add `minColumnWidth` to lower it further.",displayName:`ColumnSteps`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{K.__docgenInfo={description:`A step can be \`'auto'\`: from that width up there is no cap and the
floor alone decides the count. Here the steps fix one and two lanes
below 960px, and 200px lanes fill the container above it.`,displayName:`ColumnStepsWithFloor`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{q.__docgenInfo={description:`Items with \`width: 2\` span two lanes. The skyline picks a span
position that minimizes the resulting baseline across spanned
lanes.`,displayName:`Spanning`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{J.__docgenInfo={description:`Edit mode: drag to reorder, resize from the bottom-right corner
(horizontal only — heights are content-driven). Drop commits the
new layout via \`onChangeLayout\`.

While \`editMode\` is on, \`<DashboardLanes />\` paints its default
overlay behind the tiles to mark the lane tracks. Lanes paint
columns only — there are no row markers because heights are
content-driven.

Theme the default look in place via \`--wp-grid-overlay-tile-bg\`,
or replace the visual wholesale
by passing \`renderGridOverlay\`. See the \`Custom Grid Overlay\`
story below for a full override example.`,displayName:`EditMode`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{Y.__docgenInfo={description:`Per-item width limits via \`itemLimits\`, in pixels. The wide tile
stops shrinking at its minimum, the capped tile stops growing at its
maximum, the ranged tile stays between both, and the free tiles keep
the full range. Lanes take no height limits; lane heights are
content-driven.`,displayName:`SizeLimits`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}try{X.__docgenInfo={description:"Replaces the surface's default edit-mode overlay with a custom\nvisual through the `renderGridOverlay` prop. The same contract as\n`<DashboardGrid />`'s override path, with `rowHeight` omitted from\nthe render props because lanes are content-driven vertically.\n\nPass `renderGridOverlay={ () => null }` to suppress the overlay\nentirely while keeping `editMode` interactions on.",displayName:`CustomGridOverlayStory`,filePath:`/home/runner/work/gutenberg/gutenberg/packages/grid/src/dashboard-lanes/stories/index.story.tsx`,methods:[],props:{},tags:{}}}catch{}H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 4,
    layout: [{
      key: 'a'
    }, {
      key: 'b'
    }, {
      key: 'c'
    }, {
      key: 'd'
    }, {
      key: 'e'
    }, {
      key: 'f'
    }, {
      key: 'g'
    }, {
      key: 'h'
    }],
    children: [<Tile key="a" tone="brand" height={120} index={1}>
                120px
            </Tile>, <Tile key="b" tone="info" height={200} index={2}>
                200px
            </Tile>, <Tile key="c" tone="success" height={80} index={3}>
                80px
            </Tile>, <Tile key="d" tone="warning" height={160} index={4}>
                160px
            </Tile>, <Tile key="e" tone="error" height={100} index={5}>
                100px
            </Tile>, <Tile key="f" tone="neutral" height={240} index={6}>
                240px
            </Tile>, <Tile key="g" tone="brand" height={140} index={7}>
                140px
            </Tile>, <Tile key="h" tone="info" height={90} index={8}>
                90px
            </Tile>]
  }
}`,...H.parameters?.docs?.source},description:{story:`Mixed-height tiles in a fixed lane count. Items pack from
left-to-right by source order, falling into whichever lane has
the lowest baseline at the moment of placement.`,...H.parameters?.docs?.description}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 3,
    layout: [{
      key: 'pinned',
      draggable: false
    }, {
      key: 'a'
    }, {
      key: 'b'
    }],
    children: [<Tile key="pinned" tone="neutral" height={180}>
                <TileControls title="Pinned" />
            </Tile>, <Tile key="a" tone="info" height={180}>
                <TileControls title="Tile" />
            </Tile>, <Tile key="b" tone="success" height={180}>
                <TileControls title="Tile" />
            </Tile>]
  }
}`,...U.parameters?.docs?.source},description:{story:"Tiles with their own links, buttons and form controls. The a11y addon checks that the lanes do not wrap them in drag semantics. In edit mode, the first tile is pinned (`draggable: false`) and its controls keep their semantics.",...U.parameters?.docs?.description}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 4,
    minColumnWidth: 200,
    layout: [{
      key: 'a'
    }, {
      key: 'b'
    }, {
      key: 'c'
    }, {
      key: 'd'
    }, {
      key: 'e'
    }, {
      key: 'f'
    }],
    children: [<Tile key="a" tone="brand" height={120} index={1} />, <Tile key="b" tone="info" height={200} index={2} />, <Tile key="c" tone="success" height={80} index={3} />, <Tile key="d" tone="warning" height={160} index={4} />, <Tile key="e" tone="error" height={100} index={5} />, <Tile key="f" tone="neutral" height={240} index={6} />]
  }
}`,...W.parameters?.docs?.source},description:{story:"`columns` and `minColumnWidth` compose. `columns` alone fixes the lane\ncount. `minColumnWidth` alone fits as many lanes of at least that width\nas the container allows. Together, `columns` caps what the floor fits:\nup to four lanes here, none narrower than 200px, down to one. Open the\nstory full screen and resize the browser to walk the counts.",...W.parameters?.docs?.description}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
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
    layout: [{
      key: 'fixed-1',
      width: 1
    }, {
      key: 'fixed-2',
      width: 2
    }, {
      key: 'fill-1',
      width: 2
    }, {
      key: 'fixed-3',
      width: 1
    }, {
      key: 'fixed-4',
      width: 1
    }, {
      key: 'fixed-5',
      width: 2
    }, {
      key: 'fill-2',
      width: 3
    }, {
      key: 'full-1',
      width: 1
    }],
    children: [<Tile key="fixed-1" tone="brand" height={120} index={1}>
                width: <strong>1</strong>
            </Tile>, <Tile key="fixed-2" tone="info" height={200} index={2}>
                width: <strong>2</strong>
            </Tile>, <Tile key="fill-1" tone="success" height={80} index={3}>
                width: <strong>2</strong>
            </Tile>, <Tile key="fixed-3" tone="warning" height={160} index={4}>
                width: <strong>1</strong>
            </Tile>, <Tile key="fixed-4" tone="error" height={100} index={5}>
                width: <strong>1</strong>
            </Tile>, <Tile key="fixed-5" tone="neutral" height={240} index={6}>
                width: <strong>2</strong>
            </Tile>, <Tile key="fill-2" tone="neutral" height={240} index={7}>
                width: <strong>3</strong>
            </Tile>, <Tile key="full-1" tone="neutral" height={240} index={8}>
                width: <strong>1</strong>
            </Tile>]
  }
}`,...G.parameters?.docs?.source},description:{story:"`columns` as a map: one lane from 0px, two from 600px, four from\n960px. The count steps at those container widths regardless of how\nwide each lane ends up; add `minColumnWidth` to lower it further.",...G.parameters?.docs?.description}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  parameters: ColumnSteps.parameters,
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
    minColumnWidth: 200
  }
}`,...K.parameters?.docs?.source},description:{story:`A step can be \`'auto'\`: from that width up there is no cap and the
floor alone decides the count. Here the steps fix one and two lanes
below 960px, and 200px lanes fill the container above it.`,...K.parameters?.docs?.description}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 4,
    layout: [{
      key: 'a'
    }, {
      key: 'wide',
      width: 2
    }, {
      key: 'b'
    }, {
      key: 'c'
    }, {
      key: 'd'
    }, {
      key: 'taller-wide',
      width: 2
    }, {
      key: 'e'
    }],
    children: [<Tile key="a" tone="brand" height={120} index={1} />, <Tile key="wide" tone="info" height={100} index={2}>
                span 2
            </Tile>, <Tile key="b" tone="success" height={80} index={3} />, <Tile key="c" tone="warning" height={200} index={4} />, <Tile key="d" tone="error" height={90} index={5} />, <Tile key="taller-wide" tone="neutral" height={160} index={6}>
                span 2
            </Tile>, <Tile key="e" tone="brand" height={110} index={7} />]
  }
}`,...q.parameters?.docs?.source},description:{story:`Items with \`width: 2\` span two lanes. The skyline picks a span
position that minimizes the resulting baseline across spanned
lanes.`,...q.parameters?.docs?.description}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  args: {
    columns: 4,
    editMode: true
  },
  render: function EditModeStory(args) {
    const initial: (DashboardLanesLayoutItem & {
      tone: Tone;
      height: number;
      label: string;
    })[] = [{
      key: 'a',
      draggable: false,
      tone: 'brand',
      height: 120,
      label: 'pinned'
    }, {
      key: 'b',
      tone: 'info',
      height: 200,
      label: '200px'
    }, {
      key: 'wide',
      width: 2,
      tone: 'success',
      height: 100,
      label: 'span 2'
    }, {
      key: 'c',
      tone: 'warning',
      height: 160,
      label: '160px'
    }, {
      key: 'd',
      tone: 'error',
      height: 90,
      label: '90px'
    }, {
      key: 'e',
      tone: 'neutral',
      height: 240,
      label: '240px'
    }, {
      key: 'f',
      tone: 'brand',
      height: 140,
      label: '140px'
    }];
    const [tiles, setTiles] = useState(initial);
    const layout: DashboardLanesLayoutItem[] = tiles.map(({
      tone: _tone,
      height: _height,
      label: _label,
      ...item
    }) => item);
    const onChangeLayout = (next: DashboardLanesLayoutItem[]) => {
      setTiles(next.map(item => {
        const existing = tiles.find(t => t.key === item.key);
        return {
          ...item,
          tone: existing?.tone ?? 'neutral',
          height: existing?.height ?? 100,
          label: existing?.label ?? item.key
        };
      }));
    };
    const tileElements = useMemo(() => tiles.map((tile, i) => <Tile key={tile.key} tone={tile.tone} height={tile.height} index={i + 1}>
                        {tile.label}
                    </Tile>), [tiles]);
    return <DashboardLanes {...args} layout={layout} onChangeLayout={onChangeLayout}>
                {tileElements}
            </DashboardLanes>;
  }
}`,...J.parameters?.docs?.source},description:{story:`Edit mode: drag to reorder, resize from the bottom-right corner
(horizontal only — heights are content-driven). Drop commits the
new layout via \`onChangeLayout\`.

While \`editMode\` is on, \`<DashboardLanes />\` paints its default
overlay behind the tiles to mark the lane tracks. Lanes paint
columns only — there are no row markers because heights are
content-driven.

Theme the default look in place via \`--wp-grid-overlay-tile-bg\`,
or replace the visual wholesale
by passing \`renderGridOverlay\`. See the \`Custom Grid Overlay\`
story below for a full override example.`,...J.parameters?.docs?.description}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
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
    editMode: true,
    itemLimits: {
      min: {
        minWidth: 360
      },
      max: {
        maxWidth: 500
      },
      ranged: {
        minWidth: 300,
        maxWidth: 500
      }
    }
  },
  render: function SizeLimitsStory(args) {
    const initial: (DashboardLanesLayoutItem & {
      tone: Tone;
      height: number;
      label: string;
    })[] = [{
      key: 'min',
      width: 2,
      tone: 'info',
      height: 140,
      label: 'min 360px wide'
    }, {
      key: 'max',
      width: 3,
      tone: 'warning',
      height: 120,
      label: 'max 500px wide'
    }, {
      key: 'ranged',
      width: 2,
      tone: 'brand',
      height: 150,
      label: 'min 300, max 500px wide'
    }, {
      key: 'free-a',
      width: 3,
      tone: 'neutral',
      height: 180,
      label: 'no limits'
    }, {
      key: 'free-b',
      width: 2,
      tone: 'neutral',
      height: 100,
      label: 'no limits'
    }, {
      key: 'free-c',
      width: 3,
      tone: 'neutral',
      height: 160,
      label: 'no limits'
    }];
    const [tiles, setTiles] = useState(initial);
    const layout: DashboardLanesLayoutItem[] = tiles.map(({
      tone: _tone,
      height: _height,
      label: _label,
      ...item
    }) => item);
    const onChangeLayout = (next: DashboardLanesLayoutItem[]) => {
      setTiles(next.map(item => {
        const existing = tiles.find(t => t.key === item.key);
        return {
          ...item,
          tone: existing?.tone ?? 'neutral',
          height: existing?.height ?? 100,
          label: existing?.label ?? item.key
        };
      }));
    };
    const tileElements = useMemo(() => tiles.map(tile => <Tile key={tile.key} tone={tile.tone} height={tile.height}>
                        {tile.label}
                    </Tile>), [tiles]);
    return <DashboardLanes {...args} layout={layout} onChangeLayout={onChangeLayout}>
                {tileElements}
            </DashboardLanes>;
  }
}`,...Y.parameters?.docs?.source},description:{story:`Per-item width limits via \`itemLimits\`, in pixels. The wide tile
stops shrinking at its minimum, the capped tile stops growing at its
maximum, the ranged tile stays between both, and the free tiles keep
the full range. Lanes take no height limits; lane heights are
content-driven.`,...Y.parameters?.docs?.description}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  parameters: {
    // FIXME: Resize handles are nameless aria commands; edit mode nests interactive controls (aria-command-name, nested-interactive).
    // See: https://github.com/WordPress/gutenberg/issues/81596
    a11y: {
      test: 'todo'
    }
  },
  name: 'Custom Grid Overlay',
  args: {
    columns: 4,
    editMode: true
  },
  render: function CustomGridOverlayRender(args) {
    const initial: (DashboardLanesLayoutItem & {
      tone: Tone;
      height: number;
      label: string;
    })[] = [{
      key: 'a',
      tone: 'brand',
      height: 140,
      label: '140px'
    }, {
      key: 'b',
      tone: 'info',
      height: 200,
      label: '200px'
    }, {
      key: 'wide',
      width: 2,
      tone: 'success',
      height: 120,
      label: 'span 2'
    }, {
      key: 'c',
      tone: 'warning',
      height: 180,
      label: '180px'
    }, {
      key: 'd',
      tone: 'error',
      height: 100,
      label: '100px'
    }, {
      key: 'e',
      tone: 'neutral',
      height: 220,
      label: '220px'
    }];
    const [tiles, setTiles] = useState(initial);
    const layout: DashboardLanesLayoutItem[] = tiles.map(({
      tone: _tone,
      height: _height,
      label: _label,
      ...item
    }) => item);
    const onChangeLayout = (next: DashboardLanesLayoutItem[]) => {
      setTiles(next.map(item => {
        const existing = tiles.find(t => t.key === item.key);
        return {
          ...item,
          tone: existing?.tone ?? 'neutral',
          height: existing?.height ?? 100,
          label: existing?.label ?? item.key
        };
      }));
    };
    const tileElements = useMemo(() => tiles.map((tile, i) => <Tile key={tile.key} tone={tile.tone} height={tile.height} index={i + 1}>
                        {tile.label}
                    </Tile>), [tiles]);
    return <DashboardLanes {...args} layout={layout} onChangeLayout={onChangeLayout} renderGridOverlay={NumberedLanesOverlay}>
                {tileElements}
            </DashboardLanes>;
  }
}`,...X.parameters?.docs?.source},description:{story:"Replaces the surface's default edit-mode overlay with a custom\nvisual through the `renderGridOverlay` prop. The same contract as\n`<DashboardGrid />`'s override path, with `rowHeight` omitted from\nthe render props because lanes are content-driven vertically.\n\nPass `renderGridOverlay={ () => null }` to suppress the overlay\nentirely while keeping `editMode` interactions on.",...X.parameters?.docs?.description}}}})))()}init_index_story();export{G as ColumnSteps,K as ColumnStepsWithFloor,W as Columns,X as CustomGridOverlayStory,H as Default,J as EditMode,U as InteractiveContent,Y as SizeLimits,q as Spanning,B as default};