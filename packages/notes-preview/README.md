# `@wordpress/notes-preview`

The front-end review surface for notes on a post preview. It renders nothing on
its own: the rail's markup is produced by PHP, and this module makes it work.

Part of the reviewer workflow in
[#73418](https://github.com/WordPress/gutenberg/issues/73418), behind the
`gutenberg-notes-on-previews` experiment.

## What it does

- Lines each thread card up with the block or the inline marker it is about, the
  way a margin comment does in a document editor. The selected card is pinned
  exactly to its anchor and the rest give way to it.
- Draws an indicator over each noted block, in its own layer, so no theme markup
  is touched.
- Marks the anchored block and its inline highlight when a thread is selected.
- Posts replies to `/wp/v2/comments` with the REST nonce the page carries.

## What it does not do

- Start a new thread. That writes `metadata.noteId` into `post_content`, which is
  a change to the post, and a reviewer is precisely somebody who may not make
  one.
- Resolve or reopen. Those stay with people who can edit the post.
- Update live. The rail is a snapshot of the last save; a reload brings it
  current.

## Layout

Cards are positioned in document space and the board is translated as the page
scrolls, so a card tracks its anchor without repositioning every card on every
frame. Below 1100px there is no room to align anything, so the rail becomes a
drawer and the cards an ordinary list.

`calculateThreadTops()` is exported and pure, so the placement rules can be
tested without a DOM.

## Installation

Install the module:

```bash
npm install @wordpress/notes-preview --save
```

_This package assumes that your code will run in an **ES2015+** environment._

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
