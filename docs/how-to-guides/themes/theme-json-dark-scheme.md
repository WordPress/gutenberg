# Dark color scheme (experimental)

> **Status:** experimental prototype, opened for discussion. The shape of these
> keys may change. See the tracking discussion linked from the pull request.

A theme can provide a dark variant of its color presets. When the visitor's
operating system prefers a dark color scheme, the dark preset values are applied
automatically. The feature is **fully opt-in**: without the keys below, output is
unchanged and the site stays light.

## How it works

Color and gradient presets are already emitted as CSS custom properties
(`--wp--preset--color--{slug}`, `--wp--preset--gradient--{slug}`). The dark scheme
**redefines those same custom properties** under a `prefers-color-scheme: dark`
media query. Anything that references a preset — theme styles, block styles, user
selections made through the palette — flips automatically. Nothing that uses raw,
non-preset color values is changed.

Presets are matched by `slug`. A base preset with no dark counterpart keeps its
single value in both schemes.

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

This emits, roughly:

```css
:root {
	--wp--preset--color--base: #ffffff;
	--wp--preset--color--contrast: #111111;
}
@media (prefers-color-scheme: dark) {
	:root {
		--wp--preset--color--base: #111111;
		--wp--preset--color--contrast: #ffffff;
	}
}
```

`dark` may contain `palette` and `gradients`. (Duotone is not yet supported.)

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
`dark` takes precedence.

## Backward compatibility

`color.dark` and `color.darkScheme` are additive, optional keys under the current
`theme.json` version — there is **no new version**. Older WordPress releases that
don't recognize them simply strip them during sanitization, so the theme renders in
its light scheme. A single `theme.json` works on old and new WordPress.

## Not covered (yet)

- A visitor-facing toggle to override the automatic scheme, and a site-wide setting
  to disable automatic switching. These are planned as a follow-up.
- Dark duotone variants.
- Automatic generation of dark values — the theme must define them; the system
  never derives colors automatically.
- Raw (non-preset) colors, per-block fixed colors, images/logos, and nested light/dark
  surfaces. These remain the theme's responsibility.
