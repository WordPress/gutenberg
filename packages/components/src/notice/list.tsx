/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import Notice from '.';
import type { WordPressComponentProps } from '../context';
import type { NoticeListProps as NoticeListBaseProps } from './types';

const noop = () => {};

export type NoticeListProps = WordPressComponentProps<
	NoticeListBaseProps,
	'div',
	false
>;

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
}: NoticeListProps ) {
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
