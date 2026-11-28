// eslint-disable-next-line no-restricted-imports
import { isEmpty } from 'lodash';
import { isBlobURL } from '@wordpress/blob';

isEmpty( isBlobURL( '' ) );
