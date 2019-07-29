/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Icon,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import { withInstanceId } from '@wordpress/compose';

import {
	Fragment,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import sizesTable, { findSizeBySlug } from './sizes';

export function DimensionControl( props ) {
	const { label, icon, iconLabel = 'all', currentSize, onSpacingChange = noop, onReset = noop, className = '' } = props;

	/**
	 * Determines the size from the size slug (eg: `medium`)
	 * and decides whether to call the change or reset callback
	 * handlers
	 * @param  {string} val the DOMEvent event.target
	 * @return {void}
	 */
	const onChangeSpacingSize = ( val ) => {
		const theSize = findSizeBySlug( sizesTable, val );

		if ( ! theSize || currentSize === theSize.slug ) {
			resetSpacing();
		} else {
			onSpacingChange( theSize.slug );
		}
	};

	/**
	 * Applies the callback to handle resetting
	 * a dimension spacing values
	 * @return {void}
	 */
	const resetSpacing = () => onReset();

	/**
	 * Converts the sizes lookup tablet
	 * to a format suitable for use in the
	 * <SelectControl /> options prop
	 * @param  {Array} sizes the sizes
	 * @return {Array}       the array of options
	 */
	const formatSizesAsOptions = ( sizes ) => {
		const options = sizes.map( ( { name, slug } ) => ( {
			label: name,
			value: slug,
		} ) );

		return [ {
			label: __( 'Please select…' ),
			value: '',
		} ].concat( options );
	};

	const selectLabel = (
		<Fragment>
			{ icon && (
				<Icon
					icon={ icon }
					label={ iconLabel || '' }
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
			value={ currentSize }
			onChange={ onChangeSpacingSize }
			options={ formatSizesAsOptions( sizesTable ) }
		/>
	);
}

export default withInstanceId( DimensionControl );
