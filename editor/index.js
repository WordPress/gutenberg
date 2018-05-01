/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { deprecated } from '@wordpress/utils';

import './store';
import './hooks';

export * from './components';

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
