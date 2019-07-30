# Documentation Contributions

Documentation for Gutenberg is maintained in the `/docs/` directory in the same Gutenberg Github repository. The docs are published every 15 minutes to the [Block Editor Handbook site](https://developer.wordpress.org/block-editor/).

## New Document

To add a new documentation page:

1. Create a Markdown file in the [docs](https://github.com/WordPress/gutenberg/tree/master/docs) folder
2. Add item to the [toc.json](https://github.com/WordPress/gutenberg/blob/master/docs/toc.json) hierarchy
3. Update manifest.json by running `npm run docs:build`
4. Commit manifest.json with other files updated

## Using Links

It's very likely that at some point you will want to link to other documentation pages. It's worth emphasizing that all documents can be browsed in different contexts:

- Block Editor Handbook
- GitHub website
- npm website

To create links that work in all contexts, you should use absolute path links without the `https://github.com/WordPress/gutenberg` prefix. You can reference files using the following patterns:

- `/docs/*.md`
- `/packages/*/README.md`
- `/packages/components/src/**/README.md`

This way they will be properly handled in all three aforementioned contexts.

## Resources

* [Copy Guidelines](/docs/contributors/copy-guide.md) for writing instructions, documentations, or other contributions to Gutenberg project.

* [Tone and Voice Guide](https://make.wordpress.org/docs/handbook/documentation-team-handbook/tone-and-voice-guide/) from WordPress Documentation.
