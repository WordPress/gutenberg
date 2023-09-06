/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { useBlockEditContext } from '../components/block-edit';
import { store as blockEditorStore } from '../store';

export const PATTERN_SUPPORT_KEY = '__experimentalPattern';

// TODO: Extract this to a custom source file?
function useSourceAttributes( attributes ) {
	const { name, clientId } = useBlockEditContext();
	const dynamicContent = useSelect(
		( select ) => {
			const hasPatternSupport = select( blocksStore ).hasBlockSupport(
				name,
				PATTERN_SUPPORT_KEY
			);
			if ( ! hasPatternSupport ) return undefined;
			const parentPatternClientId = select(
				blockEditorStore
			).getBlockParentsByBlockName( clientId, 'core/block', true )[ 0 ];
			if ( ! parentPatternClientId ) return undefined;
			return select( blockEditorStore ).getBlockAttributes(
				parentPatternClientId
			).dynamicContent;
		},
		[ name, clientId ]
	);

	const attributesWithSourcedAttributes = useMemo( () => {
		const id = attributes.metadata?.id;

		if ( ! id || ! dynamicContent ) {
			return attributes;
		}

		return {
			...attributes,
			...dynamicContent[ id ],
		};
	}, [ attributes, dynamicContent ] );

	return attributesWithSourcedAttributes;
}

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
				const sourceAttributes = useSourceAttributes( attributes );

				return (
					<BlockEdit { ...props } attributes={ sourceAttributes } />
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
