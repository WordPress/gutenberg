/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useFocusOutside } from '../../utils/hooks';

export default createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const [ handleFocusOutside, setHandleFocusOutside ] = useState();
		const bindFocusOutsideHandler = useCallback(
			( node ) =>
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
