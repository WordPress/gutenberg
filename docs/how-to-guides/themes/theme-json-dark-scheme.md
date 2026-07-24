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
value in every scheme.

## Overriding the automatic scheme (`data-scheme`)

The dark overrides respond to a `data-scheme` attribute on the root (`<html>`)
element, so a visitor's choice can override the operating system:

| `data-scheme` | Behavior |
| --- | --- |
| _absent_ or `system` | Follow the OS via `prefers-color-scheme` (the default). |
| `light` | Never apply the dark values — stay light even if the OS is dark. |
| `dark` | Always apply the dark values, regardless of the OS. |

The preference is persisted in `localStorage` under the `wp-color-scheme` key and
applied to the root element **before first paint** by a small inline bootstrap
script, so a saved choice never flashes the wrong scheme on load. The bootstrap is
only emitted on the front end when the active theme provides a dark scheme.

> A visitor-facing **toggle block** that writes this preference is added in a
> follow-up change. Until then you can exercise the mechanism by setting
> `localStorage.setItem( 'wp-color-scheme', 'dark' )` (or `'light'`) in the browser
> console and reloading.

## Authoring source A — inline `settings.color.dark`

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

`dark` (and `light`) may contain `palette` and `gradients`. (Duotone is not yet
supported.)

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

## Authoring source B — reference a style variation

If your theme already ships a dark style variation in its `styles/` directory, you
can point at it by title instead of duplicating the palette:

```json
{
	"version": 3,
	"settings": {
		"color": {
			"darkScheme": "Midnight"
		}
	}
}
```

Only the variation's color palette and gradients are used as the dark scheme; its
other styles are ignored. If both `dark` and `darkScheme` are present, the inline
`dark` takes precedence. `lightScheme` works the same way for the light scheme.

## Backward compatibility

`color.light`, `color.dark`, `color.lightScheme`, and `color.darkScheme` are
additive, optional keys under the current `theme.json` version — there is **no new
version**. Older WordPress releases that don't recognize them simply strip them
during sanitization, so the theme renders with its base palette. A single
`theme.json` works on old and new WordPress.

## Not covered (yet)

- A visitor-facing toggle **block** that writes the `wp-color-scheme` preference,
  and a site-wide setting to disable automatic switching. The `data-scheme` runtime
  above is in place; the block UI is the next follow-up.
- Dark duotone variants.
- Automatic generation of dark values — the theme must define them; the system
  never derives colors automatically.
- Raw (non-preset) colors, per-block fixed colors, images/logos, and nested light/dark
  surfaces. These remain the theme's responsibility.
