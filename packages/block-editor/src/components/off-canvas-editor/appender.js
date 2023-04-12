/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { speak } from '@wordpress/a11y';
import { useSelect } from '@wordpress/data';
import {
	forwardRef,
	useState,
	useEffect,
	useCallback,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import useBlockDisplayTitle from '../block-title/use-block-display-title';

import { unlock } from '../../lock-unlock';
import { privateApis as blockEditorPrivateApis } from '../../private-apis';

const prioritizedInserterBlocks = [
	'core/navigation-link/page',
	'core/navigation-link',
];

export const Appender = forwardRef(
	( { nestingLevel, blockCount, clientId, ...props }, ref ) => {
		const [ insertedBlock, setInsertedBlock ] = useState( null );

		const instanceId = useInstanceId( Appender );
		const { hideInserter } = useSelect(
			( select ) => {
				const { getTemplateLock, __unstableGetEditorMode } =
					select( blockEditorStore );

				return {
					hideInserter:
						!! getTemplateLock( clientId ) ||
						__unstableGetEditorMode() === 'zoom-out',
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

		const orderInitialBlockItems = useCallback( ( items ) => {
			items.sort( ( { id: aName }, { id: bName } ) => {
				// Sort block items according to `prioritizedInserterBlocks`.
				let aIndex = prioritizedInserterBlocks.indexOf( aName );
				let bIndex = prioritizedInserterBlocks.indexOf( bName );
				// All other block items should come after that.
				if ( aIndex < 0 ) aIndex = prioritizedInserterBlocks.length;
				if ( bIndex < 0 ) bIndex = prioritizedInserterBlocks.length;
				return aIndex - bIndex;
			} );
			return items;
		}, [] );

		if ( hideInserter ) {
			return null;
		}
		const { PrivateInserter } = unlock( blockEditorPrivateApis );
		const descriptionId = `off-canvas-editor-appender__${ instanceId }`;
		const description = sprintf(
			/* translators: 1: The name of the block. 2: The numerical position of the block. 3: The level of nesting for the block. */
			__( 'Append to %1$s block at position %2$d, Level %3$d' ),
			blockTitle,
			blockCount + 1,
			nestingLevel
		);

		return (
			<div className="offcanvas-editor-appender">
				<PrivateInserter
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
					orderInitialBlockItems={ orderInitialBlockItems }
				/>
				<div
					className="offcanvas-editor-appender__description"
					id={ descriptionId }
				>
					{ description }
				</div>
			</div>
		);
	}
);
