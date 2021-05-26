/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	ToolSelector,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __ } from '@wordpress/i18n';
import { listView, plus } from '@wordpress/icons';
import { Button } from '@wordpress/components';
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
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			getEditedPostType,
			getEditedPostId,
			isInserterOpened,
			isListViewOpened,
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
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsListViewOpened,
	} = useDispatch( editSiteStore );

	const isLargeViewport = useViewportMatch( 'medium' );

	return (
		<div className="edit-site-header">
			<div className="edit-site-header_start">
				<div className="edit-site-header__toolbar">
					<Button
						ref={ inserterButton }
						variant="primary"
						isPressed={ isInserterOpen }
						className="edit-site-header-toolbar__inserter-toggle"
						onMouseDown={ ( event ) => {
							event.preventDefault();
						} }
						onClick={ () => {
							if ( isInserterOpen ) {
								// Focusing the inserter button closes the inserter popover
								inserterButton.current.focus();
							} else {
								setIsInserterOpened( true );
							}
						} }
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
								onClick={ () =>
									setIsListViewOpened( ! isListViewOpen )
								}
								shortcut={ listViewShortcut }
							/>
						</>
					) }
				</div>
			</div>

			<div className="edit-site-header_center">
				{ 'wp_template' === templateType && (
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
				{ 'wp_template_part' === templateType && (
					<DocumentActions
						entityTitle={ entityTitle }
						entityLabel="template part"
						isLoaded={ isLoaded }
					/>
				) }
			</div>

			<div className="edit-site-header_end">
				<div className="edit-site-header__actions">
					<PreviewOptions
						deviceType={ deviceType }
						setDeviceType={ setPreviewDeviceType }
					/>
					<SaveButton
						openEntitiesSavedStates={ openEntitiesSavedStates }
						isEntitiesSavedStatesOpen={ isEntitiesSavedStatesOpen }
					/>
					<PinnedItems.Slot scope="core/edit-site" />
					<MoreMenu />
				</div>
			</div>
		</div>
	);
}
