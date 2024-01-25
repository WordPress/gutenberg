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
import { forwardRef, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import BaseControl from '../base-control';
import type { WordPressComponentProps } from '../context/wordpress-component';
import type { SearchControlProps } from './types';
import type { ForwardedRef } from 'react';

function UnforwardedSearchControl(
	{
		__nextHasNoMarginBottom,
		__next40pxDefaultSize = false,
		className,
		onChange,
		onKeyDown,
		value,
		label,
		placeholder = __( 'Search' ),
		hideLabelFromVision = true,
		help,
		onClose,
		size = 'default',
		...restProps
	}: WordPressComponentProps< SearchControlProps, 'input', false >,
	forwardedRef: ForwardedRef< HTMLInputElement >
) {
	const searchRef = useRef< HTMLInputElement >();
	const instanceId = useInstanceId( SearchControl );
	const id = `components-search-control-${ instanceId }`;

	const renderRightButton = () => {
		if ( onClose ) {
			return (
				<Button
					__next40pxDefaultSize={ __next40pxDefaultSize }
					icon={ closeSmall }
					label={ __( 'Close search' ) }
					onClick={ onClose }
					size={ size }
				/>
			);
		}

		if ( !! value ) {
			return (
				<Button
					__next40pxDefaultSize={ __next40pxDefaultSize }
					icon={ closeSmall }
					label={ __( 'Reset search' ) }
					onClick={ () => {
						onChange( '' );
						searchRef.current?.focus();
					} }
					size={ size }
				/>
			);
		}

		return <Icon icon={ search } />;
	};

	return (
		<BaseControl
			__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
			label={ label }
			id={ id }
			hideLabelFromVision={ hideLabelFromVision }
			help={ help }
			className={ classnames( className, 'components-search-control', {
				'is-next-40px-default-size': __next40pxDefaultSize,
				'is-size-compact': size === 'compact',
			} ) }
		>
			<div className="components-search-control__input-wrapper">
				<input
					{ ...restProps }
					ref={ useMergeRefs( [ searchRef, forwardedRef ] ) }
					className="components-search-control__input"
					id={ id }
					type="search"
					placeholder={ placeholder }
					onChange={ ( event ) => onChange( event.target.value ) }
					onKeyDown={ onKeyDown }
					autoComplete="off"
					value={ value || '' }
				/>
				<div className="components-search-control__icon">
					{ renderRightButton() }
				</div>
			</div>
		</BaseControl>
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
