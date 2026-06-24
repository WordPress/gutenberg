/**
 * WordPress dependencies
 */
import { Link, privateApis as routePrivateApis } from '@wordpress/route';
import { Tooltip } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

import SiteIcon from '../site-icon';
import './style.scss';

const { useCanGoBack, useRouter } = unlock( routePrivateApis );

function SiteIconLink( {
	to,
	isBackButton,
	...props
}: {
	to: string;
	'aria-label': string;
	isBackButton?: boolean;
} ) {
	const router = useRouter();
	const canGoBack = useCanGoBack();

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Link
						to={ to }
						aria-label={ props[ 'aria-label' ] }
						className="boot-site-icon-link"
						onClick={ ( event ) => {
							// If possible, restore the previous page with
							// filters etc.
							if ( canGoBack && isBackButton ) {
								event.preventDefault();
								router.history.back();
							}
						} }
					>
						<SiteIcon />
					</Link>
				}
			/>
			<Tooltip.Popup positioner={ <Tooltip.Positioner side="right" /> }>
				{ props[ 'aria-label' ] }
			</Tooltip.Popup>
		</Tooltip.Root>
	);
}

export default SiteIconLink;
