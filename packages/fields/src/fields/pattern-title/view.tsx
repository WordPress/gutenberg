import { _x } from '@wordpress/i18n';
import { Badge } from '@wordpress/ui';
import type { CommonPost, Pattern } from '../../types';
import { BaseTitleView } from '../title/view';

export default function PatternTitleView( { item }: { item: CommonPost } ) {
	// A registered pattern that has been edited stands in for its edited
	// copy; flag it so the user knows "Reset" applies.
	const isEdited = !! ( item as Pattern ).overrideId;
	return (
		<BaseTitleView item={ item } className="fields-field__pattern-title">
			{ isEdited && (
				<Badge intent="informational">
					{ _x(
						'Edited',
						'registered pattern that has been edited'
					) }
				</Badge>
			) }
		</BaseTitleView>
	);
}
