import { useEffect, useState } from '@wordpress/element';
import { Spinner as WCSpinner } from '@wordpress/components';
import loadLazyEditor from '../../utils/load-lazy-editor';

type EntitiesSavedStatesComponent = Awaited<
	ReturnType< typeof loadLazyEditor >
>[ 'EntitiesSavedStates' ];

interface EntitiesSavedStatesProps {
	close: () => void;
	variant?: string;
}

/**
 * Shows `EntitiesSavedStates` from `@wordpress/editor`, which is loaded the
 * first time this is shown, not with the page.
 *
 * @param props         Component props.
 * @param props.close   Closes the panel.
 * @param props.variant The variant of the panel.
 * @return The panel, or a spinner while the editor loads.
 */
export default function EntitiesSavedStates( {
	close,
	variant,
}: EntitiesSavedStatesProps ) {
	const [ Component, setComponent ] =
		useState< EntitiesSavedStatesComponent | null >( null );

	useEffect( () => {
		let isMounted = true;
		loadLazyEditor()
			.then( ( module ) => {
				if ( isMounted ) {
					setComponent( () => module.EntitiesSavedStates );
				}
			} )
			.catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.error( 'Failed to load the save panel:', error );
			} );
		return () => {
			isMounted = false;
		};
	}, [] );

	if ( ! Component ) {
		return <WCSpinner />;
	}

	return <Component close={ close } variant={ variant } />;
}
