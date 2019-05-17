/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit, noop } from 'lodash';

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

	return (
		<div className={ className }>
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => (
				<Snackbar
					{ ...omit( notice, [ 'content' ] ) }
					key={ notice.id }
					onRemove={ removeNotice( notice.id ) }
				>
					{ notice.content }
				</Snackbar>
			) ) }
		</div>
	);
}

export default SnackbarList;
