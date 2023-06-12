/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { ToggleControl, TextControl } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

export default function Password( {
	password: currentPassword,
	postId,
	postType,
} ) {
	const [ showPassword, setShowPassword ] = useState( !! currentPassword );
	const [ password, setPassword ] = useState( currentPassword );

	const { editEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	async function savePassword( newPassword ) {
		setPassword( newPassword );
		try {
			await editEntityRecord( 'postType', postType, postId, {
				password: newPassword,
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while updating the password' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	}

	const handleTogglePassword = ( value ) => {
		setShowPassword( value );
		if ( ! value ) {
			savePassword( '' );
		}
	};

	return (
		<div className="edit-site-sidebar-navigation-screen-page__status">
			<ToggleControl
				label="Hide behind a password"
				checked={ showPassword }
				type="password"
				onChange={ handleTogglePassword }
			/>
			{ showPassword && (
				<TextControl onChange={ savePassword } value={ password } />
			) }
		</div>
	);
}
