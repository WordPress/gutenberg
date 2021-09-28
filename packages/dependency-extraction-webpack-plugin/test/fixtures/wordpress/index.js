/**
 * WordPress dependencies
 */
import { isBlobURL } from '@wordpress/blob';

/**
 * External dependencies
 */
import _ from 'lodash';

_.isEmpty( isBlobURL( '' ) );
