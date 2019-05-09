/**
 * External dependencies
 */
import { isFunction } from 'lodash';

/**
 * WordPress dependencies
 */
import { createPortal, useEffect, useRef, useState } from '@wordpress/element';

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

	useEffect( () => {
		ref.current.occurence = ++occurrences;
		ref.current.resetOccurrence = () => {
			ref.current.occurence = null;
		};
		ref.current.forceUpdate = rerender;
		registerFill( name, ref.current );
		return () => unregisterFill( name, ref.current );
	}, [] );

	useEffect( () => {
		if ( ! ref.current.occurence ) {
			ref.current.occurence = ++occurrences;
		}
		ref.current.children = children;
		const slot = getSlot( name );
		if ( slot && ! slot.props.bubblesVirtually ) {
			slot.forceUpdate();
		}
	}, [ children ] );

	useEffect( () => {
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
