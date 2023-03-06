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
import { Icon, SelectControl } from '../';
import sizesTable, { findSizeBySlug } from './sizes';

export function DimensionControl( props ) {
	const {
		label,
		value,
		sizes = sizesTable,
		icon,
		onChange,
		className = '',
	} = props;

	const onChangeSpacingSize = ( val ) => {
		const theSize = findSizeBySlug( sizes, val );

		if ( ! theSize || value === theSize.slug ) {
			onChange( undefined );
		} else if ( typeof onChange === 'function' ) {
			onChange( theSize.slug );
		}
	};

	const formatSizesAsOptions = ( theSizes ) => {
		const options = theSizes.map( ( { name, slug } ) => ( {
			label: name,
			value: slug,
		} ) );

		return [
			{
				label: __( 'Default' ),
				value: '',
			},
		].concat( options );
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
