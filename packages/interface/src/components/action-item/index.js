/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { ButtonGroup, Button, Slot, Fill } from '@wordpress/components';

function ActionItemSlot( {
	name,
	as = [ ButtonGroup, Button ],
	fillProps = {},
	bubblesVirtually,
	...props
} ) {
	const [ Container, Item ] = as;
	return (
		<Slot
			name={ name }
			bubblesVirtually={ bubblesVirtually }
			fillProps={ { as: Item, ...fillProps } }
		>
			{ ( fills ) =>
				! isEmpty( fills ) && (
					<Container { ...props }>{ fills }</Container>
				)
			}
		</Slot>
	);
}

function ActionItem( { name, as, onClick, ...props } ) {
	return (
		<Fill name={ name }>
			{ ( fillProps ) => {
				const { onClick: fpOnClick, as: fpAs } = fillProps;
				const Item = as || fpAs || Button;
				return (
					<Item
						onClick={
							onClick || fpOnClick
								? ( ...args ) => {
										( onClick || noop )( ...args );
										( fpOnClick || noop )( ...args );
								  }
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
