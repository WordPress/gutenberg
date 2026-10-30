import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";var s;function init_widget_identity(){return(init_widget_identity=e((()=>{s=`# Widget identity

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

A widget type's identity — \`title\`, and the rest of the identity layer in **Anatomy** — lives on \`WidgetType\`. The host already shows it in chrome. The render body sometimes needs the same data.

\`useWidgetIdentity\` is how consumers read that identity consistently. A focusable chart that builds an accessible name from the title is one casual example; the hook itself only exposes identity.

![WidgetRender holds the resolved WidgetType, including its translated title. It mounts the render module with attributes and setAttributes, and lends the subtree a filtered identity context. The widget body reads useWidgetIdentity for the title.](./assets/widget-identity-flow.svg)

## Where it sits

Alongside the other render-facing contracts:

-   Instance state: \`attributes\` / \`setAttributes\`.
-   Type identity for the body: \`useWidgetIdentity\`.
-   Host materialization when the widget needs it: \`useWidgetHost\` (\`links\`, \`actions\`). See **Widget Host**.

## Contract

\`\`\`ts
type WidgetIdentity = {
	title?: string;
};
\`\`\`

\`title\` is the translated title of the widget type, as the host already shows it. Absent identity (no provider) yields \`{}\`; the widget names its content itself.

The public surface is the hook and this type. The provider is an internal detail of \`WidgetRender\`.

## Providing it

\`<WidgetRender>\` already receives \`widgetType\`. When it mounts the render module it lends the subtree \`{ title: widgetType.title }\`. Any host that mounts through that entry point needs no extra wiring: the dashboard tile, its previews, and Storybook hosts that use \`WidgetRender\` all get it.

A host that mounts a render module directly, without \`WidgetRender\`, leaves identity absent and the hook returns \`{}\`.

## Consuming it

\`\`\`tsx
const { title } = useWidgetIdentity();
const name = title
	? sprintf(
			/* translators: %s: widget title */
			__( 'Chart: %s' ),
			title
	  )
	: undefined;

return <figure aria-label={ name } />;
\`\`\`

How a widget phrases a name around the title belongs to that widget and its translators. Prefer a format that does not assume word order when the locale can put the noun first; a colon-separated label is one such pattern.

Guard \`title\`: without a provider it is \`undefined\`.
`})))()}var c;function init_widget_identity_flow(){return(init_widget_identity_flow=e((()=>{c=new URL(`widget-identity-flow-DdJUIRjw.svg`,import.meta.url).href})))()}function _createMdxContent(e){return(0,l.jsxs)(l.Fragment,{children:[(0,l.jsx)(r,{id:`widget-primitives-widget-identity`,title:`Widgets/Primitives/Widget Identity`}),`
`,(0,l.jsx)(n,{children:s.replace(`./assets/widget-identity-flow.svg`,c)})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,l.jsx)(t,{...e,children:(0,l.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var l;function init_widget_identity$1(){return(init_widget_identity$1=e((()=>{l=i(),o(),t(),init_widget_identity(),init_widget_identity_flow()})))()}init_widget_identity$1();export{MDXContent as default};