import { __ } from '@wordpress/i18n';
import {
	Badge,
	// eslint-disable-next-line @wordpress/use-recommended-components
	Popover,
	VisuallyHidden,
} from '@wordpress/ui';

export default function NavigationDraftBadge() {
	return (
		<Badge
			intent="draft"
			infotip={ {
				popover: Popover,
				popup: (
					<Popover.Popup>
						<Popover.Arrow />
						<VisuallyHidden render={ <Popover.Title /> }>
							{ __( 'Draft status' ) }
						</VisuallyHidden>
						<Popover.Description>
							{ __(
								"This menu is a draft. It will not be visible on your site until it's published."
							) }
						</Popover.Description>
					</Popover.Popup>
				),
			} }
		>
			{ __( 'Draft' ) }
		</Badge>
	);
}
