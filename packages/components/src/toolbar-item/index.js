/**
 * External dependencies
 */
import { ToolbarItem as BaseToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import {
	forwardRef,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarItem( { children, as: Component, ...props }, ref ) {
	const initialState = useContext( ToolbarContext );
	const [ state, setState ] = useState( initialState );
	const id = useInstanceId( ToolbarItem, 'toolbar-item' );

	useEffect( () => {
		if ( ! initialState?.subscribe ) return;
		return initialState?.subscribe( ( nextState ) => {
			if ( id === state.currentId || id === nextState.currentId ) {
				setState( nextState );
			}
		} );
	}, [ initialState?.subscribe, state?.currentId, id ] );

	if ( typeof children !== 'function' && ! Component ) {
		warning(
			'`ToolbarItem` is a generic headless component. You must pass either a `children` prop as a function or an `as` prop as a component. ' +
				'See https://developer.wordpress.org/block-editor/components/toolbar-item/'
		);
		return null;
	}

	const allProps = { ...props, ref, 'data-toolbar-item': true };

	if ( ! initialState ) {
		if ( Component ) {
			return <Component { ...allProps }>{ children }</Component>;
		}
		return children( allProps );
	}

	// eslint-disable-next-line no-unused-vars
	const { subscribe, ...toolbarState } = state;

	return (
		<BaseToolbarItem
			{ ...toolbarState }
			{ ...allProps }
			as={ Component }
			id={ id }
		>
			{ children }
		</BaseToolbarItem>
	);
}

export default forwardRef( ToolbarItem );
