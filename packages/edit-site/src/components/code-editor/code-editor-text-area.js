/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/components';

export default function CodeEditorTextArea( { value, onChange, onInput } ) {
	const [ stateValue, setStateValue ] = useState( value );
	const [ isDirty, setIsDirty ] = useState( false );
	const instanceId = useInstanceId( CodeEditorTextArea );

	if ( ! isDirty && stateValue !== value ) {
		setStateValue( value );
	}

	/**
	 * Handles a textarea change event to notify the onChange prop callback and
	 * reflect the new value in the component's own state. This marks the start
	 * of the user's edits, if not already changed, preventing future props
	 * changes to value from replacing the rendered value. This is expected to
	 * be followed by a reset to dirty state via `stopEditing`.
	 *
	 * @see stopEditing
	 *
	 * @param {Event} event Change event.
	 */
	const onChangeHandler = ( event ) => {
		const newValue = event.target.value;
		onInput( newValue );
		setStateValue( newValue );
		setIsDirty( true );
	};

	/**
	 * Function called when the user has completed their edits, responsible for
	 * ensuring that changes, if made, are surfaced to the onPersist prop
	 * callback and resetting dirty state.
	 */
	const stopEditing = () => {
		if ( isDirty ) {
			onChange( stateValue );
			setIsDirty( false );
		}
	};

	return (
		<>
			<VisuallyHidden
				as="label"
				htmlFor={ `code-editor-text-area-${ instanceId }` }
			>
				{ __( 'Type text or HTML' ) }
			</VisuallyHidden>
			<Textarea
				autoComplete="off"
				dir="auto"
				value={ stateValue }
				onChange={ onChangeHandler }
				onBlur={ stopEditing }
				className="edit-site-code-editor-text-area"
				id={ `code-editor-text-area-${ instanceId }` }
				placeholder={ __( 'Start writing with text or HTML' ) }
			/>
		</>
	);
}
