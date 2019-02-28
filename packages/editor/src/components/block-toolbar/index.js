/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { Fragment } from '@wordpress/element';
import { IconButton, Toolbar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BlockSwitcher from '../block-switcher';
import MultiBlocksSwitcher from '../block-switcher/multi-blocks-switcher';
import BlockControls from '../block-controls';
import BlockFormatControls from '../block-format-controls';
import BlockSettingsMenu from '../block-settings-menu';

function BlockToolbar( { blockClientIds, isValid, mode, rootClientId, onSelectBlock } ) {
	if ( blockClientIds.length === 0 ) {
		return null;
	}

	if ( blockClientIds.length > 1 ) {
		return (
			<div className="editor-block-toolbar">
				<MultiBlocksSwitcher />
				<BlockSettingsMenu clientIds={ blockClientIds } />
			</div>
		);
	}

	return (
		<div className="editor-block-toolbar">
			{ mode === 'visual' && isValid && (
				<Fragment>
					{ rootClientId && <Toolbar>
						<IconButton
							label={ __( 'Select Parent Block' ) }
							icon="undo"
							onClick={ () => onSelectBlock( rootClientId ) }
						/>
					</Toolbar> }
					<BlockSwitcher clientIds={ blockClientIds } />
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</Fragment>
			) }
			<BlockSettingsMenu clientIds={ blockClientIds } />
		</div>
	);
}

export default compose(
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlockMode,
			getMultiSelectedBlockClientIds,
			isBlockValid,
			getBlockRootClientId,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const blockClientIds = selectedBlockClientId ?
			[ selectedBlockClientId ] :
			getMultiSelectedBlockClientIds();

		return {
			blockClientIds,
			isValid: selectedBlockClientId ? isBlockValid( selectedBlockClientId ) : null,
			mode: selectedBlockClientId ? getBlockMode( selectedBlockClientId ) : null,
			rootClientId: selectedBlockClientId ? getBlockRootClientId( selectedBlockClientId ) : null,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onSelectBlock( id ) {
			dispatch( 'core/block-editor' ).selectBlock( id );
		},
	} ) ),
)( BlockToolbar );
