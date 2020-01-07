/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

export function BlockModeToggle( { blockType, mode, onToggleMode, small = false, isCodeEditingEnabled = true } ) {
	if ( ! hasBlockSupport( blockType, 'html', true ) || ! isCodeEditingEnabled ) {
		return null;
	}

	const label = mode === 'visual' ?
		__( 'Edit as HTML' ) :
		__( 'Edit visually' );

	return (
		<MenuItem
			onClick={ onToggleMode }
			icon="html"
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock, getBlockMode, getSettings } = select( 'core/block-editor' );
		const block = getBlock( clientId );
		const isCodeEditingEnabled = getSettings().codeEditingEnabled;

		return {
			mode: getBlockMode( clientId ),
			blockType: block ? getBlockType( block.name ) : null,
			isCodeEditingEnabled,
		};
	} ),
	withDispatch( ( dispatch, { onToggle = noop, clientId } ) => ( {
		onToggleMode() {
			dispatch( 'core/block-editor' ).toggleBlockMode( clientId );
			onToggle();
		},
	} ) ),
] )( BlockModeToggle );
