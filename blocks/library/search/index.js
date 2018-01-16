/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
 import './editor.scss';
import { registerBlockType } from '../../api';
import InspectorControls from '../../inspector-controls';
import TextControl from '../../inspector-controls/text-control';

class SearchBlock extends Component {
	constructor() {
		super( ...arguments );
		this.updateLabel = this.updateLabel.bind( this );
		this.updatePlaceholder = this.updatePlaceholder.bind( this );
		this.updateSubmitValue = this.updateSubmitValue.bind( this );
		this.handleFormSubmit = this.handleFormSubmit.bind( this );
	}

	updateLabel( newLabel ) {
		this.props.setAttributes( { label: newLabel } );
	}

	updatePlaceholder( newPlaceholder ) {
		this.props.setAttributes( { placeholder: newPlaceholder } );
	}

	updateSubmitValue( newValue ) {
		this.props.setAttributes( { submitValue: newValue } );
	}

	handleFormSubmit( event ) {
		event.preventDefault();
		return false;
	}

	render() {
		const {
			attributes,
			focus,
		} = this.props;

		const {
			label,
			placeholder,
			submitValue,
		} = attributes;

		return [
			<form
				role="search"
				method="get"
				className="search-form"
				onSubmit= { this.handleFormSubmit }
			>
				<label>
					<span className="search-label">{ label }</span>
					<input type="search" className="search-field" placeholder={ placeholder } value="" name="s" />
				</label>
				<input type="submit" className="search-submit" value={ submitValue } />
			</form>,
			focus && (
				<InspectorControls key="inspector">
					<TextControl label={ __( 'Search label' ) } value={ label } onChange={ this.updateLabel } help={ __( 'Provides a label for the search field.' ) } />
					<TextControl label={ __( 'Placeholder text' ) } value={ placeholder } onChange={ this.updatePlaceholder } help={ __( 'Provides placeholder text for the search field.' ) } />
					<TextControl label={ __( 'Submit text' ) } value={ submitValue } onChange={ this.updateSubmitValue } help={ __( 'The text for the form submit button.' ) } />
				</InspectorControls>
			),
		];
	}
}

const searchAttributes = {
	label: {
		type: 'string',
		default: _x( 'Search for:', 'label' ),
	},
	placeholder: {
		type: 'string',
		default: _x( 'Search &hellip;', 'placeholder' ),
	},
	submitValue: {
		type: 'string',
		default: _x( 'Search', 'submit button' ),
	},
};

registerBlockType( 'core/search', {
	title: __( 'Search' ),
	description: __( 'A search form for your site.' ),
	icon: 'search',
	category: 'widgets',
	keywords: [ __( 'Find' ) ],
	attributes: searchAttributes,
	edit: SearchBlock,
	save() {
		return null;
	},
} );
