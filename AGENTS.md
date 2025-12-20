# AGENTS.md

## Dev environment tips

```bash
# Setup
pnpm install && composer install
pnpm run wp-env status   # Always check status first
pnpm run wp-env start    # Only start if not already running

# Development
pnpm start               # Development with watch
pnpm run build          # Production build
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
pnpm test                   # All JS tests
pnpm run test:unit         # Unit tests
pnpm run test:unit -- --testNamePattern="<TestName>"  # Specific test
pnpm run test:unit <path_to_test_directory>

# PHP (requires wp-env)
composer test             # All PHP tests
vendor/bin/phpunit <path_to_test_file.php>  # Specific file
vendor/bin/phpunit <path_to_test_directory>/              # Directory

# E2E (requires wp-env)
pnpm run test:e2e
pnpm run test:e2e -- <path_to_test_file.spec.js>  # Specific test file
pnpm run test:e2e -- --headed                   # Run with browser visible

# Code Quality
pnpm run format            # Fix JS formatting
pnpm run lint:js          # Check JS linting
vendor/bin/phpcbf        # Fix PHP standards
vendor/bin/phpcs         # Check PHP standards

# Specific files
vendor/bin/phpcbf <path_to_php_file.php>
```

## PR instructions

-   Ensure build passes
-   Fix all formatting/linting issues; these are enforced through CI in PRs
