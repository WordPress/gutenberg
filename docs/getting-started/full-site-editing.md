# Full Site Editing

Full Site Editing is the umbrella project name for various sub-projects within Gutenberg. Projects under Full Site Editing (FSE) include the Site Editor, Widgets Editor, Navigation Editor, Global Styles, numerous Site/Post/Page specific blocks, Query block, Navigation block, Templates, and block themes.

## Get Involved

The majority of full site editing features are available in the Gutenberg plugin, and an ongoing [FSE Outreach program](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/) is running with calls for testing.

- Join in on Slack at #fse-outreach-experiment
- Participate in the [Calls for Testing](https://make.wordpress.org/test/tag/fse-testing-call/), test and give feedback.
- See the [How to Test FSE instructions](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/how-to-test-fse/) to get setup to test FSE features.

## Block Themes

If you are using the Gutenberg plugin you can run, test, and develop block themes. Block themes are themes built using templates composed using blocks.

- See the [Create a Block Theme](/docs/how-to-guides/block-theme/README.md) tutorial for a walk-through of the pieces of a block theme.

- If you want to dive right in, see the [github.com/WordPress/theme-experiments](https://github.com/WordPress/theme-experiments/) repository. You can download different example block themes there, try the [TT1 Blocks](https://github.com/WordPress/theme-experiments/tree/master/tt1-blocks) is a block theme recreating the Twenty Twenty-One default theme.

- Use the `empty-theme.php` script from theme-experiments repo to generate a start block theme, it will prompt you with a few questions and create a theme.

```
❯ git clone https://github.com/WordPress/theme-experiments
❯ cd theme-experiments
❯ php new-empty-theme.php
Please provide the following information:
Theme name: TestTheme
Description: A theme to test
Author: Marcus Kazmierczak
Theme URI: https://github.com/mkaz

Your new theme is ready!
```

You can then copy the generated directory to your `wp-content/themes` directory and start playing with the Site Editor to build and extend the theme.

### theme.json

Instead of the proliferation of theme support flags or alternative methods, a new `theme.json` file is being used to define theme settings. **NOTE:** This feature is still experimental and changing, so the interim file name is `experimental-theme.json`

See [documentation for theme.json](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/).
