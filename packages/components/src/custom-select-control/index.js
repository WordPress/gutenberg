// @ts-nocheck
/**
 * External dependencies
 */
import { useSelect } from 'downshift';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, check } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import { VisuallyHidden } from '../visually-hidden';
import { Select as SelectControlSelect } from '../select-control/styles/select-control-styles';
import SelectControlChevronDown from '../select-control/chevron-down';
import { InputBaseWithBackCompatMinWidth } from './styles';
import { StyledLabel } from '../base-control/styles/base-control-styles';

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
		onMouseOver,
		onMouseOut,
		onFocus,
		onBlur,
		__experimentalShowSelectedHint = false,
	} = props;

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

	function handleOnFocus( e ) {
		setIsFocused( true );
		onFocus?.( e );
	}

	function handleOnBlur( e ) {
		setIsFocused( false );
		onBlur?.( e );
	}

	if ( ! __nextUnconstrainedWidth ) {
		deprecated(
			'Constrained width styles for wp.components.CustomSelectControl',
			{
				since: '6.1',
				version: '6.4',
				hint: 'Set the `__nextUnconstrainedWidth` prop to true to start opting into the new styles, which will become the default in a future version',
			}
		);
	}

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
				<StyledLabel
					{ ...getLabelProps( {
						className: 'components-custom-select-control__label',
					} ) }
				>
					{ label }
				</StyledLabel>
			) }
			<InputBaseWithBackCompatMinWidth
				__next36pxDefaultSize={ __next36pxDefaultSize }
				__nextUnconstrainedWidth={ __nextUnconstrainedWidth }
				isFocused={ isOpen || isFocused }
				__unstableInputWidth={
					__nextUnconstrainedWidth ? undefined : 'auto'
				}
				labelPosition={ __nextUnconstrainedWidth ? undefined : 'top' }
				size={ size }
				suffix={ <SelectControlChevronDown /> }
			>
				<SelectControlSelect
					onMouseOver={ onMouseOver }
					onMouseOut={ onMouseOut }
					as="button"
					onFocus={ handleOnFocus }
					onBlur={ handleOnBlur }
					selectSize={ size }
					__next36pxDefaultSize={ __next36pxDefaultSize }
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
			</InputBaseWithBackCompatMinWidth>
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

export function StableCustomSelectControl( props ) {
	return (
		<CustomSelectControl
			{ ...props }
			__experimentalShowSelectedHint={ false }
		/>
	);
}
