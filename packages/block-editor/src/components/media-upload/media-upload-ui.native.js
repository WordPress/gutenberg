/**
 * External dependencies
 */
import React from 'react';
import { View, ImageBackground, TextInput, Text, TouchableWithoutFeedback } from 'react-native';
import {
	subscribeMediaUpload,
	requestMediaPickFromMediaLibrary,
	requestMediaPickFromDeviceLibrary,
	requestMediaPickFromDeviceCamera,
	mediaUploadSync,
	requestImageFailedRetryDialog,
	requestImageUploadCancelDialog,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import {
	Toolbar,
	ToolbarButton,
	Spinner,
	Dashicon,
} from '@wordpress/components';
import {
	MediaPlaceholder,
	RichText,
	BlockControls,
	InspectorControls,
} from '@wordpress/block-editor';
import {
	BottomSheet,
	Picker,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';