/**
 * WordPress dependencies
 */
import { useContext, useReducer } from '@wordpress/element';
import { useReducedMotion, useFocusOnMount } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils/hooks/use-cx';
import { NavigatorContext } from '../context';
import { animation, pointerNone } from '../styles';

function usePresence( shouldPresent ) {
	const [ { isPresent }, dispatch ] = useReducer( usePresence.reducer, {} );
	if ( shouldPresent && ! isPresent ) {
		dispatch( true );
	}
	return [ isPresent, dispatch ];
}

usePresence.reducer = ( holding, predicate ) => {
	if ( predicate === true ) {
		// Mutates holding and returns it since a render isn't wanted.
		holding.isPresent = true;
		return holding;
	}
	return { isPresent: false };
};

function NavigatorScreen( { children, className, path } ) {
	const prefersReducedMotion = useReducedMotion();
	const [ location ] = useContext( NavigatorContext );
	const isCurrent = location.path === path;
	const [ isPresent, exit ] = usePresence( isCurrent );

	const ref = useFocusOnMount();

	const cx = useCx();

	if ( ! isPresent || ( prefersReducedMotion && ! isCurrent ) ) {
		return null;
	}

	if ( prefersReducedMotion ) {
		return <div>{ children }</div>;
	}

	const props = { className: [ className ] };

	if ( ! isCurrent ) {
		props.ariaHidden = true;
		props.onAnimationEnd = exit;
		props.className.push( pointerNone );
	}
	if ( ! location.isFirst ) {
		props.ref = ref;
		props.className.push( animation( isCurrent, location.isBack ) );
	}

	props.className = cx( ...props.className );

	return <div { ...props }>{ children }</div>;
}

export default NavigatorScreen;
