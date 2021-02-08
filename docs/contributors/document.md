# Documentation Contributions

A guide on how to get started contributing documentation to the Gutenberg project.

## Discussions

The [Make WordPress Docs blog](https://make.wordpress.org/docs/) is the primary spot for the latest information around WordPress documentation: including announcements, product goals, meeting notes, meeting agendas, and more.

Real-time discussions for documentation take place in the `#docs` channel in [Make WordPress Slack](https://make.wordpress.org/chat) (registration required). Weekly meetings for the Documentation team are on Mondays at 14:00UTC.

The Gutenberg project uses GitHub for managing code and tracking issues. The main repository is at: [https://github.com/WordPress/gutenberg](https://github.com/WordPress/gutenberg). To find documentation issues to work on, browse [issues with documentation label](https://github.com/WordPress/gutenberg/issues?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3A%22%5BType%5D+Documentation%22+).

## Documentation Types

There are two major sets of documentation for the Gutenberg project:

1. [User documentation](https://wordpress.org/support/article/wordpress-editor/) is information on how to use the Editor as an author publishing posts. For contributing to user docs, follow the docs blog, or ask in the #docs Slack channel, to understand the current priorities.
2. [Block Editor Handbook](https://developer.wordpress.org/block-editor/) is everything related to the Gutenberg project including: developing, extending, and—what you are reading right now—contributing specific to Gutenberg.

The rest of this document covers contributing to the Block Editor Handbook.

## Block Editor Handbook Process

The Block Editor Handbook is a mix of markdown files in the `/docs/` directory of the [Gutenberg project repository](https://github.com/WordPress/gutenberg/) and generated documentation from the packages.

An automated job publishes the docs every 15 minutes to the [Block Editor Handbook site](https://developer.wordpress.org/block-editor/).

See [the Git Workflow](/docs/contributors/git-workflow.md) documentation for how to use git to deploy changes using pull requests. Additionally, see the [video walk-through](https://wordpress.tv/2020/09/02/marcus-kazmierczak-contribute-developer-documentation-to-gutenberg/) and the accompanying [slides for contributing documentation to Gutenberg](https://mkaz.blog/wordpress/contribute-documentation-to-gutenberg/).

### Update a Document

To update an existing page:

1. Check out the gutenberg repository.
2. Create a branch to work, for example `docs/update-contrib-guide`.
3. Make the necessary changes to the existing document.
4. Commit your changes.
5. Create a pull request using "\[Type\] Documentation" label.

### Create a New Document

To add a new documentation page requires a working JavaScript development environment to build the documentation, see the [JavaScript build setup documentation](/docs/designers-developers/developers/tutorials/javascript/js-build-setup.md):

1. Create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/HEAD/docs) folder, use lower-case, no spaces, if needed a dash separator, and .md extension.
2. Add content, all documents require one and only H1 tag, using markdown notation.
3. Add item to the [toc.json](https://github.com/WordPress/gutenberg/blob/HEAD/docs/toc.json) hierarchy, see existing entries for format.
4. Run `npm run docs:build` to update `manifest.json`.
5. Commit `manifest.json` with other files updated.

If you forget to run, `npm run docs:build` your PR will fail the static analysis check, since the `manifest.json` file is an uncommitted local change that must be committed.

### Using Links

It's likely at some point you'll want to link to other internal documentation pages. It's worth emphasizing all documents can be browsed in different contexts:

-   Block Editor Handbook
-   GitHub website
-   npm website

To create links that work in all contexts, you must use absolute path links without the `https://github.com/WordPress/gutenberg` prefix. You can reference files using the following patterns:

-   `/docs/*.md`
-   `/packages/*/README.md`
-   `/packages/components/src/**/README.md`

This way they will be properly handled in all three aforementioned contexts.

Use the full directory and filename from the Gutenberg repository, not the published path; the Block Editor Handbook creates short URLs—you can see this in the tutorials section. Likewise, the `readme.md` portion is dropped in the handbook, but should be included in links.

An example, the link to this page is: `/docs/contributors/document.md`

### Code Examples

The code example in markdown should be wrapped in three tick marks \`\`\` and should additionally include a language specifier. See this [GitHub documentation around fenced code blocks](https://help.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks).

A unique feature to the Gutenberg documentation is the `codetabs` toggle, this allows two versions of code to be shown at once. This is used for showing both `ESNext` and `ES5` code samples. For example, [on this block tutorial page](/docs/designers-developers/developers/tutorials/block-tutorial/block-controls-toolbar-and-sidebar.md).

Here is an example `codetabs` section:

````md
    {% codetabs %}
    {% ESNext %}
    ```js
    	// ESNext code here
    ```
    {% ES5 %}
    ```js
    	// ES5 code here
    ```
    {% end %}
````

The preferred format for code examples is ESNext, this should be the default view. The example placed first in source will be shown as the default.

**Note:** it is not required to include ES5 code examples. The guidance is to include `ES5` code for beginner tutorials, but the majority of code in Gutenberg packages and across the larger React and JavaScript ecosystem is in ESNext.

### Editor Config

You should configure your editor to use Prettier to auto-format markdown documents. See the [Getting Started documentation](/docs/contributors/develop/getting-started.md) for complete details.

An example config for using Visual Studio Code and the Prettier extensions:

```json
"\[markdown\]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
},
```

## Resources

-   [Copy Guidelines](/docs/contributors/copy-guide.md) for writing instructions, documentations, or other contributions to Gutenberg project.

-   [Tone and Voice Guide](https://make.wordpress.org/docs/handbook/documentation-team-handbook/tone-and-voice-guide/) from WordPress Documentation.
