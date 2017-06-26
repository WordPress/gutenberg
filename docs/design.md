Gutenberg Design
================

This living document serves to describe some of the design principles and patterns that have served to form the editor interface.

## Goal

The all-encompassing goal of Gutenberg is to create a post and page building experience that makes it easy to create _rich post layouts_. From the <a href="https://make.wordpress.org/core/2017/01/04/focus-tech-and-design-leads/">kickoff post<a/>:

> The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.
Key take-aways from parsing that paragraph:

We can extract from this the following:

- Authoring rich posts is a key strength of WordPress.
- The block concept aims to unify multiple different interfaces under a single umbrella. You shouldn't have to write shortcodes, custom HTML or paste URLs to embed. You should only have to learn how the block works, and then know how to do everything.
- "Mystery meat" refers to hidden features in software, that you have to discover. WordPress already supports a large mount of blocks and 30+ embeds, so let's surface them.

## Interface Elements

### Blueprints

Basic interface elements:

![Basic Interface](https://cldup.com/pRTYpCt4os.png)

Block interface:

![Block Selected](https://cldup.com/QC1lqNlVWP.png)

Extended settings:

![Extended Settings](https://cldup.com/77Ziaj6aSx.png)

### Basic Interface

Gutenberg has a very basic separation between an editor bar at the top, and content below.

The editor bar holds document level actions, like editor mode, save status, global actions for undo/redo/insert, and toggles for the sidebar(s), and finally publish options.

The content area holds the document itself, an optionally a sidebar for contextual information. For now this is a single toggle-able sidebar holding document metadata, but one could imagine other toggled sidebars such as revisions or other metadata specific content.

### Block interface & Sidebar / Inspector

The block itself is the most basic unit of the editor. Everything is a block, and you build them together mimicking the vertical flow of the underlying HTML markup. By surfacing each section of the document as a block we can manipulate, we can attach features that are unique to each block, contextually. Inspired by desktop layout apps, it's a way to add a breadth of advanced features without weighing down the UI.

As you scroll down a page on long blocks, the top toolbar unsticks from the block, and sticks to the top of the screen.

The block interface holds _basic actions_. Through ensuring good defaults, and only the most common actions, you should be able to get all your blogging done without ever having to use the Post Settings sidebar.

If you need to do advanced configuration, though, you should keep the post settings sidebar open. The sidebar is contextual to what is selected:

- if nothing is selected, you are at the _document scope_, and see document metadata
- if a block is selected, you are at the _block scope_, and you see block metadata

Examples of advanced UI could be:

- drop cap for text
- number of columns for galleries
- number of posts, or category, in the "Latest Posts" block
- any configuration that you don't _need_ access to in order to perform basic tasks

### Key Values

**All blocks are created equal**, and they all live in the same inserter interface. We use recency, search, tabs, and grouping, to ensure the blocks you use the most are easily within reach.

**Drag and drop is additive**. Only when explicit actions (click, or tab & space) exist, can we add drag and drop as an additive enhancement on top of it.

**Placeholders are key**. If your block can have a neutral placeholder state, it should. An image placeholder block shows a button to open the media library, a text placeholder block shows a writing prompt. By embracing placeholders we can predefine editable layouts, so all you have to do is _fill out the blanks_.
