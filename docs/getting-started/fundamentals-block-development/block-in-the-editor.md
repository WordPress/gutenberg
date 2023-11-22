# The block in the Editor

The Block Editor is React Single Page Application (SPA)

A block manages two main interfaces
- The "Edit" interface - how the block is displayed and its behaviour in the Block Editor 
- The "Save" interface - how the block is stored in the DB

Every block defined its "edit" interface via a React component when the block is registered in the client

The "edit" React component of a block receives a `props` object (including attributes and setAttributes)

The block wrapper element needs to include props retrieved from useBlockProps in order to receive its classes and atributes
- any custom attributes (like extra classes) should be passed as an argument of `useBlockProps`
- When you add support for any feature, they get added to the object returned by the `useBlockProps` hook.


This "edit" interface can also define custom setting controls for the block in the Editor:  `Block Toolbar` and `Settings Sidebar`

Wordpress offers a lot of built-in components via NPM packages to define the interface of the block in the editor, like `@wordpress/components` or `@wordpress/block-editor`


## Built-in components

Use as much core stuff as possible - Check core UIs before building something custom

The WordPress Gutenberg project uses [Storybook](https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page) to view and work with the UI components developed in WordPress packages, especially 

`@wordpress/components` includes a library of generic WordPress components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.
- `TextControl`
- `PanelBody` & `PanelRow`
- `ToggleControl`
- `ExternalLink`

`@wordpress/block-editor` includes a library of components and hooks for the Block Editor. This module allows you to create and use standalone block editors.
- `RichText`
- `BlockControls`
- `InspectorControls`
- `InnerBlocks`
- `PanelColorSettings`
