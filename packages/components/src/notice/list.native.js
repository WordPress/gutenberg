/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, omit } from 'lodash';
import {
	View,
} from 'react-native';

/**
 * Internal dependencies
 */
import Notice from './';
import styles from './style.scss';

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
function NoticeList( { notices, onRemove = noop, className, children } ) {
	const removeNotice = ( id ) => () => onRemove( id );
    
	return (
		<View style={ styles.list }>
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => (
				<Notice
					{ ...notice }
					key={ notice.id }
					onRemove={ removeNotice( notice.id ) }
				>
				
				</Notice>
			) ) }
		</View>
	);
}

export default NoticeList;
