import clsx from 'clsx';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { getMetaBoxesIframeName } from '../../utils/meta-boxes';
import { store as editPostStore } from '../../store';

export default function MetaBoxesIframe( {
	location = 'main',
}: {
	location?: 'main' | 'side';
} ) {
	// The meta box loader URL renders the classic screen; the parameter
	// trims it down to this iframe's meta box locations.
	const src = useMemo(
		() =>
			window._wpMetaBoxUrl &&
			addQueryArgs( window._wpMetaBoxUrl, {
				'gutenberg-meta-box-iframe': location,
			} ),
		[ location ]
	);
	const isSide = location === 'side';

	const isVisible = useSelect(
		( select ) =>
			! isSide ||
			select( editPostStore ).isMetaBoxLocationVisible( 'side' ),
		[ isSide ]
	);

	if ( ! src ) {
		return null;
	}

	// Hidden rather than unmounted: the iframe document reports which meta
	// boxes exist, which is what decides visibility in the first place.
	return (
		<iframe
			className={ clsx(
				'edit-post-meta-boxes-iframe',
				`is-${ location }`
			) }
			style={ isVisible ? undefined : { display: 'none' } }
			name={ getMetaBoxesIframeName( location ) }
			title={ __( 'Meta Boxes' ) }
			src={ src }
		/>
	);
}
