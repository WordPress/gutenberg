/**
 * External dependencies
 */
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import BlockToolbar from '../block-toolbar';

export default function BlockToolbarPopover( {
	clientId,
	isTyping,
	__unstableContentRef,
} ) {
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
			<BlockToolbar variant="toolbar" />
		</BlockPopover>
	);
}
