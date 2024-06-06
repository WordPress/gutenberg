/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	Button,
	__experimentalHStack as HStack,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { memo } from '@wordpress/element';
import { search } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { useReducedMotion } from '@wordpress/compose';
import { displayShortcut } from '@wordpress/keycodes';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import SiteIcon from '../site-icon';
import { unlock } from '../../lock-unlock';

const SiteHub = memo( ( { isTransparent, canvasMode } ) => {
	const { dashboardLink, homeUrl, siteTitle } = useSelect( ( select ) => {
		const { getSettings } = unlock( select( editSiteStore ) );

		const {
			getSite,
			getUnstableBase, // Site index.
		} = select( coreStore );
		const _site = getSite();
		return {
			dashboardLink:
				getSettings().__experimentalDashboardLink || 'index.php',
			homeUrl: getUnstableBase()?.home,
			siteTitle:
				! _site?.title && !! _site?.url
					? filterURLForDisplay( _site?.url )
					: _site?.title,
		};
	}, [] );
	const { open: openCommandCenter } = useDispatch( commandsStore );
	const { setCanvasMode } = unlock( useDispatch( editSiteStore ) );
	const reduceMotion = useReducedMotion();

	const siteIconButtonProps =
		canvasMode === 'edit'
			? {
					onClick: ( event ) => {
						event.preventDefault();
						setCanvasMode( 'view' );
					},
					label: __( 'Open Navigation' ),
			  }
			: {
					label: __( 'Go to the Dashboard' ),
			  };

	return (
		<div className="edit-site-site-hub">
			<HStack spacing="0">
				<div
					className={ clsx(
						'edit-site-site-hub__view-mode-toggle-container',
						{
							'has-transparent-background': isTransparent,
						}
					) }
				>
					<Button
						{ ...siteIconButtonProps }
						// Even though `href` is not used in edit mode it’s kept so the
						// component doesn't remount as a `<button>` and break the animation.
						// Seems like ideally a href could be used for the 'Open navigation'
						// action as well as it does generate history.
						href={ dashboardLink }
						className={ clsx(
							'edit-site-layout__view-mode-toggle',
							{ 'is-exit': canvasMode === 'view' }
						) }
					>
						<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
					</Button>
				</div>

				<AnimatePresence>
					{ canvasMode === 'view' && (
						<HStack
							as={ motion.div }
							initial={ { opacity: 0 } }
							animate={ { opacity: 1 } }
							exit={ { opacity: 0 } }
							transition={ {
								type: 'tween',
								duration: reduceMotion ? 0 : 0.3,
								ease: 'linear',
								delay: canvasMode === 'view' ? 0.2 : 0,
							} }
						>
							<div className="edit-site-site-hub__title">
								<Button
									variant="link"
									href={ homeUrl }
									target="_blank"
									label={ __(
										'View site (opens in a new tab)'
									) }
								>
									{ decodeEntities( siteTitle ) }
								</Button>
							</div>
							<HStack
								spacing={ 0 }
								className="edit-site-site-hub__actions"
							>
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
		</div>
	);
} );

export default SiteHub;
