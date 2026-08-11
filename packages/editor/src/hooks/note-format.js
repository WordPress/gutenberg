import { registerFormatType } from '@wordpress/rich-text';
import {
	NOTE_FORMAT_NAME,
	noteFormat,
} from '../components/collab-sidebar/format';

/*
 * Registered on import rather than from a component: HTML is converted to a
 * rich text record eagerly, both when blocks are parsed and while a rich text
 * field first renders. A format registered after that leaves already-parsed
 * markers as `core/unknown` until their content changes.
 */
registerFormatType( NOTE_FORMAT_NAME, noteFormat );
