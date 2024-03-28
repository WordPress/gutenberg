/**
 * WordPress dependencies
 */
import { useId, useState } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { hasBlockSupport } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';
import { Button, BaseControl } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { InspectorControls } from '../components';
import { BlockRenameModal } from '../components/block-rename';
import isEmptyString from '../components/block-rename/is-empty-string';
import { useBlockDisplayInformation } from '../';

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

function BlockRenameControlPure( { clientId, metadata, setAttributes } ) {
	const id = useId();
	const [ isRenameModalOpen, setIsRenameModalOpen ] = useState( false );
	const blockName = metadata?.name;
	const blockInformation = useBlockDisplayInformation( clientId );
	const hasOverrides = !! blockName && !! metadata?.bindings;

	return (
		<>
			<InspectorControls group="advanced">
				<BaseControl
					id={ id }
					label={ __( 'Block name' ) }
					help={
						blockName
							? __(
									'Naming a block will help people understand its purpose. This block can be overridden in instances that might rely on this name. Renaming this block may break their connections.'
							  )
							: __(
									'Naming a block will help people understand its purpose.'
							  )
					}
				>
					<Button
						className="block-editor-hooks__block-renaming-button"
						variant="secondary"
						isDestructive={ hasOverrides }
						onClick={ () => setIsRenameModalOpen( true ) }
					>
						{ blockName
							? sprintf(
									// translators: %s: block name
									__( '%s (rename)' ),
									blockName
							  )
							: __( 'Rename' ) }
					</Button>
				</BaseControl>
			</InspectorControls>

			{ isRenameModalOpen && (
				<BlockRenameModal
					blockName={ blockName || '' }
					originalBlockName={ blockInformation?.title }
					onClose={ () => setIsRenameModalOpen( false ) }
					hasOverridesWarning={ hasOverrides }
					onSave={ ( newName ) => {
						// If the new value is the block's original name (e.g. `Group`)
						// or it is an empty string then assume the intent is to reset
						// the value. Therefore reset the metadata.
						if (
							newName === blockInformation?.title ||
							isEmptyString( newName )
						) {
							newName = undefined;
						}

						setAttributes( {
							metadata: { ...metadata, name: newName },
						} );
					} }
				/>
			) }
		</>
	);
}

export default {
	edit: BlockRenameControlPure,
	attributeKeys: [ 'metadata' ],
	hasSupport( name ) {
		return hasBlockSupport( name, 'renaming', true );
	},
};

addFilter(
	'blocks.registerBlockType',
	'core/metadata/addLabelCallback',
	addLabelCallback
);
