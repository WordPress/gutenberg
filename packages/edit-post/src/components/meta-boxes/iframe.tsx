import clsx from 'clsx';
import { useMemo } from '@wordpress/element';
import { useRefEffect } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
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

	// The ids of the meta boxes hidden through the Preferences modal, as
	// one string so that the value is stable across store updates.
	const hiddenIds = useSelect(
		( select ) => {
			const { getMetaBoxesPerLocation } = select( editPostStore );
			const { isEditorPanelEnabled } = select( editorStore );
			const locations = isSide ? [ 'side' ] : [ 'normal', 'advanced' ];
			return locations
				.flatMap(
					( boxLocation ) =>
						getMetaBoxesPerLocation( boxLocation ) ?? []
				)
				.filter(
					( { id } ) => ! isEditorPanelEnabled( `meta-box-${ id }` )
				)
				.map( ( { id } ) => id )
				.join( ',' );
		},
		[ isSide ]
	);

	// Hides the meta boxes hidden through the Preferences modal by adding
	// a style sheet to the iframe document. Reapplied on every load.
	const visibilityRef = useRefEffect< HTMLIFrameElement >(
		( iframe ) => {
			const apply = () => {
				const frameDocument = iframe.contentDocument;
				if ( ! frameDocument?.head ) {
					return;
				}
				let style = frameDocument.getElementById(
					'gutenberg-meta-box-visibility'
				);
				if ( ! style ) {
					style = frameDocument.createElement( 'style' );
					style.id = 'gutenberg-meta-box-visibility';
					frameDocument.head.appendChild( style );
				}
				style.textContent = hiddenIds
					.split( ',' )
					.filter( Boolean )
					.map(
						( id ) =>
							`#${ window.CSS.escape( id ) } { display: none; }`
					)
					.join( '\n' );
			};
			iframe.addEventListener( 'load', apply );
			apply();
			return () => iframe.removeEventListener( 'load', apply );
		},
		[ hiddenIds ]
	);

	const ref = visibilityRef;

	if ( ! src || ! isVisible ) {
		return null;
	}

	return (
		<iframe
			ref={ ref }
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
