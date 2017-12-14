/**
 * External dependencies
 */
import { connect } from 'react-redux';
import classnames from 'classnames';
import tinymce from 'tinymce';

/**
 * WordPress Dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import {
	isSavingAnnotation,
} from '../../../selectors';

/**
 * Annotation Form
 */
class AnnotationForm extends Component {
	/**
	 * Constructor.
	 */
	constructor() {
		super( ...arguments );

		this.state = {};

		this.ref = null;
		this.editor = null;

		this.setRef.bind( this );
		this.prepareHeader.bind( this );
		this.prepareEditable.bind( this );
		this.initializeEditable.bind( this );
		this.prepareFooter.bind( this );
	}

	/**
	 * After mounted.
	 */
	componentDidMount() {
		this.initializeEditable();
	}

	/**
	 * Sets element reference.
	 *
	 * @param {Object} ref Element.
	 */
	setRef( ref ) {
		this.ref = ref;
	}

	/**
	 * Prepares header.
	 *
	 * @return {?Object} Element.
	 */
	prepareHeader() {
		return (
			<header className="header">
				{ __( 'New Annotation' ) }
			</header>
		);
	}

	/**
	 * Prepares editable.
	 *
	 * @return {?Object} Element.
	 */
	prepareEditable() {
		return (
			<div
				className="editable"
				contentEditable={ true }
				suppressContentEditableWarning={ true }
			/>
		);
	}

	/**
	 * Initializes TinyMCE.
	 */
	initializeEditable() {
		tinymce.init( { // @TODO
			theme: false,
			inline: true,
			toolbar: false,

			plugins: [ 'paste' ],
			browser_spellcheck: true,

			entity_encoding: 'raw',
			formats: { strikethrough: { inline: 'del' } },
			inline_boundaries_selector: 'a[href],code,b,i,strong,em,del,ins,sup,sub',

			target: this.ref.querySelector( '> .editable' ),
			setup: ( editor ) => {
				this.editor = editor;
			},
		} );
	}

	/**
	 * Prepares footer.
	 *
	 * @return {?Object} Element.
	 */
	prepareFooter() {
		const { onSave, isSaving } = this.props;

		return (
			<footer className="footer">
				<Button
					className="submit"
					label={ __( 'Submit' ) }
					onClick={ onSave }
					disabled={ isSaving }
					isBusy={ isSaving }
					tooltip={ false }
				>
					<span className="screen-reader-text">
						{ __( 'Add Annotation' ) }
					</span>
				</Button>
			</footer>
		);
	}

	/**
	 * Renders component.
	 *
	 * @return {?Object} Element.
	 */
	render() {
		const { isSaving } = this.props;

		const className = classnames( 'editor-annotation-form', {
			'is-saving': isSaving,
		} );

		return ( // @TODO
			<div
				method="post"
				className={ className }
				aria-label={ __( 'New Annotation Form' ) }
				ref={ this.setRef }
			>
				{ this.prepareHeader() }
				{ this.prepareEditable() }
				{ this.prepareFooter() }
			</div>
		);
	}
}

const applyConnect = connect(
	( state ) => ( {
		isSaving: isSavingAnnotation( state ),
	} ),
);

export default compose( [
	applyConnect,
] )( AnnotationForm );
