import { addFilter } from '@wordpress/hooks';
import { TextControl, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { hasBlockSupport } from '@wordpress/blocks';
import type { BlockType } from '@wordpress/blocks';
import { InspectorControls } from '../components';
import { useBlockEditingMode } from '../components/block-editing-mode';
import type { AnchorAttributes, AnchorEditProps } from './types';

/**
 * Regular expression matching invalid anchor characters for replacement.
 */
const ANCHOR_REGEX = /[\s#]/g;

/**
 * Filters registered block settings, extending attributes with anchor using ID
 * of the first node.
 *
 * @param settings Original block settings.
 *
 * @return Filtered block settings.
 */
export function addAttribute( settings: BlockType ): BlockType {
	// Allow blocks to specify their own attribute definition with default values if needed.
	if ( 'type' in ( settings.attributes?.anchor ?? {} ) ) {
		return settings;
	}
	if ( hasBlockSupport( settings, 'anchor' ) ) {
		// Gracefully handle if settings.attributes is undefined.
		settings.attributes = {
			...settings.attributes,
			anchor: {
				type: 'string',
			},
		};
	}

	return settings;
}

function BlockEditAnchorControlPure( {
	anchor,
	setAttributes,
}: AnchorEditProps ) {
	const blockEditingMode = useBlockEditingMode();

	if ( blockEditingMode !== 'default' ) {
		return null;
	}

	return (
		<InspectorControls group="advanced">
			<TextControl
				className="html-anchor-control"
				label={ __( 'HTML anchor' ) }
				help={
					<>
						{ __(
							'Enter a word or two—without spaces—to make a unique web address just for this block, called an “anchor”. Then, you’ll be able to link directly to this section of your page.'
						) }{ ' ' }
						<ExternalLink
							href={ __(
								'https://wordpress.org/documentation/article/page-jumps/'
							) }
						>
							{ __( 'Learn more about anchors' ) }
						</ExternalLink>
					</>
				}
				value={ anchor || '' }
				// @ts-expect-error React types `placeholder` as a string, the runtime omits `null`.
				placeholder={ null }
				onChange={ ( nextValue ) => {
					nextValue = nextValue.replace( ANCHOR_REGEX, '-' );
					setAttributes( {
						anchor: nextValue !== '' ? nextValue : undefined,
					} );
				} }
				autoCapitalize="none"
				autoComplete="off"
			/>
		</InspectorControls>
	);
}

export default {
	addSaveProps,
	edit: BlockEditAnchorControlPure,
	attributeKeys: [ 'anchor' ],
	hasSupport( name: string | BlockType ) {
		return hasBlockSupport( name, 'anchor' );
	},
};

/**
 * Override props assigned to save component to inject anchor ID, if block
 * supports anchor. This is only applied if the block's save result is an
 * element and not a markup string.
 *
 * @param extraProps Additional props applied to save element.
 * @param blockType  Block type.
 * @param attributes Current block attributes.
 *
 * @return Filtered props applied to save element.
 */
export function addSaveProps(
	extraProps: Record< string, unknown >,
	blockType: BlockType,
	attributes: AnchorAttributes
): Record< string, unknown > {
	if ( hasBlockSupport( blockType, 'anchor' ) ) {
		extraProps.id = attributes.anchor === '' ? null : attributes.anchor;
	}

	return extraProps;
}

addFilter( 'blocks.registerBlockType', 'core/anchor/attribute', addAttribute );
