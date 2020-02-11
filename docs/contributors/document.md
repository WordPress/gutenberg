# Documentation Contributions

A guide on how to get started contributing documentation to the Gutenberg project.

## Discussions

The [Make WordPress Docs blog](https://make.wordpress.org/docs/) is the primary spot for the latest information around WordPress documentation: including announcements, product goals, meeting notes, meeting agendas, and more.

Real-time discussions for documentation take place in the `#docs` channel in [Make WordPress Slack](https://make.wordpress.org/chat) (registration required). Weekly meetings for the Documentation team are on Mondays at 14:00UTC.

The Gutenberg project uses GitHub for managing code and tracking issues. The main repository is at: [https://github.com/WordPress/gutenberg](https://github.com/WordPress/gutenberg).  To find documentation issues to work on, browse [issues with documentation label](https://github.com/WordPress/gutenberg/issues?utf8=%E2%9C%93&q=is%3Aopen+is%3Aissue+label%3A%22%5BType%5D+Documentation%22+).

## Documentation Types

There are two major sets of documentation for Gutenberg project:

1. [User documentation](https://wordpress.org/support/article/wordpress-editor/) is information on how to use the Editor as an author publishing posts. For contributing to user docs, follow the docs blog, or ask in the #docs Slack channel, to understand the current priorities.
2. [Block Editor Handbook](https://developer.wordpress.org/block-editor/) is everything related to the Gutenberg project including: developing, extending, and—what you are reading right now—contributing specific to Gutenberg.

The rest of this document covers contributing to the Block Editor Handbook.


## Block Editor Handbook Process

The Block Editor Handbook is a mix of markdown files in the `/docs/` directory of the [Gutenberg project repository](https://github.com/WordPress/gutenberg/) and generated documentation from the packages.

An automated job publishes the docs every 15 minutes to the [Block Editor Handbook site](https://developer.wordpress.org/block-editor/).

See [the Git Workflow](/docs/contributors/git-workflow.md) documentation for how to use git to deploy changes using pull requests.

### Update a Document

To update an existing page:

1. Check out the gutenberg repository.
2. Create a branch to work, for example `docs/update-contrib-guide`.
3. Make the necessary changes to the existing document.
4. Commit your changes.
5. Create a pull request with "Documentation" label.

### Create a New Document

To add a new documentation page:

1. Create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/master/docs) folder.
2. Add item to the [toc.json](https://github.com/WordPress/gutenberg/blob/master/docs/toc.json) hierarchy.
3. Update `manifest-devhub.json` by running `npm run docs:build`.
4. Commit `manifest-devhub.json` with other files updated.

### Using Links

It's likely that at some point you will want to link to other documentation pages. It's worth emphasizing that all documents can be browsed in different contexts:

- Block Editor Handbook
- GitHub website
- npm website

To create links that work in all contexts, you should use absolute path links without the `https://github.com/WordPress/gutenberg` prefix. You can reference files using the following patterns:

- `/docs/*.md`
- `/packages/*/README.md`
- `/packages/components/src/**/README.md`

This way they will be properly handled in all three aforementioned contexts.

## Resources

- [Copy Guidelines](/docs/contributors/copy-guide.md) for writing instructions, documentations, or other contributions to Gutenberg project.

- [Tone and Voice Guide](https://make.wordpress.org/docs/handbook/documentation-team-handbook/tone-and-voice-guide/) from WordPress Documentation.
