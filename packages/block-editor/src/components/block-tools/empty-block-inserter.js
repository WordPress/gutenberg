/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import Inserter from '../inserter';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

export default function EmptyBlockInserter( {
	clientId,
	__unstableContentRef,
} ) {
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
			__unstableCoverTarget
			bottomClientId={ lastClientId }
			className={ classnames(
				'block-editor-block-list__block-side-inserter-popover',
				{
					'is-insertion-point-visible': isInsertionPointVisible,
				}
			) }
			__unstableContentRef={ __unstableContentRef }
			resize={ false }
			shift={ false }
			{ ...popoverProps }
		>
			<div className="block-editor-block-list__empty-block-inserter">
				<Inserter
					position="bottom right"
					rootClientId={ rootClientId }
					clientId={ clientId }
					__experimentalIsQuick
				/>
			</div>
		</BlockPopover>
	);
}
