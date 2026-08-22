import { useWidgetHost } from '../../../widget-host';
import { registerAdminBlock } from '../registry';

interface AdminLinkProps {
	href?: string;
	label?: string;
}

/*
 * A declarative link: the composition states where to go, the host's
 * `links` capability decides how to get there. A matched href mounts the
 * host router's link; anything else stays a plain anchor.
 */
function AdminLink( { href, label }: AdminLinkProps ) {
	const { links } = useWidgetHost();

	if ( ! href || ! label ) {
		return null;
	}

	const path = links?.match( href ) ?? null;
	const HostLink = links?.Link;

	return path !== null && HostLink ? (
		<HostLink path={ path }>{ label }</HostLink>
	) : (
		<a href={ href }>{ label }</a>
	);
}

registerAdminBlock( {
	name: 'core-admin/link',
	component: AdminLink,
	attributes: {
		href: { type: 'string' },
		label: { type: 'string' },
	},
} );
