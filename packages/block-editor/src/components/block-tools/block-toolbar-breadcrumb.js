/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockSelectionButton from './block-selection-button';
import { PrivateBlockPopover } from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

function BlockToolbarBreadcrumb( { clientId, __unstableContentRef }, ref ) {
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
		<PrivateBlockPopover
			clientId={ capturingClientId || clientId }
			bottomClientId={ lastClientId }
			className={ clsx( 'block-editor-block-list__block-popover', {
				'is-insertion-point-visible': isInsertionPointVisible,
			} ) }
			resize={ false }
			{ ...popoverProps }
		>
			<BlockSelectionButton
				ref={ ref }
				clientId={ clientId }
				rootClientId={ rootClientId }
			/>
		</PrivateBlockPopover>
	);
}

export default forwardRef( BlockToolbarBreadcrumb );
