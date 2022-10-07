/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';

/**
 * External dependencies
 */
import _ from 'lodash';

/**
 * Internal dependencies
 */
import './style.css';

_.isEmpty( isBlobURL( '' ) );
