/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTextEditor() {
	const postContent = useSelect(
		( select ) => select( editorStore ).getEditedPostContent(),
		[]
	);

	const { editPost, resetEditorBlocks } = useDispatch( editorStore );

	const [ value, setValue ] = useState( postContent );
	const [ isDirty, setIsDirty ] = useState( false );
	const instanceId = useInstanceId( PostTextEditor );

	if ( ! isDirty && value !== postContent ) {
		setValue( postContent );
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
	const onChange = ( event ) => {
		const newValue = event.target.value;
		editPost( { content: newValue } );
		setValue( newValue );
		setIsDirty( true );
	};

	/**
	 * Function called when the user has completed their edits, responsible for
	 * ensuring that changes, if made, are surfaced to the onPersist prop
	 * callback and resetting dirty state.
	 */
	const stopEditing = () => {
		if ( isDirty ) {
			const blocks = parse( value );
			resetEditorBlocks( blocks );
			setIsDirty( false );
		}
	};

	return (
		<>
			<VisuallyHidden
				as="label"
				htmlFor={ `post-content-${ instanceId }` }
			>
				{ __( 'Type text or HTML' ) }
			</VisuallyHidden>
			<Textarea
				autoComplete="off"
				dir="auto"
				value={ value }
				onChange={ onChange }
				onBlur={ stopEditing }
				className="editor-post-text-editor"
				id={ `post-content-${ instanceId }` }
				placeholder={ __( 'Start writing with text or HTML' ) }
			/>
		</>
	);
}
