import type { Block } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import Inserter from '../inserter';
import type { ListViewBlockAppenderProps } from './types';

/**
 * The + in a List View row, which adds a block at the end of that row's inner
 * blocks.
 */
export const ListViewBlockAppender = forwardRef<
	HTMLElement,
	ListViewBlockAppenderProps
>(
	(
		{
			clientId,
			tabIndex,
			onFocus,
			updateExpansion,
			setInsertedBlockClientId,
		},
		ref
	) => {
		// A function, which is deprecated, is called by the inserter's own
		// `getDirectInsertBlock`, so only whether it is set matters here.
		const directInsert = useSelect(
			( select ) =>
				!! select( blockEditorStore ).getBlockListSettings( clientId )
					?.directInsert,
			[ clientId ]
		);

		const blockTitle = useBlockDisplayTitle( {
			clientId,
			context: 'list-view',
		} );

		return (
			<Inserter
				ref={ ref }
				rootClientId={ clientId }
				position="bottom right"
				isAppender
				selectBlockOnInsert={ false }
				shouldDirectInsert={ directInsert }
				__experimentalIsQuick
				toggleProps={ {
					label: sprintf(
						/* translators: %s: The name of the block that the new block is added to. */
						__( 'Add to %s' ),
						// `sprintf` formats any value for `%s`.
						blockTitle as string
					),
					className: 'block-editor-list-view-block__appender',
					size: 'small',
					tabIndex,
					onFocus,
				} }
				onSelectOrClose={ ( maybeInsertedBlock?: Block ) => {
					if ( maybeInsertedBlock?.clientId ) {
						setInsertedBlockClientId( maybeInsertedBlock.clientId );
						updateExpansion( {
							type: 'expand',
							clientIds: [ clientId ],
						} );
					}
				} }
			/>
		);
	}
);
