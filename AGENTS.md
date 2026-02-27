# AGENTS.md

## Dev environment tips

```bash
# Setup
npm install && composer install
npm run wp-env status   # Always check status first
npm run wp-env start    # Only start if not already running

# Development
npm start               # Development with watch
npm run build          # Production build
```

### Key Directories

-   `/packages/` - JavaScript packages (each has README.md and CHANGELOG.md)
-   `/lib/` - PHP code
-   `/lib/compat/wordpress-X.Y/` - Version-specific features (new PHP features usually go here)
-   `/phpunit/` - PHP tests
-   `/docs/` - Documentation
    -   `/docs/contributors/` - Contributing guides
    -   `/docs/explanations/architecture/` - System architecture docs
    -   `/docs/how-to-guides/` - Implementation tutorials
    -   `/docs/reference-guides/` - API documentation

## Testing instructions

> **Note**: PHP/E2E tests require wp-env running.

```bash
# JavaScript
npm test                   # All JS tests
npm run test:unit         # Unit tests
npm run test:unit -- --testNamePattern="<TestName>"  # Specific test
npm run test:unit <path_to_test_directory>

# PHP (requires wp-env)
composer test             # All PHP tests
vendor/bin/phpunit <path_to_test_file.php>  # Specific file
vendor/bin/phpunit <path_to_test_directory>/              # Directory

# E2E (requires wp-env)
npm run test:e2e
npm run test:e2e -- <path_to_test_file.spec.js>  # Specific test file
npm run test:e2e -- --headed                   # Run with browser visible

# Code Quality
npm run format            # Fix JS formatting
npm run lint:js          # Check JS linting
vendor/bin/phpcbf        # Fix PHP standards
vendor/bin/phpcs         # Check PHP standards

# Specific files
vendor/bin/phpcbf <path_to_php_file.php>
```

## Architectural decisions

-   **Package layering**: Three editor layers — `block-editor` (generic, WP-agnostic) → `editor` (WordPress post-type-aware) → `edit-post`/`edit-site` (full screens). Lower layers MUST NOT depend on higher ones.
-   **Block data model**: Blocks are in-memory tree structures during editing, serialized as HTML with comment delimiters (`<!-- wp:name -->`). Work with the block tree via APIs, not the serialized HTML.
-   **Data layer**: Uses `@wordpress/data` (Redux-like stores). Edit entities through `core-data` actions (`editEntityRecord` / `saveEditedEntityRecord`), not direct state manipulation.
-   **Styles system**: Three-layer merge — WordPress defaults < `theme.json` < user preferences. Use Block Supports API and CSS custom properties (`--wp--preset--*`), not hardcoded values.
-   **Modularity**: Packages are available both as npm packages and WordPress scripts (`wp-*` handles). Production packages must work in both contexts.

For full architecture details, see `docs/explanations/architecture/`.

## Common pitfalls

-   PHP features in `lib/compat/` MUST target a specific `wordpress-X.Y/` subdirectory.
-   Avoid using private APIs in bundled packages (packages without `wpScript` or `wpModuleExports`). Private APIs are intended for Core usage; bundled packages may also be imported via npm into plugin scripts, causing incompatibilities.
-   `block-editor` is a WordPress-agnostic package. NEVER add `core-data` dependencies or direct REST API calls to it.
-   `@wordpress/build` (`packages/wp-build`) is a generic build tool used both in Gutenberg and by plugins targeting WordPress Core directly. Avoid Gutenberg-specific changes in it.

## PR instructions

-   Ensure build passes
-   Fix all formatting/linting issues; these are enforced through CI in PRs
