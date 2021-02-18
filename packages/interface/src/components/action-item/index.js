/**
 * External dependencies
 */
import { isEmpty, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { ButtonGroup, Button, Slot, Fill } from '@wordpress/components';
import { Children } from '@wordpress/element';

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
			{ ( fills ) => {
				if ( isEmpty( Children.toArray( fills ) ) ) {
					return null;
				}

				// Special handling exists for backward compatibility.
				// It ensures that menu items created by plugin authors aren't
				// duplicated with automatically injected menu items coming
				// from pinnable plugin sidebars.
				// @see https://github.com/WordPress/gutenberg/issues/14457
				const initializedByPlugins = [];
				Children.forEach(
					fills,
					( {
						props: { __unstableExplicitMenuItem, __unstableTarget },
					} ) => {
						if ( __unstableTarget && __unstableExplicitMenuItem ) {
							initializedByPlugins.push( __unstableTarget );
						}
					}
				);
				const children = Children.map( fills, ( child ) => {
					if (
						! child.props.__unstableExplicitMenuItem &&
						initializedByPlugins.includes(
							child.props.__unstableTarget
						)
					) {
						return null;
					}
					return child;
				} );

				return <Container { ...props }>{ children }</Container>;
			} }
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
