<?php
/**
 * The `attachment` collection: the fields of the media editor ported to the
 * server so far.
 *
 * Attachments support authors and comments, yet the media editor shows its
 * own set of fields, declared client-side in packages/media-fields/src, none
 * of which is a default one. So they opt out of every field of the
 * `post_supports` collection, see `exclude-post-type-supports.php`, and get
 * the fields of this collection instead. The fields are plain data, so the
 * collection has no script module.
 *
 * @package WordPress
 */

return array(
	'origin' => 'core',
	'kind'   => 'postType',
	'name'   => 'attachment',
);
