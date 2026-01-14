# Site Editor Routes

## Areas

When `canvasMode` is not `edit`, the areas available to use are:

| Area | Non-mobile viewport | Mobile viewport |
| --- | --- | --- |
| `sidebar` | Always rendered. | Only if `mobile` is not provided. |
| `content` | Rendered if provided. | Not rendered. |
| `preview` | Rendered if provided. | Not rendered. |
| `edit` | Rendered if provided. | Not rendered. |
| `mobile` | Not rendered | Rendered as full-screen, if provided. |

When `canvasMode` is `edit`, the areas available to use are:

| Area | Non-mobile viewport | Mobile viewport |
| --- | --- | --- |
| `preview` | Rendered as full-screen, if provided. Otherwise, it'll display an empty blank sidebar. | Not rendered. |
| `mobile` | Not rendered | Rendered as full-screen, if provided. Otherwise, it'll display an empty blank sidebar. |
