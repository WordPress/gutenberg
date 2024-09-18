/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';
import ZoomOutToolbar from './zoom-out-toolbar';

export default function ZoomOutPopover( { clientId, __unstableContentRef } ) {
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

	// Override some of the popover props for the zoom-out toolbar.
	const props = {
		...popoverProps,
		placement: 'left-start',
		flip: false,
		shift: true,
	};

	return (
		<BlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ clsx( 'zoom-out-toolbar-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
			} ) }
			resize={ false }
			{ ...props }
		>
			<ZoomOutToolbar
				clientId={ clientId }
				rootClientId={ rootClientId }
			/>
		</BlockPopover>
	);
}
