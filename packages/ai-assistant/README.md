# AI Assistant

Experimental AI-powered assistant for the WordPress block editor, providing natural language block manipulation through the WordPress Abilities API.

## Features

- **Natural Language Commands**: Interact with blocks using conversational AI
- **Block Manipulation**: Find, replace, insert, update, and delete blocks through AI commands
- **Abilities API Integration**: Built on WordPress's new Abilities API for extensible functionality
- **OpenAI Integration**: Powered by GPT-4o-mini for intelligent block editor assistance
- **Security**: Proper permission checks and WordPress REST API integration

## Installation

This package is experimental and included with the Gutenberg plugin. It requires:
- WordPress 6.9+
- Gutenberg plugin
- OpenAI API key (configured via WordPress admin)

## Usage

The AI Assistant automatically registers block manipulation abilities when the WordPress block editor is loaded:

- **Get All Blocks**: Retrieve information about all blocks in the editor
- **Find Blocks with Text**: Search for blocks containing specific text
- **Replace Text in Blocks**: Replace text across multiple blocks
- **Insert Block**: Add new blocks to the editor
- **Update Block**: Modify existing block content
- **Delete Block**: Remove blocks from the editor

### Example Commands

Users can interact with the AI using natural language:

- "Replace 'Hello World' with 'Welcome to WordPress'"
- "Insert a heading that says 'Getting Started'"
- "Find all blocks containing 'contact'"
- "Delete the paragraph with ID abc123"

## API Reference

### Abilities Registration

```javascript
import { registerBlockAbilities } from '@wordpress/ai-assistant';

// Register all block manipulation abilities
registerBlockAbilities();
```

### REST API Endpoints

- `POST /wp-json/ai-assistant/v1/chat` - Send messages to AI assistant
- `GET /wp-json/ai-assistant/v1/config` - Get AI configuration
- `POST /wp-json/ai-assistant/v1/config` - Save AI configuration

## Configuration

The AI Assistant requires an OpenAI API key to function. Configure through:

1. WordPress Admin → Settings → AI Assistant
2. Enter your OpenAI API key
3. Select preferred AI model (defaults to gpt-4o-mini)

## Development

This package is part of the Gutenberg monorepo and follows WordPress coding standards.

### Building

The package is built automatically as part of the Gutenberg build process.

### Testing

Run tests using the standard Gutenberg test commands:

```bash
npm run test:unit packages/ai-assistant
```

## Security

- All API requests require `edit_posts` capability
- Configuration requires `manage_options` capability
- Input sanitization on all REST endpoints
- OpenAI API calls are server-side only

## Contributing

This is an experimental package. Contributions are welcome! Please follow the [Gutenberg contribution guidelines](https://github.com/WordPress/gutenberg/blob/HEAD/CONTRIBUTING.md).

## License

GPL-2.0-or-later

---

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>