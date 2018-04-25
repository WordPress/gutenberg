/**
 * External dependencies
 */
import { noop, omit } from 'lodash';

/**
 * Internal dependencies
 */
import Notice from './';

function NoticeList( { notices, onRemove = noop, children } ) {
	const removeNotice = ( id ) => () => onRemove( id );

	return (
		<div className="components-notice-list">
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => (
				<Notice { ...omit( notice, 'content' ) } key={ notice.id } onRemove={ removeNotice( notice.id ) }>
					{ notice.content }
				</Notice>
			) ) }
		</div>
	);
}

export default NoticeList;
