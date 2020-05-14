/**
 * External dependencies
 */
import { differenceBy, noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { unregisterBlockType } from '@wordpress/blocks';

const UNINSTALL_ERROR_NOTICE_ID = 'block-uninstall-error';

export class AutoBlockUninstaller extends Component {
	componentDidUpdate( prevProps ) {
		// If the document is being saved, delete unused blocks
		if ( this.props.isSavingPost && ! prevProps.isSavingPost ) {
			this.props.blocksToUninstall.forEach( ( blockType ) => {
				this.props.uninstallBlock( blockType, noop, () => {
					this.props.createWarningNotice(
						__( "Block previews can't uninstall." ),
						{
							id: UNINSTALL_ERROR_NOTICE_ID,
						}
					);
				} );
				unregisterBlockType( blockType.name );
			} );
		}
	}

	render() {
		return null;
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getInstalledBlockTypes } = select( 'core/block-directory' );
		const { isSavingPost } = select( 'core/editor' );
		const { getBlocks } = select( 'core/block-editor' );

		const downloadableBlocksToUninstall = differenceBy(
			getInstalledBlockTypes(),
			getBlocks(),
			'name'
		);

		return {
			isSavingPost: isSavingPost(),
			blocksToUninstall: downloadableBlocksToUninstall,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { createWarningNotice } = dispatch( 'core/notices' );
		const { uninstallBlock } = dispatch( 'core/block-directory' );

		return {
			createWarningNotice,
			uninstallBlock,
		};
	} ),
] )( AutoBlockUninstaller );
