/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Composite, Popover } from '@wordpress/components';
import {
	useState,
	useEffect,
	useRef,
	lazy,
	Suspense,
} from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { plus as plusIcon } from '@wordpress/icons';

/**
 * Lazy-load the Frimousse picker so its emoji data fetch and ~30KB of
 * picker code are only paid for when a user actually opens it.
 */
const FrimoussePicker = lazy( () => import( './frimousse-picker' ) );

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

		let isMounted = true;

		if ( ! fetchPromise ) {
			fetchPromise = apiFetch( {
				path: '/wp/v2/comments',
				method: 'OPTIONS',
			} )
				.then( ( response ) => {
					const schemaEmojis =
						response?.schema?.properties?.reaction_emojis?.default;
					if (
						Array.isArray( schemaEmojis ) &&
						schemaEmojis.length
					) {
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
			if ( isMounted ) {
				setEmojis( cachedEmojis );
			}
		} );

		return () => {
			isMounted = false;
		};
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
 * A row of curated emoji buttons plus a `+` button that opens a full
 * Frimousse-based picker in a Popover.
 *
 * @param {Object}   props          Component props.
 * @param {Function} props.onSelect Callback invoked with the chosen emoji.
 *                                  For curated picks this is the slug
 *                                  (e.g. `heart`); for picks from the full
 *                                  picker it is the emoji character itself.
 */
export default function ReactionEmojiPicker( { onSelect } ) {
	const emojis = useReactionEmojis();
	const [ isFullPickerOpen, setIsFullPickerOpen ] = useState( false );
	const moreButtonRef = useRef( null );

	return (
		<>
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
				<Composite.Item
					render={
						<Button
							ref={ moreButtonRef }
							size="compact"
							icon={ plusIcon }
							onClick={ () =>
								setIsFullPickerOpen( ( open ) => ! open )
							}
							aria-expanded={ isFullPickerOpen }
							aria-haspopup="dialog"
							label={ __( 'More emojis' ) }
							className="editor-collab-sidebar-panel__emoji-more"
						/>
					}
				/>
			</Composite>
			{ isFullPickerOpen && (
				<Popover
					anchor={ moreButtonRef.current }
					placement="bottom-end"
					onClose={ () => setIsFullPickerOpen( false ) }
					onFocusOutside={ () => setIsFullPickerOpen( false ) }
					className="editor-collab-sidebar-panel__frimousse-popover"
				>
					<Suspense fallback={ null }>
						<FrimoussePicker
							onSelect={ ( emoji ) => {
								setIsFullPickerOpen( false );
								onSelect( emoji );
							} }
						/>
					</Suspense>
				</Popover>
			) }
		</>
	);
}
