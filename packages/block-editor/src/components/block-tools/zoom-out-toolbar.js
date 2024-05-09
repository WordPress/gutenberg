/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

export default function ZoomOutToolbar( { clientId, __unstableContentRef } ) {
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

	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ clsx( 'zoom-out-toolbar', {
				'is-insertion-point-visible': isInsertionPointVisible,
			} ) }
			resize={ false }
			placement="left-start"
			{ ...popoverProps }
		>
			<BlockSelectionButton
				clientId={ clientId }
				rootClientId={ rootClientId }
			/>
		</BlockPopover>
	);
}
