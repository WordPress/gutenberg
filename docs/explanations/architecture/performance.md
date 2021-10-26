# Performance

Performance is a key feature for editor applications and the Block editor is not an exception.

## Metrics

To ensure the block editor stays performant across releases and development, we monitor some key metrics using [performance testing](/docs/contributors/code/testing-overview.md#performance-testing).

**Loading Time:** The time it takes to load an editor page. This includes time the server takes to respond, times to first paint, first contentful paint, DOM content load complete, load complete and first block render.
**Typing Time:** The time it takes for the browser to respond while typing on the editor.
**Block Selection Time:** The time it takes for the browser to respond after a user selects block. (Inserting a block is also equivalent to selecting a block. Monitoring the selection is sufficient to cover both metrics).

## Key Performance Decisions and Solutions

**Data Module Async Mode**

The Data Module of the WordPress Packages and the Block Editor is based on Redux. It means the state is kept globally and whenever a change happens, the components (UI) relying on that state may update.

As the number of rendered components grows (for example on long posts), the performance suffers because of the global state acting as an event dispatcher to all components. This is a common pitfall in Redux applications and the issue is solved on Gutenberg using the Data Modules Async Mode.

The Async mode is the idea that you can decide whether to refresh/rerender a part of the React component tree synchronously or asynchronously.

Rendering asynchronously in this context means that if a change is triggered in the global state, the subscribers (components) are not called synchronously, instead, we wait for the browser to be idle and perform the updates to React Tree.

Based on the idea that **when editing a given block, it is very rare that an update to that block affects other parts of the content**, the block editor canvas only renders the selected block is synchronous mode, all the remaining blocks are rendered asynchronously. This ensures that the editor stays responsive as the post grows.

## Going further

-   [Journey towards a performant editor](https://riad.blog/2020/02/14/a-journey-towards-a-performant-web-editor/)
