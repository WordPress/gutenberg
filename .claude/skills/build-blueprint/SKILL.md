# /build-blueprint

Generate a WordPress Playground blueprint from parsed issue data.

## Usage

This skill can be used in two ways:

1. **As part of triage pipeline:** Automatically called after parsing
2. **Standalone:** Manually invoked to generate/regenerate a blueprint

**Standalone usage examples:**
```
User: "Use the build-blueprint skill for issue 74447"
User: "Generate a blueprint for issue 72364"
User: "Rebuild the blueprint for 73872 with latest parsed data"
```

## Arguments

- `issue` (required): Issue number

## Input

**Required files:**
- `.triage/<issue>/<issue>.parsed.json` - Parsed issue data

**Uses from parsed data:**
- `environment.wordpress` - Target WordPress version
- `environment.gutenberg` - Gutenberg version
- `environment.theme` - Theme type (block/classic)
- `reproduction.steps` - To determine landing page

**If file doesn't exist:**
- Inform user that parsed data is missing
- Suggest running parse-issue skill first

## Output

Writes to `.triage/<issue>/<issue>.blueprint.json`

**Blueprint includes:**
- WordPress version
- Gutenberg plugin configuration
- Theme setup
- Landing page URL
- Any required test content (posts, pages)

---

## Process

### 1. Load parsed issue data

Read `.triage/<issue>.parsed.json` and extract:
- `environment.wordpress` - Target WP version
- `environment.gutenberg` - Target Gutenberg version
- `environment.theme` - Theme type (block/classic)
- `reproduction.steps` - To determine landing page

### 2. Start with default template

Load `skills/templates/default-blueprint.json` as the base.

### 3. Determine WordPress version

From `environment.wordpress`:

| Parsed Value | Blueprint `wp` Value |
|--------------|---------------------|
| `6.7`, `6.7.1`, `WordPress 6.7` | `"6.7"` |
| `trunk`, `nightly` | `"nightly"` |
| `latest`, `unknown`, empty | `"latest"` |

### 4. Determine Gutenberg version

From `environment.gutenberg`:

| Parsed Value | Action |
|--------------|--------|
| `built-in`, `core`, `none` | Omit the installPlugin step for Gutenberg |
| `trunk`, `nightly` | Use `"resource": "url"` with nightly build URL |
| `20.0`, `Gutenberg 20.0` | Use `"resource": "wordpress.org/plugins"` (latest from .org) |
| `latest`, `unknown`, empty | Use `"resource": "wordpress.org/plugins"` with slug `gutenberg` |

**Gutenberg nightly URL:**
```
https://playground.wordpress.net/gutenberg.zip
```

**Specific version URL pattern:**
```
https://downloads.wordpress.org/plugin/gutenberg.19.9.0.zip
```

### 5. Determine theme

From `environment.theme`:

| Parsed Value | Action |
|--------------|--------|
| `block`, `Twenty Twenty-Five`, unknown | No change (TT5 is default) |
| `classic`, `Twenty Twenty-One` | Add `installTheme` + `activateTheme` for classic theme |
| Specific theme name | Add steps for that theme |

**Classic theme example:**
```json
{
  "step": "installTheme",
  "themeData": {
    "resource": "wordpress.org/themes",
    "slug": "flavor"
  }
},
{
  "step": "activateTheme",
  "themeFolderName": "flavor"
}
```

### 6. Determine landing page

Analyze the first reproduction step to set `landingPage`:

| Step mentions | Landing Page |
|---------------|--------------|
| "site editor", "site-editor.php" | `/wp-admin/site-editor.php` |
| "create a new post", "add new post" | `/wp-admin/post-new.php` |
| "create a new page", "add new page" | `/wp-admin/post-new.php?post_type=page` |
| "edit a post", "open a post" | Create post first, then land on edit screen |
| "widgets", "widget editor" | `/wp-admin/widgets.php` |
| "patterns", "pattern" | `/wp-admin/site-editor.php?postType=wp_block` |
| "navigation", "menus" | `/wp-admin/site-editor.php?postType=wp_navigation` |
| "styles", "global styles" | `/wp-admin/site-editor.php?path=%2Fwp_global_styles` |
| "additional css" | `/wp-admin/site-editor.php?p=%2Fstyles&section=%2Fcss` |
| Default | `/wp-admin/` |

### 7. Add content if needed

If reproduction requires existing content:

**Create a test post:**
```json
{
  "step": "runPHP",
  "code": "<?php require '/wordpress/wp-load.php'; wp_insert_post(['post_title' => 'Test Post', 'post_content' => '<!-- wp:paragraph --><p>Test content</p><!-- /wp:paragraph -->', 'post_status' => 'publish']); ?>"
}
```

**Create a test page:**
```json
{
  "step": "runPHP",
  "code": "<?php require '/wordpress/wp-load.php'; wp_insert_post(['post_title' => 'Test Page', 'post_content' => '<!-- wp:paragraph --><p>Test content</p><!-- /wp:paragraph -->', 'post_status' => 'publish', 'post_type' => 'page']); ?>"
}
```

### 8. Write blueprint and report

1. Write final blueprint to `.triage/<issue>.blueprint.json`
2. Output summary:

```
BLUEPRINT GENERATED: .triage/<issue>.blueprint.json

CUSTOMIZATIONS APPLIED:
- WordPress version: <version> (reason)
- Gutenberg: <version/source> (reason)
- Theme: <theme> (reason)
- Landing page: <url> (reason)
- Additional steps: <list if any>

PLAYGROUND CLI COMMAND:
.claude/bin/playground.sh start --blueprint=.triage/<issue>/<issue>.blueprint.json
```

---

## Special Cases

### Gutenberg trunk/nightly

```json
{
  "step": "installPlugin",
  "pluginData": {
    "resource": "url",
    "url": "https://playground.wordpress.net/gutenberg.zip"
  }
}
```

### Specific Gutenberg version

```json
{
  "step": "installPlugin",
  "pluginData": {
    "resource": "url",
    "url": "https://downloads.wordpress.org/plugin/gutenberg.19.9.0.zip"
  }
}
```

### No Gutenberg (core only)

Remove the Gutenberg installPlugin step entirely.

---

## Error Handling

- **Cannot determine environment**: Use defaults, note in output
- **Conflicting requirements**: Flag for user decision
- **Unsupported requirement**: Note limitation (e.g., "requires multisite" - not supported in Playground)
