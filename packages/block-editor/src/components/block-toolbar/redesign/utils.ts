import { useSyncExternalStore } from '@wordpress/element';

/**
 * Props a rich text toolbar button passes to its fill.
 */
export type RichTextControl = {
	title: string;
	icon?: any;
	onClick?: ( event?: unknown ) => void;
	isActive?: boolean;
	isDisabled?: boolean;
	disabled?: boolean;
	shortcut?: string;
};

/**
 * Whether the block toolbar redesign experiment is on.
 *
 * @return True when the `gutenberg-block-toolbar-redesign` experiment is
 *         enabled.
 */
export function isBlockToolbarRedesign(): boolean {
	return (
		typeof window !== 'undefined' &&
		!! ( window as { __experimentalBlockToolbarRedesign?: boolean } )
			.__experimentalBlockToolbarRedesign
	);
}

/*
 * The options menu and the selection toolbar both read the same rich text
 * toolbar slots (Bold, Italic, Link and the inline insert controls), and a
 * slot can only be rendered in one place at a time. The selection toolbar
 * steps aside while the options menu is open, so the menu can show them.
 */
let isOptionsMenuOpen = false;
const listeners = new Set< () => void >();

export function setOptionsMenuOpen( isOpen: boolean ) {
	if ( isOptionsMenuOpen === isOpen ) {
		return;
	}
	isOptionsMenuOpen = isOpen;
	listeners.forEach( ( listener ) => listener() );
}

function subscribe( listener: () => void ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

function getSnapshot() {
	return isOptionsMenuOpen;
}

export function useIsOptionsMenuOpen(): boolean {
	return useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
}

/**
 * Reads the props of every fill in a rich text toolbar slot.
 *
 * @param fills Fills passed to a slot's render function.
 * @return The props of each fill's toolbar button.
 */
export function getFillProps( fills: any ): RichTextControl[] {
	if ( ! Array.isArray( fills ) ) {
		return [];
	}
	return fills
		.map( ( fill ) => fill?.[ 0 ]?.props ?? fill?.props )
		.filter( Boolean );
}

type VariationLike = { attributes?: Record< string, unknown > };

/**
 * Whether a block variation only changes the block's layout, like the Row,
 * Stack and Grid variations of Group. Those show under the Layout button
 * rather than as transforms.
 *
 * @param variation A block variation.
 * @return True if the variation only sets `layout`.
 */
export function isLayoutVariation( variation?: VariationLike ): boolean {
	const keys = Object.keys( variation?.attributes ?? {} );
	return keys.length > 0 && keys.every( ( key ) => key === 'layout' );
}
