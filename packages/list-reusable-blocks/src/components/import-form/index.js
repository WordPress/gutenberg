/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import { __, _x } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/components';

/**
 * Internal dependencies
 */
import importReusableBlock from '../../utils/import';

class ImportForm extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isLoading: false,
			error: null,
			file: null,
		};

		this.isStillMounted = true;
		this.onChangeFile = this.onChangeFile.bind( this );
		this.onSubmit = this.onSubmit.bind( this );
	}

	componentWillUnmount() {
		this.isStillMounted = false;
	}

	onChangeFile( event ) {
		this.setState( { file: event.target.files[ 0 ], error: null } );
	}

	onSubmit( event ) {
		event.preventDefault();
		const { file } = this.state;
		const { onUpload } = this.props;
		if ( ! file ) {
			return;
		}
		this.setState( { isLoading: true } );
		importReusableBlock( file )
			.then( ( reusableBlock ) => {
				if ( ! this.isStillMounted ) {
					return;
				}

				this.setState( { isLoading: false } );
				onUpload( reusableBlock );
			} )
			.catch( ( error ) => {
				if ( ! this.isStillMounted ) {
					return;
				}

				let uiMessage;
				switch ( error.message ) {
					case 'Invalid JSON file':
						uiMessage = __( 'Invalid JSON file' );
						break;
					case 'Invalid Reusable block JSON file':
						uiMessage = __( 'Invalid Reusable block JSON file' );
						break;
					default:
						uiMessage = __( 'Unknown error' );
				}

				this.setState( { isLoading: false, error: uiMessage } );
			} );
	}

	onDismissError() {
		this.setState( { error: null } );
	}

	render() {
		const { instanceId } = this.props;
		const { file, isLoading, error } = this.state;
		const inputId = 'list-reusable-blocks-import-form-' + instanceId;
		return (
			<form
				className="list-reusable-blocks-import-form"
				onSubmit={ this.onSubmit }
			>
				{ error && (
					<Notice
						status="error"
						onRemove={ () => this.onDismissError() }
					>
						{ error }
					</Notice>
				) }
				<label
					htmlFor={ inputId }
					className="list-reusable-blocks-import-form__label"
				>
					{ __( 'File' ) }
				</label>
				<input
					id={ inputId }
					type="file"
					onChange={ this.onChangeFile }
				/>
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
}

export default withInstanceId( ImportForm );
