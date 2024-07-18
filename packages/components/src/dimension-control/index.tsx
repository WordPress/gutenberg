/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Icon from '../icon';
import SelectControl from '../select-control';
import sizesTable, { findSizeBySlug } from './sizes';
import type { DimensionControlProps, Size } from './types';
import type { SelectControlSingleSelectionProps } from '../select-control/types';

/**
 * `DimensionControl` is a component designed to provide a UI to control spacing and/or dimensions.
 *
 * This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
 *
 * ```jsx
 * import { __experimentalDimensionControl as DimensionControl } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * export default function MyCustomDimensionControl() {
 * 	const [ paddingSize, setPaddingSize ] = useState( '' );
 *
 * 	return (
 * 		<DimensionControl
 * 			label={ 'Padding' }
 * 			icon={ 'desktop' }
 * 			onChange={ ( value ) => setPaddingSize( value ) }
 * 			value={ paddingSize }
 * 		/>
 * 	);
 * }
 * ```
 */
export function DimensionControl( props: DimensionControlProps ) {
	const {
		__next40pxDefaultSize = false,
		label,
		value,
		sizes = sizesTable,
		icon,
		onChange,
		className = '',
	} = props;

	const onChangeSpacingSize: SelectControlSingleSelectionProps[ 'onChange' ] =
		( val ) => {
			const theSize = findSizeBySlug( sizes, val );

			if ( ! theSize || value === theSize.slug ) {
				onChange?.( undefined );
			} else if ( typeof onChange === 'function' ) {
				onChange( theSize.slug );
			}
		};

	const formatSizesAsOptions = ( theSizes: Size[] ) => {
		const options = theSizes.map( ( { name, slug } ) => ( {
			label: name,
			value: slug,
		} ) );

		return [
			{
				label: __( 'Default' ),
				value: '',
			},
			...options,
		];
	};

	const selectLabel = (
		<>
			{ icon && <Icon icon={ icon } /> }
			{ label }
		</>
	);

	return (
		<SelectControl
			__next40pxDefaultSize={ __next40pxDefaultSize }
			className={ clsx( className, 'block-editor-dimension-control' ) }
			label={ selectLabel }
			hideLabelFromVision={ false }
			value={ value }
			onChange={ onChangeSpacingSize }
			options={ formatSizesAsOptions( sizes ) }
		/>
	);
}

export default DimensionControl;
