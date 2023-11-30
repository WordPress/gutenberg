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
import { store as blockEditorStore } from '../../store';
import BlockToolbar from '../block-toolbar';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

export default function BlockToolbarPopover( {
	clientId,
	__unstableContentRef,
} ) {
	const isTyping = useSelect(
		( select ) => select( blockEditorStore ).isTyping(),
		[]
	);

	const { capturingClientId, isInsertionPointVisible, lastClientId } =
		useSelectedBlockToolProps( clientId );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ classnames( 'block-editor-block-list__block-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
				'is-hidden': isTyping, // Leave the toolbar in the DOM so it can be focused at the same roving tabindex it was previously at
			} ) }
			resize={ false }
			{ ...popoverProps }
		>
			<BlockToolbar />
		</BlockPopover>
	);
}
