/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

function SiteTitle( { className } ) {
	const { isRequestingSite, siteTitle } = useSelect( ( select ) => {
		const { getEntityRecord, isResolving } = select( coreDataStore );
		const siteData =
			getEntityRecord( 'root', '__unstableBase', undefined ) || {};

		return {
			isRequestingSite: isResolving( 'core', 'getEntityRecord', [
				'root',
				'__unstableBase',
				undefined,
			] ),
			siteTitle: siteData.name,
		};
	}, [] );

	if ( isRequestingSite && ! siteTitle ) {
		return null;
	}

	return (
		<div className={ classnames( className, 'edit-site-site-title' ) }>
			{ siteTitle }
		</div>
	);
}

export default SiteTitle;
