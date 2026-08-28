import clsx from 'clsx';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import {
	getMetaBoxesIframeUrl,
	getMetaBoxesIframeName,
} from '../../utils/meta-boxes';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

	const hiddenIds = useSelect(
		( select ) =>
			unlock( select( editPostStore ) ).getHiddenMetaBoxIds( location ),
		[ location ]
	);

	const [ frameDocument, setFrameDocument ] = useState< Document | null >(
		null
	);

	// The class is toggled both ways because the block editor ignores the
	// classic Screen Options hidden state, which the server renders the
	// boxes with.
	useEffect( () => {
		const boxes = frameDocument?.querySelectorAll( '.postbox' ) ?? [];
		for ( const box of boxes ) {
			box.classList.toggle( 'hide-if-js', hiddenIds.includes( box.id ) );
		}
	}, [ frameDocument, hiddenIds ] );

	if ( ! src || ! isVisible ) {
		return null;
	}

	return (
		<iframe
			onLoad={ ( event ) =>
				setFrameDocument( event.currentTarget.contentDocument )
			}
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
