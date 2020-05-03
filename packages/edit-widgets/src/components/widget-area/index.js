/**
 * External dependencies
 */
import { defaultTo } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { uploadMedia } from '@wordpress/media-utils';
import { Panel, PanelBody } from '@wordpress/components';
import {
	BlockInspector,
	BlockEditorProvider,
	BlockList,
	Inserter as BlockInserter,
	WritingFlow,
	ObserveTyping,
	BlockEditorKeyboardShortcuts,
	ButtonBlockerAppender,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { useEntityBlockEditor, EntityProvider } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Sidebar from '../sidebar';
import SelectionObserver from './selection-observer';
import Inserter from '../inserter';

const inserterToggleProps = { isPrimary: true };

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
		mediaUpload: mediaUploadBlockEditor,
	};
}

function WidgetAreaEditor( {
	id,
	initialOpen,
	isSelectedArea,
	onBlockSelected,
	blockEditorSettings,
} ) {
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'root',
		'widgetArea'
	);
	const { widgetAreaName, hasUploadPermissions } = useSelect(
		( select ) => {
			const { canUser, getEditedEntityRecord } = select( 'core' );
			const widgetArea = getEditedEntityRecord(
				'root',
				'widgetArea',
				id
			);
			return {
				widgetAreaName: widgetArea && widgetArea.name,
				hasUploadPermissions: defaultTo(
					canUser( 'create', 'media' ),
					true
				),
			};
		},
		[ id ]
	);
	const settings = useMemo(
		() =>
			getBlockEditorSettings( blockEditorSettings, hasUploadPermissions ),
		[ blockEditorSettings, hasUploadPermissions ]
	);
	return (
		<Panel className="edit-widgets-widget-area">
			<PanelBody title={ widgetAreaName } initialOpen={ initialOpen }>
				<div
					onFocus={ ( event ) => {
						// Stop propagation of the focus event to avoid the parent
						// widget layout component catching the event and removing the selected area.
						event.stopPropagation();
						event.preventDefault();
					} }
				>
					<BlockEditorProvider
						value={ blocks }
						onInput={ onInput }
						onChange={ onChange }
						settings={ settings }
					>
						{ isSelectedArea && (
							<>
								<Inserter>
									<BlockInserter
										toggleProps={ inserterToggleProps }
									/>
								</Inserter>
								<BlockEditorKeyboardShortcuts />
							</>
						) }
						<SelectionObserver
							isSelectedArea={ isSelectedArea }
							onBlockSelected={ onBlockSelected }
						/>
						<Sidebar.Inspector>
							<BlockInspector
								showNoBlockSelectedMessage={ false }
							/>
						</Sidebar.Inspector>
						<div className="editor-styles-wrapper">
							<WritingFlow>
								<ObserveTyping>
									<BlockList
										className="edit-widgets-main-block-list"
										renderAppender={ ButtonBlockerAppender }
									/>
								</ObserveTyping>
							</WritingFlow>
						</div>
					</BlockEditorProvider>
				</div>
			</PanelBody>
		</Panel>
	);
}

function WidgetArea( { id, ...props } ) {
	return (
		<EntityProvider kind="root" type="widgetArea" id={ id }>
			<WidgetAreaEditor id={ id } { ...props } />
		</EntityProvider>
	);
}

export default WidgetArea;
