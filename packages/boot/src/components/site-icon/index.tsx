/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon, wordpress } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { store as coreDataStore } from '@wordpress/core-data';
import type { UnstableBase } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import './style.scss';

function SiteIcon( { className }: { className?: string } ) {
	const { isRequestingSite, siteIconUrl } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreDataStore );
		const siteData = getEntityRecord< UnstableBase >(
			'root',
			'__unstableBase',
			undefined
		);

		return {
			isRequestingSite: ! siteData,
			siteIconUrl: siteData?.site_icon_url,
		};
	}, [] );

	let icon = null;

	if ( isRequestingSite && ! siteIconUrl ) {
		icon = <div className="boot-site-icon__image" />;
	} else {
		icon = siteIconUrl ? (
			<img
				className="boot-site-icon__image"
				alt={ __( 'Site Icon' ) }
				src={ siteIconUrl }
			/>
		) : (
			<Icon
				className="boot-site-icon__icon"
				icon={ wordpress }
				size={ 48 }
			/>
		);
	}

	return (
		<div className={ clsx( className, 'boot-site-icon' ) }>{ icon }</div>
	);
}

export default SiteIcon;
