/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';

const htmlElementMessages = {
	header: __(
		'The <header> element should represent introductory content, typically a group of introductory or navigational aids.'
	),
	main: __(
		'The <main> element should be used for the primary content of your document only. '
	),
	section: __(
		"The <section> element should represent a standalone portion of the document that can't be better represented by another element."
	),
	article: __(
		'The <article> element should represent a self contained, syndicatable portion of the document.'
	),
	aside: __(
		"The <aside> element should represent a portion of a document whose content is only indirectly related to the document's main content."
	),
	footer: __(
		'The <footer> element should represent a footer for its nearest sectioning element (e.g.: <section>, <article>, <main> etc.).'
	),
	nav: __(
		'The <nav> element should represent a navigation element (e.g. a list of links).'
	),
};

const DEFAULT_OPTIONS = [
	{ label: '<div>', value: 'div' },
	{ label: '<header>', value: 'header' },
	{ label: '<main>', value: 'main' },
	{ label: '<section>', value: 'section' },
	{ label: '<article>', value: 'article' },
	{ label: '<aside>', value: 'aside' },
	{ label: '<footer>', value: 'footer' },
	{ label: '<nav>', value: 'nav' },
];

/**
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addAttribute( settings ) {
	/*if ( hasBlockSupport( settings, '__experimentalTagName', true ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings?.attributes,
			tagName: {
				type: 'string',
			},
		};
	}*/

	return settings;
}

/**
 * Override the default edit UI to include a new block inspector control for
 * assigning the custom tag name, if block supports custom tag.
 *
 * @param {WPComponent} BlockEdit Original component.
 *
 * @return {WPComponent} Wrapped component.
 */
export const withInspectorControl = createHigherOrderComponent(
	( BlockEdit ) => {
		return ( props ) => {
			const hasCustomTagName = hasBlockSupport(
				props.name, // block name
				'__experimentalTagName',
				true
			);
			const options = DEFAULT_OPTIONS;
			const value = props.attributes.tagName || '';
			if ( hasCustomTagName && props.isSelected ) {
				return (
					<>
						<BlockEdit { ...props } />
						<InspectorControls __experimentalGroup="advanced">
							<SelectControl
								label={ __( 'HTML element' ) }
								options={ options }
								value={ value }
								onChange={ ( nextValue ) => {
									props.setAttributes( {
										tagName:
											nextValue !== ''
												? nextValue
												: undefined,
									} );
								} }
								help={ htmlElementMessages[ value ] }
							/>
						</InspectorControls>
					</>
				);
			}

			return <BlockEdit { ...props } />;
		};
	},
	'withInspectorControl'
);

/**
 * Override props assigned to save component to change the tag, if block
 * supports custom tags. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param {Object} extraProps Additional props applied to save element.
 * @param {Object} blockType  Block type.
 * @param {Object} attributes Current block attributes.
 *
 * @return {Object} Filtered props applied to save element.
 */
export function addSaveProps( extraProps, blockType, attributes ) {
	if (
		hasBlockSupport( blockType, '__experimentalTagName', true ) &&
		attributes.tagName
	) {
		extraProps.tagName = attributes.tagName;
	}

	return extraProps;
}

export function addTransforms( result, source, index, results ) {
	if ( ! hasBlockSupport( result.name, '__experimentalTagName', true ) ) {
		return result;
	}

	// If we are transforming one block to multiple blocks or multiple blocks to one block,
	// we ignore the tag during the transform.
	if (
		( results.length === 1 && source.length > 1 ) ||
		( results.length > 1 && source.length === 1 )
	) {
		return result;
	}

	// If we are in presence of transform between one or more block in the source
	// that have one or more blocks in the result
	// we apply the tag on source N to the result N,
	// if source N does not exists we do nothing.
	if ( source[ index ] ) {
		const originTagName = source[ index ]?.attributes.tagName;
		if ( originTagName ) {
			return {
				...result,
				attributes: {
					...result.attributes,
					tagName: originTagName,
				},
			};
		}
	}
	return result;
}

addFilter(
	'blocks.registerBlockType',
	'core/custom-tag-name/attribute',
	addAttribute
);
addFilter(
	'editor.BlockEdit',
	'core/editor/custom-tag-name/with-inspector-control',
	withInspectorControl
);

/*
This adds tagname="div" which is not what we want!
addFilter(
	'blocks.getSaveContent.extraProps',
	'core/custom-tag-name/save-props',
	addSaveProps
);
*/

addFilter(
	'blocks.switchToBlockType.transformedBlock',
	'core/custom-tag-name/addTransforms',
	addTransforms
);
