/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const noop = () => {};

export function BlockModeToggle( {
	blockType,
	mode,
	onToggleMode,
	small = false,
	isCodeEditingEnabled = true,
} ) {
	if (
		! blockType ||
		! hasBlockSupport( blockType, 'html', true ) ||
		! isCodeEditingEnabled
	) {
		return null;
	}

	const label =
		mode === 'visual' ? __( 'Edit as HTML' ) : __( 'Edit visually' );

	return <MenuItem onClick={ onToggleMode }>{ ! small && label }</MenuItem>;
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock, getBlockMode, getSettings } =
			select( blockEditorStore );
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
			dispatch( blockEditorStore ).toggleBlockMode( clientId );
			onToggle();
		},
	} ) ),
] )( BlockModeToggle );
