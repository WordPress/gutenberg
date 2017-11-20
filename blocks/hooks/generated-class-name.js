/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import { hasBlockSupport, getBlockDefaultClassname } from '../api';

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param  {Object} extraProps Additional props applied to save element
 * @param  {Object} blockType  Block type
 * @return {Object}            Filtered props applied to save element
 */
export function addGeneratedClassName( extraProps, blockType ) {
	// Adding the generated className
	if ( hasBlockSupport( blockType, 'generatedClassName', true ) ) {
		const updatedClassName = classnames(
			getBlockDefaultClassname( blockType.name ),
			extraProps.className,
		);
		extraProps.className = updatedClassName;
	}

	return extraProps;
}

export default function generatedClassName( { addFilter } ) {
	addFilter( 'getSaveContent.extraProps', 'core\generated-class-name-save-props', addGeneratedClassName );
}
