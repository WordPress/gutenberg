# Color schemes (experimental)

> **Status:** experimental prototype, opened for discussion. The shape of these
> keys may change. See the tracking discussion linked from the pull request.

A theme can provide alternate light and/or dark variants of its color presets,
mirroring the CSS [`prefers-color-scheme`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
model: the theme's base palette is the default, and `settings.color.light` /
`settings.color.dark` override the *other* scheme. So a light-by-default theme adds
a `dark` override, and a **dark-by-default theme adds a `light` override**. The
feature is **fully opt-in**: without the keys below, output is unchanged.

## How it works

Color and gradient presets are already emitted as CSS custom properties
(`--wp--preset--color--{slug}`, `--wp--preset--gradient--{slug}`). A scheme override
**redefines those same custom properties** under the matching
`prefers-color-scheme` media query. Anything that references a preset — theme
styles, block styles, user selections made through the palette — flips
automatically. Nothing that uses raw, non-preset color values is changed.

Presets are matched by `slug`. A base preset with no override keeps its single
value in every scheme. A scheme section overrides the base presets rather than
adding to them, so an entry whose `slug` has no base preset is ignored.

## Overriding the automatic scheme (`data-scheme`)

The dark overrides respond to a `data-scheme` attribute on the root (`<html>`)
element, so a visitor's choice can override the operating system:

| `data-scheme` | Behavior |
| --- | --- |
| _absent_ or `system` | Follow the OS via `prefers-color-scheme` (the default). |
| `light` | Never apply the dark values — stay light even if the OS is dark. |
| `dark` | Always apply the dark values, regardless of the OS. |

`data-scheme` is intended to be set **in memory only** — the automatic
`prefers-color-scheme` behavior is always the default. It is not persisted (no
`localStorage`, `sessionStorage`, or cookies), so the page returns to the system
preference after navigation or reload. Core ships no UI to set it; you can exercise
the mechanism by setting `document.documentElement.dataset.scheme = 'dark'` (or
`'light'`, or removing it to return to the system default) in the browser console.

## Authoring — inline light/dark presets

```json
{
	"version": 3,
	"settings": {
		"color": {
			"palette": [
				{ "slug": "base", "name": "Base", "color": "#ffffff" },
				{ "slug": "contrast", "name": "Contrast", "color": "#111111" }
			],
			"dark": {
				"palette": [
					{ "slug": "base", "color": "#111111" },
					{ "slug": "contrast", "color": "#ffffff" }
				]
			}
		}
	}
}
```

This emits, roughly (the `data-scheme` rules let a visitor control override the OS):

```css
:root {
	--wp--preset--color--base: #ffffff;
	--wp--preset--color--contrast: #111111;
}
@media (prefers-color-scheme: dark) {
	:root:not([data-scheme="light"]) {
		--wp--preset--color--base: #111111;
		--wp--preset--color--contrast: #ffffff;
	}
}
:root[data-scheme="dark"] {
	--wp--preset--color--base: #111111;
	--wp--preset--color--contrast: #ffffff;
}
```

`dark` (and `light`) may contain `palette` and `gradients`.

### Dark by default (a `light` override)

For a theme whose base palette is dark, add a `light` override instead — it is
emitted under `prefers-color-scheme: light`, so visitors whose OS is in light mode
(or who opt into light) get the light values:

```json
{
	"version": 3,
	"settings": {
		"color": {
			"palette": [
				{ "slug": "base", "name": "Base", "color": "#111111" },
				{ "slug": "contrast", "name": "Contrast", "color": "#ffffff" }
			],
			"light": {
				"palette": [
					{ "slug": "base", "color": "#ffffff" },
					{ "slug": "contrast", "color": "#111111" }
				]
			}
		}
	}
}
```

A theme may define `light`, `dark`, or both. When both are set, the base palette is
the fallback for visitors whose OS expresses no preference.

## Backward compatibility

`color.light` and `color.dark` are additive, optional keys under the current
`theme.json` version — there is **no new version**. Older WordPress releases that
don't recognize them simply strip them during sanitization, so the theme renders
with its base palette. A single `theme.json` works on old and new WordPress.

## Not covered (yet)

- Persisting a visitor's `data-scheme` choice across page loads. If ever added, it
  would be a dedicated visitor-preferences feature with its own privacy review, not
  a default.
- Dark duotone variants.
- Automatic generation of dark values — the theme must define them; the system
  never derives colors automatically.
- Raw (non-preset) colors, per-block fixed colors, images/logos, and nested light/dark
  surfaces. These remain the theme's responsibility.
