/**
 * External dependencies
 */
import clsx from 'clsx';

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
import { StyledInputControl, SuffixItemWrapper } from './styles';

function SuffixItem( {
	searchRef,
	value,
	onChange,
	onClose,
}: SuffixItemProps ) {
	if ( ! onClose && ! value ) {
		return <Icon icon={ search } />;
	}

	const onReset = () => {
		onChange( '' );
		searchRef.current?.focus();
	};

	return (
		<Button
			size="small"
			icon={ closeSmall }
			label={ onClose ? __( 'Close search' ) : __( 'Reset search' ) }
			onClick={ onClose ?? onReset }
		/>
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
	}: Omit<
		WordPressComponentProps< SearchControlProps, 'input', false >,
		// TODO: Background styling currently doesn't support a disabled state. Needs design work.
		'disabled'
	>,
	forwardedRef: ForwardedRef< HTMLInputElement >
) {
	// @ts-expect-error The `disabled` prop is not yet supported in the SearchControl component.
	// Work with the design team (@WordPress/gutenberg-design) if you need this feature.
	delete restProps.disabled;

	const searchRef = useRef< HTMLInputElement >( null );
	const instanceId = useInstanceId(
		SearchControl,
		'components-search-control'
	);

	const contextValue = useMemo(
		() => ( {
			BaseControl: {
				// Overrides the underlying BaseControl `__nextHasNoMarginBottom` via the context system
				// to provide backwards compatibile margin for SearchControl.
				// (In a standard InputControl, the BaseControl `__nextHasNoMarginBottom` is always set to true.)
				_overrides: { __nextHasNoMarginBottom },
				__associatedWPComponentName: 'SearchControl',
			},
			// `isBorderless` is still experimental and not a public prop for InputControl yet.
			InputBase: { isBorderless: true },
		} ),
		[ __nextHasNoMarginBottom ]
	);

	return (
		<ContextSystemProvider value={ contextValue }>
			<StyledInputControl
				__next40pxDefaultSize
				id={ instanceId }
				hideLabelFromVision={ hideLabelFromVision }
				label={ label }
				ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
				type="search"
				size={ size }
				className={ clsx( 'components-search-control', className ) }
				onChange={ ( nextValue?: string ) =>
					onChange( nextValue ?? '' )
				}
				autoComplete="off"
				placeholder={ placeholder }
				value={ value ?? '' }
				suffix={
					<SuffixItemWrapper size={ size }>
						<SuffixItem
							searchRef={ searchRef }
							value={ value }
							onChange={ onChange }
							onClose={ onClose }
						/>
					</SuffixItemWrapper>
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
