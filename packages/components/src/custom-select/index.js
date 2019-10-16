/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { Button, Dashicon } from '../';

const itemToString = ( item ) => item.name;
// This is needed so that in Windows, where
// the menu does not necessarily open on
// key up/down, you can still switch between
// options with the menu closed.
const stateReducer = (
	{ selectedItem },
	{ type, changes, props: { items } }
) => {
	// TODO: Remove this.
	// eslint-disable-next-line no-console
	console.debug(
		'Selected Item: ',
		selectedItem,
		'Type: ',
		type,
		'Changes: ',
		changes,
		'Items: ',
		items
	);
	switch ( type ) {
		case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowDown:
			// If we already have a selected item, try to select the next one,
			// without circular navigation. Otherwise, select the first item.
			return {
				...changes,
				selectedItem:
					items[
						selectedItem ?
							Math.min( items.indexOf( selectedItem ) + 1, items.length - 1 ) :
							0
					],
			};
		case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowUp:
			// If we already have a selected item, try to select the previous one,
			// without circular navigation. Otherwise, select the last item.
			return {
				...changes,
				selectedItem:
					items[
						selectedItem ?
							Math.max( items.indexOf( selectedItem ) - 1, 0 ) :
							items.length - 1
					],
			};
		default:
			return changes;
	}
};
export default function CustomSelect( { label, items } ) {
	const {
		getLabelProps,
		getToggleButtonProps,
		getMenuProps,
		getItemProps,
		isOpen,
		highlightedIndex,
		selectedItem,
	} = useSelect( {
		initialSelectedItem: items[ 0 ],
		items,
		itemToString,
		stateReducer,
	} );
	const menuProps = getMenuProps( {
		className: 'components-custom-select__menu',
	} );
	// We need this here, because the null active descendant is not
	// fully ARIA compliant.
	if (
		menuProps[ 'aria-activedescendant' ] &&
		menuProps[ 'aria-activedescendant' ].slice( 0, 'downshift-null'.length ) ===
			'downshift-null'
	) {
		delete menuProps[ 'aria-activedescendant' ];
	}
	return (
		<div className="components-custom-select">
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */ }
			<span
				{ ...getLabelProps( { className: 'components-custom-select__label' } ) }
			>
				{ label }
			</span>
			<Button
				{ ...getToggleButtonProps( {
					// This is needed because some speech recognition software don't support `aria-labelledby`.
					'aria-label': label,
					className: 'components-custom-select__button',
				} ) }
			>
				{ itemToString( selectedItem ) }
				<Dashicon
					icon="arrow-down-alt2"
					className="components-custom-select__button-icon"
				/>
			</Button>
			<ul { ...menuProps }>
				{ isOpen &&
					items.map( ( item, index ) => (
						// eslint-disable-next-line react/jsx-key
						<li
							{ ...getItemProps( {
								item,
								index,
								key: item.key,
								className: classnames( 'components-custom-select__item', {
									'is-highlighted': index === highlightedIndex,
								} ),
								style: item.style,
							} ) }
						>
							{ item === selectedItem && (
								<Dashicon
									icon="saved"
									className="components-custom-select__item-icon"
								/>
							) }
							{ item.name }
						</li>
					) ) }
			</ul>
		</div>
	);
}
