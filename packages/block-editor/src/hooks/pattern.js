/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { getBlockSupport } from '@wordpress/blocks';

export const PATTERN_SUPPORT_KEY = '__experimentalPattern';

function hasPatternSupport( blockType ) {
	return !! getBlockSupport( blockType, PATTERN_SUPPORT_KEY );
}

/**
 * Filters registered block settings, extending usesContext to include the
 * dynamic content and setter provided by a pattern block.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
function extendUsesContext( settings ) {
	if ( ! hasPatternSupport( settings ) ) {
		return settings;
	}

	if ( ! Array.isArray( settings.usesContext ) ) {
		settings.usesContext = [ 'dynamicContent', 'setDynamicContent' ];
		return settings;
	}

	if ( ! settings.usesContext.includes( 'dynamicContent' ) ) {
		settings.usesContext.push( 'dynamicContent' );
	}

	if ( ! settings.usesContext.includes( 'setDynamicContent' ) ) {
		settings.usesContext.push( 'setDynamicContent' );
	}

	return settings;
}

addFilter(
	'blocks.registerBlockType',
	'core/pattern/extendUsesContext',
	extendUsesContext
);
