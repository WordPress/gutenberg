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
		const { getEntityRecord } = select( coreDataStore );
		const siteData = getEntityRecord( 'root', '__unstableBase', undefined );

		return {
			isRequestingSite: ! siteData,
			siteIconUrl: siteData?.site_icon_url,
		};
	}, [] );

	if ( isRequestingSite && ! siteIconUrl ) {
		return <div className="edit-site-site-icon__image" />;
	}

	const icon = siteIconUrl ? (
		<img
			className="edit-site-site-icon__image"
			alt={ __( 'Site Icon' ) }
			src={ siteIconUrl }
		/>
	) : (
		<Icon
			className="edit-site-site-icon__icon"
			size="48px"
			icon={ wordpress }
		/>
	);

	return (
		<div className={ classnames( className, 'edit-site-site-icon' ) }>
			{ icon }
		</div>
	);
}

export default SiteIcon;
