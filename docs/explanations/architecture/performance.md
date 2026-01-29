# Performance

Performance is a key feature for editor applications and the Block editor is not an exception.

## Metrics

To ensure the block editor stays performant across releases and development, we monitor some key metrics using [performance benchmark job](#the-performance-benchmark-job).

Some of the main important metrics are:

- **Loading Time:** The time it takes to load an editor page. This includes time the server takes to respond, times to first paint, first contentful paint, DOM content load complete, load complete and first block render (both in post and site).
- **Typing Time:** The time it takes for the browser to respond while typing on the editor.
- **Block Selection Time:** The time it takes for the browser to respond after a user selects block. (Inserting a block is also equivalent to selecting a block. Monitoring the selection is sufficient to cover both metrics).

## Key performance decisions and solutions

**Data Module Async Mode**

The Data Module of the WordPress Packages and the Block Editor is based on Redux. It means the state is kept globally and whenever a change happens, the components (UI) relying on that state may update.

As the number of rendered components grows (for example on long posts), the performance suffers because of the global state acting as an event dispatcher to all components. This is a common pitfall in Redux applications and the issue is solved on Gutenberg using the Data Modules Async Mode.

The Async mode is the idea that you can decide whether to refresh/rerender a part of the React component tree synchronously or asynchronously.

Rendering asynchronously in this context means that if a change is triggered in the global state, the subscribers (components) are not called synchronously, instead, we wait for the browser to be idle and perform the updates to React Tree.

Based on the idea that **when editing a given block, it is very rare that an update to that block affects other parts of the content**, the block editor canvas only renders the selected block is synchronous mode, all the remaining blocks are rendered asynchronously. This ensures that the editor stays responsive as the post grows.

## The performance benchmark job

A tool to compare performance across multiple branches/tags/commits is provided. You can run it locally like so: `./bin/plugin/cli.js perf [branches]`, example:

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

1. Start the environment for `branch1`
2. Run the performance test for the current suite
3. Stop the environment for `branch1`
4. Repeat the first 3 steps for all other branches
5. Compute medians for all the performance metrics of the current suite.

Once all the test suites are executed, a summary report is printed.

## Tracking performance using CodeVitals.

The performance results for each commit are pushed to codevitals and can be seen on the [Gutenberg dashboard there](https://www.codevitals.run/project/gutenberg). The graphs allow us to track the evolution of a given metric over time.

It's thus very important to ensure that the metric being computed is stable. Meaning, if you run the same test twice with the same code and environment, you'll get results that are close.

Our performance job runs GitHub CI which means that we can't trust the consistency of the numbers that we get between two similar job runs. GitHub CI may allocate different CPU and memory resources for us over time for instance. To alleviate this problem, each time we run the performance job on the trunk branch, we compare the current commit's performance to a fixed reference commit hash, which allows us to track the relative difference between the current commit and the reference commit consistently regardless of environment changes.

### Update the reference commit

Gutenberg supports only two WP versions, this impacts the performance job in two ways:

 - The base WP version used to run the performance job needs to be updated, when the minimum version supported by Gutenberg changes. In order to do that, we rely on the `Tested up to` flag of the plugin's `readme.txt` file. So each time that flag is changed, the version used for the performance job is changed as well.

 - Updating the WP version used for performance jobs means that there's a high chance that the reference commit used for performance test stability becomes incompatible with the WP version that is used. So every time, the `Tested up to` flag is updated in the `readme.txt` is changed, we also have to update the reference commit that is used in `.github/workflows/performance.yml`.

The new reference commit hash that is chosen needs to meet the following requirements:

 - Be compatible with the new WP version used in the "Tested up to" flag.
 - Is already tracked on "codevitals.run" for all existing metrics.

When releasing a plugin update with changes to the minimum WordPress version requirements, the end-to-end test GitHub Action workflow in Core SVN will need to be updated for any branch losing support. Otherwise the first run of that workflow on that branch following the release will fail.

The version of the plugin used in the workflow can be pinned by adding the `gutenberg-version` input to the test matrix. [Core-59221](https://core.trac.wordpress.org/changeset/59221) is an example of this change for the 6.4 branch.

**Note:** Always use the final release including bug fixes (ie. `x.y.2` or `x.y.3`). If the final release is not yet known, create a [Trac ticket](https://core.trac.wordpress.org/ticket/62488) so it's not forgotten.

**A simple way to choose commit is to pick a very recent commit on trunk with a passing performance job.**

## Going further

-   [Journey towards a performant editor](https://riad.blog/2020/02/14/a-journey-towards-a-performant-web-editor/)
