/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { createPortal, useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Consumer } from './context';

let occurrences = 0;

function FillComponent( { name, getSlot, children, registerFill, unregisterFill } ) {
	// Random state used to rerender the component if needed, ideally we don't need this
	const [ , updateRerenderState ] = useState( {} );
	const rerender = () => updateRerenderState( {} );

	const ref = useRef( {
		name,
		children,
	} );

	if ( ! ref.current.occurrence ) {
		ref.current.occurrence = ++occurrences;
	}

	useLayoutEffect( () => {
		ref.current.forceUpdate = rerender;
		registerFill( name, ref.current );
		return () => unregisterFill( name, ref.current );
	}, [] );

	useLayoutEffect( () => {
		ref.current.children = children;
		const slot = getSlot( name );
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

	const slot = getSlot( name );

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
		{ ( { getSlot, registerFill, unregisterFill } ) => (
			<FillComponent
				{ ...props }
				getSlot={ getSlot }
				registerFill={ registerFill }
				unregisterFill={ unregisterFill }
			/>
		) }
	</Consumer>
);

export default Fill;
