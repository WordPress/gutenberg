/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Icon, navigation } from '@wordpress/icons';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const PlaceholderPreview = ( { isLoading } ) => {
	return (
		<Placeholder
			className={ classnames( 'wp-block-navigation-placeholder', {
				'is-loading': isLoading,
			} ) }
		>
			<div className="wp-block-navigation-placeholder__controls">
				<div className="wp-block-navigation-placeholder__actions">
					<div className="wp-block-navigation-placeholder__actions__indicator">
						<Icon icon={ navigation } /> { __( 'Navigation' ) }
					</div>
				</div>
			</div>
		</Placeholder>
	);
};

export default PlaceholderPreview;
