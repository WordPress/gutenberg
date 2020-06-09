/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { wordpress } from '@wordpress/icons';

function FullscreenModeClose() {
	const [ siteIconURL ] = useEntityProp( 'root', 'site', 'site_icon_url' );

	const isRequestingSiteIcon = useSelect( ( select ) => {
		return select( 'core/data' ).isResolving( 'core', 'getEntityRecord', [
			'root',
			'site',
			undefined,
		] );
	}, [] );

	const { isActive, postType } = useSelect( ( select ) => {
		const { getCurrentPostType } = select( 'core/editor' );
		const { isFeatureActive } = select( 'core/edit-post' );
		const { getPostType } = select( 'core' );

		return {
			isActive: isFeatureActive( 'fullscreenMode' ),
			postType: getPostType( getCurrentPostType() ),
		};
	}, [] );

	if ( ! isActive || ! postType ) {
		return null;
	}

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	if ( siteIconURL ) {
		buttonIcon = (
			<img
				className="edit-post-fullscreen-mode-close_site-icon"
				src={ siteIconURL }
				alt="site-icon"
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	}

	return (
		<Button
			className="edit-post-fullscreen-mode-close has-icon"
			href={ addQueryArgs( 'edit.php', {
				post_type: postType.slug,
			} ) }
			label={ get( postType, [ 'labels', 'view_items' ], __( 'Back' ) ) }
		>
			{ buttonIcon }
		</Button>
	);
}

export default FullscreenModeClose;
