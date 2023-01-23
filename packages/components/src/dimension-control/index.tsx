/**
 * External dependencies
 */
import classnames from 'classnames';

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
import type { SelectControlProps } from '../select-control/types';

export function DimensionControl( props: DimensionControlProps ) {
	const {
		label,
		value,
		sizes = sizesTable,
		icon,
		onChange,
		className = '',
	} = props;

	const onChangeSpacingSize: SelectControlProps[ 'onChange' ] = ( val ) => {
		const theSize = findSizeBySlug( sizes, val as string );

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
			className={ classnames(
				className,
				'block-editor-dimension-control'
			) }
			label={ selectLabel }
			hideLabelFromVision={ false }
			value={ value }
			onChange={ onChangeSpacingSize }
			options={ formatSizesAsOptions( sizes ) }
		/>
	);
}

export default DimensionControl;
