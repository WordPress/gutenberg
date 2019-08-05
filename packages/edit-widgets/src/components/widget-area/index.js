/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { uploadMedia } from '@wordpress/media-utils';
import { compose } from '@wordpress/compose';
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockInspector,
	BlockEditorProvider,
	BlockList,
	Inserter as BlockInserter,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SelectionObserver from './selection-observer';
import Inserter from '../inserter';

function getBlockEditorSettings( blockEditorSettings, hasUploadPermissions ) {
	if ( ! hasUploadPermissions ) {
		return blockEditorSettings;
	}
	const mediaUploadBlockEditor = ( { onError, ...argumentsObject } ) => {
		uploadMedia( {
			wpAllowedMimeTypes: blockEditorSettings.allowedMimeTypes,
			onError: ( { message } ) => onError( message ),
			...argumentsObject,
		} );
	};
	return {
		...blockEditorSettings,
		__experimentalMediaUpload: mediaUploadBlockEditor,
	};
}

function WidgetArea( {
	blockEditorSettings,
	blocks,
	hasUploadPermissions,
	initialOpen,
	isSelectedArea,
	onBlockSelected,
	updateBlocks,
	widgetAreaName,
} ) {
	const settings = useMemo(
		() => getBlockEditorSettings( blockEditorSettings, hasUploadPermissions ),
		[ blockEditorSettings, hasUploadPermissions ]
	);
	return (
		<Panel className="edit-widgets-widget-area">
			<PanelBody
				title={ widgetAreaName }
				initialOpen={ initialOpen }
			>
				<BlockEditorProvider
					value={ blocks }
					onInput={ updateBlocks }
					onChange={ updateBlocks }
					settings={ settings }
				>
					{ isSelectedArea && (
						<Inserter>
							<BlockInserter />
						</Inserter>
					) }
					<SelectionObserver
						isSelectedArea={ isSelectedArea }
						onBlockSelected={ onBlockSelected }
					/>
					<Sidebar.Inspector>
						<BlockInspector showNoBlockSelectedMessage={ false } />
					</Sidebar.Inspector>
					<WritingFlow>
						<ObserveTyping>
							<BlockList
								className="edit-widgets-main-block-list"
							/>
						</ObserveTyping>
					</WritingFlow>
				</BlockEditorProvider>
			</PanelBody>
		</Panel>
	);
}

export default compose( [
	withSelect( ( select, { id } ) => {
		const {
			getBlocksFromWidgetArea,
			getWidgetArea,
		} = select( 'core/edit-widgets' );
		const { canUser } = select( 'core' );
		const blocks = getBlocksFromWidgetArea( id );
		const widgetAreaName = ( getWidgetArea( id ) || {} ).name;
		return {
			blocks,
			widgetAreaName,
			hasUploadPermissions: defaultTo( canUser( 'create', 'media' ), true ),
		};
	} ),
	withDispatch( ( dispatch, { id } ) => {
		return {
			updateBlocks( blocks ) {
				const {
					updateBlocksInWidgetArea,
				} = dispatch( 'core/edit-widgets' );
				updateBlocksInWidgetArea( id, blocks );
			},
		};
	} ),
] )( WidgetArea );
