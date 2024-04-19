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
import { filterURLForDisplay } from '@wordpress/url';

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
				getSite,
				getUnstableBase, // Site index.
			} = select( coreStore );
			const _site = getSite();
			return {
				canvasMode: getCanvasMode(),
				dashboardLink:
					getSettings().__experimentalDashboardLink || 'index.php',
				homeUrl: getUnstableBase()?.home,
				siteTitle:
					! _site?.title && !! _site?.url
						? filterURLForDisplay( _site?.url )
						: _site?.title,
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
			<HStack justify="flex-start" spacing="0">
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
						duration: disableMotion ? 0 : HUB_ANIMATION_DURATION,
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

				<AnimatePresence initial={ false }>
					{ canvasMode === 'view' && (
						<HStack
							as={ motion.div }
							initial={ { opacity: 0 } }
							animate={ {
								opacity: isTransparent ? 0 : 1,
							} }
							exit={ { opacity: 0 } }
							transition={ {
								type: 'tween',
								duration: disableMotion ? 0 : 0.2,
								ease: 'easeOut',
								delay: canvasMode === 'view' ? 0.1 : 0,
							} }
						>
							<div className="edit-site-site-hub__title">
								{ decodeEntities( siteTitle ) }
							</div>
							<HStack
								spacing={ 0 }
								expanded={ false }
								className="edit-site-site-hub__actions"
							>
								<Button
									href={ homeUrl }
									target="_blank"
									label={ __(
										'View site (opens in a new tab)'
									) }
									aria-label={ __(
										'View site (opens in a new tab)'
									) }
									icon={ external }
									className="edit-site-site-hub__site-view-link"
								/>

								<Button
									className="edit-site-site-hub_toggle-command-center"
									icon={ search }
									onClick={ () => openCommandCenter() }
									label={ __( 'Open command palette' ) }
									shortcut={ displayShortcut.primary( 'k' ) }
								/>
							</HStack>
						</HStack>
					) }
				</AnimatePresence>
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
