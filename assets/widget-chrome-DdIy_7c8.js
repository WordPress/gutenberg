import{n as e}from"./rolldown-runtime-Db01ssZC.js";import{h as t,l as n,u as r}from"./blocks-Bi8bw4xb.js";import{t as i}from"./jsx-runtime-BxZPLZy3.js";import{i as a,r as o}from"./react-sPqhvIIV.js";var s;function init_widget_chrome(){return(init_widget_chrome=e((()=>{s=`# Anatomy of the Widget Chrome

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The chrome is everything the dashboard wraps around a widget instance: the header, its controls, the footer, and the boundaries that catch errors and loading.

The widget declares its identity and how it wants to be framed; the chrome materializes both.
The widget never paints its own header or toolbar.

## From metadata to tile

The chrome reads the widget type and materializes each field in one of three areas.

![One widget type materialized as a tile of three areas: the header takes the identity, the high-relevance attributes, and the low-relevance actions; the content takes the render module fed with the attribute values; the footer takes the promoted actions.](./assets/tile-anatomy.svg)

The header takes the identity (\`icon\`, \`title\`, \`help\`), the high-relevance \`attributes\` inline plus the settings trigger for the full schema, and the low-relevance \`actions\` in the More menu. The content belongs to the render module, fed the attribute values. The footer takes the promoted \`actions\`. Both surfaces also take the actions the mounted instance declares through \`useWidgetActions\`.

Wherever a link action lands, one rule applies: a target the host recognizes as one of its own routes mounts the host router's link and navigates client-side; every other link, and any \`download\` or \`openInNewTab\`, keeps the plain anchor.

## The frame

The dashboard widget interprets \`presentation\` and determines how much chrome a widget gets.

-   \`framed\` paints a header and pads the content.
-   \`content-bleed\` keeps the header but lets the content fill the available area.
-   \`full-bleed\` hides the header and the footer and gives the widget the whole tile, while keeping the identity available to assistive technology.

Whatever the presentation, an error boundary and a loading fallback wrap the content, so a widget that throws or suspends never breaks the tile.

## The header

The header is a single row of three sections.

![The header row: an identity cluster on the leading edge, the attribute controls next, and the actions menu on the trailing edge.](./assets/header-anatomy.svg)

The sections are semantic. A control belongs to a section by its nature, not by how it renders.

-   **Identity.** The widget's icon, title, and help. It names the tile, and its title truncates rather than wrapping when the row runs short.
-   **Attributes.** The widget's high-relevance attributes: quick in-place editing or a dropdown button when there isn't enough space.
-   **More.** The widget's low-relevance actions, gathered in a menu on the trailing edge.

### Fitting the row

Only the attributes change form. The identity truncates its title, and the actions menu is compact throughout.

Attributes are inline fields when they fit, or a form within a dropdown when they do not.

![Wide tiles keep the attributes inline; narrow tiles fold them into a dropdown, while the identity truncates its title and the actions menu stays.](./assets/header-fit.svg)

The header decides from what it measures: the row's own width, and the width each section reports.

It measures the identity as it stands, discounts the sections that keep their size, and gives the attributes what is left; when that is less than their inline width, they fold.

Because the decision measures the real row, every section counts on its own.

The widget declares its sections; the header measures the fit.

## The footer

A persistent strip under the body, for the actions the widget promotes.

![The footer strip: a full-width divider, high-relevance actions as text links on the leading edge, medium-relevance actions as compact icon affordances on the trailing edge.](./assets/footer-anatomy.svg)

\`relevance\` routes every action to its surface.

-   **\`high\`.** Text links on the leading edge, labels always visible, a declared icon as prefix.
-   **\`medium\`.** Compact affordances on the trailing edge: icon-only with a declared icon, text links otherwise.
-   **\`low\`** (default). The header's More menu.

Every link is a real anchor: middle-click, copy address, and download survive. A \`callback\` action mounts a button.

The divider spans the tile, and the body above keeps no bottom padding, so scrolled content runs flush against it.

The strip has one height, the text line plus its padding, whatever it holds: a compact control sits centered in it, so dividers stay level across tiles and the body keeps its size when an action arrives at runtime.

The widget declares importance; the footer materializes it.
`})))()}var c;function init_tile_anatomy(){return(init_tile_anatomy=e((()=>{c=new URL(`tile-anatomy-CKy9yyRp.svg`,import.meta.url).href})))()}var l;function init_header_anatomy(){return(init_header_anatomy=e((()=>{l=`data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgODYwIDE4MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IlRoZSB3aWRnZXQgaGVhZGVyIHJvdywgbWFkZSBvZiB0aHJlZSBzZW1hbnRpYyBzZWN0aW9uczogYW4gaWRlbnRpdHkgY2x1c3RlciAoaWNvbiwgdGl0bGUsIGhlbHApIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIHRoZSBhdHRyaWJ1dGUgY29udHJvbHMgaW4gdGhlIG1pZGRsZSwgYW5kIHRoZSBhY3Rpb25zIG1lbnUgb24gdGhlIHRyYWlsaW5nIGVkZ2UuIj4KICA8cmVjdCB4PSI2IiB5PSI2IiB3aWR0aD0iODQ4IiBoZWlnaHQ9IjE3MCIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIi8+CgogIDx0ZXh0IHg9IjQzMCIgeT0iMzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTEuNSIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzY0NzQ4YiI+dGhlIGhlYWRlciByb3c8L3RleHQ+CgogIDwhLS0gVGhlIHJvdyAtLT4KICA8cmVjdCB4PSI0MCIgeT0iNTQiIHdpZHRoPSI3ODAiIGhlaWdodD0iNTQiIHJ4PSIxMCIgZmlsbD0iI2ZmZmZmZiIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuNiIvPgoKICA8IS0tIElkZW50aXR5OiBpY29uICsgdGl0bGUgKyBoZWxwIC0tPgogIDxyZWN0IHg9IjU2IiB5PSI2OCIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI2IiByeD0iNiIgZmlsbD0iI2UyZWNmZCIgc3Ryb2tlPSIjMmY1NGE1IiBzdHJva2Utd2lkdGg9IjEuNCIvPgogIDx0ZXh0IHg9IjkyIiB5PSI4NiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMyIgZm9udC13ZWlnaHQ9IjYwMCIgZmlsbD0iIzFlM2E4YSI+VHJhZmZpYyBTbmFwc2hvdDwvdGV4dD4KICA8Y2lyY2xlIGN4PSIyMjQiIGN5PSI4MSIgcj0iOCIgZmlsbD0iI2VlZjRmZSIgc3Ryb2tlPSIjN2Y5Y2Q4IiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDx0ZXh0IHg9IjIyNCIgeT0iODUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZvbnQtd2VpZ2h0PSI3MDAiIGZvbnQtc3R5bGU9Iml0YWxpYyIgZmlsbD0iIzNiNjJiMCI+aTwvdGV4dD4KCiAgPCEtLSBBdHRyaWJ1dGVzOiB0d28gaW5saW5lIGZpZWxkIGNvbnRyb2xzIC0tPgogIDxyZWN0IHg9IjQ2OCIgeT0iNzAiIHdpZHRoPSIxMTgiIGhlaWdodD0iMjIiIHJ4PSI2IiBmaWxsPSIjZmFmYmZjIiBzdHJva2U9IiNjYmQ1ZTEiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgPHRleHQgeD0iNDgwIiB5PSI4NSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMSIgZmlsbD0iIzQ3NTU2OSI+TWV0cmljPC90ZXh0PgogIDxwYXRoIGQ9Ik01NjQgNzkgbDcgMCBsLTMuNSA1IHoiIGZpbGw9IiM5NGEzYjgiLz4KICA8cmVjdCB4PSI1OTgiIHk9IjcwIiB3aWR0aD0iMTE4IiBoZWlnaHQ9IjIyIiByeD0iNiIgZmlsbD0iI2ZhZmJmYyIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDx0ZXh0IHg9IjYxMCIgeT0iODUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTEiIGZpbGw9IiM0NzU1NjkiPlBlcmlvZDwvdGV4dD4KICA8cGF0aCBkPSJNNjk0IDc5IGw3IDAgbC0zLjUgNSB6IiBmaWxsPSIjOTRhM2I4Ii8+CgogIDwhLS0gTW9yZTogYWN0aW9ucyBtZW51IC0tPgogIDxyZWN0IHg9Ijc2NCIgeT0iNzAiIHdpZHRoPSI0NCIgaGVpZ2h0PSIyMiIgcng9IjYiIGZpbGw9IiNmYWZiZmMiIHN0cm9rZT0iI2NiZDVlMSIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KICA8Y2lyY2xlIGN4PSI3ODYiIGN5PSI3NiIgcj0iMS44IiBmaWxsPSIjNDc1NTY5Ii8+CiAgPGNpcmNsZSBjeD0iNzg2IiBjeT0iODEiIHI9IjEuOCIgZmlsbD0iIzQ3NTU2OSIvPgogIDxjaXJjbGUgY3g9Ijc4NiIgY3k9Ijg2IiByPSIxLjgiIGZpbGw9IiM0NzU1NjkiLz4KCiAgPCEtLSBTZWN0aW9uIGJyYWNrZXRzIC0tPgogIDxwYXRoIGQ9Ik01NiAxMjAgTDU2IDEyNiBMMjMyIDEyNiBMMjMyIDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDx0ZXh0IHg9IjE0NCIgeT0iMTQzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMzM0MTU1Ij5JZGVudGl0eTwvdGV4dD4KICA8dGV4dCB4PSIxNDQiIHk9IjE1OCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk0YTNiOCI+aWNvbiDCtyB0aXRsZSDCtyBoZWxwPC90ZXh0PgoKICA8cGF0aCBkPSJNNDY4IDEyMCBMNDY4IDEyNiBMNzE2IDEyNiBMNzE2IDEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDx0ZXh0IHg9IjU5MiIgeT0iMTQzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMzM0MTU1Ij5BdHRyaWJ1dGVzPC90ZXh0PgogIDx0ZXh0IHg9IjU5MiIgeT0iMTU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTRhM2I4Ij5oaWdoLXJlbGV2YW5jZSBmaWVsZHM8L3RleHQ+CgogIDxwYXRoIGQ9Ik03NjQgMTIwIEw3NjQgMTI2IEw4MDggMTI2IEw4MDggMTIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNjYmQ1ZTEiIHN0cm9rZS13aWR0aD0iMS4yIi8+CiAgPHRleHQgeD0iNzg2IiB5PSIxNDMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiMzMzQxNTUiPk1vcmU8L3RleHQ+CiAgPHRleHQgeD0iNzg2IiB5PSIxNTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5NGEzYjgiPmFjdGlvbnM8L3RleHQ+Cjwvc3ZnPgo=`})))()}var u;function init_header_fit(){return(init_header_fit=e((()=>{u=new URL(`header-fit-Cy5fsMY8.svg`,import.meta.url).href})))()}var d;function init_footer_anatomy(){return(init_footer_anatomy=e((()=>{d=`data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgODYwIDIxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IlRoZSBmb290ZXIgc3RyaXAgdW5kZXIgdGhlIHdpZGdldCBib2R5OiBhIGZ1bGwtd2lkdGggZGl2aWRlciwgaGlnaC1yZWxldmFuY2UgYWN0aW9ucyBhcyB0ZXh0IGxpbmtzIG9uIHRoZSBsZWFkaW5nIGVkZ2UsIG1lZGl1bS1yZWxldmFuY2UgYWN0aW9ucyBhcyBjb21wYWN0IGljb24gYWZmb3JkYW5jZXMgb24gdGhlIHRyYWlsaW5nIGVkZ2UuIj4KICA8cmVjdCB4PSI2IiB5PSI2IiB3aWR0aD0iODQ4IiBoZWlnaHQ9IjE5OCIgcng9IjEyIiBmaWxsPSIjZmZmZmZmIi8+CgogIDx0ZXh0IHg9IjQzMCIgeT0iMzQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTEuNSIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzY0NzQ4YiI+dGhlIGZvb3RlciBzdHJpcDwvdGV4dD4KCiAgPCEtLSBUaGUgdGlsZTogYm9keSBhYm92ZSB0aGUgZGl2aWRlciwgZm9vdGVyIGJlbG93IC0tPgogIDxyZWN0IHg9IjQwIiB5PSI1NCIgd2lkdGg9Ijc4MCIgaGVpZ2h0PSI4MiIgcng9IjEwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNjYmQ1ZTEiIHN0cm9rZS13aWR0aD0iMS42Ii8+CgogIDwhLS0gQm9keSBoaW50IC0tPgogIDxyZWN0IHg9IjU2IiB5PSI2NiIgd2lkdGg9IjMzMCIgaGVpZ2h0PSI4IiByeD0iNCIgZmlsbD0iI2VlZjJmNyIvPgogIDxyZWN0IHg9IjU2IiB5PSI4MCIgd2lkdGg9IjI0MCIgaGVpZ2h0PSI4IiByeD0iNCIgZmlsbD0iI2VlZjJmNyIvPgoKICA8IS0tIERpdmlkZXIsIGVkZ2UgdG8gZWRnZSAtLT4KICA8bGluZSB4MT0iNDAiIHkxPSI5OCIgeDI9IjgyMCIgeTI9Ijk4IiBzdHJva2U9IiNjYmQ1ZTEiIHN0cm9rZS13aWR0aD0iMS40Ii8+CgogIDwhLS0gSGlnaDogbGVhZGluZyB0ZXh0IGxpbmsgLS0+CiAgPHRleHQgeD0iNTYiIHk9IjEyMiIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMi41IiBmb250LXdlaWdodD0iNjAwIiBmaWxsPSIjMmY1NGE1Ij5WaWV3IGFsbCBkcmFmdHM8L3RleHQ+CgogIDwhLS0gTWVkaXVtOiB0cmFpbGluZyBpY29uLW9ubHkgYWZmb3JkYW5jZSAtLT4KICA8cmVjdCB4PSI3NzgiIHk9IjEwNiIgd2lkdGg9IjI2IiBoZWlnaHQ9IjI0IiByeD0iNiIgZmlsbD0iI2ZhZmJmYyIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDxwYXRoIGQ9Ik03OTEgMTExIHY4IG0tMy41IC0zLjUgbDMuNSAzLjUgbDMuNSAtMy41IE03ODYgMTI0IGgxMCIgc3Ryb2tlPSIjNDc1NTY5IiBzdHJva2Utd2lkdGg9IjEuNSIgZmlsbD0ibm9uZSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CgogIDwhLS0gU2VjdGlvbiBicmFja2V0cyAtLT4KICA8cGF0aCBkPSJNNTYgMTQ4IEw1NiAxNTQgTDE1MCAxNTQgTDE1MCAxNDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2NiZDVlMSIgc3Ryb2tlLXdpZHRoPSIxLjIiLz4KICA8dGV4dCB4PSIxMDMiIHk9IjE3MSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzMzNDE1NSI+SGlnaDwvdGV4dD4KICA8dGV4dCB4PSIxMDMiIHk9IjE4NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9Ii1hcHBsZS1zeXN0ZW0sIHN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzk0YTNiOCI+dGV4dCBsaW5rcyDCtyBsZWFkaW5nPC90ZXh0PgoKICA8cGF0aCBkPSJNNzc4IDE0OCBMNzc4IDE1NCBMODA0IDE1NCBMODA0IDE0OCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEuMiIvPgogIDx0ZXh0IHg9Ijc5MSIgeT0iMTcxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iLWFwcGxlLXN5c3RlbSwgc3lzdGVtLXVpLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iNzAwIiBmaWxsPSIjMzM0MTU1Ij5NZWRpdW08L3RleHQ+CiAgPHRleHQgeD0iNzkxIiB5PSIxODYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9IiM5NGEzYjgiPmNvbXBhY3QgwrcgdHJhaWxpbmc8L3RleHQ+Cjwvc3ZnPgo=`})))()}function _createMdxContent(e){return(0,f.jsxs)(f.Fragment,{children:[(0,f.jsx)(r,{id:`widget-dashboard-widget-chrome`,title:`Widgets/Dashboard/Widget Chrome`}),`
`,(0,f.jsx)(n,{children:s.replace(`./assets/tile-anatomy.svg`,c).replace(`./assets/header-anatomy.svg`,l).replace(`./assets/header-fit.svg`,u).replace(`./assets/footer-anatomy.svg`,d)})]})}function MDXContent(e={}){let{wrapper:t}={...a(),...e.components};return t?(0,f.jsx)(t,{...e,children:(0,f.jsx)(_createMdxContent,{...e})}):_createMdxContent(e)}var f;function init_widget_chrome$1(){return(init_widget_chrome$1=e((()=>{f=i(),o(),t(),init_widget_chrome(),init_tile_anatomy(),init_header_anatomy(),init_header_fit(),init_footer_anatomy()})))()}init_widget_chrome$1();export{MDXContent as default};