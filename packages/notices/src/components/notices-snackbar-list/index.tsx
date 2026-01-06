/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as noticesStore } from '../../store';

// Last three notices. Slices from the tail end of the list.
const MAX_VISIBLE_NOTICES = -3;

type NoticesSnackbarListProps = {
	className?: string;
};

export default function NoticesSnackbarList( {
	className,
}: NoticesSnackbarListProps ) {
	const notices = useSelect( ( select ) =>
		select( noticesStore ).getNotices()
	);
	const { removeNotice } = useDispatch( noticesStore );
	const snackbarNotices = notices
		.filter( ( { type } ) => type === 'snackbar' )
		.slice( MAX_VISIBLE_NOTICES );

	return (
		<SnackbarList
			// @ts-expect-error - SnackbarList is not typed properly.
			notices={ snackbarNotices }
			className={ clsx( 'components-notices__snackbar', className ) }
			onRemove={ removeNotice }
		/>
	);
}
