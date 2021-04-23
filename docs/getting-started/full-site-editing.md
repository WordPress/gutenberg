# Full Site Editing

Full Site Editing is the umbrella project name for various sub-projects within Gutenberg. Projects under Full Site Editing (FSE) include the Site Editor, Widgets Editor, Navigation Editor, Global Styles, numerous Site/Post/Page specific blocks, Query block, Navigation block, Templates, and block themes.

**Jump in:** The best way to learn something is start playing with it. So jump in, install the Gutenberg plugin from the plugins directory and then all you need is a block theme. We recommend the [TT1 Blocks theme](https://wordpress.org/themes/tt1-blocks/), it is listed in the theme diretory and our development reference theme. You can find other themes in the directory using the [full-site-editing feature tag](https://wordpress.org/themes/tags/full-site-editing/).

## Get Involved

An ongoing [FSE Outreach program](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/) is running with calls for testing, this is a great way to get involved and learn about the new features.

- Join in on Slack at #fse-outreach-experiment
- Participate in the [Calls for Testing](https://make.wordpress.org/test/tag/fse-testing-call/), test and give feedback.
- See detailed [How to Test FSE instructions](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/how-to-test-fse/) to get setup to test FSE features.

## Block Themes

If you are using the Gutenberg plugin you can run, test, and develop block themes. Block themes are themes built using templates composed using blocks. See [block theme overview](/docs/how-to-guides/themes/block-based-themes.md) for additional details.

- See the [Create a Block Theme](/docs/how-to-guides/block-theme/README.md) tutorial for a walk-through of the pieces of a block theme.

- For examples, see the [WordPress/theme-experiments](https://github.com/WordPress/theme-experiments/) repository with several block themes there including the source for the above mentioned TT1 Blocks.

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

### Template and Template Parts

See the [architecture document on templates](docs/explanations/architecture/full-site-editing-templates.md) for an explanation on the internals of how templates and templates parts are rendered in the frontend and edited in the backend.

### theme.json

Instead of the proliferation of theme support flags or alternative methods, a new `theme.json` file is being used to define theme settings. **NOTE:** This feature is still experimental and changing, so the interim file name is `experimental-theme.json`

See [documentation for theme.json](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/).
