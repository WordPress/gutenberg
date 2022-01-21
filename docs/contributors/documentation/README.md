# Documentation Contributions

A guide on how to get started contributing documentation to the Gutenberg project.

## Discussions

The [Make WordPress Docs blog](https://make.wordpress.org/docs/) is the primary spot for the latest information around WordPress documentation: including announcements, product goals, meeting notes, meeting agendas, and more.

Real-time discussions for documentation take place in the `#docs` channel in [Make WordPress Slack](https://make.wordpress.org/chat) (registration required). Weekly meetings for the Documentation team are on Tuesdays at 14:00UTC.

The Gutenberg project uses GitHub for managing code and tracking issues. The main repository is at: [https://github.com/WordPress/gutenberg](https://github.com/WordPress/gutenberg). To find documentation issues to work on, browse [issues with documentation label](https://github.com/WordPress/gutenberg/issues?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3A%22%5BType%5D+Documentation%22+).

## Documentation types

There are two major sets of documentation for the Gutenberg project:

1. [User documentation](https://wordpress.org/support/article/wordpress-editor/) is information on how to use the Editor as an author publishing posts. For contributing to user docs, follow the docs blog, or ask in the #docs Slack channel, to understand the current priorities.
2. [Block editor handbook](https://developer.wordpress.org/block-editor/) is everything related to the Gutenberg project including: developing, extending, and—what you are reading right now—contributing specific to Gutenberg.

The rest of this document covers contributing to the block editor handbook.

## Block editor handbook process

The block editor handbook is a mix of markdown files in the `/docs/` directory of the [Gutenberg project repository](https://github.com/WordPress/gutenberg/) and generated documentation from the packages.

An automated job publishes the docs every 15 minutes to the [block editor handbook site](https://developer.wordpress.org/block-editor/).

See [the Git Workflow](/docs/contributors/code/git-workflow.md) documentation for how to use git to deploy changes using pull requests. Additionally, see the [video walk-through](https://wordpress.tv/2020/09/02/marcus-kazmierczak-contribute-developer-documentation-to-gutenberg/) and the accompanying [slides for contributing documentation to Gutenberg](https://mkaz.blog/wordpress/contribute-documentation-to-gutenberg/).

### Handbook structure

The handbook is organized into four sections based on the functional types of documents. [The Documentation System](https://documentation.divio.com/) does a great job explaining the needs and functions of each type, but in short they are:

-   **Getting started tutorials** - full lessons that take learners step by step to complete an objective, for example the [create a block tutorial](/docs/getting-started/create-block/README.md).
-   **How to guides** - short lessons specific to completing a small specific task, for example [how to add a button to the block toolbar](/docshow-to-guides/format-api/README.md).
-   **Reference guides** - API documentation, purely functional descriptions,
-   **Explanations** - longer documentation focused on learning, not a specific task.

### Templates

A [how to guide template](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/contributors/documentation/how-to-guide-template.md) is available to provide a common structure to guides. If starting a new how to guide, copy the markdown from the template to get started.

The template is based on examples from The Good Docs Project, see their [template repository for additional examples](https://github.com/thegooddocsproject/templates) to help you create quality documentation.

### Update a document

To update an existing page:

1. Check out the gutenberg repository.
2. Create a branch to work, for example `docs/update-contrib-guide`.
3. Make the necessary changes to the existing document.
4. Commit your changes.
5. Create a pull request using "\[Type\] Documentation" label.

### Create a new document

To add a new document requires a working JavaScript development environment to build the documentation, see the [JavaScript build setup documentation](/docs/how-to-guides/javascript/js-build-setup.md):

1. Create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/HEAD/docs) folder, use lower-case, no spaces, if needed a dash separator, and `.md` extension.
2. Add content, all documents require one and only H1 tag, using markdown notation.
3. Add document entry to the [toc.json](https://github.com/WordPress/gutenberg/blob/HEAD/docs/toc.json) hierarchy, see existing entries for format.
4. Run `pnpm docs:build` to update `manifest.json`.
5. Commit `manifest.json` with other files updated.

If you forget to run, `pnpm docs:build` your PR will fail the static analysis check, since the `manifest.json` file is an uncommitted local change that must be committed.

### Using links

It's likely at some point you'll want to link to other internal documentation pages. It's worth emphasizing all documents can be browsed in different contexts:

-   Block editor handbook
-   GitHub website
-   npm website

To create links that work in all contexts, you must use absolute path links without the `https://github.com/WordPress/gutenberg` prefix. You can reference files using the following patterns:

-   `/docs/*.md`
-   `/packages/*/README.md`
-   `/packages/components/src/**/README.md`

This way they will be properly handled in all three aforementioned contexts.

Use the full directory and filename from the Gutenberg repository, not the published path; the Block Editor Handbook creates short URLs—you can see this in the tutorials section. Likewise, the `readme.md` portion is dropped in the handbook, but should be included in links.

An example, the link to this page is: `/docs/contributors/documentation/README.md`

### Code examples

The code example in markdown should be wrapped in three tick marks \`\`\` and should additionally include a language specifier. See this [GitHub documentation around fenced code blocks](https://help.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks).

A unique feature to the Gutenberg documentation is the `codetabs` toggle, this allows two versions of code to be shown at once. This is used for showing both `JSX` and `Plain` code samples. For example, [on this block tutorial page](/docs/how-to-guides/block-tutorial/block-controls-toolbar-and-sidebar.md).

Here is an example `codetabs` section:

````md
    \{\% codetabs \%\}
    \{\% JSX \%\}
    ```js
    // JSX code here
    ```
    \{\% Plain \%\}
    ```js
    // Plain code here
    ```
    \{\% end \%\}
````

The preferred format for code examples is JSX, this should be the default view. The example placed first in source will be shown as the default.

**Note:** It is not required to include plain JavaScript code examples for every guide. The recommendation is to include plain code for beginner tutorials or short examples, but the majority of code in Gutenberg packages and across the larger React and JavaScript ecosystem are in JSX that requires a build process.

### Callout notices

The Block Editor handbook supports the same [notice styles as other WordPress handbooks](https://make.wordpress.org/docs/handbook/documentation-team-handbook/handbooks-style-and-formatting-guide/#formatting). However, the shortcode implementation is not ideal with the different locations the block editor handbook documentation is published (npm, GitHub).

The recommended way to implement in markdown is to use the raw HTML and `callout callout-LEVEL` classes. For example:

```html
<div class="callout callout-info">This is an **info** callout.</div>
```

The following classes are available: `info`, `tip`, `alert`, `warning`

<div class="callout callout-tip">
This is a **tip** callout.
</div>

<div class="callout callout-info">
This is an **info** callout.
</div>

<div class="callout callout-alert">
This is an **alert** callout.
</div>

<div class="callout callout-warning">
This is a **warning** callout.
</div>

### Editor config

You should configure your editor to use Prettier to auto-format markdown documents. See the [Getting Started documentation](/docs/contributors/code/getting-started-with-code-contribution.md) for complete details.

An example config for using Visual Studio Code and the Prettier extensions:

```json
"[[markdown]]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
},
```

 <div class="callout callout-info">
 Note: depending on where you are viewing this document, the brackets may show as double, the proper format is just a single bracket.
</div>

## Resources

-   [Copy Guidelines](/docs/contributors/documentation/copy-guide.md) for writing instructions, documentations, or other contributions to Gutenberg project.

-   [Tone and Voice Guide](https://make.wordpress.org/docs/handbook/documentation-team-handbook/tone-and-voice-guide/) from WordPress Documentation.
