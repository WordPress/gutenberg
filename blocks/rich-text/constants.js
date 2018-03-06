/**
 * Set of native events supported by TinyMCE's event dispatcher, preserving
 * original case used in suffix of a React event callback.
 *
 * @see https://github.com/tinymce/tinymce/blob/4.6.6/src/core/src/main/js/util/EventDispatcher.js#L28-L34
 *
 * @type {String[]}
 */
export const EVENTS = [
	'Focus',
	'Blur',
	'FocusIn',
	'FocusOut',
	'Click',
	'DblClick',
	'MouseDown',
	'MouseUp',
	'MouseMove',
	'MouseOver',
	'BeforePaste',
	'Paste',
	'Cut',
	'Copy',
	'SelectionChange',
	'MouseOut',
	'MouseEnter',
	'MouseLeave',
	'Wheel',
	'KeyDown',
	'KeyPress',
	'KeyUp',
	'Input',
	'ContextMenu',
	'DragStart',
	'DragEnd',
	'DragOver',
	'DragGesture',
	'DragDrop',
	'Drop',
	'Drag',
	'Submit',
	'CompositionStart',
	'CompositionEnd',
	'CompositionUpdate',
	'TouchStart',
	'TouchMove',
	'TouchEnd',
];
