<?php
/**
 * The `attachment` collection: the fields of the media editor ported to the
 * server so far.
 *
 * Attachments support authors and comments, yet the media editor shows its
 * own set of fields, declared client-side in packages/media-fields/src, none
 * of which is a default one. So they opt out of every default field, which
 * the collection unregisters, and get the fields of this collection
 * instead. The collection registers right after the defaults, so `true`
 * only drops those. The fields are plain data, so the collection has no
 * script module.
 *
 * @package WordPress
 */

return array(
	'origin'     => 'core',
	'kind'       => 'postType',
	'name'       => 'attachment',
	'unregister' => true,
);
