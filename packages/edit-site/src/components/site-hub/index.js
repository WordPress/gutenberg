/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__unstableMotion as motion,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useReducedMotion, useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { useLocation } from '../routes';
import getIsListPage from '../../utils/get-is-list-page';
import SiteIcon from '../site-icon';
import useEditedEntityRecord from '../use-edited-entity-record';
import { unlock } from '../../experiments';

const HUB_ANIMATION_DURATION = 0.3;

const SiteHub = forwardRef(
	( { isMobileCanvasVisible, setIsMobileCanvasVisible, ...props }, ref ) => {
		const { params } = useLocation();
		const isListPage = getIsListPage( params );
		const isEditorPage = ! isListPage;
		const { canvasMode, dashboardLink, entityConfig } = useSelect(
			( select ) => {
				select( editSiteStore ).getEditedPostType();
				const { getCanvasMode, getSettings, getEditedPostType } =
					unlock( select( editSiteStore ) );
				return {
					canvasMode: getCanvasMode(),
					dashboardLink: getSettings().__experimentalDashboardLink,
					entityConfig: select( coreStore ).getEntityConfig(
						'postType',
						getEditedPostType()
					),
				};
			},
			[]
		);
		const disableMotion = useReducedMotion();
		const isMobileViewport = useViewportMatch( 'medium', '<' );
		const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
		const { clearSelectedBlock } = useDispatch( blockEditorStore );
		const showEditButton =
			( isEditorPage && canvasMode === 'view' && ! isMobileViewport ) ||
			( isMobileViewport &&
				canvasMode === 'view' &&
				isMobileCanvasVisible );
		const isBackToDashboardButton =
			( ! isMobileViewport && canvasMode === 'view' ) ||
			( isMobileViewport && ! isMobileCanvasVisible );
		const showLabels = canvasMode !== 'edit';
		const siteIconButtonProps = isBackToDashboardButton
			? {
					href: dashboardLink || 'index.php',
					'aria-label': __( 'Go back to the dashboard' ),
			  }
			: {
					label: __( 'Open Navigation Sidebar' ),
					onClick: () => {
						clearSelectedBlock();
						setIsMobileCanvasVisible( false );
						setCanvasMode( 'view' );
					},
			  };
		const { getTitle } = useEditedEntityRecord();

		return (
			<motion.div
				ref={ ref }
				{ ...props }
				className={ classnames(
					'edit-site-site-hub',
					props.className
				) }
				layout
				transition={ {
					type: 'tween',
					duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
					ease: 'easeOut',
				} }
			>
				<HStack
					justify="flex-start"
					className="edit-site-site-hub__text-content"
					spacing="0"
				>
					<motion.div
						className="edit-site-site-hub__view-mode-toggle-container"
						layout
						transition={ {
							type: 'tween',
							duration: disableMotion
								? 0
								: HUB_ANIMATION_DURATION,
							ease: 'easeOut',
						} }
					>
						<Button
							{ ...siteIconButtonProps }
							className="edit-site-layout__view-mode-toggle"
						>
							<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
						</Button>
					</motion.div>

					{ showLabels && (
						<VStack spacing={ 0 }>
							<div className="edit-site-site-hub__title">
								{ getTitle() }
							</div>
							<div className="edit-site-site-hub__post-type">
								{ entityConfig?.label }
							</div>
						</VStack>
					) }
				</HStack>

				{ showEditButton && (
					<Button
						className="edit-site-site-hub__edit-button"
						onClick={ () => {
							setCanvasMode( 'edit' );
						} }
						variant="primary"
					>
						{ __( 'Edit' ) }
					</Button>
				) }

				{ isMobileViewport && ! isMobileCanvasVisible && (
					<Button
						onClick={ () => setIsMobileCanvasVisible( true ) }
						variant="primary"
					>
						{ __( 'View Editor' ) }
					</Button>
				) }
			</motion.div>
		);
	}
);

export default SiteHub;
