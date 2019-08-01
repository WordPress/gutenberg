/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { createPortal, useLayoutEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Consumer, useSlot } from './context';

let occurrences = 0;

function FillComponent( { name, children, registerFill, unregisterFill } ) {
	const slot = useSlot( name );

	const ref = useRef( {
		name,
		children,
	} );

	if ( ! ref.current.occurrence ) {
		ref.current.occurrence = ++occurrences;
	}

	useLayoutEffect( () => {
		registerFill( name, ref.current );
		return () => unregisterFill( name, ref.current );
	}, [] );

	useLayoutEffect( () => {
		ref.current.children = children;
		if ( slot && ! slot.props.bubblesVirtually ) {
			slot.forceUpdate();
		}
	}, [ children ] );

	useLayoutEffect( () => {
		if ( name === ref.current.name ) {
			// ignore initial effect
			return;
		}
		unregisterFill( ref.current.name, ref.current );
		ref.current.name = name;
		registerFill( name, ref.current );
	}, [ name ] );

	if ( ! slot || ! slot.node || ! slot.props.bubblesVirtually ) {
		return null;
	}

	// If a function is passed as a child, provide it with the fillProps.
	if ( isFunction( children ) ) {
		children = children( slot.props.fillProps );
	}

	return createPortal( children, slot.node );
}

const Fill = ( props ) => (
	<Consumer>
		{ ( { registerFill, unregisterFill } ) => (
			<FillComponent
				{ ...props }
				registerFill={ registerFill }
				unregisterFill={ unregisterFill }
			/>
		) }
	</Consumer>
);

export default Fill;
