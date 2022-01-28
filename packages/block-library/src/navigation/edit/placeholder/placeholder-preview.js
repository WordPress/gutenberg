/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, navigation } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const PlaceholderPreview = ( { isLoading } ) => {
	return (
		<div
			className={ classnames(
				'wp-block-navigation-placeholder__preview',
				{ 'is-loading': isLoading }
			) }
		>
			<div className="wp-block-navigation-placeholder__actions__indicator">
				<Icon icon={ navigation } />
				{ __( 'Navigation' ) }
			</div>
		</div>
	);
};

export default PlaceholderPreview;
