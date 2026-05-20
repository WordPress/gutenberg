/**
 * Internal dependencies
 */
import RichTextControl from './control';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	RichTextControl,
} );
