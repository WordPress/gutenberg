/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { store as coreDataStore } from '@wordpress/core-data';

function SiteIcon( { className } ) {
	const { isRequestingSite, siteIconUrl } = useSelect( ( select ) => {
		const { getEditedEntityRecord, isResolving } = select( coreDataStore );
		const siteData =
			getEditedEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			isRequestingSite: isResolving( 'core', 'getEntityRecord', [
				'root',
				'__unstableBase',
				undefined,
			] ),
			siteIconUrl: siteData.site_icon_url,
		};
	}, [] );

	if ( isRequestingSite && ! siteIconUrl ) {
		return null;
	}

	const icon = siteIconUrl ? (
		<img
			className="onboarding-site-icon__image"
			alt={ __( 'Site Icon' ) }
			src={ siteIconUrl }
		/>
	) : (
		<Icon
			className="onboarding-site-icon__icon"
			size="32px"
			icon={ wordpress }
		/>
	);

	return (
		<div className={ classnames( className, 'onboarding-site-icon' ) }>
			{ icon }
		</div>
	);
}

export default SiteIcon;
