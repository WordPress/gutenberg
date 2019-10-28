/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Slot, Fill } from '../slot-fill';
import ToolbarContext from '../toolbar-context';

export function ToolbarSlot( { className, ...props } ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	const finalClassName = classnames( 'components-toolbar-slot-fill', className );
	return (
		<Slot
			{ ...props }
			className={ finalClassName }
			fillProps={ accessibleToolbarState || null }
		/>
	);
}

export function ToolbarFill( props ) {
	return (
		<Fill { ...props }>
			{ ( fillProps ) => (
				<ToolbarContext.Provider value={ fillProps }>
					{ props.children }
				</ToolbarContext.Provider>
			) }
		</Fill>
	);
}

/**
 * Toolbar requires context to be passed to its children (ToolbarButton's),
 * which doesn't happen when using Slot/Fill with bubblesVirtually prop set to
 * true. Toolbar Slot/Fill will pass the context automatically.
 *
 * @param {string} name
 */
export function createToolbarSlotFill( name ) {
	const FillComponent = ( props ) => <ToolbarFill name={ name } { ...props } />;
	FillComponent.displayName = name + 'Fill';

	const SlotComponent = ( props ) => <ToolbarSlot name={ name } { ...props } />;
	SlotComponent.displayName = name + 'Slot';

	return {
		Fill: FillComponent,
		Slot: SlotComponent,
	};
}
