/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function ZoomOutToolbarButton( { onClick } ) {
	const { __unstableSetEditorMode } = useDispatch( blockEditorStore );

	return (
		<ToolbarButton
			label={ __( 'Edit Canvas' ) }
			icon={ layout }
			className="block-editor-block-toolbar-zoom-out"
			onClick={ () => {
				__unstableSetEditorMode( 'zoom-out' );
				if ( typeof onClick === 'function' ) {
					onClick();
				}

				// Move focus to...?

				// Open the pattern inserter? block settings?
			} }
		/>
	);
}
