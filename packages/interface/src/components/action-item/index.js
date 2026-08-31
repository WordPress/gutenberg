import { MenuGroup, MenuItem, Slot, Fill } from '@wordpress/components';
import { Children } from '@wordpress/element';

function ActionItemSlot( {
	name,
	as: Component = MenuGroup,
	fillProps = {},
	children,
	...props
} ) {
	return (
		<Slot name={ name } fillProps={ fillProps }>
			{ ( fills ) => {
				// Each fill renders an array of its own, so flatten them into a
				// single list before handing them over.
				const items = Children.toArray( fills );

				if ( ! items.length ) {
					return null;
				}

				if ( typeof children === 'function' ) {
					return children( items );
				}

				return <Component { ...props }>{ items }</Component>;
			} }
		</Slot>
	);
}

function ActionItem( { name, as, onClick, ...props } ) {
	return (
		<Fill name={ name }>
			{ ( { as: slotAs = MenuItem, onClick: slotOnClick } ) => {
				// The slot provides the component to render the item with, so
				// that it fits the menu it ends up in, and an onClick handler,
				// for example one that closes that menu. The `as` prop
				// replaces the component. The `onClick` prop does not replace
				// the handler: both run.
				const Component = as ?? slotAs;
				const handlers = [ onClick, slotOnClick ].filter( Boolean );

				return (
					<Component
						onClick={
							handlers.length
								? ( ...args ) =>
										handlers.forEach( ( handler ) =>
											handler( ...args )
										)
								: undefined
						}
						{ ...props }
					/>
				);
			} }
		</Fill>
	);
}

ActionItem.Slot = ActionItemSlot;

export default ActionItem;
