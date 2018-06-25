# StoryPage

Basically, **StoryPage** removes `widgets` blocks category and adds `storypage` catgeory. To be able to do that, we had to add 2 new actions to `core/blocks` store: `addCategories` and `removeCategories`.

Also, Suggested and Shared panels were removed from InserterMenu through `hideInserterMenuPanel` action.

Finally, **StoryPage** provides 3 news kinds of blocks (Post, Row and Section) and 2 new panels to sidebar: 'PostPanel' and 'TemplateSettingsPanel' (not functional yet).
