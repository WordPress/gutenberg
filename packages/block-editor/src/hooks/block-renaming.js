/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { createHigherOrderComponent, pure } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { useBlockRename } from '../components/block-rename';

/**
 * Filters registered block settings, adding an `__experimentalLabel` callback if one does not already exist.
 *
 * @param {Object} settings Original block settings.
 *
 * @return {Object} Filtered block settings.
 */
export function addLabelCallback( settings ) {
	// If blocks provide their own label callback, do not override it.
	if ( settings.__experimentalLabel ) {
		return settings;
	}

	const supportsBlockNaming = hasBlockSupport(
		settings,
		'renaming',
		true // default value
	);

	// Check whether block metadata is supported before using it.
	if ( supportsBlockNaming ) {
		settings.__experimentalLabel = ( attributes, { context } ) => {
			const { metadata } = attributes;

			// In the list view, use the block's name attribute as the label.
			if ( context === 'list-view' && metadata?.name ) {
				return metadata.name;
			}
		};
	}

	return settings;
}

function BlockRenameControlPure( { name, metadata, setAttributes } ) {
	const { canRename } = useBlockRename( name );

	if ( ! canRename ) {
		return null;
	}

	return (
		<InspectorControls group="advanced">
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Block name' ) }
				value={ metadata?.name || '' }
				onChange={ ( newName ) => {
					setAttributes( {
						metadata: { ...metadata, name: newName },
					} );
				} }
			/>
		</InspectorControls>
	);
}

// We don't want block controls to re-render when typing inside a block. `pure`
// will prevent re-renders unless props change, so only pass the needed props
// and not the whole attributes object.
const BlockRenameControl = pure( BlockRenameControlPure );

export const withBlockRenameControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { name, attributes, setAttributes, isSelected } = props;
		return (
			<>
				{ isSelected && (
					<BlockRenameControl
						name={ name }
						// This component is pure, so only pass needed props!
						metadata={ attributes.metadata }
						setAttributes={ setAttributes }
					/>
				) }
				<BlockEdit key="edit" { ...props } />
			</>
		);
	},
	'withToolbarControls'
);

addFilter(
	'editor.BlockEdit',
	'core/block-rename-ui/with-block-rename-control',
	withBlockRenameControl
);

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addLabelCallback',
	addLabelCallback
);
