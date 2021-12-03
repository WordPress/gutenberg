/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, navigation } from '@wordpress/icons';

const PlaceholderPreview = ( { isLoading } ) => {
	return (
		<div
			className={ classnames(
				'wp-block-navigation-placeholder__preview',
				{ 'is-loading': isLoading }
			) }
		>
			<Icon icon={ navigation } />
		</div>
	);
};

export default PlaceholderPreview;
