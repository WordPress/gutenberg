/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { useSelect } from '@wordpress/data';
import { forwardRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useListViewContext } from './context';
import Inserter from '../inserter';
import AriaReferencedText from './aria-referenced-text';

export const Appender = forwardRef(
	( { nestingLevel, blockCount, clientId, ...props }, ref ) => {
		const { insertedBlock, setInsertedBlock } = useListViewContext();

		const instanceId = useInstanceId( Appender );
		const hideInserter = useSelect(
			( select ) => {
				const { getTemplateLock, __unstableGetEditorMode } =
					select( blockEditorStore );

				return (
					!! getTemplateLock( clientId ) ||
					__unstableGetEditorMode() === 'zoom-out'
				);
			},
			[ clientId ]
		);

		const blockTitle = useBlockDisplayTitle( {
			clientId,
			context: 'list-view',
		} );

		const insertedBlockTitle = useBlockDisplayTitle( {
			clientId: insertedBlock?.clientId,
			context: 'list-view',
		} );

		useEffect( () => {
			if ( ! insertedBlockTitle?.length ) {
				return;
			}

			speak(
				sprintf(
					// translators: %s: name of block being inserted (i.e. Paragraph, Image, Group etc)
					__( '%s block inserted' ),
					insertedBlockTitle
				),
				'assertive'
			);
		}, [ insertedBlockTitle ] );

		if ( hideInserter ) {
			return null;
		}

		const descriptionId = `list-view-appender__${ instanceId }`;
		const description = sprintf(
			/* translators: 1: The name of the block. 2: The numerical position of the block. 3: The level of nesting for the block. */
			__( 'Append to %1$s block at position %2$d, Level %3$d' ),
			blockTitle,
			blockCount + 1,
			nestingLevel
		);

		return (
			<div className="list-view-appender">
				<Inserter
					ref={ ref }
					rootClientId={ clientId }
					position="bottom right"
					isAppender
					selectBlockOnInsert={ false }
					shouldDirectInsert={ false }
					__experimentalIsQuick
					{ ...props }
					toggleProps={ { 'aria-describedby': descriptionId } }
					onSelectOrClose={ ( maybeInsertedBlock ) => {
						if ( maybeInsertedBlock?.clientId ) {
							setInsertedBlock( maybeInsertedBlock );
						}
					} }
				/>
				<AriaReferencedText id={ descriptionId }>
					{ description }
				</AriaReferencedText>
			</div>
		);
	}
);
