# Content Guidelines

Site-level editorial guidelines for WordPress. While Global Styles define how your site _looks_, Content Guidelines define how your site _sounds_.

## Description

This package provides a comprehensive system for managing editorial voice, tone, and content rules at the site level. It's designed to be AI-agnostic, allowing any AI provider to consume the guidelines for content generation and validation.

## Features

-   **Brand Context**: Site description, audience, goals, and topics
-   **Voice & Tone**: Tone traits, point of view, readability level
-   **Copy Rules**: Do's, don'ts, and formatting guidelines
-   **Vocabulary**: Preferred terms, terms to avoid, acronyms, custom dictionary
-   **Heuristics**: Sentence/paragraph length targets, reading level
-   **Images**: Style guidelines, alt text rules, reference images
-   **Block-specific Rules**: Override guidelines for specific block types
-   **Draft/Publish Workflow**: Safe iteration with revision history

## Installation

Install the module:

```bash
npm install @wordpress/content-guidelines
```

## Usage

```js
import { ContentGuidelinesUI } from '@wordpress/content-guidelines';

// Render the full guidelines UI
<ContentGuidelinesUI />
```

### Store

The package registers a data store at `content-guidelines`:

```js
import { useSelect, useDispatch } from '@wordpress/data';

// Get guidelines
const { draft, active } = useSelect( ( select ) => {
    const store = select( 'content-guidelines' );
    return {
        draft: store.getDraft(),
        active: store.getActive(),
    };
} );

// Update draft
const { updateDraft, publishDraft } = useDispatch( 'content-guidelines' );
```

## API

### REST Endpoints

-   `GET /wp/v2/content-guidelines` - Get active and draft guidelines
-   `PUT /wp/v2/content-guidelines/draft` - Save draft
-   `POST /wp/v2/content-guidelines/publish` - Publish draft to active
-   `GET /wp/v2/content-guidelines/packet` - Get AI-ready context packet
-   `GET /wp/v2/content-guidelines/for-post/{id}` - Guidelines for specific post

### Hooks

AI providers can integrate via filters:

```php
// Register as AI provider
add_filter( 'wp_content_guidelines_has_ai_provider', '__return_true' );

// Handle playground tests
add_filter( 'wp_content_guidelines_run_playground_test', function( $result, $request ) {
    // Process with AI and return result
    return array(
        'output' => 'Generated content...',
        'alternatives' => array(),
        'metadata' => array(),
    );
}, 10, 2 );
```

## Contributing

See the [WordPress Gutenberg repository](https://github.com/WordPress/gutenberg) for contribution guidelines.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
