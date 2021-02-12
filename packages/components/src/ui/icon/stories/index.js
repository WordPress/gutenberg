/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { Icon } from '..';

export default {
	component: Icon,
	title: 'G2 Components (Experimental)/Icon',
};

export const _default = () => {
	return (
		<Icon
			icon={
				<SVG>
					<Path d="M5 4v3h5.5v12h3V7H19V4z" />
				</SVG>
			}
			size="50"
		/>
	);
};
