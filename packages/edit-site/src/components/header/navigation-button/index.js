/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Button, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';

function NavigationButton( { icon, isOpen, onClick } ) {
	const {
		isActive,
		isRequestingSiteIcon,
		siteIconUrl,
		siteTitle,
	} = useSelect( ( select ) => {
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
			siteTitle: siteData.name,
		};
	}, [] );

	if ( ! isActive ) {
		return null;
	}

	let buttonIcon = <Icon size="32px" icon={ wordpress } />;

	if ( siteIconUrl ) {
		buttonIcon = (
			<img
				alt={ __( 'Site Icon' ) }
				className="edit-site-navigation-button_site-icon"
				src={ siteIconUrl }
			/>
		);
	} else if ( isRequestingSiteIcon ) {
		buttonIcon = null;
	} else if ( icon ) {
		buttonIcon = <Icon size="32px" icon={ icon } />;
	}

	return (
		<div
			className={
				'edit-site-navigation-button_wrapper' +
				( isOpen ? ' is-open' : '' )
			}
		>
			<Button
				className="edit-site-navigation-button has-icon"
				label={ __( 'Open navigation' ) }
				onClick={ onClick }
				showTooltip
			>
				{ buttonIcon }
			</Button>

			{ isOpen && (
				<div className="edit-site-navigation-name">{ siteTitle }</div>
			) }
		</div>
	);
}

export default NavigationButton;
