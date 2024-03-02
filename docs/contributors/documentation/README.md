# Documentation Contributions

A guide on how to get started contributing documentation to the Gutenberg project.

## Discussions

The [Make WordPress Docs blog](https://make.wordpress.org/docs/) is the primary spot for the latest information around WordPress documentation, including announcements, product goals, meeting notes, meeting agendas, and more.

Real-time discussions for documentation take place in the `#docs` channel in [Make WordPress Slack](https://make.wordpress.org/chat) (registration required). Weekly meetings for the Documentation team are on Tuesdays at 14:00UTC.

The Gutenberg project uses GitHub for managing code and tracking issues. The main repository is at: [https://github.com/WordPress/gutenberg](https://github.com/WordPress/gutenberg). To find documentation issues to work on, browse [issues with documentation label](https://github.com/WordPress/gutenberg/issues?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3A%22%5BType%5D+Documentation%22+).

## Documentation types

There are two major sets of documentation for the Gutenberg project:

1. [User documentation](https://wordpress.org/documentation/article/wordpress-block-editor/) is information on how to use the Editor as an author publishing posts. For contributing to user docs, follow the docs blog or ask in the #docs Slack channel to understand the current priorities.
2. [Block editor handbook](https://developer.wordpress.org/block-editor/) is everything related to the Gutenberg project including: developing, extending, and—what you are reading right now—contributing specific to Gutenberg.

The rest of this document covers contributing to the block editor handbook.

## Block editor handbook process

The block editor handbook is a mix of markdown files in the `/docs/` directory of the [Gutenberg project repository](https://github.com/WordPress/gutenberg/) and generated documentation from the packages.

An automated job publishes the docs every 15 minutes to the [block editor handbook site](https://developer.wordpress.org/block-editor/).

See [the Git Workflow](/docs/contributors/code/git-workflow.md) documentation for how to use git to deploy changes using pull requests. Additionally, see the [video walk-through](https://wordpress.tv/2020/09/02/marcus-kazmierczak-contribute-developer-documentation-to-gutenberg/) and the accompanying [slides for contributing documentation to Gutenberg](https://mkaz.blog/wordpress/contribute-developer-documentation-to-gutenberg/).

### Handbook structure

The handbook is organized into four sections based on the functional types of documents. [The Documentation System](https://documentation.divio.com/) does a great job explaining the needs and functions of each type, but in short, they are:

-   **Getting started tutorials** - full lessons that take learners step by step to complete an objective, for example the [create a block tutorial](/docs/getting-started/devenv/get-started-with-create-block.md).
-   **How-to guides** - short lessons specific to completing a small specific task, for example [how to add a button to the block toolbar](/docs/how-to-guides/format-api.md).
-   **Reference guides** - API documentation, purely functional descriptions,
-   **Explanations** - longer documentation focused on learning, not a specific task.

### Templates

A [how-to guide template](https://raw.githubusercontent.com/WordPress/gutenberg/trunk/docs/contributors/documentation/how-to-guide-template.md) is available to provide a common structure to guides. If starting a new how-to guide, copy the markdown from the template to get started.

The template is based on examples from The Good Docs Project. See their [template repository](https://github.com/thegooddocsproject/templates) for additional examples to help you create quality documentation.

### Update a document

To update an existing page:

1. Check out the Gutenberg repository.
2. Create a branch to work, for example `docs/update-contrib-guide`.
3. Make the necessary changes to the existing document.
4. Commit your changes.
5. Create a pull request using the [\[Type\] Developer Documentation](https://github.com/WordPress/gutenberg/labels/%5BType%5D%20Developer%20Documentation) label.

### Create a new document

To add a new document requires a working JavaScript development environment to build the documentation, see the [JavaScript build setup documentation](/docs/how-to-guides/javascript/js-build-setup.md):

1. Create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/HEAD/docs) folder, use lower-case, no spaces, if needed a dash separator, and `.md` extension.
2. Add content using markdown notation. All documents require one and only `h1` tag.
3. Add document entry to the [toc.json](https://github.com/WordPress/gutenberg/blob/HEAD/docs/toc.json) hierarchy. See existing entries for format.
4. Run `npm run docs:build` to update `manifest.json`.
5. Commit `manifest.json` with other files updated.

If you forget to run, `npm run docs:build` your PR will fail the static analysis check since the `manifest.json` file is an uncommitted local change that must be committed.

### Documenting packages

Package documentation is generated automatically by the documentation tool by pulling the contents of the README.md file located in the root of the package. Sometimes, however, it is preferable to split the contents of the README into smaller, easier-to-read portions.

This can be accomplished by creating a `docs` directory in the package and adding `toc.json` file that contains references other markdown files also contained in the `docs` directory. The `toc.json` file should contain an array of pages to be added as sub-pages of the main README file. The formatting follows the [`manifest.json`](https://github.com/WordPress/gutenberg/blob/HEAD/docs/manifest.json) file that is generated automatically.

In order for these pages to be nested under the main package name, be sure to set the `parent` property correctly. See the example below that adds child pages to the [`@wordpress/create-block` section](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/).

```json
[
	{
		"title": "@wordpress/create-block External Template",
		"slug": "packages-create-block-external-template",
		"markdown_source": "../packages/create-block/docs/external-template.md",
		"parent": "packages-create-block"
	}
]
```

### Using links

It's likely at some point, you'll want to link to other internal documentation pages. It's worth emphasizing all documents can be browsed in different contexts:

-   Block editor handbook
-   GitHub website
-   npm website

To create links that work in all contexts, you must use absolute path links without the `https://github.com/WordPress/gutenberg` prefix. You can reference files using the following patterns:

-   `/docs/*.md`
-   `/packages/*/README.md`
-   `/packages/components/src/**/README.md`

This way, they will be properly handled in all three aforementioned contexts.

Use the full directory and filename from the Gutenberg repository, not the published path; the Block Editor Handbook creates short URLs—you can see this in the tutorials section. Likewise, the `readme.md` portion is dropped in the handbook but should be included in the links.

An example, the link to this page is: `/docs/contributors/documentation/README.md`

<div class="callout callout-warning">
<b>Note:</b> The usual link transformation is not applied to links in callouts. See below. 
</div>

### Code examples

The code example in markdown should be wrapped in three tick marks \`\`\` and should additionally include a language specifier. See this [GitHub documentation around fenced code blocks](https://help.github.com/en/github/writing-on-github/creating-and-highlighting-code-blocks).

A unique feature to the Gutenberg documentation is the `codetabs` toggle, this allows two versions of code to be shown at once. This is used for showing both `JSX` and `Plain` code samples.

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

The preferred format for code examples is JSX. This should be the default view. The example placed first in source will be shown as the default.

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

<div class="callout callout-warning">
Note: In callout notices, links also need to be HTML `&lt;a href>&lt;/a>` notations. 
The usual link transformation is not applied to links in callouts.
For instance, to reach the Getting started > Create Block page, the URL in GitHub is
https://developer.wordpress.org/docs/getting-started/devenv/get-started-with-create-block.md
and will have to be hardcoded for the endpoint in the Block Editor Handbook as 
<a href="https://developer.wordpress.org/block-editor/getting-started/create-block/">https://developer.wordpress.org/block-editor/getting-started/create-block/</a> to link correctly in the handbook. 
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
Depending on where you are viewing this document, the brackets may show as double. The proper format is just a single bracket.
</div>

### Video embeds

Videos in the Block Editor Handbook need to be hosted on the [WordPress YouTube channel](https://www.youtube.com/@WordPress) as unlisted videos. This process requires additional permissions. Reach out in the #marketing Slack channel for assistance.

Once the video has been uploaded to YouTube, retrieve the video embed link. It should look something like this: 

```
https://www.youtube.com/embed/nrut8SfXA44?si=YxvmHmAoYx-BDCog
```

Then, place the following code where you want the video to be embedded in the documentation. Update the embed link and video title accordingly.

```html
<iframe width="960" height="540" src="[Video embed link]" title="[Video title]" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen="true"></iframe>
```

<div class="callout callout-info">
Videos should have an aspect ratio of <code>16:9</code> and be filmed at the highest resolution possible.
</div>

## Resources

-   [Copy Guidelines](/docs/contributors/documentation/copy-guide.md) for writing instructions, documentation, or other contributions to the Gutenberg project.

-   [Tone and Voice Guide](https://make.wordpress.org/docs/handbook/documentation-team-handbook/tone-and-voice-guide/) from WordPress Documentation.
