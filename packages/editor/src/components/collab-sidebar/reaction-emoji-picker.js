/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Composite } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Curated emoji set for reactions (fallback).
 * The `value` slug is used as the storage key in the database to avoid
 * potential encoding issues with emoji characters.
 */
export const REACTION_EMOJIS = [
	{ emoji: '❤️', label: __( 'Heart' ), value: 'heart' },
	{ emoji: '🎉', label: __( 'Celebration' ), value: 'celebration' },
	{ emoji: '😄', label: __( 'Smile' ), value: 'smile' },
	{ emoji: '👀', label: __( 'Eyes' ), value: 'eyes' },
	{ emoji: '🚀', label: __( 'Rocket' ), value: 'rocket' },
];

// Module-level cache so the OPTIONS request is made only once.
let cachedEmojis = null;
let fetchPromise = null;

/**
 * Hook that returns the allowed reaction emojis from the REST API schema.
 *
 * Fetches the emoji list from the `OPTIONS /wp/v2/comments` response
 * and caches the result at module level. Falls back to the hardcoded
 * REACTION_EMOJIS if the request fails or the schema property is missing.
 *
 * @return {Array} The list of allowed reaction emoji objects.
 */
export function useReactionEmojis() {
	const [ emojis, setEmojis ] = useState( cachedEmojis || REACTION_EMOJIS );

	useEffect( () => {
		if ( cachedEmojis ) {
			return;
		}

		if ( ! fetchPromise ) {
			fetchPromise = apiFetch( {
				path: '/wp/v2/comments',
				method: 'OPTIONS',
			} )
				.then( ( response ) => {
					const schemaEmojis =
						response?.schema?.properties?.reaction_emojis
							?.default;
					if ( Array.isArray( schemaEmojis ) && schemaEmojis.length ) {
						cachedEmojis = schemaEmojis;
					} else {
						cachedEmojis = REACTION_EMOJIS;
					}
				} )
				.catch( () => {
					cachedEmojis = REACTION_EMOJIS;
				} );
		}

		fetchPromise.then( () => {
			setEmojis( cachedEmojis );
		} );
	}, [] );

	return emojis;
}

/**
 * Get the emoji character for a given reaction slug.
 *
 * @param {string} slug   The reaction slug.
 * @param {Array}  emojis Optional emoji list to search.
 * @return {string} The emoji character, or the slug if not found.
 */
export function getEmojiBySlug( slug, emojis = REACTION_EMOJIS ) {
	return emojis.find( ( r ) => r.value === slug )?.emoji ?? slug;
}

/**
 * Get the label for a given reaction slug.
 *
 * @param {string} slug   The reaction slug.
 * @param {Array}  emojis Optional emoji list to search.
 * @return {string} The label, or the slug if not found.
 */
export function getLabelBySlug( slug, emojis = REACTION_EMOJIS ) {
	return emojis.find( ( r ) => r.value === slug )?.label ?? slug;
}

/**
 * A selection of emoji buttons for adding reactions.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Callback when an emoji is selected.
 */
export default function ReactionEmojiPicker( { onSelect } ) {
	const emojis = useReactionEmojis();

	return (
		<Composite
			role="listbox"
			aria-label={ __( 'Select an emoji reaction' ) }
			className="editor-collab-sidebar-panel__emoji-picker"
		>
			{ emojis.map( ( { emoji, label, value } ) => (
				<Composite.Item
					key={ value }
					render={
						<Button
							role="option"
							size="compact"
							onClick={ () => onSelect( value ) }
							aria-label={ label }
							className="editor-collab-sidebar-panel__emoji-option"
						/>
					}
				>
					{ emoji }
				</Composite.Item>
			) ) }
		</Composite>
	);
}
