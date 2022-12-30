/**
 * WordPress dependencies
 */
import { escapeHTML } from '@wordpress/escape-html';
import { safeDecodeURI } from '@wordpress/url';

/**
 * @typedef {'post-type'|'custom'|'taxonomy'|'post-type-archive'} WPNavigationLinkKind
 */
/**
 * Navigation Link Block Attributes
 *
 * @typedef {Object} WPNavigationLinkBlockAttributes
 *
 * @property {string}               [label]         Link text.
 * @property {WPNavigationLinkKind} [kind]          Kind is used to differentiate between term and post ids to check post draft status.
 * @property {string}               [type]          The type such as post, page, tag, category and other custom types.
 * @property {string}               [rel]           The relationship of the linked URL.
 * @property {number}               [id]            A post or term id.
 * @property {boolean}              [opensInNewTab] Sets link target to _blank when true.
 * @property {string}               [url]           Link href.
 * @property {string}               [title]         Link title attribute.
 */
/**
 * Link Control onChange handler that updates block attributes when a setting is changed.
 *
 * @param {Object}                          updatedValue    New block attributes to update.
 * @param {Function}                        setAttributes   Block attribute update function.
 * @param {WPNavigationLinkBlockAttributes} blockAttributes Current block attributes.
 *
 */

export const updateAttributes = (
	updatedValue = {},
	setAttributes,
	blockAttributes = {}
) => {
	const {
		label: originalLabel = '',
		kind: originalKind = '',
		type: originalType = '',
	} = blockAttributes;

	const {
		title: newLabel = '', // the title of any provided Post.
		url: newUrl = '',
		opensInNewTab,
		id,
		kind: newKind = originalKind,
		type: newType = originalType,
	} = updatedValue;

	const newLabelWithoutHttp = newLabel.replace( /http(s?):\/\//gi, '' );
	const newUrlWithoutHttp = newUrl.replace( /http(s?):\/\//gi, '' );

	const useNewLabel =
		newLabel &&
		newLabel !== originalLabel &&
		// LinkControl without the title field relies
		// on the check below. Specifically, it assumes that
		// the URL is the same as a title.
		// This logic a) looks suspicious and b) should really
		// live in the LinkControl and not here. It's a great
		// candidate for future refactoring.
		newLabelWithoutHttp !== newUrlWithoutHttp;

	// Unfortunately this causes the escaping model to be inverted.
	// The escaped content is stored in the block attributes (and ultimately in the database),
	// and then the raw data is "recovered" when outputting into the DOM.
	// It would be preferable to store the **raw** data in the block attributes and escape it in JS.
	// Why? Because there isn't one way to escape data. Depending on the context, you need to do
	// different transforms. It doesn't make sense to me to choose one of them for the purposes of storage.
	// See also:
	// - https://github.com/WordPress/gutenberg/pull/41063
	// - https://github.com/WordPress/gutenberg/pull/18617.
	const label = useNewLabel
		? escapeHTML( newLabel )
		: originalLabel || escapeHTML( newUrlWithoutHttp );

	// In https://github.com/WordPress/gutenberg/pull/24670 we decided to use "tag" in favor of "post_tag"
	const type = newType === 'post_tag' ? 'tag' : newType.replace( '-', '_' );

	const isBuiltInType =
		[ 'post', 'page', 'tag', 'category' ].indexOf( type ) > -1;

	const isCustomLink =
		( ! newKind && ! isBuiltInType ) || newKind === 'custom';
	const kind = isCustomLink ? 'custom' : newKind;

	setAttributes( {
		// Passed `url` may already be encoded. To prevent double encoding, decodeURI is executed to revert to the original string.
		...( newUrl && { url: encodeURI( safeDecodeURI( newUrl ) ) } ),
		...( label && { label } ),
		...( undefined !== opensInNewTab && { opensInNewTab } ),
		...( id && Number.isInteger( id ) && { id } ),
		...( kind && { kind } ),
		...( type && type !== 'URL' && { type } ),
	} );
};
