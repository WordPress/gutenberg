/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import CreatePatternModal from '../create-pattern-modal';
import { unlock } from '../../private-apis';

const { useHistory } = unlock( routerPrivateApis );

export default function AddNewPattern( { toggleProps } ) {
	const history = useHistory();
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

	async function createPattern( { name, categoryId } ) {
		if ( ! name ) {
			createErrorNotice( __( 'Name is not defined.' ), {
				type: 'snackbar',
			} );
			return;
		}

		if ( ! categoryId ) {
			createErrorNotice( __( 'Category has not been selected.' ), {
				type: 'snackbar',
			} );
			return;
		}

		try {
			// TODO: Enforce unique pattern names?

			const pattern = await saveEntityRecord(
				'postType',
				'wp_block',
				{
					title: name || __( 'Untitled Pattern' ),
					content: '',
					status: 'publish',
					meta: { wp_block: { sync_status: 'notSynced' } },
					wp_pattern: [ categoryId ],
				},
				{ throwOnError: true }
			);

			setIsModalOpen( false );

			history.push( {
				postId: pattern.id,
				postType: 'wp_block',
				categoryType: 'wp_block',
				categoryId,
				canvas: 'edit',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the pattern.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
			setIsModalOpen( false );
		}
	}

	const { as: Toggle = Button, ...restToggleProps } = toggleProps ?? {};

	return (
		<>
			<Toggle
				{ ...restToggleProps }
				onClick={ () => {
					setIsModalOpen( true );
				} }
				icon={ plus }
				label={ __( 'Create pattern' ) }
			/>
			{ isModalOpen && (
				<CreatePatternModal
					closeModal={ () => setIsModalOpen( false ) }
					onCreate={ createPattern }
				/>
			) }
		</>
	);
}
