/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItem } from '@wordpress/components';
import { getBlockType, hasBlockSupport } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const noop = () => {};

export default function BlockModeToggle( { clientId, onToggle = noop } ) {
	const { blockType, mode, isCodeEditingEnabled } = useSelect(
		( select ) => {
			const { getBlock, getBlockMode, getSettings } =
				select( blockEditorStore );
			const block = getBlock( clientId );

			return {
				mode: getBlockMode( clientId ),
				blockType: block ? getBlockType( block.name ) : null,
				isCodeEditingEnabled: getSettings().codeEditingEnabled,
			};
		},
		[ clientId ]
	);
	const { toggleBlockMode } = useDispatch( blockEditorStore );

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
		<MenuItem
			onClick={ () => {
				toggleBlockMode( clientId );
				onToggle();
			} }
		>
			{ label }
		</MenuItem>
	);
}
