/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockToolbar from '../block-toolbar';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import { useShouldContextualToolbarShow } from '../../utils/use-should-contextual-toolbar-show';

export default function BlockToolbarPopover( {
	clientId,
	__unstableContentRef,
} ) {
	const { capturingClientId, isInsertionPointVisible, lastClientId } =
		useSelectedBlockToolProps( clientId );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	const { shouldShowContextualToolbar } = useShouldContextualToolbarShow();

	// There shouldn't be an idea of focus on mount. It's just "Does the shortcut work or not". If there are block tools it can be focused. If the block tools have been accessed, the same tabindex will be persisted until it is remounted via a block change.
	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ classnames( 'block-editor-block-list__block-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
				'is-hidden': ! shouldShowContextualToolbar, // Leave the toolbar in the DOM so it can be focused at the same roving tabindex it was previously at
			} ) }
			resize={ false }
			{ ...popoverProps }
		>
			<BlockToolbar />
		</BlockPopover>
	);
}
