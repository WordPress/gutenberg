---
sidebar_position: 1
---

# Compose the UI

## Building blocks

The interface of the block editor is composed of several UI elements:

 - The block list is the main area where you can interact and edit the blocks.
 - The block toolbar: When a block is selected, the main tools to manipulate the blocks are rendered in a block toolbar. This toolbar can be rendered adjacent to the block or separate depending on the design you want to achieve for your block editor.
 - The block inspector: Generally shown as a sidebar or a modal, the inspector shows advanced tools to manipulate the selected block.
 - Block inserter: Can be used to select blocks to insert to your block editor.

The Gutenberg platform allows you to render these pieces separately and lay them out as you wish to achieve the desired design for your interface.

## The Block Toolbar

The block toolbar is rendered automatically next to the selected block by default. But if you set the flag `hasFixedToolbar` to true in your `BlockEditorProvider` settings, you will be able to use the `BlockToolbar` component to render the block toolbar in your place of choice.

## The Block Inspector

You can use the `BlockInspector` to render what is called the block inspector. It's a set of tools that are specific to the selected block.
While the block toolbar contains what are considered to be the "main tools" to manipulate each block, the block inspector is meant to render advanced tools and customization options. It is generally rendered as a sidebar or a modal.

## The Block Inserter

By default the block editor renders a block inserter at the end of the canvas if there's no block selected. It also renders an inserter if you hover over the area between two consecutive blocks. That said, you can also decide to render a permanent inserter, for instance in a header of your editor. You can do so by using the `Inserter` component.
