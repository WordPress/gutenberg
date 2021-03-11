/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { check } from '@wordpress/icons';
import { MenuItem } from '@wordpress/components';

/**
 * Internal dependencies
 */
import ComplementaryAreaToggle from '../complementary-area-toggle';
import ActionItem from '../action-item';

const PluginsMenuItem = ( props ) => (
	// Menu item is marked with unstable prop for backward compatibility.
	// They are removed so they don't leak to DOM elements.
	// @see https://github.com/WordPress/gutenberg/issues/14457
	<MenuItem
		{ ...omit( props, [
			'__unstableExplicitMenuItem',
			'__unstableTarget',
		] ) }
	/>
);

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
						as={ PluginsMenuItem }
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
