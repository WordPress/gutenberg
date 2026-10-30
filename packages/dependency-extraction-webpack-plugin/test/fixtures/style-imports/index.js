import { isBlobURL } from '@wordpress/blob';
// eslint-disable-next-line no-restricted-imports
import _ from 'lodash';
import './style.css';

_.isEmpty( isBlobURL( '' ) );
