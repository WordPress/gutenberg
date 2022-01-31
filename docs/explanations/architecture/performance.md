# Performance

Performance is a key feature for editor applications and the Block editor is not an exception.

## Metrics

To ensure the block editor stays performant across releases and development, we monitor some key metrics using [performance benchmark job](#the-performance-benchmark-job).

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

## The performance benchmark job

A tool to compare performance accross multiple branches/tags/commits is provided. You can run it locally like so: `./bin/plugin/cli.js perf [branches]`, example:

```
./bin/plugin/cli.js perf trunk v8.1.0 v8.0.0
```

To get the most accurate results, it's is important to use the exact same version of the tests and environment (theme...) when running the tests, the only thing that need to be different between the branches is the Gutenberg plugin version (or branch used to build the plugin).

To achieve that the command first prepares the following folder structure:

    │
    ├── tests/packages/e2e-tests/specs/performance/*
    |   The actual performance tests to run
    │
    ├── tests/test/emptytheme
    |   The theme used for the tests environment. (site editor)
    │
    │── envs/branch1/.wp-env.json
    │   The wp-env config file for branch1 (similar to all other branches except the plugin folder).
    │── envs/branch1/plugin
    │   A built clone of the Gutenberg plugin for branch1 (git checkout branch1)
    │
    └── envs/branchX
        The structure of perf-envs/branch1 is duplicated for all other branches.

Once the directory above is in place, the performance command loop over the performance test suites (post editor and site editor) and does the following:

 1- Start the environment for branch1
 2- Run the performance test for the current suite
 3- Stop the environment for branch1
 4- Repeat the first 3 steps for all other branches
 5- Repeat the previous 4 steps 3 times.
 6- Compute medians for all the performance metrics of the current suite.

Once all the test suites are executed, a summary report is printed.

## Going further

-   [Journey towards a performant editor](https://riad.blog/2020/02/14/a-journey-towards-a-performant-web-editor/)
