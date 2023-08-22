---
sidebar_position: 1
---

# Compose the UI

## Building blocks

The interface of the block editor is composed of several UI elements:

 - The block list is the main area where you can interact and edit the blocks.
 - The block toolbar: when a block is selected, the main tools to manipulate the blocks are rendered in a block toolbar. This toolbar can be rendered adjacent to the block or separate depending on the design you want to achieve for your block editor.
 - The block inspector: Generally shown as a sidebar or a modal, the inspector shows advanced tools to manipuate the selected block.
 - Block inserter: Can be used to select blocks to insert to your block editor.

The Gutenberg platform allows you to render these pieces separately and lay them out as you wish to achieve the desired design for your interface.

## The Block Toolbar

Wrapping your `BlockList` component within the `BlockTools` wrapper allows the editor to render a block toolbar adjacent to the selected block.

## The Block Inspector

Render `BlockInspector`.

## The Block Inserter

`Inserter`