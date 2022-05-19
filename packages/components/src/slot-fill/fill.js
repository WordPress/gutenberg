// @ts-nocheck
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
import SlotFillContext from './context';
import useSlot from './use-slot';

function FillComponent( { name, children, registerFill, unregisterFill } ) {
	const slot = useSlot( name );

	const ref = useRef( {
		name,
		children,
	} );

	useLayoutEffect( () => {
		registerFill( name, ref.current );
		return () => unregisterFill( name, ref.current );
	}, [] );

	useLayoutEffect( () => {
		ref.current.children = children;
		if ( slot ) {
			slot.forceUpdate();
		}
	}, [ children ] );

	useLayoutEffect( () => {
		if ( name === ref.current.name ) {
			// Ignore initial effect.
			return;
		}
		unregisterFill( ref.current.name, ref.current );
		ref.current.name = name;
		registerFill( name, ref.current );
	}, [ name ] );

	if ( ! slot || ! slot.node ) {
		return null;
	}

	// If a function is passed as a child, provide it with the fillProps.
	if ( isFunction( children ) ) {
		children = children( slot.props.fillProps );
	}

	return createPortal( children, slot.node );
}

const Fill = ( props ) => (
	<SlotFillContext.Consumer>
		{ ( { registerFill, unregisterFill } ) => (
			<FillComponent
				{ ...props }
				registerFill={ registerFill }
				unregisterFill={ unregisterFill }
			/>
		) }
	</SlotFillContext.Consumer>
);

export default Fill;
