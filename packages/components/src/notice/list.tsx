/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * Internal dependencies
 */
import Notice from '.';
import type { WordPressComponentProps } from '../context';
import type { NoticeListProps } from './types';

const noop = () => {};

/**
 * `NoticeList` is a component used to render a collection of notices.
 *
 *```jsx
 * import { Notice, NoticeList } from `@wordpress/components`;
 *
 * const MyNoticeList = () => {
 *	const [ notices, setNotices ] = useState( [
 *		{
 *			id: 'second-notice',
 *			content: 'second notice content',
 *		},
 *		{
 *			id: 'fist-notice',
 *			content: 'first notice content',
 *		},
 *	] );
 *
 *	const removeNotice = ( id ) => {
 *		setNotices( notices.filter( ( notice ) => notice.id !== id ) );
 *	};
 *
 *	return <NoticeList notices={ notices } onRemove={ removeNotice } />;
 *};
 *```
 */
function NoticeList( {
	notices,
	onRemove = noop,
	className,
	children,
}: WordPressComponentProps< NoticeListProps, 'div', false > ) {
	const removeNotice =
		( id: NoticeListProps[ 'notices' ][ number ][ 'id' ] ) => () =>
			onRemove( id );

	className = clsx( 'components-notice-list', className );

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
