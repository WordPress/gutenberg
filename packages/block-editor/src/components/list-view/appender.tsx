import type { ComponentProps, ComponentType, RefAttributes } from 'react';
import type { Block } from '@wordpress/blocks';
import { useInstanceId } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { useSelect } from '@wordpress/data';
import { forwardRef, useEffect } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';
import { useInsertedBlockClientId, useListViewContext } from './context';
import Inserter from '../inserter';
import AriaReferencedText from './aria-referenced-text';
import { unlock } from '../../lock-unlock';
import type { ListViewAppenderProps } from './types';

// The inserter is still JavaScript, so its inferred props are all required.
const AppenderInserter = Inserter as ComponentType<
	Partial< ComponentProps< typeof Inserter > > & RefAttributes< HTMLElement >
>;

export const Appender = forwardRef< HTMLElement, ListViewAppenderProps >(
	( { nestingLevel, blockCount, clientId, ...props }, ref ) => {
		const { setInsertedBlockClientId } = useListViewContext();
		const insertedBlockClientId = useInsertedBlockClientId();

		const instanceId = useInstanceId( Appender );
		const { directInsert, hideInserter } = useSelect(
			( select ) => {
				const { getBlockListSettings, getTemplateLock, isZoomOut } =
					unlock( select( blockEditorStore ) );

				const settings = getBlockListSettings( clientId );
				const directInsertValue = settings?.directInsert || false;
				const templateLock = getTemplateLock( clientId );
				// `contentOnly` doesn't block insertion outright; `canInsertBlockType`
				// decides per container, and the Inserter renders nothing when no
				// block is insertable. Should be kept in sync with `canInsertBlockType`.
				const hideInserterValue =
					( !! templateLock && templateLock !== 'contentOnly' ) ||
					isZoomOut();

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
			clientId: insertedBlockClientId,
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
			// `sprintf` formats any value for `%s`.
			blockTitle as string,
			blockCount + 1,
			nestingLevel
		);

		return (
			<div className="list-view-appender">
				<AppenderInserter
					ref={ ref }
					rootClientId={ clientId }
					position="bottom right"
					isAppender
					selectBlockOnInsert={ false }
					shouldDirectInsert={ directInsert }
					__experimentalIsQuick
					{ ...props }
					toggleProps={ { 'aria-describedby': descriptionId } }
					onSelectOrClose={ ( maybeInsertedBlock?: Block ) => {
						if ( maybeInsertedBlock?.clientId ) {
							setInsertedBlockClientId(
								maybeInsertedBlock.clientId
							);
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
