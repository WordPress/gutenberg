/**
 * WordPress dependencies
 */
import {removeEditorOnlyFormats} from '@wordpress/packages/rich-text/build-module/component/utils';
import {createRecord} from '@wordpress/packages/rich-text/src/component/utils';

/**
 * Prepares data passed to `onEnter` prop on keydown.
 *
 * @param root0
 * @param root0.formatTypes
 * @param root0.recordData
 * @param root0.handleChange
 * @param event
 */
export const prepareEnterEvent = (
	{ formatTypes, recordData, handleChange },
	event
) => ( {
	value: removeEditorOnlyFormats( {
		val: createRecord( recordData ),
		formatTypes,
	} ),
	onChange: handleChange,
	shiftKey: event.shiftKey,
} );
