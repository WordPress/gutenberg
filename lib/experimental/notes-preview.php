<?php
/**
 * Notes on post previews.
 *
 * Lets a site give someone the ability to read and reply to a post's notes
 * without giving them the ability to edit the post, and surfaces those notes on
 * the post's preview so the discussion sits against the real rendered content.
 *
 * The whole feature sits behind the `gutenberg-notes-on-previews` experiment
 * and, until a site grants the new capabilities to somebody, changes nothing:
 * both capabilities map to `edit_post` by default.
 *
 * @see https://github.com/WordPress/gutenberg/issues/73418
 *
 * @package gutenberg
 */

require_once __DIR__ . '/notes-preview/capabilities.php';
require_once __DIR__ . '/notes-preview/class-gutenberg-rest-comments-controller-notes.php';
require_once __DIR__ . '/notes-preview/rest-api.php';
require_once __DIR__ . '/notes-preview/preview-access.php';
require_once __DIR__ . '/notes-preview/render.php';
require_once __DIR__ . '/notes-preview/panel.php';
