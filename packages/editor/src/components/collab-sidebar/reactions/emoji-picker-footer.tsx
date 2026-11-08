import { Text } from '@wordpress/ui';
import { useSyncExternalStore } from '@wordpress/element';

/**
 * The parts of a grid cell the footer shows.
 */
export interface HighlightedEmoji {
	// The emoji character.
	value: string;
	// Its name, without the skin tone the character already shows.
	name: string;
}

/**
 * A minimal store holding the emoji highlighted in the picker grid.
 */
export interface HighlightStore {
	get: () => HighlightedEmoji | undefined;
	set: ( next: HighlightedEmoji | undefined ) => void;
	subscribe: ( listener: () => void ) => () => void;
}

/**
 * Create a store for the highlighted emoji.
 *
 * The highlight moves on every hover and arrow key press. Keeping it out of
 * the picker's own state means only the footer re-renders, not the ~1,900
 * grid cells.
 *
 * @return The store.
 */
export function createHighlightStore(): HighlightStore {
	let current: HighlightedEmoji | undefined;
	const listeners = new Set< () => void >();
	return {
		get: () => current,
		set( next ) {
			if ( next === current ) {
				return;
			}
			current = next;
			listeners.forEach( ( listener ) => listener() );
		},
		subscribe( listener ) {
			listeners.add( listener );
			return () => {
				listeners.delete( listener );
			};
		},
	};
}

/**
 * Footer under the emoji grid showing the highlighted emoji with its name.
 * It follows the highlight for both the pointer and the arrow
 * keys. It is hidden from assistive technology, since the search field
 * already announces the highlighted cell through `aria-activedescendant`.
 *
 * With nothing highlighted it stays empty but keeps its height, so the grid
 * above it doesn't resize as the pointer moves in and out.
 *
 * @param props       Component props.
 * @param props.store The store holding the highlighted emoji.
 */
export default function EmojiPickerFooter( {
	store,
}: {
	store: HighlightStore;
} ) {
	const highlighted = useSyncExternalStore( store.subscribe, store.get );
	return (
		<div className="editor-collab-sidebar-panel__picker-footer" aria-hidden>
			{ highlighted && (
				<>
					<span className="editor-collab-sidebar-panel__picker-footer-emoji">
						{ highlighted.value }
					</span>
					<Text
						variant="body-md"
						className="editor-collab-sidebar-panel__picker-footer-name"
					>
						{ highlighted.name }
					</Text>
				</>
			) }
		</div>
	);
}
