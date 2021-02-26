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
	__unstableExplicitMenuItem,
	...props
} ) {
	return (
		<ComplementaryAreaToggle
			as={ ( toggleProps ) => {
				return (
					<ActionItem
						__unstableExplicitMenuItem={
							__unstableExplicitMenuItem
						}
						__unstableTarget={ `${ scope }/${ target }` }
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
