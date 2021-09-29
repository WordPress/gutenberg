/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { View } from '../../view';
import { NavigatorContext } from '../context';
import type { NavigatorProviderProps, NavigatorPath } from '../types';

function NavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const { initialPath, children, ...otherProps } = useContextSystem(
		props,
		'NavigatorProvider'
	);

	const [ path, setPath ] = useState< NavigatorPath >( {
		path: initialPath,
	} );

	return (
		<View ref={ forwardedRef } { ...otherProps }>
			<NavigatorContext.Provider value={ [ path, setPath ] }>
				{ children }
			</NavigatorContext.Provider>
		</View>
	);
}

const ConnectedNavigatorProvider = contextConnect(
	NavigatorProvider,
	'NavigatorProvider'
);

export default ConnectedNavigatorProvider;
