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
import { unlock } from '../../lock-unlock';

export const Appender = forwardRef(
	(
		{ nestingLevel, blockCount, clientId, renderAppender, ...props },
		ref
	) => {
		const { insertedBlock, setInsertedBlock } = useListViewContext();

		const instanceId = useInstanceId( Appender );
		const { directInsert, hideInserter } = useSelect(
			( select ) => {
				const { getBlockListSettings, getTemplateLock, isZoomOut } =
					unlock( select( blockEditorStore ) );

				const settings = getBlockListSettings( clientId );
				const directInsertValue = settings?.directInsert || false;
				const hideInserterValue =
					!! getTemplateLock( clientId ) || isZoomOut();

				return {
					directInsert: directInsertValue,
					hideInserter: hideInserterValue,
				};
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

		// The generic inserter must respect template locks and zoom-out mode,
		// but private List View consumers can provide a custom appender that
		// handles its own insertion rules. Do not suppress that escape hatch.
		if ( hideInserter && ! renderAppender ) {
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
				{ renderAppender ? (
					// Private escape hatch for specialized list views that need
					// the appender row/focus semantics without the generic Inserter UI.
					renderAppender( {
						clientId,
						nestingLevel,
						blockCount,
						descriptionId,
						ref,
						setInsertedBlock,
						...props,
					} )
				) : (
					<Inserter
						ref={ ref }
						rootClientId={ clientId }
						position="bottom right"
						isAppender
						selectBlockOnInsert={ false }
						shouldDirectInsert={ directInsert }
						__experimentalIsQuick
						{ ...props }
						toggleProps={ { 'aria-describedby': descriptionId } }
						onSelectOrClose={ ( maybeInsertedBlock ) => {
							if ( maybeInsertedBlock?.clientId ) {
								setInsertedBlock( maybeInsertedBlock );
							}
						} }
					/>
				) }
				<AriaReferencedText id={ descriptionId }>
					{ description }
				</AriaReferencedText>
			</div>
		);
	}
);
