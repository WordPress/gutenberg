/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import IconButton from '../icon-button';

class FormFileUpload extends Component {
	constructor() {
		super( ...arguments );
		this.openFileDialog = this.openFileDialog.bind( this );
		this.bindInput = this.bindInput.bind( this );
	}

	openFileDialog() {
		this.input.click();
	}

	bindInput( ref ) {
		this.input = ref;
	}

	render() {
		const {
			accept,
			children,
			icon = 'upload',
			multiple = false,
			onChange,
			render,
			...props
		} = this.props;

		const ui = render ?
			render( { openFileDialog: this.openFileDialog } ) : (
				<IconButton
					icon={ icon }
					onClick={ this.openFileDialog }
					{ ...props }
				>
					{ children }
				</IconButton>
			);
		return (
			<div className="components-form-file-upload">
				{ ui }
				<input
					type="file"
					ref={ this.bindInput }
					multiple={ multiple }
					style={ { display: 'none' } }
					accept={ accept }
					onChange={ onChange }
				/>
			</div>
		);
	}
}

export default FormFileUpload;
