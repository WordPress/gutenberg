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
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { memo } from '@wordpress/element';
import { search, external } from '@wordpress/icons';
import { store as commandsStore } from '@wordpress/commands';
import { displayShortcut } from '@wordpress/keycodes';

const SiteHub = memo( ( { isTransparent, className } ) => {
	const { homeUrl, siteTitle } = useSelect( ( select ) => {
		const {
			getSite,
			getUnstableBase, // Site index.
		} = select( coreStore );

		return {
			homeUrl: getUnstableBase()?.home,
			siteTitle: getSite()?.title,
		};
	}, [] );
	const { open: openCommandCenter } = useDispatch( commandsStore );

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
