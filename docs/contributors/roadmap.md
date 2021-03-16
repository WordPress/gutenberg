# Upcoming Projects & Roadmap

_Complementary to [Phase 2 Scope](https://github.com/WordPress/gutenberg/issues/13113)._

This document outlines some of the features currently in development or being considered for the project. It should not be confused with the product roadmap for WordPress itself, even if some areas naturally overlap. The main purpose of it is to give visibility to some of the key problems remaining to be solved and as an invitation for those wanting to collaborate on some of the more complex issues to learn about what needs help.

Gutenberg is already in use by millions of sites through WordPress, so in order to make substantial changes to the design or updating specifications it is advisable to consider a discussion process ("Request for Comments") showing both an understanding of the impact, both positives and negatives, trade offs and opportunities.

## Projects

- **Block Registry** — define an entry point for block identification. ([See active RFC](https://github.com/WordPress/gutenberg/pull/13693).)
- **Live Component Library** — a place to visualize and interact with the UI components and block tools included in the packages.
- **Modular Editor** — allow loading the block editor in several contexts without a dependency to a post object. (Ongoing [pending tasks](https://github.com/WordPress/gutenberg/issues/14043).)
- **Better Validation** — continue to refine the mechanisms used in validating editor content. (See in depth overview at [#11440](https://github.com/WordPress/gutenberg/issues/11440) and [#7604](https://github.com/WordPress/gutenberg/issues/7604).)
- **Block Areas** — build support for areas of blocks that fall outside the content (including relationship with templates, registration, storage, and so on). ([See overview](https://github.com/WordPress/gutenberg/issues/13489).)
- **Multi-Block Editing** — allow modifying attributes of multiple blocks of the same kind at once.
- **Rich Text Roadmap** — continue to develop the capabilities of the rich text package. ([See overview](https://github.com/WordPress/gutenberg/issues/13778).)
- **Common Block Functionality** — coalesce into a preferred mechanism for creating and sharing chunks of functionality (block alignment, color tools, etc) across blocks with a simple and intuitive code interface. (Suggested exploration: React Hooks, [see overview](https://github.com/WordPress/gutenberg/issues/15450).)
- **Responsive Images** — propose mechanisms for handling flexible image sources that can be optimized for loading and takes into account their placement on a page (within main content, a column, sidebar, etc).
- **Async Loading** — propose a strategy for loading block code only when necessary in the editor without overhead for the developer or disrupting the user experience.
- **Styles** — continue to develop the mechanisms for managing block style variations and other styling solutions. (See overview at [#7551](https://github.com/WordPress/gutenberg/issues/7551) and [#9534](https://github.com/WordPress/gutenberg/issues/9534).)
- **Bundling Front-end Assets** — explore ways in which front-end styles for blocks could be assembled based on which blocks are used in a given page response. ([See overview](https://github.com/WordPress/gutenberg/issues/5445).)
- **Transforms API** — improve the transform API to allow advanced use-cases: support for async-transforms, access to the block editor settings and bring consistency between the different types of transforms. ([See related issue](https://github.com/WordPress/gutenberg/issues/14755).)

## Timeline

The projects outlined above indicate areas of interest but not necessarily development priorities. Sometimes, a product need will accelerate a resolution (as is the case of the block registry), other times community interest might be the driving force.

- 2019 Q1: Block Registry — First phase. Required for plugin directory "meta" project.
- 2019 Q2: Modular Editor — Requirement for most of phase 2.
- 2019 Q3: Block Areas.
