/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ComplementaryAreaToggle from '../complementary-area-toggle';
import ActionItem from '../action-item';

export default function ComplementaryAreaMoreMenuItem( {
	scope,
	target,
	...props
} ) {
	return (
		<ComplementaryAreaToggle
			as={ ( toggleProps ) => {
				return (
					<ActionItem
						name={ `${ scope }/plugin-more-menu` }
						{ ...toggleProps }
					/>
				);
			} }
			role="menuitemcheckbox"
			selectedIcon={ check }
			name={ target }
			scope={ scope }
			{ ...props }
		/>
	);
}
