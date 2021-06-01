/**
 * WordPress dependencies
 */
import { Icon, search } from '@wordpress/icons';
import { memo } from '@wordpress/element';

const PlaceholderPreview = () => {
	return (
		<ul className="wp-block-navigation-placeholder__preview wp-block-navigation__container">
			<li className="wp-block-navigation-link">&#8203;</li>
			<li className="wp-block-navigation-link">&#8203;</li>
			<li className="wp-block-navigation-link">&#8203;</li>
			<Icon icon={ search } />
		</ul>
	);
};

export default memo( PlaceholderPreview );
