/**
 * WordPress dependencies
 */
import { Icon, search } from '@wordpress/icons';

const PlaceholderPreview = () => {
	return (
		<div className="wp-block-navigation-placeholder__preview">
			<span className="wp-block-navigation-link"></span>
			<span className="wp-block-navigation-link"></span>
			<span className="wp-block-navigation-link"></span>
			<Icon icon={ search } />
		</div>
	);
};

export default PlaceholderPreview;
