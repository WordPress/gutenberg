/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	Toolbar,
	ToolbarButton,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import UngroupIcon from './icon';

export function UngroupButton( {
	onConvertFromGroup,
	isUngroupable = false,
} ) {
	if ( ! isUngroupable ) {
		return null;
	}
	return (
		<Toolbar>
			<ToolbarButton
				title={ __( 'Ungroup' ) }
				icon={ UngroupIcon }
				onClick={ onConvertFromGroup }
			/>
		</Toolbar>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getSelectedBlockClientId,
			getBlock,
		} = select( 'core/block-editor' );

		const {
			getGroupingBlockName,
		} = select( 'core/blocks' );

		const selectedId = getSelectedBlockClientId();
		const selectedBlock = getBlock( selectedId );

		const groupingBlockName = getGroupingBlockName();

		const isUngroupable = selectedBlock && selectedBlock.innerBlocks && !! selectedBlock.innerBlocks.length && selectedBlock.name === groupingBlockName;
		const innerBlocks = isUngroupable ? selectedBlock.innerBlocks : [];

		return {
			isUngroupable,
			clientId: selectedId,
			innerBlocks,
		};
	} ),
	withDispatch( ( dispatch, { clientId, innerBlocks, onToggle = noop } ) => {
		const {
			replaceBlocks,
		} = dispatch( 'core/block-editor' );

		return {
			onConvertFromGroup() {
				if ( ! innerBlocks.length ) {
					return;
				}

				replaceBlocks(
					clientId,
					innerBlocks
				);

				onToggle();
			},
		};
	} ),
] )( UngroupButton );
