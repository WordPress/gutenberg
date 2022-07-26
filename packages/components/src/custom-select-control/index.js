/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../';
import { Select as SelectControlSelect } from '../select-control/styles/select-control-styles';
import InputBase from '../input-control/input-base';

const itemToString = ( item ) => item?.name;
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
	/** Start opting into the larger default height that will become the default size in a future version. */
	__next36pxDefaultSize = false,
	/** Start opting into the unconstrained width that will become the default in a future version. */
	__nextUnconstrainedWidth = false,
	className,
	hideLabelFromVision,
	label,
	describedBy,
	options: items,
	onChange: onSelectedItemChange,
	/** @type {import('../select-control/types').SelectControlProps.size} */
	size = 'default',
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
		...( typeof _selectedItem !== 'undefined' && _selectedItem !== null
			? { selectedItem: _selectedItem }
			: undefined ),
		stateReducer,
	} );

	const [ isFocused, setIsFocused ] = useState( false );

	function getDescribedBy() {
		if ( describedBy ) {
			return describedBy;
		}

		if ( ! selectedItem ) {
			return __( 'No selection' );
		}

		// translators: %s: The selected option.
		return sprintf( __( 'Currently selected: %s' ), selectedItem.name );
	}

	const menuProps = getMenuProps( {
		className: 'components-custom-select-control__menu',
		'aria-hidden': ! isOpen,
	} );

	const onKeyDownHandler = useCallback(
		( e ) => {
			e.stopPropagation();
			menuProps?.onKeyDown?.( e );
		},
		[ menuProps ]
	);

	// We need this here, because the null active descendant is not fully ARIA compliant.
	if (
		menuProps[ 'aria-activedescendant' ]?.startsWith( 'downshift-null' )
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
			{ hideLabelFromVision ? (
				<VisuallyHidden as="label" { ...getLabelProps() }>
					{ label }
				</VisuallyHidden>
			) : (
				/* eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */
				<label
					{ ...getLabelProps( {
						className: 'components-custom-select-control__label',
					} ) }
				>
					{ label }
				</label>
			) }
			<InputBase
				isFocused={ isOpen || isFocused }
				__unstableInputWidth={
					__nextUnconstrainedWidth ? undefined : 'auto'
				}
				labelPosition={ __nextUnconstrainedWidth ? undefined : 'top' }
			>
				<SelectControlSelect
					as="button"
					onFocus={ () => setIsFocused( true ) }
					onBlur={ () => setIsFocused( false ) }
					selectSize={ size }
					__next36pxDefaultSize={ __next36pxDefaultSize }
					{ ...getToggleButtonProps( {
						// This is needed because some speech recognition software don't support `aria-labelledby`.
						'aria-label': label,
						'aria-labelledby': undefined,
						className: classnames(
							'components-custom-select-control__button',
							{
								'is-next-unconstrained-width':
									__nextUnconstrainedWidth,
							}
						),
						describedBy: getDescribedBy(),
					} ) }
				>
					{ itemToString( selectedItem ) }
					<Icon
						icon={ chevronDown }
						className="components-custom-select-control__button-icon"
						size={ 18 }
					/>
				</SelectControlSelect>
			</InputBase>
			{ /* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */ }
			<ul { ...menuProps } onKeyDown={ onKeyDownHandler }>
				{ isOpen &&
					items.map( ( item, index ) => (
						// eslint-disable-next-line react/jsx-key
						<li
							{ ...getItemProps( {
								item,
								index,
								key: item.key,
								className: classnames(
									item.className,
									'components-custom-select-control__item',
									{
										'is-highlighted':
											index === highlightedIndex,
										'has-hint': !! item.__experimentalHint,
										'is-next-36px-default-size':
											__next36pxDefaultSize,
									}
								),
								style: item.style,
							} ) }
						>
							{ item.name }
							{ item.__experimentalHint && (
								<span className="components-custom-select-control__item-hint">
									{ item.__experimentalHint }
								</span>
							) }
							{ item === selectedItem && (
								<Icon
									icon={ check }
									className="components-custom-select-control__item-icon"
								/>
							) }
						</li>
					) ) }
			</ul>
		</div>
	);
}
