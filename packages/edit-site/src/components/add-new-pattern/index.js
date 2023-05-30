/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
// import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
// import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import CreatePatternModal from '../create-pattern-modal';
// import { unlock } from '../../private-apis';

// const { useHistory } = unlock( routerPrivateApis );

export default function AddNewPattern( { toggleProps } ) {
	// const history = useHistory();
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { createErrorNotice } = useDispatch( noticesStore );
	// const { saveEntityRecord } = useDispatch( coreStore );

	async function createPattern( { name } ) {
		if ( ! name ) {
			createErrorNotice( __( 'Name is not defined.' ), {
				type: 'snackbar',
			} );
			return;
		}

		// TODO: Implement saving of pattern.
		setIsModalOpen( false );
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
