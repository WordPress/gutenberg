/**
 * External dependencies
 */
import classnames from 'classnames';
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
/**
 * Internal dependencies
 */
import {
	Icon,
	SelectControl,
} from '../';
import { __ } from '@wordpress/i18n';

import {
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import sizesTable, { findSizeBySlug } from './sizes';

export function DimensionControl( props ) {
	const { label, value, sizes = sizesTable, icon, onChange, className = '' } = props;

	const onChangeSpacingSize = ( val ) => {
		const theSize = findSizeBySlug( sizes, val );

		if ( ! theSize || value === theSize.slug ) {
			onChange( undefined );
		} else if ( isFunction( onChange ) ) {
			onChange( theSize.slug );
		}
	};

	const formatSizesAsOptions = ( theSizes ) => {
		const options = theSizes.map( ( { name, slug } ) => ( {
			label: name,
			value: slug,
		} ) );

		return [ {
			label: __( 'Default' ),
			value: '',
		} ].concat( options );
	};

	const selectLabel = (
		<Fragment>
			{ icon && (
				<Icon
					icon={ icon }
				/>
			) }
			{ label }
		</Fragment>
	);

	return (
		<SelectControl
			className={ classnames( className, 'block-editor-dimension-control' ) }
			label={ selectLabel }
			hideLabelFromVision={ false }
			value={ value }
			onChange={ onChangeSpacingSize }
			options={ formatSizesAsOptions( sizes ) }
		/>
	);
}

export default DimensionControl;
