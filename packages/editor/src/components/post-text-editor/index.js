/**
 * External dependencies
 */
import { map } from 'lodash';
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { __unstableCodeHandler as codeHandler } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store } from '../../store';

// Copied from block-editor/src/hooks/utils
function allowedTagsToKsesSchema( allowedHtmlTags ) {
	const schema = {
		'#text': {},
	};
	for ( const tagName of Object.keys( allowedHtmlTags || {} ) ) {
		schema[ tagName ] = {
			attributes: map( allowedHtmlTags[ tagName ], ( enabled, attr ) => [
				attr,
				enabled,
			] )
				.filter( ( [ , enabled ] ) => enabled )
				.map( ( [ attr ] ) => attr ),
		};
		if ( ! [ '#text', 'br' ].includes( tagName ) ) {
			schema[ tagName ].children = schema;
		}
	}

	return schema;
}

export default function PostTextEditor() {
	const postContent = useSelect(
		( select ) => select( 'core/editor' ).getEditedPostContent(),
		[]
	);

	const { editPost, resetEditorBlocks } = useDispatch( 'core/editor' );

	const [ value, setValue ] = useState( postContent );
	const [ isDirty, setIsDirty ] = useState( false );
	const instanceId = useInstanceId( PostTextEditor );
	const allowedHtmlTags = useSelect(
		( select ) => select( store ).getEditorSettings().allowedHtmlTags
	);
	const schema = useMemo( () => allowedTagsToKsesSchema( allowedHtmlTags ), [
		allowedHtmlTags,
	] );

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
			const blocks = codeHandler( { HTML: value }, schema );
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
