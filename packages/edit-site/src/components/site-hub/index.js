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
} from '@wordpress/components';
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

			return {
				canvasMode: getCanvasMode(),
				dashboardLink:
					getSettings().__experimentalDashboardLink || 'index.php',
				homeUrl: getUnstableBase()?.home,
				siteTitle: getSite()?.title,
			};
		},
		[]
	);
	const { open: openCommandCenter } = useDispatch( commandsStore );

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
		<motion.div className={ classnames( 'edit-site-site-hub', className ) }>
			<HStack
				justify="space-between"
				alignment="center"
				className="edit-site-site-hub__container"
			>
				<HStack
					justify="flex-start"
					className="edit-site-site-hub__text-content"
					spacing={ 3 }
				>
					<Button
						{ ...siteIconButtonProps }
						className="edit-site-layout__view-mode-toggle"
					>
						<SiteIcon className="edit-site-layout__view-mode-toggle-icon" />
					</Button>

					<div
						className={ classnames(
							'edit-site-site-hub__site-title'
						) }
					>
						{ decodeEntities( siteTitle ) }
					</div>
					<Button
						href={ homeUrl }
						target="_blank"
						label={ __( 'View site (opens in a new tab)' ) }
						aria-label={ __( 'View site (opens in a new tab)' ) }
						icon={ external }
						className={ classnames(
							'edit-site-site-hub__site-view-link'
						) }
					/>
				</HStack>
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
			</HStack>
		</motion.div>
	);
} );

export default SiteHub;
