/**
 * WordPress dependencies
 */
import { MenuGroup, Button, Slot, Fill } from '@wordpress/components';
import { Children } from '@wordpress/element';

const noop = () => {};

function ActionItemSlot( {
	name,
	as: Component = MenuGroup,
	fillProps = {},
	bubblesVirtually,
	...props
} ) {
	return (
		<Slot
			name={ name }
			bubblesVirtually={ bubblesVirtually }
			fillProps={ fillProps }
		>
			{ ( fills ) => {
				if ( ! Children.toArray( fills ).length ) {
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

				return <Component { ...props }>{ children }</Component>;
			} }
		</Slot>
	);
}

function ActionItem( { name, as: Component = Button, onClick, ...props } ) {
	return (
		<Fill name={ name }>
			{ ( { onClick: fpOnClick } ) => {
				return (
					<Component
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
