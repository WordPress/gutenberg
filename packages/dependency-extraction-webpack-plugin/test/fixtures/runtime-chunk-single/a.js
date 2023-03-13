/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';

/**
 * External dependencies
 */
import atob from 'atob';

isBlobURL( '' );
atob( 'SGVsbG8sIFdvcmxkIQ==' );
