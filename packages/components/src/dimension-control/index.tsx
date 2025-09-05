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
import { ContextSystemProvider } from '../context';
import deprecated from '@wordpress/deprecated';
import { maybeWarnDeprecated36pxSize } from '../utils/deprecated-36px-size';

const CONTEXT_VALUE = {
	BaseControl: {
		// Temporary during deprecation grace period: Overrides the underlying `__associatedWPComponentName`
		// via the context system to override the value set by SelectControl.
		_overrides: { __associatedWPComponentName: 'DimensionControl' },
	},
};

/**
 * `DimensionControl` is a component designed to provide a UI to control spacing and/or dimensions.
 *
 * @deprecated
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
 * 			__next40pxDefaultSize
 * 			__nextHasNoMarginBottom
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
		__nextHasNoMarginBottom = false,
		label,
		value,
		sizes = sizesTable,
		icon,
		onChange,
		className = '',
	} = props;

	deprecated( 'wp.components.DimensionControl', {
		since: '6.7',
		version: '7.0',
	} );

	maybeWarnDeprecated36pxSize( {
		componentName: 'DimensionControl',
		__next40pxDefaultSize,
		size: undefined,
	} );

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
		<ContextSystemProvider value={ CONTEXT_VALUE }>
			<SelectControl
				__next40pxDefaultSize={ __next40pxDefaultSize }
				__shouldNotWarnDeprecated36pxSize
				__nextHasNoMarginBottom={ __nextHasNoMarginBottom }
				className={ clsx(
					className,
					'block-editor-dimension-control'
				) }
				label={ selectLabel }
				hideLabelFromVision={ false }
				value={ value }
				onChange={ onChangeSpacingSize }
				options={ formatSizesAsOptions( sizes ) }
			/>
		</ContextSystemProvider>
	);
}

export default DimensionControl;
