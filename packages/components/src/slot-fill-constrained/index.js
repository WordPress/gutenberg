/**
 * External dependencies
 */
import {
	filter,
	isFunction,
	isString,
	negate,
	findIndex,
} from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createContext,
	useReducer,
	useContext,
	useEffect,
	cloneElement,
	Children,
	isEmptyElement,
	Fragment,
} from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';

export function createConstrainedSlotFill() {
	const Context = createContext( [ [], () => {} ] );

	const initialFills = [];
	function reducer( state, action ) {
		switch ( action.type ) {
			case 'remove':
				return filter( state, ( fill ) => fill.key !== action.key );
			case 'add': {
				const index = findIndex( state, ( fill ) => fill.key === action.key );
				if ( index === -1 ) {
					return [
						...state,
						{ key: action.key, children: action.children },
					];
				}
				return [
					...state.slice( 0, index ),
					{ key: action.key, children: action.children },
					...state.slice( index + 1 ),
				];
			}
			default:
				throw new Error();
		}
	}

	function Provider( { children } ) {
		const context = useReducer( reducer, initialFills );

		return (
			<Context.Provider value={ context }>
				{ children }
			</Context.Provider>
		);
	}

	function Slot( { children, fillProps = {} } ) {
		const [ fills ] = useContext( Context );

		const normalizedFills = fills.map( ( fill ) => {
			const { children: fillChildren, key } = fill;
			const element = isFunction( fillChildren ) ? fillChildren( fillProps ) : fillChildren;
			return Children.map( element, ( child, childIndex ) => {
				if ( ! child || isString( child ) ) {
					return child;
				}

				const childKey = `${ key }---${ child.key || childIndex }`;
				return cloneElement( child, { key: childKey } );
			} );
		} ).filter(
			// In some cases fills are rendered only when some conditions apply.
			// This ensures that we only use non-empty fills when rendering, i.e.,
			// it allows us to render wrappers only when the fills are actually present.
			negate( isEmptyElement )
		);

		return (
			<Fragment>
				{ isFunction( children ) ? children( normalizedFills ) : normalizedFills }
			</Fragment>
		);
	}

	const Fill = withInstanceId( ( { children, instanceId } ) => {
		const [ , dispatch ] = useContext( Context );
		useEffect( () => {
			dispatch( { type: 'add', key: instanceId, children } );
			return () => dispatch( { type: 'remove', key: instanceId } );
		}, [ instanceId, children ] );
		return null;
	} );

	return {
		Provider,
		Slot,
		Fill,
	};
}
