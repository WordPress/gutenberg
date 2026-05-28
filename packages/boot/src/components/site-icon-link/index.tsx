/**
 * WordPress dependencies
 */
import { Link, privateApis as routePrivateApis } from '@wordpress/route';
import { Tooltip as WCTooltip } from '@wordpress/components';

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
		<WCTooltip text={ props[ 'aria-label' ] } placement="right">
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
		</WCTooltip>
	);
}

export default SiteIconLink;
