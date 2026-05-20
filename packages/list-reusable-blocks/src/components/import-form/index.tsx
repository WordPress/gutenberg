/**
 * WordPress dependencies
 */
import { Button, Notice } from '@wordpress/components';
import { withInstanceId } from '@wordpress/compose';
import { useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import importReusableBlock from '../../utils/import';
import type { ImportFormProps, ReusableBlock } from '../../utils/types';

function ImportForm( { instanceId, onUpload }: ImportFormProps ) {
	const inputId = 'list-reusable-blocks-import-form-' + instanceId;

	const formRef = useRef< HTMLFormElement >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ file, setFile ] = useState< File | null >( null );

	const onChangeFile = ( event: React.ChangeEvent< HTMLInputElement > ) => {
		setFile( event.target.files?.[ 0 ] || null );
		setError( null );
	};

	const onSubmit = ( event: React.FormEvent< HTMLFormElement > ) => {
		event.preventDefault();
		if ( ! file ) {
			return;
		}
		setIsLoading( true );
		importReusableBlock( file )
			.then( ( reusableBlock: ReusableBlock ) => {
				if ( ! formRef.current ) {
					return;
				}

				setIsLoading( false );
				onUpload( reusableBlock );
			} )
			.catch( ( errors: Error ) => {
				if ( ! formRef.current ) {
					return;
				}

				let uiMessage: string;
				switch ( errors.message ) {
					case 'Invalid JSON file':
						uiMessage = __( 'Invalid JSON file' );
						break;
					case 'Invalid pattern JSON file':
						uiMessage = __( 'Invalid pattern JSON file' );
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
			ref={ formRef }
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
				__next40pxDefaultSize
				type="submit"
				isBusy={ isLoading }
				accessibleWhenDisabled
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
