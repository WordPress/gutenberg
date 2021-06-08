/**
 * External dependencies
 */
import { filter } from 'lodash';

/**
 * WordPress dependencies
 */
import { NoticeList, SnackbarList } from '@wordpress/components';
import { useResizeObserver } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import TemplateValidationNotice from '../template-validation-notice';

export default function EditorNotices( { onResize } ) {
	const notices = useSelect( ( select ) => {
		return select( noticesStore ).getNotices();
	}, [] );
	const { removeNotice: onRemove } = useDispatch( noticesStore );

	const [ resizeListener, size ] = useResizeObserver();
	useEffect( () => {
		onResize?.( size );
	}, [ size.width, size.height ] );

	const dismissibleNotices = filter( notices, {
		isDismissible: true,
		type: 'default',
	} );
	const nonDismissibleNotices = filter( notices, {
		isDismissible: false,
		type: 'default',
	} );
	const snackbarNotices = filter( notices, {
		type: 'snackbar',
	} );

	return (
		<>
			<NoticeList
				notices={ nonDismissibleNotices }
				className="components-editor-notices__pinned"
			/>
			<NoticeList
				notices={ dismissibleNotices }
				className="components-editor-notices__dismissible"
				onRemove={ onRemove }
			>
				{ resizeListener }
				<TemplateValidationNotice />
			</NoticeList>
			<SnackbarList
				notices={ snackbarNotices }
				className="components-editor-notices__snackbar"
				onRemove={ onRemove }
			/>
		</>
	);
}
