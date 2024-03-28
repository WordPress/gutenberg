/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { store as blockEditorStore } from '../../store';

export default function BlockToolbarBreadcrumb( {
	clientId,
	__unstableContentRef,
} ) {
	const { editorMode } = useSelect( ( select ) => {
		const { __unstableGetEditorMode } = select( blockEditorStore );
		return {
			editorMode: __unstableGetEditorMode(),
		};
	} );

	const {
		capturingClientId,
		isInsertionPointVisible,
		lastClientId,
		rootClientId,
	} = useSelectedBlockToolProps( clientId );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	const isZoomedOutViewExperimentEnabled =
		window?.__experimentalEnableZoomedOutView && editorMode === 'zoom-out';

	if ( isZoomedOutViewExperimentEnabled ) {
		popoverProps.placement = 'left-start';
	}

	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ classnames( 'block-editor-block-list__block-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
				'is-vertical': isZoomedOutViewExperimentEnabled,
			} ) }
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
