// @ts-nocheck
/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import { Select as SelectControlSelect } from '../select-control/styles/select-control-styles';
import SelectControlChevronDown from '../select-control/chevron-down';
import { StyledLabel } from '../base-control/styles/base-control-styles';
import { useDeprecated36pxDefaultSizeProp } from '../utils/use-deprecated-props';
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

export default function CustomSelectControl( props ) {
	const {
		/** Start opting into the larger default height that will become the default size in a future version. */
		__next40pxDefaultSize = false,
		className,
		hideLabelFromVision,
		label,
		describedBy,
		options: items,
		onChange: onSelectedItemChange,
		/** @type {import('../select-control/types').SelectControlProps.size} */
		size = 'default',
		value: _selectedItem,
		onMouseOver,
		onMouseOut,
		onFocus,
		onBlur,
		__experimentalShowSelectedHint = false,
	} = useDeprecated36pxDefaultSizeProp( props );

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
			className={ clsx( 'components-custom-select-control', className ) }
		>
			{ hideLabelFromVision ? (
				<VisuallyHidden as="label" { ...getLabelProps() }>
					{ label }
				</VisuallyHidden>
			) : (
				/* eslint-disable-next-line jsx-a11y/label-has-associated-control, jsx-a11y/label-has-for */
				<StyledLabel
					{ ...getLabelProps( {
						className: 'components-custom-select-control__label',
					} ) }
				>
					{ label }
				</StyledLabel>
			) }
			<InputBase
				__next40pxDefaultSize={ __next40pxDefaultSize }
				size={ size }
				suffix={ <SelectControlChevronDown /> }
			>
				<SelectControlSelect
					onMouseOver={ onMouseOver }
					onMouseOut={ onMouseOut }
					as="button"
					onFocus={ onFocus }
					onBlur={ onBlur }
					selectSize={ size }
					__next40pxDefaultSize={ __next40pxDefaultSize }
					{ ...getToggleButtonProps( {
						// This is needed because some speech recognition software don't support `aria-labelledby`.
						'aria-label': label,
						'aria-labelledby': undefined,
						className: 'components-custom-select-control__button',
						describedBy: getDescribedBy(),
					} ) }
				>
					{ itemToString( selectedItem ) }
					{ __experimentalShowSelectedHint &&
						selectedItem.__experimentalHint && (
							<span className="components-custom-select-control__hint">
								{ selectedItem.__experimentalHint }
							</span>
						) }
				</SelectControlSelect>
				<div className="components-custom-select-control__menu-wrapper">
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
										className: clsx(
											item.className,
											'components-custom-select-control__item',
											{
												'is-highlighted':
													index === highlightedIndex,
												'has-hint':
													!! item.__experimentalHint,
												'is-next-40px-default-size':
													__next40pxDefaultSize,
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
			</InputBase>
		</div>
	);
}

export function StableCustomSelectControl( props ) {
	return (
		<CustomSelectControl
			{ ...props }
			__experimentalShowSelectedHint={ false }
		/>
	);
}
