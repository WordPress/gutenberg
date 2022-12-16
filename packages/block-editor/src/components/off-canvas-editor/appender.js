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

	const { insertedBlockAttributes, insertedBlockName } = useSelect(
		( select ) => {
			const { getBlockName, getBlockAttributes } =
				select( blockEditorStore );

			return {
				insertedBlockAttributes: getBlockAttributes(
					insertedBlockClientId
				),
				insertedBlockName: getBlockName( insertedBlockClientId ),
			};
		},
		[ insertedBlockClientId ]
	);

	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const setAttributes =
		( _insertedBlockClientId ) => ( _updatedAttributes ) => {
			updateBlockAttributes( _insertedBlockClientId, _updatedAttributes );
		};

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
						setAttributes( insertedBlockClientId ),
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
