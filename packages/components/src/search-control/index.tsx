/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { Icon, search, closeSmall } from '@wordpress/icons';
import { forwardRef, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { SearchControlProps, SuffixItemProps } from './types';
import type { ForwardedRef } from 'react';
import { ContextSystemProvider } from '../context';
import {
	SearchIconWrapper,
	InputControlWithoutWebkitStyles,
	CloseIconWrapper,
} from './styles';

function SuffixItem( {
	searchRef,
	value,
	onChange,
	onClose,
}: SuffixItemProps ) {
	if ( ! onClose && ! value ) {
		return null;
	}

	const onReset = () => {
		onChange( '' );
		searchRef.current?.focus();
	};

	return (
		<CloseIconWrapper>
			<Button
				size="small"
				icon={ closeSmall }
				label={ onClose ? __( 'Close search' ) : __( 'Reset search' ) }
				onClick={ onClose ?? onReset }
			/>
		</CloseIconWrapper>
	);
}

function UnforwardedSearchControl(
	{
		__nextHasNoMarginBottom = false,
		className,
		onChange,
		value,
		label = __( 'Search' ),
		placeholder = __( 'Search' ),
		hideLabelFromVision = true,
		onClose,
		size = 'default',
		...restProps
	}: WordPressComponentProps< SearchControlProps, 'input', false >,
	forwardedRef: ForwardedRef< HTMLInputElement >
) {
	const searchRef = useRef< HTMLInputElement >( null );
	const instanceId = useInstanceId(
		SearchControl,
		'components-search-control'
	);

	// Overrides the underlying BaseControl `__nextHasNoMarginBottom` via the context system
	// to provide backwards compatibile margin for SearchControl.
	// (In a standard InputControl, the BaseControl `__nextHasNoMarginBottom` is always set to true.)
	const baseControlContextValue = useMemo(
		() => ( { BaseControl: { _overrides: { __nextHasNoMarginBottom } } } ),
		[ __nextHasNoMarginBottom ]
	);

	return (
		<ContextSystemProvider value={ baseControlContextValue }>
			<InputControlWithoutWebkitStyles
				__next40pxDefaultSize
				id={ instanceId }
				hideLabelFromVision={ hideLabelFromVision }
				label={ label }
				ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
				type="search"
				size={ size }
				className={ classnames(
					'components-search-control',
					className
				) }
				onChange={ ( nextValue?: string ) =>
					onChange( nextValue ?? '' )
				}
				autoComplete="off"
				placeholder={ placeholder }
				value={ value || '' }
				prefix={
					<SearchIconWrapper>
						<Icon icon={ search } />
					</SearchIconWrapper>
				}
				suffix={
					<SuffixItem
						searchRef={ searchRef }
						value={ value }
						onChange={ onChange }
						onClose={ onClose }
					/>
				}
				{ ...restProps }
			/>
		</ContextSystemProvider>
	);
}

/**
 * SearchControl components let users display a search control.
 *
 * ```jsx
 * import { SearchControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * function MySearchControl( { className, setState } ) {
 *   const [ searchInput, setSearchInput ] = useState( '' );
 *
 *   return (
 *     <SearchControl
 *       __nextHasNoMarginBottom
 *       value={ searchInput }
 *       onChange={ setSearchInput }
 *     />
 *   );
 * }
 * ```
 */
export const SearchControl = forwardRef( UnforwardedSearchControl );

export default SearchControl;
