/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, search } from '@wordpress/icons';

const PlaceholderPreview = ( { hideSelected } ) => {
	const classes = classNames( 'wp-block-navigation-placeholder__preview', {
		'wp-block-navigation-placeholder__preview_select_hide': hideSelected,
	} );

	return (
		<div className={ classes }>
			<span className="wp-block-navigation-link"></span>
			<span className="wp-block-navigation-link"></span>
			<span className="wp-block-navigation-link"></span>
			<Icon icon={ search } />
		</div>
	);
};

export default PlaceholderPreview;
