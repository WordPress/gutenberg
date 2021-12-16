/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useMergeRefs, useResizeObserver } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { Icon, check, chevronDown } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { Button, Popover, VisuallyHidden } from '../';

const OptionList = ( { anchorRef, isOpen, children } ) => {
	if ( ! isOpen ) {
		return children;
	}

	return (
		<Popover
			anchorRef={ anchorRef?.current }
			className="components-custom-select-control__popover"
			isAlternate={ true }
			position={ 'bottom center' }
			shouldAnchorIncludePadding
		>
			{ children }
		</Popover>
	);
};

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
	className,
	hideLabelFromVision,
	label,
	describedBy,
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
		...( typeof _selectedItem !== 'undefined' && _selectedItem !== null
			? { selectedItem: _selectedItem }
			: undefined ),
		stateReducer,
	} );

	const anchorRef = useRef();

	const [
		buttonResizeListener,
		{ width: buttonWidth },
	] = useResizeObserver();

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
		style: {
			minWidth: buttonWidth,
		},
	} );
	// We need this here, because the null active descendant is not fully ARIA compliant.
	if (
		menuProps[ 'aria-activedescendant' ]?.startsWith( 'downshift-null' )
	) {
		delete menuProps[ 'aria-activedescendant' ];
	}

	const toggleButtonProps = getToggleButtonProps( {
		// This is needed because some speech recognition software don't support `aria-labelledby`.
		'aria-label': label,
		'aria-labelledby': undefined,
		className: 'components-custom-select-control__button',
		isSmall: true,
		describedBy: getDescribedBy(),
	} );

	// Merge the toggle button's ref and the anchorRef so that the anchorRef can be
	// used for calculating the Popover position based on the size of the button.
	const buttonRef = useMergeRefs( [ toggleButtonProps.ref, anchorRef ] );

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
			<Button { ...toggleButtonProps } ref={ buttonRef }>
				{ buttonResizeListener }
				{ itemToString( selectedItem ) }
				<Icon
					icon={ chevronDown }
					className="components-custom-select-control__button-icon"
				/>
			</Button>
			<OptionList isOpen={ isOpen } anchorRef={ anchorRef }>
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
										item.className,
										'components-custom-select-control__item',
										{
											'is-highlighted':
												index === highlightedIndex,
											'has-hint': !! item.__experimentalHint,
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
			</OptionList>
		</div>
	);
}
