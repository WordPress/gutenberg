import { applyFilters } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

export const REVISION_BADGES_FILTER = 'editor.PostRevision.badges';

/**
 * @typedef {Object} RevisionBadgeDescriptor
 * @property {string}                            id       Namespaced identifier.
 * @property {string|((item: Object) => string)} label    Translated text, or a function that returns it.
 * @property {string}                            [intent] Badge intent. Defaults to `none`.
 * @property {(item: Object) => boolean}         isMatch  Whether the badge applies to this revision.
 */

/**
 * @typedef {Object} RevisionBadge
 * @property {string} id     Namespaced identifier.
 * @property {string} label  Resolved label text.
 * @property {string} intent Badge intent.
 */

function isAutosaveRevision( item ) {
	// Autosaves use the `{parent_id}-autosave-v1` slug, like Core's `wp_is_post_autosave()`.
	return item?.slug?.endsWith( '-autosave-v1' ) ?? false;
}

/** @type {RevisionBadgeDescriptor[]} */
const DEFAULT_REVISION_BADGES = [
	{
		id: 'core/autosave',
		label: __( 'Autosave' ),
		intent: 'none',
		isMatch: isAutosaveRevision,
	},
];

function isValidDescriptor( descriptor ) {
	return (
		!! descriptor &&
		typeof descriptor === 'object' &&
		typeof descriptor.id === 'string' &&
		!! descriptor.id &&
		( typeof descriptor.label === 'string' ||
			typeof descriptor.label === 'function' ) &&
		typeof descriptor.isMatch === 'function'
	);
}

function descriptorMatches( descriptor, item ) {
	try {
		return !! descriptor.isMatch( item );
	} catch {
		return false;
	}
}

function resolveDescriptor( descriptor, item ) {
	let label;
	try {
		label =
			typeof descriptor.label === 'function'
				? descriptor.label( item )
				: descriptor.label;
	} catch {
		return null;
	}
	if ( typeof label !== 'string' || ! label ) {
		return null;
	}
	return {
		id: descriptor.id,
		label,
		intent: descriptor.intent ?? 'none',
	};
}

/**
 * Returns the badges that apply to a revision timeline row.
 *
 * Plugins extend the list with the `editor.PostRevision.badges` filter.
 *
 * @param {Object} item Revision record from `getPageRevisions`.
 * @return {RevisionBadge[]} Matching badges with resolved labels.
 */
export default function getRevisionBadges( item ) {
	const filtered = applyFilters(
		REVISION_BADGES_FILTER,
		DEFAULT_REVISION_BADGES.map( ( badge ) => ( { ...badge } ) )
	);
	const descriptors = Array.isArray( filtered )
		? filtered
		: DEFAULT_REVISION_BADGES;

	const badges = [];
	for ( const descriptor of descriptors ) {
		if ( ! isValidDescriptor( descriptor ) ) {
			continue;
		}
		if ( ! descriptorMatches( descriptor, item ) ) {
			continue;
		}
		const resolved = resolveDescriptor( descriptor, item );
		if ( resolved ) {
			badges.push( resolved );
		}
	}
	return badges;
}
