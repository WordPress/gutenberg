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

type SnackbarNoticesProps = {
	className?: string;
	context?: string;
};

export default function SnackbarNotices( {
	className,
	context,
}: SnackbarNoticesProps ) {
	const notices = useSelect(
		( select ) => select( noticesStore ).getNotices( context ),
		[ context ]
	);
	const { removeNotice } = useDispatch( noticesStore );
	const snackbarNotices = notices
		.filter( ( { type } ) => type === 'snackbar' )
		.slice( MAX_VISIBLE_NOTICES );

	return (
		<SnackbarList
			notices={ snackbarNotices }
			className={ clsx( 'components-notices__snackbar', className ) }
			onRemove={ ( id ) => removeNotice( id, context ) }
		/>
	);
}
