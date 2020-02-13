/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check, chevronDown } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { Button } from '../';

const itemToString = ( item ) => item && item.name;
// This is needed so that in Windows, where
// the menu does not necessarily open on
// key up/down, you can still switch between
// options with the menu closed.
const stateReducer = (
	{ selectedItem },
	{ type, changes, props: { items } }
) => {
	switch ( type ) {
		case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowDown:
			// If we already have a selected item, try to select the next one,
			// without circular navigation. Otherwise, select the first item.
			return {
				selectedItem:
					items[
						selectedItem
							? Math.min(
									items.indexOf( selectedItem ) + 1,
									items.length - 1
							  )
							: 0
					],
			};
		case useSelect.stateChangeTypes.ToggleButtonKeyDownArrowUp:
			// If we already have a selected item, try to select the previous one,
			// without circular navigation. Otherwise, select the last item.
			return {
				selectedItem:
					items[
						selectedItem
							? Math.max( items.indexOf( selectedItem ) - 1, 0 )
							: items.length - 1
					],
			};
		default:
			return changes;
	}
};
export default function CustomSelectControl( {
	className,
	hideLabelFromVision,
	label,
	options: items,
	onChange: onSelectedItemChange,
	value: _selectedItem,
} ) {
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
		onSelectedItemChange,
		selectedItem: _selectedItem,
		stateReducer,
	} );

	const menuProps = getMenuProps( {
		className: 'components-custom-select-control__menu',
	} );
	// We need this here, because the null active descendant is not
	// fully ARIA compliant.
	if (
		menuProps[ 'aria-activedescendant' ] &&
		menuProps[ 'aria-activedescendant' ].slice(
			0,
			'downshift-null'.length
		) === 'downshift-null'
	) {
		delete menuProps[ 'aria-activedescendant' ];
	}
	return (
		<div
			className={ classnames(
				'components-custom-select-control',
				className
			) }
		>
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */ }
			<label
				{ ...getLabelProps( {
					className: classnames(
						'components-custom-select-control__label',
						{
							'screen-reader-text': hideLabelFromVision,
						}
					),
				} ) }
			>
				{ label }
			</label>
			<Button
				{ ...getToggleButtonProps( {
					// This is needed because some speech recognition software don't support `aria-labelledby`.
					'aria-label': label,
					'aria-labelledby': undefined,
					className: 'components-custom-select-control__button',
					isSmall: true,
				} ) }
			>
				{ itemToString( selectedItem ) }
				<Icon
					icon={ chevronDown }
					className="components-custom-select-control__button-icon"
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
								className: classnames(
									'components-custom-select-control__item',
									{
										'is-highlighted':
											index === highlightedIndex,
									}
								),
								style: item.style,
							} ) }
						>
							{ item === selectedItem && (
								<Icon
									icon={ check }
									className="components-custom-select-control__item-icon"
								/>
							) }
							{ item.name }
						</li>
					) ) }
			</ul>
		</div>
	);
}
