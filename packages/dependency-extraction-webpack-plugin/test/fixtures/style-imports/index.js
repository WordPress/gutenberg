/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';

/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import _ from 'lodash';

/**
 * Internal dependencies
 */
import './style.css';

_.isEmpty( isBlobURL( '' ) );
