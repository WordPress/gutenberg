/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import {
	createHigherOrderComponent,
	__experimentalUseFocusOutside as useFocusOutside,
} from '@wordpress/compose';

/**
 * External dependencies
 */
import type { FocusEvent } from 'react';

export default createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const [ handleFocusOutside, setHandleFocusOutside ] = useState<
			undefined | ( ( event: FocusEvent ) => void )
		>( undefined );

		const bindFocusOutsideHandler = useCallback<
			( node: FocusEvent ) => void
		>(
			( node: any ) =>
				setHandleFocusOutside( () =>
					node?.handleFocusOutside
						? node.handleFocusOutside.bind( node )
						: undefined
				),
			[]
		);

		return (
			<div { ...useFocusOutside( handleFocusOutside ) }>
				<WrappedComponent
					ref={ bindFocusOutsideHandler }
					{ ...props }
				/>
			</div>
		);
	},
	'withFocusOutside'
);
