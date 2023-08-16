/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { getBlockSupport } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { BlockSettingsMenuControls } from '../components';

export const withBlockRenameControl = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { clientId, name: blockName } = props;

		const metaDataSupport = getBlockSupport(
			blockName,
			'__experimentalMetadata',
			false
		);

		const supportsBlockNaming = !! (
			true === metaDataSupport || metaDataSupport?.name
		);

		return (
			<>
				{ supportsBlockNaming && (
					<BlockSettingsMenuControls>
						{ ( { selectedClientIds } ) => {
							// Only enabled for single selections.
							const canRename =
								selectedClientIds.length === 1 &&
								clientId === selectedClientIds[ 0 ];

							// This check ensures
							// - the `BlockSettingsMenuControls` fill
							// doesn't render multiple times and also that it renders for
							// the block from which the menu was triggered.
							// - `Rename` only appears in the ListView options.
							// - `Rename` only appears for blocks that support renaming.
							if (
								// __unstableDisplayLocation !== 'list-view' ||
								! canRename
							) {
								return null;
							}

							return (
								<MenuItem onClick={ () => {} }>
									{ __( 'Rename' ) }
								</MenuItem>
							);
						} }
					</BlockSettingsMenuControls>
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
