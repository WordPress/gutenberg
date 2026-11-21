import { Notice } from '@wordpress/ui';
import { getSitePartArea } from './constants';

/**
 * Tells people how far a change reaches. A site part is shared: what they
 * change in it shows on every page that uses the part. Some panels reach
 * further still: the identity panel edits the site's own details, and the
 * menu panel edits menus, both of which show wherever the site uses them.
 *
 * Tinted with the color the editor uses for synced content, such as template
 * parts and synced patterns.
 *
 * @param props       Component props.
 * @param props.area  The template part area.
 * @param props.panel The open panel, if any.
 */
export default function SitePartSyncedNotice( {
	area,
	panel,
}: {
	area: string;
	panel?: string;
} ) {
	const areaDetails = getSitePartArea( area );
	if ( ! areaDetails ) {
		return null;
	}

	let message = areaDetails.syncedNotice;
	if ( panel === 'identity' ) {
		message = areaDetails.identitySyncedNotice;
	} else if ( panel === 'menu' ) {
		message = areaDetails.menuSyncedNotice;
	}

	return (
		<Notice.Root
			icon={ areaDetails.icon }
			className="editor-site-part-synced-notice"
		>
			<Notice.Description>{ message }</Notice.Description>
		</Notice.Root>
	);
}
