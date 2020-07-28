/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { getPathAndQueryString } from '@wordpress/url';
import { useRegistry, useSelect, useDispatch } from '@wordpress/data';

function useBrowseModeNavigation( isBrowseMode, registry, setPage ) {
	useEffect( () => {
		const listener = async ( event ) => {
			if ( ! event.target.dataset.type || ! event.target.dataset.id )
				return;

			const entity = await registry
				.__experimentalResolveSelect( 'core' )
				.getEntityRecord(
					'postType',
					event.target.dataset.type,
					event.target.dataset.id
				);

			setPage( {
				type: entity.type,
				slug: entity.slug,
				path: getPathAndQueryString( entity.link || entity.url ),
				context: { postType: entity.type, postId: entity.id },
			} );
		};

		const unsubscribe = () =>
			document
				.getElementsByClassName( 'editor-styles-wrapper' )?.[ 0 ]
				?.removeEventListener( 'click', listener, true );

		if ( ! isBrowseMode ) unsubscribe();
		else
			return (
				document
					.getElementsByClassName( 'editor-styles-wrapper' )?.[ 0 ]
					?.addEventListener( 'click', listener, true ) && unsubscribe
			);
	}, [ isBrowseMode ] );
}

export default function BrowseModeNavigation() {
	const registry = useRegistry();
	useBrowseModeNavigation(
		useSelect(
			( select ) => select( 'core/block-editor' ).isBrowseMode(),
			[]
		),
		registry,
		useDispatch( 'core/edit-site' ).setPage
	);
	return null;
}
