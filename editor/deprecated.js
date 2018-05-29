/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { withSelect } from '@wordpress/data';

import {
	Autocomplete,
	AlignmentToolbar,
	BlockAlignmentToolbar,
	BlockControls,
	BlockEdit,
	BlockFormatControls,
	BlockIcon,
	ColorPalette,
	ContrastChecker,
	ImagePlaceholder,
	InnerBlocks,
	InspectorAdvancedControls,
	InspectorControls,
	PlainText,
	RichText,
	RichTextProvider,
	MediaUpload,
	UrlInput,
	UrlInputButton,
	withColorContext,
	getColorClass,
	getColorName,
	withColors,
} from './components';
import { editorMediaUpload } from './utils';

const componentsToDepreacate = {
	Autocomplete,
	AlignmentToolbar,
	BlockAlignmentToolbar,
	BlockControls,
	BlockEdit,
	BlockFormatControls,
	BlockIcon,
	ColorPalette,
	ContrastChecker,
	ImagePlaceholder,
	InnerBlocks,
	InspectorAdvancedControls,
	InspectorControls,
	PlainText,
	RichText,
	RichTextProvider,
	MediaUpload,
	UrlInput,
	UrlInputButton,
};

const functionsToDeprecate = {
	withColorContext,
	getColorClass,
	getColorName,
	withColors,
	editorMediaUpload,
};

forEach( componentsToDepreacate, ( WrappedComponent, key ) => {
	wp.blocks[ key ] = class extends Component {
		constructor() {
			super( ...arguments );

			deprecated( 'wp.blocks.' + key, {
				version: '3.1',
				alternative: 'wp.editor.' + key,
				plugin: 'Gutenberg',
			} );
		}

		render() {
			return <WrappedComponent { ...this.props } />;
		}
	};
} );

forEach( functionsToDeprecate, ( wrappedFunction, key ) => {
	wp.blocks[ key ] = ( ...args ) => {
		deprecated( 'wp.blocks.' + key, {
			version: '3.1',
			alternative: 'wp.editor.' + key,
			plugin: 'Gutenberg',
		} );
		return wrappedFunction( ...args );
	};
} );

wp.blocks.withEditorSettings = ( mapSettingsToProps ) => ( WrappedComponent ) => {
	const applyWithSelect = withSelect( ( select, ownProps ) => {
		const settings = select( 'core/editor' ).getEditorSettings();
		if ( ! mapSettingsToProps ) {
			return { settings };
		}
		return mapSettingsToProps( settings, ownProps );
	} );

	deprecated( 'wp.blocks.withEditorSettings', {
		version: '3.1',
		alternative: 'the data module to access the editor settings `wp.data.select( "core/editor" ).getEditorSettings()`',
		plugin: 'Gutenberg',
	} );

	return applyWithSelect( WrappedComponent );
};
