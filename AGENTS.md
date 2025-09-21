# AGENTS.md

## Dev environment tips

```bash
# Setup
npm install && composer install
npm run wp-env status   # Check if wp-env running
npm run wp-env start    # Start WordPress environment

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
npm run test:unit -- --testNamePattern="Button"  # Specific test
npm run test:unit packages/components/src/button/test/

# PHP (requires wp-env)
composer test             # All PHP tests
vendor/bin/phpunit phpunit/class-wp-theme-json-test.php  # Specific file
vendor/bin/phpunit phpunit/block-supports/              # Directory

# E2E (requires wp-env)
npm run test:e2e

# Code Quality
npm run format            # Fix JS formatting
npm run lint:js          # Check JS linting
vendor/bin/phpcbf        # Fix PHP standards
vendor/bin/phpcs         # Check PHP standards

# Specific files
vendor/bin/phpcbf lib/compat/wordpress-6.9/file.php
```

## PR instructions

-   Ensure build passes
-   Fix all formatting/linting issues; these are enforced through CI in PRs
