# Design Patterns

## Basic Editor Interface

Gutenberg’s general layout relies on a bar at the top, with content below.

![Editor Interface](https://cldup.com/VWA_jMcIRw-3000x3000.png)

The **Toolbar** holds document level actions: Editor mode, save status, global actions for undo/redo/insert, the settings toggle, and publish options.

The **Content Area** holds the document itself.

The **Settings Sidebar** holds additional settings for the document itself (tags, categories, schedule etc.), and also for blocks in the “Block” tab. A cog button in the toolbar can be used to hide the Settings Sidebar, creating a more immersive writing experience. On small screens, the sidebar is hidden by default. 

## The Block Interface

The block itself is the most basic unit of the editor. Generally speaking, everything is a block. Users build posts and pages using blocks, mimicking the vertical flow of the underlying HTML markup. 

By surfacing each section of the document as a manipulatable block, block-specific features can be surfaced contextually. This is inspired by the desktop app conventions, and allows for a breadth of advanced features without weighing down the UI. 

A selected block shows a number of contextual actions:

![Block Interface](https://cldup.com/3tQqIncKPB-3000x3000.png)

The block interface holds basic actions. Gutenberg aims to ensure good, common defaults, so users should be able to get all their creating done without ever having to use the advanced actions in the Settings Sidebar.

Commonly used actions are highlighted in the **Block Toolbar**. The **Block Chip** lives in the block toolbar, and contains high level block controls for the selected block. It primarily allows users to transform a block into another type of compatible block. Some blocks also use the block chip to users to choose from a set of alternate block styles. 

The **Block Formatting** options let users adjust block-level settings, and the **Inline Formatting** options allow for adjustments to elements inside the block. When a block is long, the block toolbar pins itself to the top of the screen as the user scrolls down the page. 

Blocks can be moved up and down via the **Block Mover** icons on the left. Additional Block options are available on the right: **Advanced Settings** like “Edit as HTML” and “Convert to Shared Block,” and the ability to delete the block.

An unselected block does not show the block toolbar or any other contextual controls. In effect, an unselected block is essentially a preview of the content itself:

![Unselected Block](https://cldup.com/DH9HZnEgwH-3000x3000.png)

Please note that selection and focus can be different. For example, an image block can be selected but the focus can be on the caption field, exposing extra (caption-specific) UI.

## Settings Sidebar

![Settings Sidebar](https://cldup.com/iAqrn6Gc8o-3000x3000.png)

The sidebar has two tabs, Document and Block:

- The **Document Tab** shows metadata and settings for the post or page being edited.
- The **Block Tab** shows metadata and settings for the currently selected block.

Each tab consists of sets of editable fields (**Sidebar Sections**) that can be toggled open or closed. 

If a block requires advanced configuration, those settings should live in the Settings sidebar. Editor block settings can also be reached directly by clicking the cog icon next to a block. Don’t put anything in the sidebar block tab that is necessary for the basic operation of your block. Your user might dismiss the sidebar for an immersive writing experience. So pick good defaults, and make important actions available in the block toolbar.

Examples of actions that could go in the block tab of the sidebar could be:

- Drop cap for text
- Number of columns for galleries
- Number of posts, or category, in the “Latest Posts” block
- Any configuration that you don’t need access to in order to perform basic tasks

## Block Library

![Block Library](https://cldup.com/7QoQIoLk-A-3000x3000.png)

The **Block Library** appears when someone inserts a block via the toolbar, or contextually within the content area. Inside, blocks are organized into sections that can be expanded or collapsed. The block library’s search bar auto-filters the list of blocks as the user types. Users can choose a block by selecting the **Block Button** or the **Block Name**. 

**Parent Blocks** (Blocks that contain children blocks) are represented by a layered block button.
