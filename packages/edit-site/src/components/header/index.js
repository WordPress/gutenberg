/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';
import {
	ToolSelector,
	BlockToolbar,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x, __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { SVG, Path } from '@wordpress/primitives';

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

const MenuIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
	>
		<Path d="M13.8 5.2H3v1.5h10.8V5.2zm-3.6 12v1.5H21v-1.5H10.2zm7.2-6H6.6v1.5h10.8v-1.5z" />
	</SVG>
);

export default function Header( { openEntitiesSavedStates } ) {
	const inserterButton = useRef();
	const {
		deviceType,
		entityTitle,
		hasFixedToolbar,
		template,
		templateType,
		isInserterOpen,
		isBlockNavigationOpen,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			isFeatureActive,
			getEditedPostType,
			getEditedPostId,
			isInserterOpened,
			isBlockNavigationOpened,
		} = select( editSiteStore );
		const { getEntityRecord } = select( 'core' );
		const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
			'core/editor'
		);

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEntityRecord( 'postType', postType, postId );
		const _entityTitle =
			'wp_template' === postType
				? getTemplateInfo( record ).title
				: record?.slug;

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			entityTitle: _entityTitle,
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			template: record,
			templateType: postType,
			isInserterOpen: isInserterOpened(),
			isBlockNavigationOpen: isBlockNavigationOpened(),
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
		setIsBlockNavigationOpened,
	} = useDispatch( editSiteStore );

	const isLargeViewport = useViewportMatch( 'medium' );
	const displayBlockToolbar =
		! isLargeViewport || deviceType !== 'Desktop' || hasFixedToolbar;

	return (
		<div className="edit-site-header">
			<div className="edit-site-header_start">
				<div className="edit-site-header__toolbar">
					<Button
						ref={ inserterButton }
						isPrimary
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
							'Add block',
							'Generic label for block inserter button'
						) }
					/>
					{ isLargeViewport && (
						<>
							<ToolSelector />
							<UndoButton />
							<RedoButton />
							<Button
								isPressed={ isBlockNavigationOpen }
								className="edit-site-header-toolbar__block-navigation-toggle"
								onClick={ () =>
									setIsBlockNavigationOpened(
										! isBlockNavigationOpen
									)
								}
								icon={ MenuIcon }
								/* translators: button label text should, if possible, be under 16 characters. */
								label={ __( 'Outline' ) }
							/>
						</>
					) }
					{ displayBlockToolbar && (
						<div className="edit-site-header-toolbar__block-toolbar">
							<BlockToolbar hideDragHandle />
						</div>
					) }
				</div>
			</div>

			<div className="edit-site-header_center">
				{ 'wp_template' === templateType && (
					<DocumentActions
						entityTitle={ entityTitle }
						entityLabel="template"
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
					/>
					<PinnedItems.Slot scope="core/edit-site" />
					<MoreMenu />
				</div>
			</div>
		</div>
	);
}
