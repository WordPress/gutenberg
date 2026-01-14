/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ExternalLink,
	Button,
	// @ts-ignore
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { search } from '@wordpress/icons';
import { displayShortcut } from '@wordpress/keycodes';
// @ts-expect-error Commands is not typed properly.
import { store as commandsStore } from '@wordpress/commands';
import { filterURLForDisplay } from '@wordpress/url';
import type { UnstableBase } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import SiteIconLink from '../site-icon-link';
import { store as bootStore } from '../../store';
import './style.scss';

function SiteHub() {
	const { dashboardLink, homeUrl, siteTitle } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const _base = getEntityRecord< UnstableBase >(
			'root',
			'__unstableBase'
		);
		return {
			dashboardLink: select( bootStore ).getDashboardLink(),
			homeUrl: _base?.home,
			siteTitle:
				! _base?.name && !! _base?.url
					? filterURLForDisplay( _base?.url )
					: _base?.name,
		};
	}, [] );
	const { open: openCommandCenter } = useDispatch( commandsStore );

	return (
		<div className="boot-site-hub">
			<SiteIconLink
				to={ dashboardLink || '/' }
				aria-label={ __( 'Go to the Dashboard' ) }
			/>
			<ExternalLink
				href={ homeUrl ?? '/' }
				className="boot-site-hub__title"
			>
				<div className="boot-site-hub__title-text">
					{ siteTitle && decodeEntities( siteTitle ) }
				</div>
				<div className="boot-site-hub__url">
					{ filterURLForDisplay( homeUrl ?? '' ) }
				</div>
			</ExternalLink>
			<HStack className="boot-site-hub__actions">
				<Button
					variant="tertiary"
					icon={ search }
					onClick={ () => openCommandCenter() }
					size="compact"
					label={ __( 'Open command palette' ) }
					shortcut={ displayShortcut.primary( 'k' ) }
				/>
			</HStack>
		</div>
	);
}

export default SiteHub;
