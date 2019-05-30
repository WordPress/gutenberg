/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit, noop } from 'lodash';
import { useTransition, animated } from 'react-spring';

/**
 * WordPress dependencies
 */
import { useReducedMotion } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Snackbar from './';

/**
* Renders a list of notices.
*
* @param  {Object}   $0           Props passed to the component.
* @param  {Array}    $0.notices   Array of notices to render.
* @param  {Function} $0.onRemove  Function called when a notice should be removed / dismissed.
* @param  {Object}   $0.className Name of the class used by the component.
* @param  {Object}   $0.children  Array of children to be rendered inside the notice list.
* @return {Object}                The rendered notices list.
*/
function SnackbarList( { notices, className, children, onRemove = noop } ) {
	className = classnames( 'components-snackbar-list', className );
	const removeNotice = ( id ) => () => onRemove( id );

	const isReducedMotion = useReducedMotion();
	const [ refMap ] = useState( () => new WeakMap() );
	const [ cancelMap ] = useState( () => new WeakMap() );
	const transitions = useTransition(
		notices,
		( notice ) => notice.id,
		{
			from: { opacity: 0, height: 0 },
			enter: ( item ) => async ( next ) => await next( { opacity: 1, height: refMap.get( item ).offsetHeight } ),
			leave: ( item ) => async ( next, cancel ) => {
				cancelMap.set( item, cancel );
				// await next( { life: '0%' } );
				await next( { opacity: 0 } );
				await next( { height: 0 } );
			},
			config: { tension: 300 },
			immediate: isReducedMotion,
		}
	);

	return (
		<div className={ className }>
			{ children }
			{ transitions.map( ( { item: notice, key, props: style } ) => (
				<animated.div key={ key } style={ style }>
					<Snackbar
						ref={ ( ref ) => ref && refMap.set( notice, ref ) }
						{ ...omit( notice, [ 'content' ] ) }
						onRemove={ removeNotice( notice.id ) }
					>
						{ notice.content }
					</Snackbar>
				</animated.div>
			) ) }
		</div>
	);
}

export default SnackbarList;
