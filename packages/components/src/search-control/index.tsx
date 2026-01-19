/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { search, closeSmall } from '@wordpress/icons';
import { forwardRef, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import Button from '../button';
import { InputControlPrefixWrapper } from '../input-control/input-prefix-wrapper';
import { InputControlSuffixWrapper } from '../input-control/input-suffix-wrapper';
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { SearchControlProps, SuffixItemProps } from './types';
import { StyledInputControl, StyledIcon } from './styles';

function SuffixItem( {
	searchRef,
	value,
	onChange,
	onClose,
}: SuffixItemProps ) {
	if ( ! onClose && ! value ) {
		return null;
	}

	if ( onClose ) {
		deprecated( '`onClose` prop in wp.components.SearchControl', {
			since: '6.8',
		} );
	}

	const onReset = () => {
		onChange( '' );
		searchRef.current?.focus();
	};

	return (
		<InputControlSuffixWrapper variant="control">
			<Button
				size="small"
				icon={ closeSmall }
				label={ onClose ? __( 'Close search' ) : __( 'Reset search' ) }
				onClick={ onClose ?? onReset }
			/>
		</InputControlSuffixWrapper>
	);
}

function UnforwardedSearchControl(
	{
		__nextHasNoMarginBottom: _, // Prevent passing to internal component
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
	const { disabled, ...filteredRestProps } = restProps;

	const searchRef = useRef< HTMLInputElement >( null );
	const instanceId = useInstanceId(
		SearchControl,
		'components-search-control'
	);

	return (
		<StyledInputControl
			__next40pxDefaultSize
			id={ instanceId }
			hideLabelFromVision={ hideLabelFromVision }
			label={ label }
			ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
			type="search"
			size={ size }
			className={ clsx( 'components-search-control', className ) }
			onChange={ ( nextValue?: string ) => onChange( nextValue ?? '' ) }
			autoComplete="off"
			placeholder={ placeholder }
			value={ value ?? '' }
			prefix={
				<InputControlPrefixWrapper variant="icon">
					<StyledIcon icon={ search } fill="currentColor" />
				</InputControlPrefixWrapper>
			}
			suffix={
				<SuffixItem
					searchRef={ searchRef }
					value={ value }
					onChange={ onChange }
					onClose={ onClose }
				/>
			}
			{ ...filteredRestProps }
		/>
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
