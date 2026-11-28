import { isBlobURL } from '@wordpress/blob';
import atob from 'atob';

isBlobURL( '' );
atob( 'SGVsbG8sIFdvcmxkIQ==' );
