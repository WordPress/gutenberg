import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{t}from"./jsx-runtime-BxZPLZy3.js";import{n,t as r}from"./react-Cd8OJmTE.js";import{n as i,t as a}from"./button-4mL0WSce.js";import{Lc as o,_s as s,n as c,un as l,w as u}from"./build-module-DttIWYbV.js";import{a as d,f,i as ee,n as te,o as p,p as ne,r as re,s as ie,t as m}from"./widget-dashboard-I_V9JrYG.js";import{c as h,t as ae}from"./build-module-CzsdqjFz.js";import{n as oe,t as g}from"./page-DYOOWCKn.js";function isSameAction(e,t){let n=e,r=t,i=Object.keys(n);return i.length===Object.keys(r).length&&i.every(e=>Object.is(n[e],r[e])||typeof n[e]==`function`&&typeof r[e]==`function`)}function isSameList(e,t){return e.length===t.length&&e.every((e,n)=>isSameAction(e,t[n]))}function useWidgetActions(e){let t=ie().actions?.declare,n=ee(),i=(0,r.useId)(),a=(0,r.useMemo)(()=>n?e=>n.declare(i,e):t,[n,t,i]),o=(0,r.useRef)(e),s=(0,r.useRef)(null);return(0,r.useLayoutEffect)(()=>{o.current=e,!(!a||s.current&&isSameList(s.current,e))&&(s.current=e,a(e.map(e=>`callback`in e?{...e,callback:()=>{let t=o.current.find(({id:t})=>t===e.id);return t&&`callback`in t?t.callback():void 0}}:e)))}),(0,r.useLayoutEffect)(()=>()=>{s.current=null,a?.(_)},[a]),n?n.hosted:!!t}var _;function init_use_widget_actions(){return(init_use_widget_actions=e((()=>{n(),p(),re(),_=[]})))()}function TrafficSnapshotWidget({attributes:e}){let{metric:t=`views`,period:n=`week`,label:r=`Traffic`}=e??{},i=y.find(e=>e.value===t)?.label??t,a=b.find(e=>e.value===n)?.label??n;return(0,v.jsxs)(`div`,{style:{display:`grid`,gap:`var(--wpds-dimension-gap-xs, 4px)`,alignContent:`center`,height:`100%`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,v.jsx)(`strong`,{style:{fontSize:`var(--wpds-typography-font-size-2xl, 32px)`},children:x[t][n].toLocaleString(`en-US`)}),(0,v.jsx)(`span`,{style:{color:`var(--wpds-color-foreground-content-neutral-weak, #707070)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`},children:`${r}: ${i}, ${a}`})]})}function GoalProgressWidget({attributes:e}){let{metric:t=`revenue`,target:n=`5000`}=e??{},r=C.find(e=>e.value===t)?.label??t,i=w.find(e=>e.value===n)?.label??n,a=Math.min(100,Math.round(T[t]/Number(n)*100));return(0,v.jsxs)(`div`,{style:{display:`grid`,gap:`var(--wpds-dimension-gap-xs, 4px)`,alignContent:`center`,height:`100%`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,v.jsx)(`strong`,{style:{fontSize:`var(--wpds-typography-font-size-2xl, 32px)`},children:`${a}%`}),(0,v.jsx)(`div`,{style:{background:`var(--wpds-color-background-surface-neutral-weak, #f4f4f4)`,borderRadius:`var(--wpds-border-radius-md, 4px)`,height:8,overflow:`hidden`},children:(0,v.jsx)(`div`,{style:{background:`var(--wpds-color-background-surface-brand, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 9%, white))`,height:`100%`,width:`${a}%`}})}),(0,v.jsx)(`span`,{style:{color:`var(--wpds-color-foreground-content-neutral-weak, #707070)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`},children:`${r} vs ${i}`})]})}function downloadChecks(e){let t=[`Check,Status`,...e.map(e=>`${e.label},${e.status}`)],n=URL.createObjectURL(new Blob([t.join(`
`)],{type:`text/csv`})),r=document.createElement(`a`);r.href=n,r.download=`site-checks.csv`,r.click(),URL.revokeObjectURL(n)}function ChecksExportSection({checks:e}){let[t,n]=(0,r.useState)(0);return useWidgetActions([{id:`export`,label:`Download CSV`,icon:s,relevance:`medium`,callback:async()=>{await wait(1500),downloadChecks(e),n(e.length)}}]),(0,v.jsx)(`span`,{style:{color:`var(--wpds-color-foreground-content-neutral-weak, #707070)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`},children:t>0?`Exported ${t} checks.`:`Export ready for ${e.length} checks.`})}function SiteStatusWidget(){let[e,t]=(0,r.useState)(null),[n,i]=(0,r.useState)(!0);(0,r.useEffect)(()=>{let e=setTimeout(()=>t(k),1500);return()=>clearTimeout(e)},[]),useWidgetActions(e?.length?[{id:`details`,label:`Review ${e.length} items`,relevance:`high`,href:`admin.php?page=demo-dashboard&p=/status?filter=issues`}]:[]);let o=`Checking the site…`;return e&&(o=e.length>0?`${e.length} checks need attention.`:`Every check passes.`),(0,v.jsxs)(`div`,{style:{display:`grid`,gap:`var(--wpds-dimension-gap-sm, 8px)`,alignContent:`start`,color:`var(--wpds-color-foreground-content-neutral, #1e1e1e)`},children:[(0,v.jsx)(`strong`,{children:o}),e&&e.length>0&&(0,v.jsx)(`ul`,{style:{margin:0,paddingInlineStart:`1.25em`},children:e.map(e=>(0,v.jsx)(`li`,{children:`${e.label} (${e.status})`},e.id))}),e&&e.length>0&&n&&(0,v.jsx)(ChecksExportSection,{checks:e}),e&&(0,v.jsxs)(`div`,{style:{display:`flex`,gap:`var(--wpds-dimension-gap-xs, 4px)`},children:[(0,v.jsx)(a,{variant:`outline`,tone:`neutral`,size:`compact`,onClick:()=>t(e.length>0?e.slice(1):k),children:e.length>0?`Resolve one`:`Reset`}),e.length>0&&(0,v.jsx)(a,{variant:`outline`,tone:`neutral`,size:`compact`,onClick:()=>i(!n),children:n?`Hide export`:`Show export`})]})]})}function FooterCallbacksWidget(e){return useWidgetActions([{id:`refresh`,label:`Refresh`,relevance:`high`,callback:()=>wait(1500)},{id:`export-progress`,label:`Export progress`,relevance:`medium`,icon:s,callback:()=>wait(1500)}]),(0,v.jsx)(GoalProgressWidget,{...e})}function DefaultStory(){let[e,t]=(0,r.useState)(M);return(0,v.jsx)(m,{widgetTypes:[S,O],layout:e,onLayoutChange:t,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:200},children:(0,v.jsx)(m.Widgets,{})})}function LongTitleStory(){let[e,t]=(0,r.useState)(F);return(0,v.jsx)(m,{widgetTypes:[P],layout:e,onLayoutChange:t,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:200},children:(0,v.jsx)(m.Widgets,{})})}function HostLinksStory(){let[e,t]=(0,r.useState)(U),[n,i]=(0,r.useState)(null);return(0,r.useEffect)(()=>{let onNavigate=e=>i({path:e.detail});return window.addEventListener(R,onNavigate),()=>window.removeEventListener(R,onNavigate)},[]),(0,r.useEffect)(()=>{if(!n)return;let e=setTimeout(()=>i(null),3e3);return()=>clearTimeout(e)},[n]),(0,v.jsxs)(d,{value:V,children:[(0,v.jsx)(`p`,{role:`status`,style:{color:`var(--wpds-color-foreground-content-neutral-weak, #707070)`,fontSize:`var(--wpds-typography-font-size-sm, 12px)`},children:n?`Client-side navigation to ${n.path}; the document never reloaded.`:`Pick "See report" in the widget footer: its target is a route this demo host owns.`}),(0,v.jsx)(m,{widgetTypes:[H],layout:e,onLayoutChange:t,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:200},children:(0,v.jsx)(m.Widgets,{})})]})}function RuntimeActionsStory(){let[e,t]=(0,r.useState)(G);return(0,v.jsx)(d,{value:V,children:(0,v.jsx)(m,{widgetTypes:[A],layout:e,onLayoutChange:t,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:260},children:(0,v.jsx)(m.Widgets,{})})})}function FooterStory(){let[e,t]=(0,r.useState)(q);return(0,v.jsx)(m,{widgetTypes:j,layout:e,onLayoutChange:t,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:200},children:(0,v.jsx)(m.Widgets,{})})}function PolicyStory({profile:e}){let[t,n]=(0,r.useState)(M),[i,a]=(0,r.useState)(!1),[o,s]=(0,r.useState)(`/analytics`),c=(0,r.useMemo)(()=>{let{operations:t}=X[e],n=Y.find(e=>e.href===o)?.type;return e=>t!==`all`&&!t.includes(e.operation)?!1:e.operation!==`insert`||!n||e.widgetType.name===n},[e,o]),l=(0,r.useCallback)(({href:e,onClick:t,children:n,...r})=>(0,v.jsx)(`a`,{...r,href:e,onClick:n=>{n.preventDefault(),s(e),t?.(n)},children:n}),[]);(0,r.useEffect)(()=>{let containPaletteShortcut=e=>{(e.metaKey||e.ctrlKey)&&!e.shiftKey&&!e.altKey&&e.key.toLowerCase()===`k`&&e.stopPropagation()};return document.addEventListener(`keydown`,containPaletteShortcut),()=>document.removeEventListener(`keydown`,containPaletteShortcut)},[]);let{label:u,summary:d}=X[e];return(0,v.jsx)(m.Policy,{canPerform:c,children:(0,v.jsx)(m,{widgetTypes:[S,O],layout:t,onLayoutChange:n,onLayoutReset:()=>n(M),editMode:i,onEditChange:a,resolveWidgetModule:resolveDemoModule,gridSettings:{model:`grid`,rowHeight:200},children:(0,v.jsxs)(g,{title:`Analytics`,subTitle:`Signed in as ${u}: ${d}. The section scopes what "Add widget" offers.`,actions:(0,v.jsx)(m.Actions,{}),navigation:{items:Y.map(({label:e,href:t})=>({label:e,href:t})),currentHref:o,ariaLabel:`Sections`},components:{link:l},showSidebarToggle:!1,hasPadding:!0,children:[(0,v.jsx)(m.Widgets,{}),(0,v.jsx)(m.Commands,{}),(0,v.jsx)(h,{})]})})})}function describeColumnPolicy(e,t,n){let r=Object.entries(t).map(([e,t])=>[Number(e),t]).sort((e,t)=>e[0]-t[0]),i=r.length>0?r.map(([e,t])=>t===`auto`?`the floor decides from ${e}px`:`${t} from ${e}px`).join(`, `):`${e} columns at every width`;return n>0?`${i}, none narrower than ${n}px`:i}function GridSettingsStory({columns:e,steps:t,minColumnWidth:n,model:i,rowHeight:a,flowTolerance:o}){let[s,c]=(0,r.useState)(Q),[l,u]=(0,r.useState)(!1),d=(0,r.useMemo)(()=>{let r=Object.keys(t).length>0?t:e,s=n>0?{columns:r,minColumnWidth:n}:{columns:r};return i===`masonry`?{model:i,...s,flowTolerance:o}:{model:i,...s,rowHeight:f[a]}},[i,e,t,n,o,a]);return(0,v.jsx)(m,{widgetTypes:[S,O],layout:s,onLayoutChange:c,editMode:l,onEditChange:u,resolveWidgetModule:resolveDemoModule,gridSettings:d,children:(0,v.jsx)(g,{title:`Dashboard`,subTitle:`${i===`masonry`?`Masonry`:`Standard grid`}: ${describeColumnPolicy(e,t,n)}.`,actions:(0,v.jsx)(m.Actions,{}),showSidebarToggle:!1,hasPadding:!0,children:(0,v.jsx)(m.Widgets,{})})})}var v,y,b,x,S,C,w,T,E,D,O,k,wait,A,j,resolveDemoModule,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;function init_index_story(){return(init_index_story=e((()=>{oe(),ae(),n(),c(),i(),p(),init_use_widget_actions(),ne(),te(),v=t(),y=[{value:`views`,label:`Views`},{value:`visitors`,label:`Visitors`},{value:`orders`,label:`Orders`}],b=[{value:`day`,label:`Last 24 hours`},{value:`week`,label:`Last 7 days`},{value:`month`,label:`Last 30 days`}],x={views:{day:1284,week:9051,month:38402},visitors:{day:342,week:2410,month:10236},orders:{day:12,week:87,month:356}},S={apiVersion:1,name:`demo/traffic-snapshot`,title:`Traffic Snapshot`,description:`Sample metric widget used to exercise the inline attribute controls.`,help:{content:`Three attributes. <strong>Metric</strong> and <strong>Period</strong> are <strong>high</strong> relevance — two fields in the header. <strong>Label</strong> is <strong>low</strong>, behind the settings button.`},icon:o,renderModule:`demo/widgets/traffic-snapshot/render`,attributes:[{id:`metric`,label:`Metric`,type:`text`,elements:y,relevance:`high`},{id:`period`,label:`Period`,type:`text`,elements:b,relevance:`high`},{id:`label`,label:`Label`,type:`text`}],example:{attributes:{metric:`views`,period:`week`,label:`Traffic`}}},C=[{value:`revenue`,label:`Revenue`},{value:`orders`,label:`Orders`}],w=[{value:`1000`,label:`1K target`},{value:`5000`,label:`5K target`},{value:`10000`,label:`10K target`}],T={revenue:3600,orders:118},E=[{id:`metric`,label:`Goal metric`,type:`text`,elements:C,relevance:`high`}],D=[{id:`view-goal`,label:`View goal details`,relevance:`high`,icon:o,href:`https://wordpress.org/`,openInNewTab:!0},{id:`export-progress`,label:`Export progress`,relevance:`medium`,icon:s,href:new URL(`data:text/csv;base64,bWV0cmljLHRhcmdldCxjdXJyZW50LHBlcmNlbnQKcmV2ZW51ZSw1MDAwLDM2MDAsNzIK`,``+import.meta.url).href,download:`goal-progress.csv`},{id:`about-goals`,label:`About goals`,href:`https://wordpress.org/documentation/`,openInNewTab:!0}],O={apiVersion:1,name:`demo/goal-progress`,title:`Goal Progress`,description:`Sample goal widget whose attributes are all promoted.`,help:{content:`One attribute, <strong>Goal metric</strong>, at <strong>high</strong> relevance: a single field in the header and no settings button. Two promoted actions in the footer (a link and a download), plus one in the <strong>More</strong> menu.`},icon:u,renderModule:`demo/widgets/goal-progress/render`,attributes:E,actions:D,example:{attributes:{metric:`revenue`,target:`5000`}}},k=[{id:1,label:`Background updates`,status:`critical`},{id:2,label:`HTTPS status`,status:`recommended`},{id:3,label:`Page cache`,status:`recommended`}],wait=e=>new Promise(t=>setTimeout(t,e)),A={apiVersion:1,name:`demo/site-status`,title:`Site Status`,description:`Checks the site and declares what to do next.`,help:{content:`The declared <strong>Details</strong> action shows while the check runs. Then the widget declares <strong>Review N items</strong> in its place, and its export section declares <strong>Download CSV</strong>.`},icon:l,renderModule:`demo/widgets/site-status/render`,actions:[{id:`details`,label:`Details`,relevance:`high`,href:`admin.php?page=demo-dashboard&p=/status`},{id:`about`,label:`About site health`,href:`https://wordpress.org/documentation/article/site-health-screen/`,openInNewTab:!0}]},j=[{...O,name:`demo/footer-text-links`,title:`Text links`,actions:D.map(({icon:e,...t})=>t)},{...O,name:`demo/footer-icon-link`,title:`Icon-only link`},{...O,name:`demo/footer-callbacks`,title:`Callback buttons`,renderModule:`demo/widgets/footer-callbacks/render`,actions:[]}],resolveDemoModule=async e=>{let t;return t=e===O.renderModule?GoalProgressWidget:e===A.renderModule?SiteStatusWidget:e===j[2].renderModule?FooterCallbacksWidget:TrafficSnapshotWidget,{default:t}},M=[{uuid:`traffic-snapshot-wide`,type:`demo/traffic-snapshot`,attributes:{metric:`views`,period:`week`,label:`Traffic`},placement:{width:2,height:1,order:1}},{uuid:`traffic-snapshot-narrow`,type:`demo/traffic-snapshot`,attributes:{metric:`visitors`,period:`month`,label:`Audience`},placement:{width:1,height:1,order:2}},{uuid:`goal-progress-narrow`,type:`demo/goal-progress`,attributes:{metric:`revenue`,target:`5000`},placement:{width:1,height:1,order:3}}],N={id:`widget-dashboard-playground`,title:`Widgets/Dashboard/Playground`,component:m,tags:[`status-experimental`],parameters:{a11y:{test:`todo`},componentStatus:{status:`use-with-caution`,whereUsed:`global`,notes:"The `@wordpress/widget-dashboard` package is under active development: APIs may change without notice. Recommended for development workflows only; not production-ready."},docs:{description:{component:"\n`WidgetDashboard` is the stateless rendering engine for widget dashboards: the consumer owns the `layout` state, every mutation flows back through `onLayoutChange`, and widget types arrive through the `widgetTypes` prop. What users may do on it is the application's answer, given through `WidgetDashboard.Policy`.\n"}}}},P={...S,name:`demo/long-title`,title:`Traffic Snapshot Against the Quarterly Revenue Target`},F=[{uuid:`long-title-wide`,type:`demo/long-title`,attributes:{metric:`views`,period:`week`,label:`Traffic`},placement:{width:2,height:1,order:1}},{uuid:`long-title-narrow`,type:`demo/long-title`,attributes:{metric:`visitors`,period:`month`,label:`Audience`},placement:{width:1,height:1,order:2}}],I={render:()=>(0,v.jsx)(LongTitleStory,{}),parameters:{docs:{description:{story:`
The identity holds the widget type's title. When the row cannot fit it, the title truncates with an ellipsis rather than wrapping: the header is one line tall.

The same type appears at two widths. Resize the canvas to watch where the cut lands.
`}}}},L={render:()=>(0,v.jsx)(DefaultStory,{}),parameters:{docs:{description:{story:"\nIn normal mode the dashboard promotes every `relevance: 'high'` attribute into the tile header as a bare inline control beside the identity, plus the settings entry point when a non-promoted attribute exists.\n\nTwo demo types exercise that policy:\n\n- `demo/traffic-snapshot` declares three attributes: `metric` and `period` are `relevance: 'high'`, and `label` stays on the settings surface.\n- `demo/goal-progress` declares a single attribute at `relevance: 'high'`: with nothing left for the settings surface, the inline presentation shows no settings entry point.\n\nTheir tiles compare the header presentations:\n\n- The two-column tile fits the identity and both inline controls, so they stay in the header.\n- The one-column traffic tile does not: the promoted fields collapse into a dropdown holding them as a form, while the settings trigger stays in the toolbar beside it.\n- The one-column goal tile carries a single promoted field and no settings surface, so its toolbar holds that field and the actions menu.\n\nThe widget only declares relevance; the fit is measured by the chrome, so the same declaration adapts to any tile width. Resize the canvas to watch the headers switch presentations.\n\nBeyond attributes, `demo/goal-progress` declares three `actions` spanning the relevance scale, and that scale routes them: \"View goal details\" at `'high'` mounts as a leading text link (declared icon as prefix) in a persistent chrome footer, \"Export progress\" at `'medium'` beside it as a trailing icon-only link, and \"About goals\" at the default `'low'` lands in the \"More\" menu. The widget declares each action as data plus its importance; the host owns the surfaces.\n\nEach type also carries a `help` note, opened from the help icon in the header, that describes its attributes and what they do.\n"}}}},R=`widget-dashboard-demo-navigate`,z=(0,r.forwardRef)(function UnforwardedDemoRouteLink({path:e,onClick:t,children:n,...r},i){return(0,v.jsx)(`a`,{ref:i,...r,href:`?p=${e}`,onClick:n=>{n.preventDefault(),window.dispatchEvent(new CustomEvent(R,{detail:e})),t?.(n)},children:n})}),B=`https://demo.example/wp-admin/admin.php?page=demo-dashboard`,V={links:{match:e=>{let t;try{t=new URL(e,B)}catch{return null}return t.pathname!==`/wp-admin/admin.php`||t.searchParams.get(`page`)!==`demo-dashboard`?null:t.searchParams.get(`p`)??`/`},Link:z}},H={...O,name:`demo/goal-progress-links`,help:{content:`The footer holds an in-app route link, an external link, and a download; the <strong>More</strong> menu keeps the rest.`},actions:[{id:`see-report`,label:`See report`,relevance:`high`,href:`admin.php?page=demo-dashboard&p=/reports`},...D]},U=[{uuid:`goal-progress-links`,type:`demo/goal-progress-links`,attributes:{metric:`revenue`,target:`5000`},placement:{width:2,height:1,order:1}}],W={render:()=>(0,v.jsx)(HostLinksStory,{}),parameters:{docs:{description:{story:`
The widget declares where to go; the host decides how to get there. This story mounts a \`WidgetHostProvider\` whose \`links\` capability recognizes hrefs targeting the demo application's own routes.

The footer shows the three materializations side by side:

- "See report" declares \`admin.php?page=demo-dashboard&p=/reports\`, a route this host owns: it mounts the host's route link and navigates client-side; the status line above confirms the document never reloaded.
- "View goal details" opens another origin in a new tab: a plain anchor.
- "Export progress" is a download: downloads always keep the plain anchor.

Without the provider the same declarations still work; every action falls back to a plain anchor. Real hosts implement the capability at their route layer with their actual router.
`}}}},G=[{uuid:`site-status`,type:`demo/site-status`,attributes:{},placement:{width:2,height:1,order:1}}],K={render:()=>(0,v.jsx)(RuntimeActionsStory,{}),parameters:{docs:{description:{story:'\nA widget declares actions from what its render knows, through `useWidgetActions`, and from more than one component.\n\nThe footer starts with the declared "Details" link. Once the check settles, the widget declares "Review 3 items" with the same `id`, and it takes that place. Its export section, a child component, declares "Download CSV": a `callback` action, disabled while the export runs. `WidgetRender` joins both declarations, so the host receives one list. The strip keeps its height as they arrive.\n\n"Hide export" unmounts the section and withdraws only its action. "Resolve one" shrinks the list; once nothing is left, "Details" returns.\n'}}}},q=[{uuid:`footer-text-links`,type:`demo/footer-text-links`,attributes:{metric:`revenue`,target:`5000`},placement:{width:1,height:1,order:1}},{uuid:`footer-icon-link`,type:`demo/footer-icon-link`,attributes:{metric:`orders`,target:`1000`},placement:{width:1,height:1,order:2}},{uuid:`footer-callbacks`,type:`demo/footer-callbacks`,attributes:{metric:`revenue`,target:`10000`},placement:{width:1,height:1,order:3}}],J={render:()=>(0,v.jsx)(FooterStory,{}),parameters:{docs:{description:{story:`
Three tiles whose footers hold different affordances: text links, a text link beside an icon-only link, and callback buttons declared at runtime.

Every strip has one height, the text line plus its padding, and a compact control sits centered in it: the dividers stay level across the tiles, and the body keeps its size whatever the footer holds. Run a callback to watch its button disable while the promise settles, without moving the strip.
`}}}},Y=[{label:`All`,href:`/analytics`,type:null},{label:`Traffic`,href:`/analytics/traffic`,type:`demo/traffic-snapshot`},{label:`Goals`,href:`/analytics/goals`,type:`demo/goal-progress`}],X={viewer:{label:`Viewer`,summary:`reads the dashboard and edits nothing`,operations:[]},arranger:{label:`Arranger`,summary:`may customize, move, and resize; never adds, removes, edits, or resets`,operations:[`customize`,`move`,`resize`]},owner:{label:`Owner`,summary:`may do everything`,operations:`all`}},Z={render:e=>(0,v.jsx)(PolicyStory,{...e}),args:{profile:`owner`},argTypes:{profile:{control:`select`,options:Object.keys(X),description:`The user profile the application maps to a policy. Viewer: nothing. Arranger: customize, move, resize. Owner: everything, including reset.`}},parameters:{docs:{description:{story:'\nThe application governs the dashboard; the widget types stay untouched. This story mounts `WidgetDashboard.Policy` around the dashboard with a `canPerform` closing over the signed-in profile and the active section, and composes the dashboard inside an admin `Page`: the section links in its navigation, the dashboard actions in its actions slot.\n\nSwitch the `profile` control. A Viewer gets no Customize button, no Reset to default entry, no attribute controls, and read-only widgets (no `setAttributes`). An Arranger enters customize mode and drags or resizes tiles, but has no Add widget trigger, no Reset to default entry, no Remove control, and no attribute editing. An Owner does everything.\n\nThe command palette is mounted too: press ⌘K (Ctrl+K outside macOS) and the commands follow the same policy. An Owner sees Customize dashboard, Add dashboard widgets, and Reset dashboard widgets to default; an Arranger keeps Customize dashboard only; a Viewer gets no dashboard commands.\n\nSwitch the section, then open "Add widget": the listing follows the section, even while open; the excluded types keep rendering where already placed because the `widgetTypes` registry never changes.\n\nNested policies compose restrictively; without a policy, every operation is allowed. See the **Policy** page for the contract.\n'}}}},Q=[{uuid:`grid-settings-traffic-week`,type:`demo/traffic-snapshot`,attributes:{metric:`views`,period:`week`,label:`Traffic`},placement:{width:2,height:1,order:1}},{uuid:`grid-settings-goal-revenue`,type:`demo/goal-progress`,attributes:{metric:`revenue`,target:`5000`},placement:{width:1,height:1,order:2}},{uuid:`grid-settings-audience-tall`,type:`demo/traffic-snapshot`,attributes:{metric:`visitors`,period:`month`,label:`Audience`},placement:{width:1,height:2,order:3}},{uuid:`grid-settings-goal-orders`,type:`demo/goal-progress`,attributes:{metric:`orders`,target:`1000`},placement:{width:2,height:1,order:4}},{uuid:`grid-settings-traffic-day`,type:`demo/traffic-snapshot`,attributes:{metric:`views`,period:`day`,label:`Today`},placement:{width:1,height:1,order:5}},{uuid:`grid-settings-goal-stretch`,type:`demo/goal-progress`,attributes:{metric:`revenue`,target:`10000`},placement:{width:1,height:1,order:6}}],$={render:e=>(0,v.jsx)(GridSettingsStory,{...e}),args:{columns:4,steps:{0:1,600:2,960:4},minColumnWidth:0,model:`grid`,rowHeight:`medium`,flowTolerance:16},argTypes:{columns:{control:{type:`range`,min:1,max:12,step:1},description:`Column count at every width. The host decides; the package only floors it at one.`},steps:{control:`object`,description:"Count per container width, applied from that width up: `{ 0: 1, 600: 2, 960: 4 }`; a step can be 'auto'. Replaces `columns` while set; an empty object leaves it to `columns`."},minColumnWidth:{control:{type:`range`,min:0,max:480,step:20},description:`Per-column floor in pixels, composed with either form. Zero leaves it unset.`},model:{control:`radio`,options:[`grid`,`masonry`],description:"The grid model. `grid` gives uniform rows and two-axis spans; `masonry` drives heights from content."},rowHeight:{control:`radio`,options:Object.keys(f),description:`Height of each grid row. Grid model only.`,if:{arg:`model`,eq:`grid`}},flowTolerance:{control:{type:`range`,min:0,max:200,step:4},description:`Pixel tolerance for source-order tiebreaking between lanes. Masonry model only.`,if:{arg:`model`,eq:`masonry`}}},parameters:{controls:{include:[`columns`,`steps`,`minColumnWidth`,`model`,`rowHeight`,`flowTolerance`]},docs:{description:{story:"\nThe `gridSettings` prop carries the host's layout decisions, and the column policy travels to the surface untouched. `columns` is a count at every width. `steps` is the same field as a map from container width to count, the form a host uses to step the count as the surface narrows, and a step can be `'auto'` to leave that band to the floor, or to the count below it when no floor is set. One, two and four columns (`DEFAULT_GRID.columns`) is the default when the host sets nothing; the package applies no steps of its own. Resize the canvas to watch the count change at each step; clear `steps` to hold `columns` at every width.\n\n`minColumnWidth` is a per-column floor that composes with either form: the surface fits as many columns as the container allows at that width, capped by the count, down to one. Raise it and narrow the canvas to watch the count fall one column at a time.\n\n`model` picks the surface, and the per-model field follows it: `rowHeight` belongs to `grid`, `flowTolerance` to `masonry`. Only the active one is passed in `gridSettings`, and only its control is shown.\n\nTile spans are stored per widget and do not scale with the count. Raise `columns` and every track narrows, so the same spans cover less of the surface. Enter Customize and resize a tile to see it take the new count.\n"}}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  render: () => <LongTitleStory />,
  parameters: {
    docs: {
      description: {
        story: \`
The identity holds the widget type's title. When the row cannot fit it, the title truncates with an ellipsis rather than wrapping: the header is one line tall.

The same type appears at two widths. Resize the canvas to watch where the cut lands.
\`
      }
    }
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  render: () => <DefaultStory />,
  parameters: {
    docs: {
      description: {
        story: \`
In normal mode the dashboard promotes every \\\`relevance: 'high'\\\` attribute into the tile header as a bare inline control beside the identity, plus the settings entry point when a non-promoted attribute exists.

Two demo types exercise that policy:

- \\\`demo/traffic-snapshot\\\` declares three attributes: \\\`metric\\\` and \\\`period\\\` are \\\`relevance: 'high'\\\`, and \\\`label\\\` stays on the settings surface.
- \\\`demo/goal-progress\\\` declares a single attribute at \\\`relevance: 'high'\\\`: with nothing left for the settings surface, the inline presentation shows no settings entry point.

Their tiles compare the header presentations:

- The two-column tile fits the identity and both inline controls, so they stay in the header.
- The one-column traffic tile does not: the promoted fields collapse into a dropdown holding them as a form, while the settings trigger stays in the toolbar beside it.
- The one-column goal tile carries a single promoted field and no settings surface, so its toolbar holds that field and the actions menu.

The widget only declares relevance; the fit is measured by the chrome, so the same declaration adapts to any tile width. Resize the canvas to watch the headers switch presentations.

Beyond attributes, \\\`demo/goal-progress\\\` declares three \\\`actions\\\` spanning the relevance scale, and that scale routes them: "View goal details" at \\\`'high'\\\` mounts as a leading text link (declared icon as prefix) in a persistent chrome footer, "Export progress" at \\\`'medium'\\\` beside it as a trailing icon-only link, and "About goals" at the default \\\`'low'\\\` lands in the "More" menu. The widget declares each action as data plus its importance; the host owns the surfaces.

Each type also carries a \\\`help\\\` note, opened from the help icon in the header, that describes its attributes and what they do.
\`
      }
    }
  }
}`,...L.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  render: () => <HostLinksStory />,
  parameters: {
    docs: {
      description: {
        story: \`
The widget declares where to go; the host decides how to get there. This story mounts a \\\`WidgetHostProvider\\\` whose \\\`links\\\` capability recognizes hrefs targeting the demo application's own routes.

The footer shows the three materializations side by side:

- "See report" declares \\\`admin.php?page=demo-dashboard&p=/reports\\\`, a route this host owns: it mounts the host's route link and navigates client-side; the status line above confirms the document never reloaded.
- "View goal details" opens another origin in a new tab: a plain anchor.
- "Export progress" is a download: downloads always keep the plain anchor.

Without the provider the same declarations still work; every action falls back to a plain anchor. Real hosts implement the capability at their route layer with their actual router.
\`
      }
    }
  }
}`,...W.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: () => <RuntimeActionsStory />,
  parameters: {
    docs: {
      description: {
        story: \`
A widget declares actions from what its render knows, through \\\`useWidgetActions\\\`, and from more than one component.

The footer starts with the declared "Details" link. Once the check settles, the widget declares "Review 3 items" with the same \\\`id\\\`, and it takes that place. Its export section, a child component, declares "Download CSV": a \\\`callback\\\` action, disabled while the export runs. \\\`WidgetRender\\\` joins both declarations, so the host receives one list. The strip keeps its height as they arrive.

"Hide export" unmounts the section and withdraws only its action. "Resolve one" shrinks the list; once nothing is left, "Details" returns.
\`
      }
    }
  }
}`,...K.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  render: () => <FooterStory />,
  parameters: {
    docs: {
      description: {
        story: \`
Three tiles whose footers hold different affordances: text links, a text link beside an icon-only link, and callback buttons declared at runtime.

Every strip has one height, the text line plus its padding, and a compact control sits centered in it: the dividers stay level across the tiles, and the body keeps its size whatever the footer holds. Run a callback to watch its button disable while the promise settles, without moving the strip.
\`
      }
    }
  }
}`,...J.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: args => <PolicyStory {...args} />,
  args: {
    profile: 'owner'
  },
  argTypes: {
    profile: {
      control: 'select',
      options: Object.keys(PROFILES),
      description: 'The user profile the application maps to a policy. Viewer: nothing. Arranger: customize, move, resize. Owner: everything, including reset.'
    }
  },
  parameters: {
    docs: {
      description: {
        story: \`
The application governs the dashboard; the widget types stay untouched. This story mounts \\\`WidgetDashboard.Policy\\\` around the dashboard with a \\\`canPerform\\\` closing over the signed-in profile and the active section, and composes the dashboard inside an admin \\\`Page\\\`: the section links in its navigation, the dashboard actions in its actions slot.

Switch the \\\`profile\\\` control. A Viewer gets no Customize button, no Reset to default entry, no attribute controls, and read-only widgets (no \\\`setAttributes\\\`). An Arranger enters customize mode and drags or resizes tiles, but has no Add widget trigger, no Reset to default entry, no Remove control, and no attribute editing. An Owner does everything.

The command palette is mounted too: press ⌘K (Ctrl+K outside macOS) and the commands follow the same policy. An Owner sees Customize dashboard, Add dashboard widgets, and Reset dashboard widgets to default; an Arranger keeps Customize dashboard only; a Viewer gets no dashboard commands.

Switch the section, then open "Add widget": the listing follows the section, even while open; the excluded types keep rendering where already placed because the \\\`widgetTypes\\\` registry never changes.

Nested policies compose restrictively; without a policy, every operation is allowed. See the **Policy** page for the contract.
\`
      }
    }
  }
}`,...Z.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  render: args => <GridSettingsStory {...args} />,
  args: {
    columns: 4,
    steps: {
      0: 1,
      600: 2,
      960: 4
    },
    minColumnWidth: 0,
    model: 'grid',
    rowHeight: 'medium',
    flowTolerance: 16
  },
  argTypes: {
    columns: {
      control: {
        type: 'range',
        min: 1,
        max: 12,
        step: 1
      },
      description: 'Column count at every width. The host decides; the package only floors it at one.'
    },
    steps: {
      control: 'object',
      description: "Count per container width, applied from that width up: \`{ 0: 1, 600: 2, 960: 4 }\`; a step can be 'auto'. Replaces \`columns\` while set; an empty object leaves it to \`columns\`."
    },
    minColumnWidth: {
      control: {
        type: 'range',
        min: 0,
        max: 480,
        step: 20
      },
      description: 'Per-column floor in pixels, composed with either form. Zero leaves it unset.'
    },
    model: {
      control: 'radio',
      options: ['grid', 'masonry'],
      description: 'The grid model. \`grid\` gives uniform rows and two-axis spans; \`masonry\` drives heights from content.'
    },
    rowHeight: {
      control: 'radio',
      options: Object.keys(ROW_HEIGHT_PRESETS),
      description: 'Height of each grid row. Grid model only.',
      if: {
        arg: 'model',
        eq: 'grid'
      }
    },
    flowTolerance: {
      control: {
        type: 'range',
        min: 0,
        max: 200,
        step: 4
      },
      description: 'Pixel tolerance for source-order tiebreaking between lanes. Masonry model only.',
      if: {
        arg: 'model',
        eq: 'masonry'
      }
    }
  },
  parameters: {
    controls: {
      include: ['columns', 'steps', 'minColumnWidth', 'model', 'rowHeight', 'flowTolerance']
    },
    docs: {
      description: {
        story: \`
The \\\`gridSettings\\\` prop carries the host's layout decisions, and the column policy travels to the surface untouched. \\\`columns\\\` is a count at every width. \\\`steps\\\` is the same field as a map from container width to count, the form a host uses to step the count as the surface narrows, and a step can be \\\`'auto'\\\` to leave that band to the floor, or to the count below it when no floor is set. One, two and four columns (\\\`DEFAULT_GRID.columns\\\`) is the default when the host sets nothing; the package applies no steps of its own. Resize the canvas to watch the count change at each step; clear \\\`steps\\\` to hold \\\`columns\\\` at every width.

\\\`minColumnWidth\\\` is a per-column floor that composes with either form: the surface fits as many columns as the container allows at that width, capped by the count, down to one. Raise it and narrow the canvas to watch the count fall one column at a time.

\\\`model\\\` picks the surface, and the per-model field follows it: \\\`rowHeight\\\` belongs to \\\`grid\\\`, \\\`flowTolerance\\\` to \\\`masonry\\\`. Only the active one is passed in \\\`gridSettings\\\`, and only its control is shown.

Tile spans are stored per widget and do not scale with the count. Raise \\\`columns\\\` and every track narrows, so the same spans cover less of the surface. Enter Customize and resize a tile to see it take the new count.
\`
      }
    }
  }
}`,...$.parameters?.docs?.source}}}})))()}init_index_story();export{L as Default,J as Footer,$ as GridSettings,W as HostLinks,I as LongTitle,Z as Policy,K as RuntimeActions,N as default};