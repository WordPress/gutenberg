# Block API Reference

Blocks are the fundamental element of the editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

## Registering a block

All blocks must be registered before they can be used in the editor. You can learn about block registration, and the available options, in the [block registration](../../../../docs/designers-developers/developers/block-api/block-registration.md) documentation.

## Block `edit` and `save`

The `edit` and `save` functions define the editor interface with which a user would interact, and the markup to be serialized back when a post is saved. They are the heart of how a block operates, so they are [covered separately](../../../../docs/designers-developers/developers/block-api/block-edit-save.md).
