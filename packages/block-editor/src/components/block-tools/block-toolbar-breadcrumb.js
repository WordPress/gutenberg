/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import { store as blockEditorStore } from '../../store';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

export default function BlockToolbarBreadcrumb( {
	clientId,
	showEmptyBlockSideInserter,
	__unstableContentRef,
} ) {
	const {
		capturingClientId,
		isInsertionPointVisible,
		lastClientId,
		rootClientId,
	} = useSelectedBlockToolProps( clientId );

	const { shouldShowBreadcrumb } = useSelect( ( select ) => {
		const { hasMultiSelection, __unstableGetEditorMode } =
			select( blockEditorStore );

		const editorMode = __unstableGetEditorMode();

		return {
			shouldShowBreadcrumb:
				! hasMultiSelection() &&
				( editorMode === 'navigation' || editorMode === 'zoom-out' ),
		};
	}, [] );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	if ( showEmptyBlockSideInserter ) {
		return null;
	}

	if ( shouldShowBreadcrumb ) {
		return (
			<BlockPopover
				clientId={ capturingClientId || clientId }
				bottomClientId={ lastClientId }
				className={ classnames(
					'block-editor-block-list__block-popover',
					{
						'is-insertion-point-visible': isInsertionPointVisible,
					}
				) }
				resize={ false }
				{ ...popoverProps }
			>
				<BlockSelectionButton
					clientId={ clientId }
					rootClientId={ rootClientId }
				/>
			</BlockPopover>
		);
	}

	return null;
}
