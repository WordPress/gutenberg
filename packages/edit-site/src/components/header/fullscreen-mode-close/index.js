/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function FullscreenModeClose( { icon } ) {
	const [ siteIconURL ] = useEntityProp( 'root', 'site', 'site_icon_url' );

	const isRequestingSiteIcon = useSelect( ( select ) => {
		return select( 'core/data' ).isResolving( 'core', 'getEntityRecord', [
			'root',
			'site',
			undefined,
		] );
	}, [] );

	const isActive = useSelect( ( select ) => {
		return select( 'core/edit-site' ).isFeatureActive( 'fullscreenMode' );
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	const shouldDisplaySiteIcon = siteIconURL || isRequestingSiteIcon;
	const buttonIcon = shouldDisplaySiteIcon ? null : icon || wordpress;

	return (
		<Button
			className="edit-site-fullscreen-mode-close"
			icon={ buttonIcon }
			iconSize={ 36 }
			href="index.php"
			label={ __( 'Back' ) }
		>
			{ /* TODO: Properly style site icon */ }
			{ siteIconURL && (
				<img
					src={ siteIconURL }
					alt="site-icon"
					style={ { width: '36px', height: 'auto' } }
				/>
			) }
		</Button>
	);
}

export default FullscreenModeClose;
