/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';
import { Button, Icon } from '@wordpress/components';
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

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	if ( siteIconURL ) {
		buttonIcon = (
			<img
				className="edit-site-fullscreen-mode-close_site-icon"
				src={ siteIconURL }
				alt="site-icon"
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	} else if ( icon ) {
		buttonIcon = <Icon size="36px" icon={ icon } />;
	}

	return (
		<Button
			className="edit-site-fullscreen-mode-close has-icon"
			href="index.php"
			label={ __( 'Back' ) }
			showTooltip
		>
			{ buttonIcon }
		</Button>
	);
}

export default FullscreenModeClose;
