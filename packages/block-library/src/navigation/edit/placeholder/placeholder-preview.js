/**
 * WordPress dependencies
 */
import { Icon, navigation } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const PlaceholderPreview = ( { isVisible = true } ) => {
	return (
		<div
			aria-hidden={ ! isVisible ? true : undefined }
			className="wp-block-navigation-placeholder__preview"
		>
			<div className="wp-block-navigation-placeholder__actions__indicator">
				<Icon icon={ navigation } />
				{ __( 'Navigation' ) }
			</div>
		</div>
	);
};

export default PlaceholderPreview;
