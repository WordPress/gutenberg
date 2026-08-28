import clsx from 'clsx';
import { useMemo } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
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

	// The ids of the hidden meta boxes, as one string so that the value is
	// stable across store updates.
	const hiddenIds = useSelect(
		( select ) =>
			select( editPostStore )
				.getAllMetaBoxes()
				.filter( ( { hidden } ) => hidden )
				.map( ( { id } ) => id )
				.join( ',' ),
		[]
	);

	// The document renders with the visibility saved on the server, which
	// a change made while it is loading would miss, so the store's
	// visibility is applied to the rendered boxes on load and on change.
	const visibilityRef = useRefEffect< HTMLIFrameElement >(
		( iframe ) => {
			const hiddenSet = new Set(
				hiddenIds.split( ',' ).filter( Boolean )
			);
			const apply = () => {
				const boxes =
					iframe.contentDocument?.querySelectorAll( '.postbox' ) ??
					[];
				for ( const box of boxes ) {
					box.classList.toggle(
						'hide-if-js',
						hiddenSet.has( box.id )
					);
				}
			};
			iframe.addEventListener( 'load', apply );
			apply();
			return () => iframe.removeEventListener( 'load', apply );
		},
		[ hiddenIds ]
	);

	if ( ! src || ! isVisible ) {
		return null;
	}

	return (
		<iframe
			ref={ visibilityRef }
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
