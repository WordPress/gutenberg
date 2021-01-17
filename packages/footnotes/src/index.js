/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { registerFormatType } from '@wordpress/rich-text';
import { Slot } from '@wordpress/components';
import {
	forwardRef,
	useMemo,
	createContext,
	useState,
	useCallback,
} from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import format from './format';

export const slotName = '__unstable-footnote-controls';
export const SlotRemount = createContext();

registerFormatType( format.name, format );

const List = forwardRef( ( props, ref ) => (
	<ol ref={ ref } { ...props } className="wp-block" />
) );

addFilter(
	'blockEditor.BlockListItems',
	'core/footnotes',
	( BlockListItems ) => () => {
		const [ state, setState ] = useState();
		const remountSlot = useCallback(
			() => setState( ( value ) => ! value ),
			[ setState ]
		);
		const order = useSelect(
			( select ) => select( 'core/block-editor' ).getBlockOrder(),
			[]
		);

		// Remount the slot if block order changes so the order of the footnotes
		// updates too.
		const key = useMemo( () => uuid(), [ order, state ] );

		return (
			<SlotRemount.Provider value={ remountSlot }>
				<BlockListItems />
				<Slot
					key={ key }
					name={ slotName }
					as={ List }
					bubblesVirtually
				/>
			</SlotRemount.Provider>
		);
	}
);
