/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Notice from '.';
import type { WordPressComponentProps } from '../ui/context';
import type { NoticeListProps } from './types';

const noop = () => {};

function NoticeList( {
	notices,
	onRemove = noop,
	className,
	children,
}: WordPressComponentProps< NoticeListProps, 'div', false > ) {
	const removeNotice =
		( id: NoticeListProps[ 'notices' ][ number ][ 'id' ] ) => () =>
			onRemove( id );

	className = classnames( 'components-notice-list', className );

	return (
		<div className={ className }>
			{ children }
			{ [ ...notices ].reverse().map( ( notice ) => {
				const { content, ...restNotice } = notice;
				return (
					<Notice
						{ ...restNotice }
						key={ notice.id }
						onRemove={ removeNotice( notice.id ) }
					>
						{ notice.content }
					</Notice>
				);
			} ) }
		</div>
	);
}

export default NoticeList;
