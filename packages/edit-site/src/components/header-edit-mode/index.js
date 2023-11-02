/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';
import {
	__experimentalPreviewOptions as PreviewOptions,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect, useDispatch } from '@wordpress/data';
import { PinnedItems } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import {
	__unstableMotion as motion,
	MenuGroup,
	MenuItem,
	VisuallyHidden,
} from '@wordpress/components';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import MoreMenu from './more-menu';
import SaveButton from '../save-button';
import DocumentActions from './document-actions';
import DocumentTools from './document-tools';
import { store as editSiteStore } from '../../store';
import {
	getEditorCanvasContainerTitle,
	useHasEditorCanvasContainer,
} from '../editor-canvas-container';
import { unlock } from '../../lock-unlock';
import { FOCUSABLE_ENTITIES } from '../../utils/constants';

export default function HeaderEditMode( { setListViewToggleElement } ) {
	const {
		deviceType,
		templateType,
		isDistractionFree,
		blockEditorMode,
		homeUrl,
		showIconLabels,
		editorCanvasView,
	} = useSelect( ( select ) => {
		const { __experimentalGetPreviewDeviceType, getEditedPostType } =
			select( editSiteStore );
		const { __unstableGetEditorMode } = select( blockEditorStore );

		const postType = getEditedPostType();

		const {
			getUnstableBase, // Site index.
		} = select( coreStore );

		const { get: getPreference } = select( preferencesStore );

		return {
			deviceType: __experimentalGetPreviewDeviceType(),
			templateType: postType,
			blockEditorMode: __unstableGetEditorMode(),
			homeUrl: getUnstableBase()?.home,
			showIconLabels: getPreference(
				editSiteStore.name,
				'showIconLabels'
			),
			editorCanvasView: unlock(
				select( editSiteStore )
			).getEditorCanvasContainerView(),
			isDistractionFree: getPreference(
				editSiteStore.name,
				'distractionFree'
			),
		};
	}, [] );

	const { __experimentalSetPreviewDeviceType: setPreviewDeviceType } =
		useDispatch( editSiteStore );
	const disableMotion = useReducedMotion();

	const hasDefaultEditorCanvasView = ! useHasEditorCanvasContainer();

	const isFocusMode = FOCUSABLE_ENTITIES.includes( templateType );

	const isZoomedOutView = blockEditorMode === 'zoom-out';

	const toolbarVariants = {
		isDistractionFree: { y: '-50px' },
		isDistractionFreeHovering: { y: 0 },
		view: { y: 0 },
		edit: { y: 0 },
	};

	const toolbarTransition = {
		type: 'tween',
		duration: disableMotion ? 0 : 0.2,
		ease: 'easeOut',
	};

	return (
		<div
			className={ classnames( 'edit-site-header-edit-mode', {
				'show-icon-labels': showIconLabels,
			} ) }
		>
			{ hasDefaultEditorCanvasView && (
				<DocumentTools
					blockEditorMode={ blockEditorMode }
					isDistractionFree={ isDistractionFree }
					showIconLabels={ showIconLabels }
					setListViewToggleElement={ setListViewToggleElement }
					toolbarTransition={ toolbarTransition }
					toolbarVariants={ toolbarVariants }
				/>
			) }

			{ ! isDistractionFree && (
				<div className="edit-site-header-edit-mode__center">
					{ ! hasDefaultEditorCanvasView ? (
						getEditorCanvasContainerTitle( editorCanvasView )
					) : (
						<DocumentActions />
					) }
				</div>
			) }

			<div className="edit-site-header-edit-mode__end">
				<motion.div
					className="edit-site-header-edit-mode__actions"
					variants={ toolbarVariants }
					transition={ toolbarTransition }
				>
					<div
						className={ classnames(
							'edit-site-header-edit-mode__preview-options',
							{ 'is-zoomed-out': isZoomedOutView }
						) }
					>
						<PreviewOptions
							deviceType={ deviceType }
							setDeviceType={ setPreviewDeviceType }
							label={ __( 'View' ) }
							isEnabled={
								! isFocusMode && hasDefaultEditorCanvasView
							}
						>
							{ ( { onClose } ) => (
								<MenuGroup>
									<MenuItem
										href={ homeUrl }
										target="_blank"
										icon={ external }
										onClick={ onClose }
									>
										{ __( 'View site' ) }
										<VisuallyHidden as="span">
											{
												/* translators: accessibility text */
												__( '(opens in a new tab)' )
											}
										</VisuallyHidden>
									</MenuItem>
								</MenuGroup>
							) }
						</PreviewOptions>
					</div>
					<SaveButton />
					{ ! isDistractionFree && (
						<PinnedItems.Slot scope="core/edit-site" />
					) }
					<MoreMenu showIconLabels={ showIconLabels } />
				</motion.div>
			</div>
		</div>
	);
}
