/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { deprecated } from '@wordpress/utils';

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
	withColor,
} from './components';

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
	withColor,
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
		wrappedFunction( ...args );
	};
} );

