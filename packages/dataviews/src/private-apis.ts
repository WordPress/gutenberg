/**
 * Internal dependencies
 */
import RichTextControl from './components/dataform-controls/richtext/control';
import { lock } from './lock-unlock';

export const privateApis = {};
lock( privateApis, {
	RichTextControl,
} );
