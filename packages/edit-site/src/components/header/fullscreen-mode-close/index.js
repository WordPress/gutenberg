/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function FullscreenModeClose( { icon } ) {
	const { isActive, isRequestingSiteIcon, siteIconUrl } = useSelect(
		( select ) => {
			const { isFeatureActive } = select( 'core/edit-site' );
			const { getEntityRecord } = select( 'core' );
			const { isResolving } = select( 'core/data' );
			const siteData =
				getEntityRecord( 'root', '__unstableBase', undefined ) || {};

			return {
				isActive: isFeatureActive( 'fullscreenMode' ),
				isRequestingSiteIcon: isResolving( 'core', 'getEntityRecord', [
					'root',
					'__unstableBase',
					undefined,
				] ),
				siteIconUrl: siteData.site_icon_url,
			};
		},
		[]
	);

	if ( ! isActive ) {
		return null;
	}

	let buttonIcon = <Icon size="36px" icon={ wordpress } />;

	if ( siteIconUrl ) {
		buttonIcon = (
			<img
				alt={ __( 'Site Icon' ) }
				className="edit-site-fullscreen-mode-close_site-icon"
				src={ siteIconUrl }
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
