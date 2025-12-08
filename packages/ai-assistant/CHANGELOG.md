# Changelog

## Unreleased

### New Features

- Initial release of AI Assistant experimental package
- Natural language block manipulation through OpenAI integration
- WordPress Abilities API integration for extensible block operations
- REST API endpoints for AI chat and configuration
- Support for all core block types (paragraph, heading, list, etc.)

### Abilities Added

- `ai-assistant/get-blocks` - Retrieve all blocks in the editor
- `ai-assistant/find-blocks-with-text` - Search for blocks containing specific text
- `ai-assistant/replace-text-in-blocks` - Replace text across multiple blocks
- `ai-assistant/insert-block` - Insert new blocks into the editor
- `ai-assistant/update-block` - Update existing block content
- `ai-assistant/delete-block` - Remove blocks from the editor

### Developer Experience

- Full TypeScript support
- Comprehensive API documentation
- Integration with WordPress data stores
- Proper permission handling and security measures