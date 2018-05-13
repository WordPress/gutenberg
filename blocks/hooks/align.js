/**
 * External dependencies
 */
import classnames from 'classnames';
import { assign, includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import {
	getBlockValidAlignments,
	hasBlockSupport,
} from '../api';

/**
 * Filters registered block settings, extending attributes to include `align`.
 *
 * @param  {Object} settings Original block settings
 * @return {Object}          Filtered block settings
 */
export function addAttribute( settings ) {
	if ( hasBlockSupport( settings, 'align' ) ) {
		// Use Lodash's assign to gracefully handle if attributes are undefined
		settings.attributes = assign( settings.attributes, {
			align: {
				type: 'string',
			},
		} );
	}

	return settings;
}

/**
 * Override props assigned to save component to inject alignment class name if
 * block supports it.
 *
 * @param  {Object} props      Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @param  {Object} attributes Block attributes
 * @return {Object}            Filtered props applied to save element
 */
export function addAssignedAlign( props, blockType, attributes ) {
	const { align } = attributes;

	if ( includes( getBlockValidAlignments( blockType ), align ) ) {
		props.className = classnames( `align${ align }`, props.className );
	}

	return props;
}

addFilter( 'blocks.registerBlockType', 'core/align/addAttribute', addAttribute );
addFilter( 'blocks.getSaveContent.extraProps', 'core/align/addAssignedAlign', addAssignedAlign );

