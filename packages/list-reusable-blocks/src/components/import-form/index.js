/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withInstanceId } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
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

		this.isMounted = true;
		this.onChangeFile = this.onChangeFile.bind( this );
		this.onSubmit = this.onSubmit.bind( this );
	}

	componentWillUnmount() {
		this.isMounted = false;
	}

	onChangeFile( event ) {
		this.setState( { file: event.target.files[ 0 ] } );
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
				if ( ! this.isMounted ) {
					return;
				}

				this.setState( { isLoading: false } );
				onUpload( reusableBlock );
			} )
			.catch( ( error ) => {
				if ( ! this.isMounted ) {
					return;
				}

				this.setState( { isLoading: false, error: error.message } );
			} );
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
					<Notice status="error">
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
					isDefault
					className="list-reusable-blocks-import-form__button"
				>
					{ __( 'Import' ) }
				</Button>
			</form>
		);
	}
}

export default withInstanceId( ImportForm );
