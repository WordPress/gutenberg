/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { forwardRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';
import { LinkUI } from './link-ui';
import { updateAttributes } from './update-attributes';

export const Appender = forwardRef( ( props, ref ) => {
	const [ insertedBlock, setInsertedBlock ] = useState();

	const { hideInserter, clientId } = useSelect( ( select ) => {
		const {
			getTemplateLock,
			__unstableGetEditorMode,
			getSelectedBlockClientId,
		} = select( blockEditorStore );

		const _clientId = getSelectedBlockClientId();

		return {
			clientId: getSelectedBlockClientId(),
			hideInserter:
				!! getTemplateLock( _clientId ) ||
				__unstableGetEditorMode() === 'zoom-out',
		};
	}, [] );

	const { insertedBlockAttributes } = useSelect(
		( select ) => {
			const { getBlockAttributes } = select( blockEditorStore );

			return {
				insertedBlockAttributes: getBlockAttributes( insertedBlock ),
			};
		},
		[ insertedBlock ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const setAttributes =
		( insertedBlockClientId ) => ( _updatedAttributes ) => {
			updateBlockAttributes( insertedBlockClientId, _updatedAttributes );
		};

	let maybeLinkUI;

	if ( insertedBlock ) {
		maybeLinkUI = (
			<LinkUI
				clientId={ insertedBlock }
				link={ insertedBlockAttributes }
				onClose={ () => setInsertedBlock( null ) }
				hasCreateSuggestion={ false }
				onChange={ ( updatedValue ) => {
					updateAttributes(
						updatedValue,
						setAttributes( insertedBlock ),
						insertedBlockAttributes
					);
					setInsertedBlock( null );
				} }
			/>
		);
	}

	if ( hideInserter ) {
		return null;
	}

	return (
		<div className="offcanvas-editor__appender">
			{ maybeLinkUI }
			<Inserter
				ref={ ref }
				rootClientId={ clientId }
				position="bottom right"
				isAppender={ true }
				selectBlockOnInsert={ false }
				onSelectOrClose={ ( { insertedBlockId } ) => {
					setInsertedBlock( insertedBlockId );
				} }
				{ ...props }
			/>
		</div>
	);
} );
