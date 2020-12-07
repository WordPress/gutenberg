/**
 * WordPress dependencies
 */
import {
	createHigherOrderComponent,
	useFocusOutside,
} from '@wordpress/compose';
import { useRef } from '@wordpress/element';

export default createHigherOrderComponent( ( WrappedComponent ) => {
	return ( props ) => {
		const node = useRef();
		const wrapperRef = useFocusOutside( () => {
			if ( node?.current?.handleFocusOutside ) {
				node.current.handleFocusOutside();
			}
		} );
		return (
			<div ref={ wrapperRef }>
				<WrappedComponent ref={ node } { ...props } />
			</div>
		);
	};
}, 'withFocusOutside' );
