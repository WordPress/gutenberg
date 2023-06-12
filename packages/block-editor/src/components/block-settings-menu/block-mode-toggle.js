/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { DropdownMenuItemV2 } = unlock( componentsPrivateApis );

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

	return (
		// TODO: check if this used in other legacy dropdown menus
		<DropdownMenuItemV2 onSelect={ onToggleMode }>
			{ /* TODO: what if `small` is true? What contents are displayed? */ }
			{ ! small && label }
		</DropdownMenuItemV2>
	);
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
