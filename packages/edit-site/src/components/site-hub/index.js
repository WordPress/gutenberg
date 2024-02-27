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
	__unstableAnimatePresence as AnimatePresence,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useReducedMotion } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { memo } from '@wordpress/element';
import { search, external } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { displayShortcut } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SiteIcon from '../site-icon';
import { unlock } from '../../lock-unlock';

const HUB_ANIMATION_DURATION = 0.3;

const SiteHub = memo( ( { isTransparent, className } ) => {
	const { canvasMode, dashboardLink, homeUrl, siteTitle } = useSelect(
		( select ) => {
			const { getCanvasMode, getSettings } = unlock(
				select( editSiteStore )
			);

			const {
				getEntityRecord,
				getUnstableBase, // Site index.
			} = select( coreStore );

			return {
				canvasMode: getCanvasMode(),
				dashboardLink:
					getSettings().__experimentalDashboardLink || 'index.php',
				homeUrl: getUnstableBase()?.home,
				siteTitle: getEntityRecord( 'root', 'site' )?.title,
			};
		},
		[]
	);
	const { open: openCommandCenter } = useDispatch( commandsStore );

	const disableMotion = useReducedMotion();
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const { clearSelectedBlock } = useDispatch( blockEditorStore );
	const { setDeviceType } = useDispatch( editorStore );
	const isBackToDashboardButton = canvasMode === 'view';
	const siteIconButtonProps = isBackToDashboardButton
		? {
				href: dashboardLink,
				label: __( 'Go to the Dashboard' ),
		  }
		: {
				href: dashboardLink, // We need to keep the `href` here so the component doesn't remount as a `<button>` and break the animation.
				role: 'button',
				label: __( 'Open Navigation' ),
				onClick: ( event ) => {
					event.preventDefault();
					if ( canvasMode === 'edit' ) {
						clearSelectedBlock();
						setDeviceType( 'Desktop' );
						setCanvasMode( 'view' );
					}
				},
		  };

	return (
		<motion.div
			className={ classnames( 'edit-site-site-hub', className ) }
			variants={ {
				isDistractionFree: { x: '-100%' },
				isDistractionFreeHovering: { x: 0 },
				view: { x: 0 },
				edit: { x: 0 },
			} }
			initial={ false }
			transition={ {
				type: 'tween',
				duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
				ease: 'easeOut',
			} }
		>
			<HStack
				justify="space-between"
				alignment="center"
				className="edit-site-site-hub__container"
			>
				<HStack
					justify="flex-start"
					className="edit-site-site-hub__text-content"
					spacing="0"
				>
					<motion.div
						className={ classnames(
							'edit-site-site-hub__view-mode-toggle-container',
							{
								'has-transparent-background': isTransparent,
							}
						) }
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
							<motion.div
								initial={ false }
								animate={ {
									scale: canvasMode === 'view' ? 0.5 : 1,
								} }
								whileHover={ {
									scale: canvasMode === 'view' ? 0.5 : 0.96,
								} }
								transition={ {
									type: 'tween',
									duration: disableMotion
										? 0
										: HUB_ANIMATION_DURATION,
									ease: 'easeOut',
								} }
							>
								<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
							</motion.div>
						</Button>
					</motion.div>

					<AnimatePresence>
						<motion.div
							layout={ canvasMode === 'edit' }
							animate={ {
								opacity: canvasMode === 'view' ? 1 : 0,
							} }
							exit={ {
								opacity: 0,
							} }
							className={ classnames(
								'edit-site-site-hub__site-title',
								{ 'is-transparent': isTransparent }
							) }
							transition={ {
								type: 'tween',
								duration: disableMotion ? 0 : 0.2,
								ease: 'easeOut',
								delay: canvasMode === 'view' ? 0.1 : 0,
							} }
						>
							{ decodeEntities( siteTitle ) }
						</motion.div>
					</AnimatePresence>
					{ canvasMode === 'view' && (
						<Button
							href={ homeUrl }
							target="_blank"
							label={ __( 'View site (opens in a new tab)' ) }
							aria-label={ __(
								'View site (opens in a new tab)'
							) }
							icon={ external }
							className={ classnames(
								'edit-site-site-hub__site-view-link',
								{ 'is-transparent': isTransparent }
							) }
						/>
					) }
				</HStack>
				{ canvasMode === 'view' && (
					<Button
						className={ classnames(
							'edit-site-site-hub_toggle-command-center',
							{ 'is-transparent': isTransparent }
						) }
						icon={ search }
						onClick={ () => openCommandCenter() }
						label={ __( 'Open command palette' ) }
						shortcut={ displayShortcut.primary( 'k' ) }
					/>
				) }
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
