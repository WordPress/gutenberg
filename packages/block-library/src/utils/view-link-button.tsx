import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { useResolvedUrl } from './use-resolved-url';

interface ViewLinkButtonProps {
	/** The link, as stored in the block's attributes. */
	url?: string;
}

/**
 * The block inspector's "View" button for a block that links somewhere. It
 * opens the link in a new tab, resolved against the site's home URL, and
 * renders nothing while there is no link to open.
 *
 * @param props     Component props.
 * @param props.url The link, as stored in the block's attributes.
 */
export default function ViewLinkButton( { url }: ViewLinkButtonProps ) {
	const resolvedUrl = useResolvedUrl( url );

	if ( ! resolvedUrl ) {
		return null;
	}

	return (
		<Button
			variant="secondary"
			href={ resolvedUrl }
			target="_blank"
			icon={ external }
			iconPosition="right"
			__next40pxDefaultSize
			className="navigation-link-to__action-button"
		>
			{ __( 'View' ) }
		</Button>
	);
}
