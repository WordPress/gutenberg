/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import importReusableBlock from '../../utils/import';

function ImportForm( { instanceId, onUpload } ) {
	const inputId = 'list-reusable-blocks-import-form-' + instanceId;

	let isStillMounted = true;
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState( null );
	const [ file, setFile ] = useState( null );

	useEffect( () => {
		return function () {
			isStillMounted = false;
		};
	}, [] );

	const onChangeFile = ( event ) => {
		setFile( event.target.files[ 0 ] );
		setError( null );
	};

	const onSubmit = ( event ) => {
		event.preventDefault();
		if ( ! file ) {
			return;
		}
		setIsLoading( { isLoading: true } );
		importReusableBlock( file )
			.then( ( reusableBlock ) => {
				if ( ! isStillMounted ) {
					return;
				}

				setIsLoading( false );
				onUpload( reusableBlock );
			} )
			.catch( ( errors ) => {
				if ( ! isStillMounted ) {
					return;
				}

				let uiMessage;
				switch ( errors.message ) {
					case 'Invalid JSON file':
						uiMessage = __( 'Invalid JSON file' );
						break;
					case 'Invalid Reusable block JSON file':
						uiMessage = __( 'Invalid Reusable block JSON file' );
						break;
					default:
						uiMessage = __( 'Unknown error' );
				}

				setIsLoading( false );
				setError( uiMessage );
			} );
	};

	const onDismissError = () => {
		setError( null );
	};

	return (
		<form
			className="list-reusable-blocks-import-form"
			onSubmit={ onSubmit }
		>
			{ error && (
				<Notice status="error" onRemove={ () => onDismissError() }>
					{ error }
				</Notice>
			) }
			<label
				htmlFor={ inputId }
				className="list-reusable-blocks-import-form__label"
			>
				{ __( 'File' ) }
			</label>
			<input id={ inputId } type="file" onChange={ onChangeFile } />
			<Button
				type="submit"
				isBusy={ isLoading }
				disabled={ ! file || isLoading }
				variant="secondary"
				className="list-reusable-blocks-import-form__button"
			>
				{ _x( 'Import', 'button label' ) }
			</Button>
		</form>
	);
}

export default withInstanceId( ImportForm );
