# Full Site Editing

At the highest level, the vision of Full Site Editing is to provide a collection of features that bring the familiar experience and extendability of blocks to all parts of your site rather than just post and pages. You can think of Full Site Editing as the umbrella project name for various sub-projects within Gutenberg that make this vision possible. Projects under Full Site Editing (FSE) include everything from the Site Editor, Global Styles, numerous Site/Post/Page specific blocks, Query block, Navigation block, Templates, and block themes. What follows are brief descriptions of the major pieces with more details found [here](https://github.com/WordPress/gutenberg/issues/24551): 

- Site Editor: the cohesive experience that allows you to directly edit and navigate between various templates, template parts, styling options, and more. 
- Template Editing: a scaled down direct editing experience allowing you to edit/change/create the template a post/page uses. 
- Block Theme: work to allow for a theme that's built using templates composed using blocks that works with full site editing. More below. 
- Styling: the feature that enables styling modifications across three levels (local blocks, theme defaults, and global modifications).
- Theme Blocks: new blocks that accomplish everything possible in traditional templates using template tags (ex: Post Author Block). 
- Browsing: the feature that unlocks the ability to navigate between various entities in the site editing experience including templates, pages, etc. 
- Navigation Block: a new block that allows you to edit a site's navigation menu, both in terms of structure and design.
- Query Block: a new block that replicates the classic WP_Query and allows for further customization with additional functionality. 

There are other projects, like the Navigation Editor and Widget Editor, that are meant to specifically help classic themes begin adapting more to the block framework and to act as a stepping stone of sorts to Full Site Editing. These are separate projects from Full Site Editing though but are worth being aware of as they ultimately help the cause of getting more people adjusted to using blocks in more places.

**Jump in:**

The best way to learn something is start playing with it. So jump in by installing the Gutenberg plugin from the plugins directory and activating a block theme on a test site. We recommend the [TT1 Blocks theme](https://wordpress.org/themes/tt1-blocks/), it is listed in the theme diretory and our development reference theme. You can find other themes in the directory using the [full-site-editing feature tag](https://wordpress.org/themes/tags/full-site-editing/).

## Get Involved

An ongoing [FSE Outreach program](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/) is in place with calls for testing and is a great way to get involved and learn about the new features.

- Join in on [WordPress Slack](https://make.wordpress.org/chat/) at [#fse-outreach-experiment](https://wordpress.slack.com/archives/C015GUFFC00)
- Participate in the [Calls for Testing](https://make.wordpress.org/test/tag/fse-testing-call/) by testing and giving feedback.
- See detailed [How to Test FSE instructions](https://make.wordpress.org/test/handbook/full-site-editing-outreach-experiment/how-to-test-fse/) to get setup to test FSE features.

## Block Themes

If you are using the Gutenberg plugin you can run, test, and develop block themes. Block themes are themes built using templates composed using blocks. See [block theme overview](/docs/how-to-guides/themes/block-theme-overview.md) for additional details.

- See the [Create a Block Theme](/docs/how-to-guides/themes/create-block-theme.md) tutorial for a walk-through of the pieces of a block theme.

- For examples, see the [WordPress/theme-experiments](https://github.com/WordPress/theme-experiments/) repository with several block themes there including the source for the above mentioned TT1 Blocks.

- Use the `empty-theme.php` script from theme-experiments repo to generate a starter block theme, it will prompt you with a few questions and create a theme.

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

See the [architecture document on templates](/docs/explanations/architecture/full-site-editing-templates.md) for an explanation on the internals of how templates and templates parts are rendered in the frontend and edited in the backend.

### theme.json

Instead of the proliferation of theme support flags or alternative methods, a new `theme.json` file is being used to define theme settings.

See [documentation for theme.json](/docs/how-to-guides/themes/theme-json.md).
