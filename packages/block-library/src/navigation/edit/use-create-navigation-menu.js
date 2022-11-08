/**
 * WordPress dependencies
 */
import { serialize } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import useGenerateDefaultNavigationTitle from './use-generate-default-navigation-title';
import { DEFAULT_ENTITY_KIND, DEFAULT_ENTITY_TYPE } from '../constants';

export const CREATE_NAVIGATION_MENU_SUCCESS = 'success';
export const CREATE_NAVIGATION_MENU_ERROR = 'error';
export const CREATE_NAVIGATION_MENU_PENDING = 'pending';
export const CREATE_NAVIGATION_MENU_IDLE = 'idle';

export default function useCreateNavigationMenu( clientId ) {
	const [ status, setStatus ] = useState( CREATE_NAVIGATION_MENU_IDLE );
	const [ value, setValue ] = useState( null );
	const [ error, setError ] = useState( null );

	const { saveEntityRecord } = useDispatch( coreStore );
	const generateDefaultTitle = useGenerateDefaultNavigationTitle( clientId );

	// This callback uses data from the two placeholder steps and only creates
	// a new navigation menu when the user completes the final step.
	const create = useCallback(
		async ( title = null, blocks = [], postStatus, slug = '' ) => {
			// Guard against creating Navigations without a title.
			// Note you can pass no title, but if one is passed it must be
			// a string otherwise the title may end up being empty.
			if ( title && typeof title !== 'string' ) {
				setError(
					'Invalid title supplied when creating Navigation Menu.'
				);
				setStatus( CREATE_NAVIGATION_MENU_ERROR );
				throw new Error(
					`Value of supplied title argument was not a string.`
				);
			}

			setStatus( CREATE_NAVIGATION_MENU_PENDING );
			setValue( null );
			setError( null );

			if ( ! title ) {
				title = await generateDefaultTitle().catch( ( err ) => {
					setError( err?.message );
					setStatus( CREATE_NAVIGATION_MENU_ERROR );
					throw new Error(
						'Failed to create title when saving new Navigation Menu.',
						{
							cause: err,
						}
					);
				} );
			}
			const record = {
				title,
				slug,
				content: serialize( blocks ),
				status: postStatus,
			};

			// wp_navigation entities are keyed by slug in Core Data.
			// By default saveEntityRecord will apply an optimisation and assume that if the
			// recordKey is included in the record being saved then this should be a "update"
			// rather than a "save" request. Therefore it will issue PUT and append the recordKey
			// to the request path. However this will fail as no record yet exists.
			// The record being created (see above) optionally includes a slug. This is in order that
			// any template hierarchy within which the Nav block was position can be persisted
			// in the slug and retrieved for later usage.
			// Due to the inclusion of slug in the record being created is it necessary to bypass
			// saveEntityRecord's inbuilt "optimisations" around PUT vs POST and always issue a POST request.
			const forceCreateMethod = 'POST';

			// By default saveEntityRecord will apply an optimisation and assume that if the
			// recordKey is included in the record being saved then this should be a "update"
			// rather than a "save" request. This function strips the recordKey that is appended to
			// request path to ensure the request can be routed to the POST handler on the REST API
			// endpoint. Failured to do this results in a 404.
			const stripRecordKeyFromRequestPath = ( path, recordKey ) =>
				path.replace( recordKey, '' );

			// Return affords ability to await on this function directly
			return saveEntityRecord(
				DEFAULT_ENTITY_KIND,
				DEFAULT_ENTITY_TYPE,
				record,
				{
					__unstableFetch: ( params ) => {
						return apiFetch( {
							...params,
							path: stripRecordKeyFromRequestPath(
								params.path,
								slug
							),
							method: forceCreateMethod,
						} );
					},
				}
			)
				.then( ( response ) => {
					setValue( response );
					setStatus( CREATE_NAVIGATION_MENU_SUCCESS );
					return response;
				} )
				.catch( ( err ) => {
					setError( err?.message );
					setStatus( CREATE_NAVIGATION_MENU_ERROR );
					throw new Error( 'Unable to save new Navigation Menu', {
						cause: err,
					} );
				} );
		},
		[ serialize, saveEntityRecord ]
	);

	return {
		create,
		status,
		value,
		error,
		isIdle: status === CREATE_NAVIGATION_MENU_IDLE,
		isPending: status === CREATE_NAVIGATION_MENU_PENDING,
		isSuccess: status === CREATE_NAVIGATION_MENU_SUCCESS,
		isError: status === CREATE_NAVIGATION_MENU_ERROR,
	};
}
