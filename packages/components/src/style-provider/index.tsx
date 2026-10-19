import { useInsertionEffect } from '@wordpress/element';
import { registerDocument } from '@wordpress/style-runtime';
import { contextConnectWithoutRef, useContextSystem } from '../context';
import type { StyleProviderProps } from './types';

function UnconnectedStyleProvider( props: StyleProviderProps ) {
	const { children, document, nonce } = useContextSystem<
		StyleProviderProps & { className?: string }
	>( props, 'StyleProvider' );

	// Inject module styles before children measure layout, including in iframes.
	useInsertionEffect( () => {
		if ( ! document ) {
			return;
		}

		return registerDocument( document, { nonce } );
	}, [ document, nonce ] );

	if ( ! document ) {
		return null;
	}

	return <>{ children }</>;
}

export const StyleProvider = contextConnectWithoutRef(
	UnconnectedStyleProvider,
	'StyleProvider'
);

export default StyleProvider;
