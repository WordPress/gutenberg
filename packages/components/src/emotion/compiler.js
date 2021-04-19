/**
 * External dependencies
 */
import createEmotion from 'create-emotion';
import mitt from 'mitt';

/** @type {import('create-emotion').Emotion & { events: import('mitt').Emitter }} */
export const emotion = createEmotion();

const __events = mitt();

const nativeInsert = emotion.sheet.insert.bind( emotion.sheet );
emotion.sheet.insert = ( ...args ) => {
	// Emit an event when sheet.insert is called so that StyleFrameProvider can listen to it
	__events.emit( 'sheet.insert', ...args );
	nativeInsert( ...args );
};

emotion.events = __events;

export const {
	flush,
	hydrate,
	cx,
	merge,
	getRegisteredStyles,
	injectGlobal,
	keyframes,
	css,
	sheet,
	cache,
	events,
} = emotion;
