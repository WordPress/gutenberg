import clsx from 'clsx';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	getMetaBoxesIframeUrl,
	getMetaBoxesIframeName,
} from '../../utils/meta-boxes';
import { store as editPostStore } from '../../store';

export default function MetaBoxesIframe( {
	location = 'main',
}: {
	location?: 'main' | 'side';
} ) {
	const src = useMemo(
		() => getMetaBoxesIframeUrl( location ),
		[ location ]
	);
	const isSide = location === 'side';

	const isVisible = useSelect(
		( select ) =>
			! isSide ||
			select( editPostStore ).isMetaBoxLocationVisible( 'side' ),
		[ isSide ]
	);

	if ( ! src || ! isVisible ) {
		return null;
	}

	return (
		<iframe
			className={ clsx(
				'edit-post-meta-boxes-iframe',
				`is-${ location }`
			) }
			name={ getMetaBoxesIframeName( location ) }
			title={ __( 'Meta Boxes' ) }
			src={ src }
		/>
	);
}
