/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function useNavigateToEntityRecord() {
	const history = useHistory();

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			return ( event ) => {
				event?.preventDefault();

				history.push( { ...params, focusMode: true, canvas: 'edit' } );
			};
		},
		[ history ]
	);

	return onNavigateToEntityRecord;
}
