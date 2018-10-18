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

export function BlockModeToggle( { blockType, mode, onToggleMode, small = false } ) {
	if ( ! hasBlockSupport( blockType, 'html', true ) ) {
		return null;
	}

	const label = mode === 'visual' ?
		__( 'Edit as HTML' ) :
		__( 'Edit visually' );

	return (
		<MenuItem
			className="editor-block-settings-menu__control"
			onClick={ onToggleMode }
			icon="html"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</MenuItem>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock, getBlockMode } = select( 'core/editor' );
		const block = getBlock( clientId );

		return {
			mode: getBlockMode( clientId ),
			blockType: block ? getBlockType( block.name ) : null,
		};
	} ),
	withDispatch( ( dispatch, { onToggle = noop, clientId } ) => ( {
		onToggleMode() {
			dispatch( 'core/editor' ).toggleBlockMode( clientId );
			onToggle();
		},
	} ) ),
] )( BlockModeToggle );
