/**
 * WordPress dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */

export const PATTERN_SUPPORT_KEY = '__experimentalPattern';

/**
 * Creates a higher order component that overrides the `attributes` and
 * `setAttributes` props to sync changes to the pattern's dynamic content
 * attribute. The original attributes should remain in tact so they can be used
 * as fallback content. The original attributes will be those set in the source
 * pattern's inner blocks.
 *
 * TODO: Double check that the last couple of sentences above are correct.
 */
const createEditFunctionWithPatternSource = () =>
	createHigherOrderComponent(
		( BlockEdit ) =>
			( { attributes, ...props } ) => {
				const registry = useRegistry();
				const sourceAttributes = registry._selectAttributes?.(
					props.clientId,
					attributes
				);

				return (
					<BlockEdit
						{ ...props }
						attributes={ sourceAttributes ?? attributes }
					/>
				);
			}
	);

function shimAttributeSource( settings ) {
	settings.edit = createEditFunctionWithPatternSource()( settings.edit );

	return settings;
}

if ( window.__experimentalPatterns ) {
	addFilter(
		'blocks.registerBlockType',
		'core/pattern/shimAttributeSource',
		shimAttributeSource
	);
}
