/**
 * WordPress dependencies
 */
import { useRef, useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
/**
 * WordPress dependencies
 */
import { Button, ToolbarItem } from '@wordpress/components';
import { plus } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as editorStore } from '@wordpress/editor';
/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function InserterButton() {
	const inserterButton = useRef();
	const { setIsInserterOpened } = useDispatch( editPostStore );
	const { isInserterEnabled, isInserterOpened, showIconLabels } = useSelect(
		( select ) => {
			const {
				hasInserterItems,
				getBlockRootClientId,
				getBlockSelectionEnd,
			} = select( blockEditorStore );
			const { getEditorSettings } = select( editorStore );
			const { getEditorMode, isFeatureActive } = select( editPostStore );

			return {
				// This setting (richEditingEnabled) should not live in the block editor's setting.
				isInserterEnabled:
					getEditorMode() === 'visual' &&
					getEditorSettings().richEditingEnabled &&
					hasInserterItems(
						getBlockRootClientId( getBlockSelectionEnd() )
					),
				isInserterOpened: select( editPostStore ).isInserterOpened(),
				showIconLabels: isFeatureActive( 'showIconLabels' ),
			};
		},
		[]
	);

	const toggleInserter = useCallback( () => {
		if ( isInserterOpened ) {
			// Focusing the inserter button should close the inserter popover.
			// However, there are some cases it won't close when the focus is lost.
			// See https://github.com/WordPress/gutenberg/issues/43090 for more details.
			inserterButton.current.focus();
			setIsInserterOpened( false );
		} else {
			setIsInserterOpened( true );
		}
	}, [ isInserterOpened, setIsInserterOpened ] );

	/* translators: button label text should, if possible, be under 16 characters. */
	const longLabel = _x(
		'Toggle block inserter',
		'Generic label for block inserter button'
	);
	const shortLabel = ! isInserterOpened ? __( 'Add' ) : __( 'Close' );

	return (
		<ToolbarItem
			ref={ inserterButton }
			as={ Button }
			className="edit-site-header-edit-mode__inserter-toggle"
			variant="primary"
			isPressed={ isInserterOpened }
			onMouseDown={ preventDefault }
			onClick={ toggleInserter }
			disabled={ ! isInserterEnabled }
			icon={ plus }
			label={ showIconLabels ? shortLabel : longLabel }
			showTooltip={ ! showIconLabels }
		/>
	);
}
