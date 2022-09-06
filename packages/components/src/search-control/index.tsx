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
import type { WordPressComponentProps } from '../ui/context/wordpress-component';
import type { SearchControlProps } from './types';
import type { ForwardedRef } from 'react';

function UnforwardedSearchControl(
	{
		__nextHasNoMarginBottom,
		className,
		onChange,
		onKeyDown,
		value,
		label,
		placeholder = __( 'Search' ),
		hideLabelFromVision = true,
		help,
		onClose,
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
					icon={ closeSmall }
					label={ __( 'Close search' ) }
					onClick={ onClose }
				/>
			);
		}

		if ( !! value ) {
			return (
				<Button
					icon={ closeSmall }
					label={ __( 'Reset search' ) }
					onClick={ () => {
						onChange( '' );
						searchRef.current?.focus();
					} }
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
			className={ classnames( className, 'components-search-control' ) }
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
