/**
 * External dependencies
 */
import { first } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useCallback, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __, _n, sprintf } from '@wordpress/i18n';
import { listView, plus, closeSmall } from '@wordpress/icons';
import { Button, Slot } from '@wordpress/components';
import { store as keyboardShortcutsStore } from '@wordpress/keyboard-shortcuts';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import DocumentActions from './document-actions';
import TemplateDetails from '../template-details';
import { store as editSiteStore } from '../../store';
import MosaicViewBatchDeleteButton from '../mosaic-view/batch-delete-button';

const preventDefault = ( event ) => {
	event.preventDefault();
};

export default function Header( {
	openEntitiesSavedStates,
	isEntitiesSavedStatesOpen,
} ) {
	const inserterButton = useRef();
	const {
		deviceType,
		entityTitle,
		template,
		templateType,
		isInserterOpen,
		isListViewOpen,
		listViewShortcut,
		isLoaded,
		editorMode,
		selectedTemplates,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			getEditedPostType,
			getEditedPostId,
			isInserterOpened,
			isListViewOpened,
			getEditorMode,
			getSelectedTemplates,
		} = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
			editorStore
		);
		const { getShortcutRepresentation } = select( keyboardShortcutsStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEditedEntityRecord( 'postType', postType, postId );
		const _entityTitle =
			'wp_template' === postType
				? getTemplateInfo( record ).title
				: record?.slug;
		const _isLoaded = !! postId;

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			entityTitle: _entityTitle,
			isLoaded: _isLoaded,
			template: record,
			templateType: postType,
			isInserterOpen: isInserterOpened(),
			isListViewOpen: isListViewOpened(),
			listViewShortcut: getShortcutRepresentation(
				'core/edit-site/toggle-list-view'
			),
			editorMode: getEditorMode(),
			selectedTemplates: getSelectedTemplates(),
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsListViewOpened,
		switchEditorMode,
	} = useDispatch( editSiteStore );

	const isLargeViewport = useViewportMatch( 'medium' );

	const openInserter = useCallback( () => {
		if ( isInserterOpen ) {
			// Focusing the inserter button closes the inserter popover
			inserterButton.current.focus();
		} else {
			setIsInserterOpened( true );
		}
	}, [ isInserterOpen, setIsInserterOpened ] );

	const toggleListView = useCallback(
		() => setIsListViewOpened( ! isListViewOpen ),
		[ setIsListViewOpened, isListViewOpen ]
	);

	return (
		<div
			className={ classnames( 'edit-site-header', {
				'is-selecting-templates':
					editorMode === 'mosaic' && selectedTemplates.length > 0,
			} ) }
		>
			<div className="edit-site-header_start">
				{ editorMode !== 'mosaic' && (
					<div className="edit-site-header__toolbar">
						<Button
							ref={ inserterButton }
							variant="primary"
							isPressed={ isInserterOpen }
							className="edit-site-header-toolbar__inserter-toggle"
							onMouseDown={ preventDefault }
							onClick={ openInserter }
							icon={ plus }
							label={ _x(
								'Toggle block inserter',
								'Generic label for block inserter button'
							) }
						/>
						{ isLargeViewport && (
							<>
								<ToolSelector />
								<UndoButton />
								<RedoButton />
								<Button
									className="edit-site-header-toolbar__list-view-toggle"
									icon={ listView }
									isPressed={ isListViewOpen }
									/* translators: button label text should, if possible, be under 16 characters. */
									label={ __( 'List View' ) }
									onClick={ toggleListView }
									shortcut={ listViewShortcut }
								/>
							</>
						) }
					</div>
				) }
			</div>

			<div className="edit-site-header_center">
				{ editorMode !== 'mosaic' && 'wp_template' === templateType && (
					<DocumentActions
						entityTitle={ entityTitle }
						entityLabel="template"
						isLoaded={ isLoaded }
					>
						{ ( { onClose } ) => (
							<TemplateDetails
								template={ template }
								onClose={ onClose }
							/>
						) }
					</DocumentActions>
				) }
				{ editorMode !== 'mosaic' &&
					'wp_template_part' === templateType && (
						<DocumentActions
							entityTitle={ entityTitle }
							entityLabel="template part"
							isLoaded={ isLoaded }
						/>
					) }
				{ editorMode === 'mosaic' && selectedTemplates.length === 0 && (
					<span>{ __( 'All templates' ) }</span>
				) }

				{ editorMode === 'mosaic' && selectedTemplates.length > 0 && (
					<span>
						{ sprintf(
							/* translators: %d: number of selected templates. */
							_n(
								'%d Template selected',
								'%d Templates selected',
								selectedTemplates.length
							),
							selectedTemplates.length
						) }
					</span>
				) }
			</div>

			<div className="edit-site-header_end">
				<div className="edit-site-header__actions">
					{ editorMode !== 'mosaic' && (
						<>
							<PreviewOptions
								deviceType={ deviceType }
								setDeviceType={ setPreviewDeviceType }
							/>
							<SaveButton
								openEntitiesSavedStates={
									openEntitiesSavedStates
								}
								isEntitiesSavedStatesOpen={
									isEntitiesSavedStatesOpen
								}
							/>
							<PinnedItems.Slot scope="core/edit-site" />
							<MoreMenu />
						</>
					) }
					{ editorMode === 'mosaic' &&
						selectedTemplates.length === 0 && (
							<>
								<Slot name="PinnedItems/core/edit-site">
									{ ( fills ) => {
										const globalStylesFill =
											fills &&
											fills.find &&
											fills.find( ( element ) => {
												if ( ! element ) {
													return false;
												}
												const firstElement = first(
													element
												);
												if ( ! firstElement ) {
													return false;
												}
												return (
													firstElement.props &&
													firstElement.props
														.identifier ===
														'edit-site/global-styles'
												);
											} );
										return globalStylesFill
											? globalStylesFill
											: null;
									} }
								</Slot>
								<Button
									icon={ closeSmall }
									onClick={ () => {
										switchEditorMode( 'visual' );
									} }
								/>
							</>
						) }
					{ editorMode === 'mosaic' &&
						selectedTemplates.length > 0 && (
							<MosaicViewBatchDeleteButton />
						) }
				</div>
			</div>
		</div>
	);
}
