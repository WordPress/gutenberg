/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, search } from '@wordpress/icons';

const PlaceholderPreview = ( { isLoading } ) => {
	return (
		<ul
			className={ classnames(
				'wp-block-navigation-placeholder__preview',
				'wp-block-navigation__container',
				{ 'is-loading': isLoading }
			) }
		>
			<li className="wp-block-navigation-item">&#8203;</li>
			<li className="wp-block-navigation-item">&#8203;</li>
			<li className="wp-block-navigation-item">&#8203;</li>
			<li className="wp-block-navigation-placeholder__preview-search-icon">
				<Icon icon={ search } />
			</li>
		</ul>
	);
};

export default PlaceholderPreview;
