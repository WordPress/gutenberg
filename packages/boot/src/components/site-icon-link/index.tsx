/**
 * External dependencies
 */
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router';

/**
 * Internal dependencies
 */
import SiteIcon from '../site-icon';
import './style.scss';

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
	);
}

export default SiteIconLink;
