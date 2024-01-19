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
import type { SearchControlProps } from './types';
import type { ForwardedRef } from 'react';
import { ContextSystemProvider } from '../context';
import {
	SearchIconWrapper,
	InputControlWithoutWebkitStyles,
	CloseIconWrapper,
} from './styles';

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
	const searchRef = useRef< HTMLInputElement >();
	const instanceId = useInstanceId(
		SearchControl,
		'components-search-control'
	);

	const SuffixItem = () => {
		if ( ! onClose && ! value ) {
			return null;
		}

		const onReset = () => {
			onChange( '' );
			searchRef.current?.focus();
		};

		return (
			<CloseIconWrapper size={ size }>
				<Button
					size="small"
					icon={ closeSmall }
					label={
						onClose ? __( 'Close search' ) : __( 'Reset search' )
					}
					onClick={ onClose ?? onReset }
				/>
			</CloseIconWrapper>
		);
	};

	// Overrides the underlying BaseControl `__nextHasNoMarginBottom` via the context system
	// to provide backwards compatibile margin for SearchControl.
	// (In a standard InputControl, the BaseControl `__nextHasNoMarginBottom` is always set to true.)
	const baseControlContextValue = useMemo(
		() => ( { BaseControl: { _overrides: { __nextHasNoMarginBottom } } } ),
		[ __nextHasNoMarginBottom ]
	);

	// TODO:
	// - comb the codebase for `components-search-control__*` selectors

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
					<SearchIconWrapper size={ size }>
						<Icon icon={ search } />
					</SearchIconWrapper>
				}
				suffix={ <SuffixItem /> }
				{ ...restProps }
			/>
		</ContextSystemProvider>

		// <BaseControl
		// 	__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
		// 	label={ label }
		// 	id={ id }
		// 	hideLabelFromVision={ hideLabelFromVision }
		// 	help={ help }
		// 	className={ classnames( className, 'components-search-control', {
		// 		'is-next-40px-default-size': __next40pxDefaultSize,
		// 		'is-size-compact': size === 'compact',
		// 	} ) }
		// >
		// 	<div className="components-search-control__input-wrapper">
		// 		<input
		// 			{ ...restProps }
		// 			ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
		// 			className="components-search-control__input"
		// 			id={ id }
		// 			type="search"
		// 			placeholder={ placeholder }
		// 			onChange={ ( event ) => onChange( event.target.value ) }
		// 			onKeyDown={ onKeyDown }
		// 			autoComplete="off"
		// 			value={ value || '' }
		// 		/>
		// 		<div className="components-search-control__icon">
		// 			{ renderRightButton() }
		// 		</div>
		// 	</div>
		// </BaseControl>
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
 *       value={ searchInput }
 *       onChange={ setSearchInput }
 *     />
 *   );
 * }
 * ```
 */
export const SearchControl = forwardRef( UnforwardedSearchControl );

export default SearchControl;
