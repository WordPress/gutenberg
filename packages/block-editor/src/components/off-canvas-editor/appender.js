/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { forwardRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import Inserter from '../inserter';
import { LinkUI } from './link-ui';
import { updateAttributes } from './update-attributes';
import { useInsertedBlock } from './use-inserted-block';

const BLOCKS_WITH_LINK_UI_SUPPORT = [
	'core/navigation-link',
	'core/navigation-submenu',
];

export const Appender = forwardRef( ( props, ref ) => {
	const [ insertedBlockClientId, setInsertedBlockClientId ] = useState();

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

	const {
		insertedBlockAttributes,
		insertedBlockName,
		setInsertedBlockAttributes,
	} = useInsertedBlock( insertedBlockClientId );

	const maybeSetInsertedBlockOnInsertion = ( _insertedBlock ) => {
		if ( ! _insertedBlock?.clientId ) {
			return;
		}

		setInsertedBlockClientId( _insertedBlock?.clientId );
	};

	let maybeLinkUI;

	if (
		insertedBlockClientId &&
		BLOCKS_WITH_LINK_UI_SUPPORT?.includes( insertedBlockName )
	) {
		maybeLinkUI = (
			<LinkUI
				clientId={ insertedBlockClientId }
				link={ insertedBlockAttributes }
				onClose={ () => setInsertedBlockClientId( null ) }
				hasCreateSuggestion={ false }
				onChange={ ( updatedValue ) => {
					updateAttributes(
						updatedValue,
						setInsertedBlockAttributes,
						insertedBlockAttributes
					);
					setInsertedBlockClientId( null );
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
				onSelectOrClose={ maybeSetInsertedBlockOnInsertion }
				__experimentalIsQuick
				{ ...props }
			/>
		</div>
	);
} );
