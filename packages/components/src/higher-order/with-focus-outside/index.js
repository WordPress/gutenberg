/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useFocusOutside } from '../../utils/hooks';

export default createHigherOrderComponent(
	( WrappedComponent ) => ( props ) => {
		const __unstableNodeRef = useRef();
		const eventHandlers = useFocusOutside( null, __unstableNodeRef );

		return (
			<div { ...eventHandlers }>
				<WrappedComponent ref={ __unstableNodeRef } { ...props } />
			</div>
		);
	},
	'withFocusOutside'
);
