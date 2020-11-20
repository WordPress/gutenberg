/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	BlockNavigationDropdown,
	ToolSelector,
	BlockToolbar,
	__experimentalPreviewOptions as PreviewOptions,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { _x } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import UndoButton from './undo-redo/undo';
import RedoButton from './undo-redo/redo';
import DocumentActions from './document-actions';
import TemplateDetails from '../template-details';

export default function Header( { openEntitiesSavedStates } ) {
	const {
		deviceType,
		entityTitle,
		hasFixedToolbar,
		template,
		templateType,
		isInserterOpen,
	} = useSelect( ( select ) => {
		const {
			__experimentalGetPreviewDeviceType,
			isFeatureActive,
			getTemplateId,
			getTemplatePartId,
			getTemplateType,
			isInserterOpened,
		} = select( 'core/edit-site' );
		const { getEntityRecord } = select( 'core' );
		const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
			'core/editor'
		);

		const _templateType = getTemplateType();
		const _template = getEntityRecord(
			'postType',
			'wp_template',
			getTemplateId()
		);
		const _templatePart = getEntityRecord(
			'postType',
			'wp_template_part',
			getTemplatePartId()
		);

		const _entityTitle =
			'wp_template' === _templateType
				? getTemplateInfo( _template ).title
				: _templatePart?.slug;

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			entityTitle: _entityTitle,
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			template: _template,
			templateType: _templateType,
			isInserterOpen: isInserterOpened(),
		};
	}, [] );

	const {
		__experimentalSetPreviewDeviceType: setPreviewDeviceType,
		setIsInserterOpened,
	} = useDispatch( 'core/edit-site' );

	const isLargeViewport = useViewportMatch( 'medium' );
	const displayBlockToolbar =
		! isLargeViewport || deviceType !== 'Desktop' || hasFixedToolbar;

	return (
		<div className="edit-site-header">
			<div className="edit-site-header_start">
				<div className="edit-site-header__toolbar">
					<Button
						isPrimary
						isPressed={ isInserterOpen }
						className="edit-site-header-toolbar__inserter-toggle"
						onClick={ () =>
							setIsInserterOpened( ! isInserterOpen )
						}
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
							<BlockNavigationDropdown />
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
