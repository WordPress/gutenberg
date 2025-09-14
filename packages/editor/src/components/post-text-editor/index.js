/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useRef, useEffect } from '@wordpress/element';
import { __unstableSerializeAndClean } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

/**
 * Displays the Post Text Editor along with content in Visual and Text mode.
 *
 * @return {React.ReactNode} The rendered PostTextEditor component.
 */
export default function PostTextEditor() {
	const editableElementRef = useRef( null );
	const { content, blocks, type, id } = useSelect( ( select ) => {
		const { getEditedEntityRecord } = select( coreStore );
		const { getCurrentPostType, getCurrentPostId } = select( editorStore );
		const _type = getCurrentPostType();
		const _id = getCurrentPostId();
		const editedRecord = getEditedEntityRecord( 'postType', _type, _id );

		return {
			content: editedRecord?.content,
			blocks: editedRecord?.blocks,
			type: _type,
			id: _id,
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );
	// Replicates the logic found in getEditedPostContent().
	const value = useMemo( () => {
		if ( content instanceof Function ) {
			return content( { blocks } );
		} else if ( blocks ) {
			// If we have parsed blocks already, they should be our source of truth.
			// Parsing applies block deprecations and legacy block conversions that
			// unparsed content will not have.
			return __unstableSerializeAndClean( blocks );
		}
		return content;
	}, [ content, blocks ] );

	useEffect( () => {
		if (
			editableElementRef.current &&
			editableElementRef.current.textContent !== value
		) {
			editableElementRef.current.textContent = value;
		}
	}, [ value ] );

	return (
		<pre
			ref={ editableElementRef }
			contentEditable="plaintext-only"
			suppressContentEditableWarning
			// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
			role="textbox"
			onInput={ () => {
				if ( editableElementRef.current ) {
					editEntityRecord( 'postType', type, id, {
						content: editableElementRef.current.textContent,
						blocks: undefined,
						selection: undefined,
					} );
				}
			} }
			className="editor-post-text-editor"
			data-placeholder={ __( 'Start writing with text or HTML' ) }
			aria-label={ __( 'Type text or HTML' ) }
		/>
	);
}
