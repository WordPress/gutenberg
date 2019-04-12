/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { switchToBlockType } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { Group } from './icons';

export function ConvertToGroupButton( {
	onConvertToGroup,
	isVisible = true,
} ) {
	if ( ! isVisible ) {
		return null;
	}

	return (
		<Fragment>
			<MenuItem
				className="editor-block-settings-menu__control block-editor-block-settings-menu__control"
				icon={ Group }
				onClick={ onConvertToGroup }
			>
				{ __( 'Group' ) }
			</MenuItem>
		</Fragment>
	);
}

export default compose( [
	withSelect( ( select, { clientIds } ) => {
		const {
			getBlocksByClientId,
		} = select( 'core/block-editor' );

		const blocksToGroup = getBlocksByClientId( clientIds );

		const isSingleContainerBlock = blocksToGroup.length === 1 && blocksToGroup[ 0 ].name === 'core/group';

		const isGroupable = (
			blocksToGroup.length &&
			blocksToGroup[ 0 ] &&
			! isSingleContainerBlock
		);

		// Define any edge cases here
		const isVisible = isGroupable;

		return {
			isVisible,
			blocksToGroup,
		};
	} ),
	withDispatch( ( dispatch, { clientIds, onToggle = noop, blocksToGroup = [] } ) => {
		const {
			replaceBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			onConvertToGroup() {
				if ( ! blocksToGroup.length ) {
					return;
				}

				// Activate the `transform` on `core/group` which does the conversion
				const newBlocks = switchToBlockType( blocksToGroup, 'core/group' );

				if ( newBlocks ) {
					replaceBlocks(
						clientIds,
						newBlocks
					);
				}

				onToggle();
			},
		};
	} ),
] )( ConvertToGroupButton );
