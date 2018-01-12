/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { hasBlockSupport, getBlockDefaultClassname } from '../api';

/**
 * Override props assigned to save component to inject generated className if block
 * supports it. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param  {Object} extraProps Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @return {Object}            Filtered props applied to save element
 */
export function addGeneratedClassName( extraProps, blockType ) {
	// Adding the generated className
	if ( hasBlockSupport( blockType, 'className', true ) ) {
		const blockDefaultClassname = getBlockDefaultClassname( blockType.name );

		const blockDefaultClassnameIsDupe = ( typeof( extraProps.className ) === 'string' &&
												extraProps.className.search( blockDefaultClassname ) !== -1 );

		if ( ! blockDefaultClassnameIsDupe ) {
			/**
			 * The block default classname has not been found in the
			 * existing className string. This is not a duplicate class,
			 * we can add the blockDefaultClassname to the set of classes.
			 */
			const updatedClassName = classnames(
				blockDefaultClassname,
				extraProps.className,
			);

			extraProps.className = updatedClassName;
		}
	}

	return extraProps;
}

addFilter( 'blocks.getSaveContent.extraProps', 'core/generated-class-name/save-props', addGeneratedClassName );
