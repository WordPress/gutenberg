/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { shield } from '@wordpress/icons';
import { Link } from '@wordpress/ui';

export default {
	name: 'core/site-health',
	icon: shield,
	info: (
		<>
			{ __( "Results come from your site's latest health checks." ) }{ ' ' }
			<Link href="site-health.php">{ __( 'Visit Site Health' ) }</Link>
		</>
	),
};
