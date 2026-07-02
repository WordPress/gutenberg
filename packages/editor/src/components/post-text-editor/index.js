/**
 * External dependencies
 */
import Textarea from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useLayoutEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { adjustPosition, getDiff } from './utils';

/**
 * Displays the Post Text Editor along with content in Visual and Text mode.
 *
 * @return {React.ReactNode} The rendered PostTextEditor component.
 */
export default function PostTextEditor() {
	const instanceId = useInstanceId( PostTextEditor );
	const textareaRef = useRef();
	const previousValueRef = useRef();
	const selectionRef = useRef();
	const { value, type, id } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId, getEditedPostContent } =
			select( editorStore );
		return {
			value: getEditedPostContent(),
			type: getCurrentPostType(),
			id: getCurrentPostId(),
		};
	}, [] );
	const { editEntityRecord } = useDispatch( coreStore );

	useLayoutEffect( () => {
		const textarea = textareaRef.current;
		const previousValue = previousValueRef.current;
		previousValueRef.current = value;

		if (
			! textarea ||
			previousValue === undefined ||
			previousValue === value ||
			! selectionRef.current
		) {
			return;
		}

		const { selectionStart, selectionEnd, selectionDirection } =
			selectionRef.current;
		const changes = getDiff( previousValue, value );
		const adjustedSelectionStart = adjustPosition(
			selectionStart,
			changes,
			previousValue,
			value
		);
		const adjustedSelectionEnd = adjustPosition(
			selectionEnd,
			changes,
			previousValue,
			value
		);

		textarea.setSelectionRange(
			adjustedSelectionStart,
			adjustedSelectionEnd,
			selectionDirection
		);
		selectionRef.current = {
			selectionStart: adjustedSelectionStart,
			selectionEnd: adjustedSelectionEnd,
			selectionDirection,
		};
	}, [ value ] );

	const updateSelection = ( event ) => {
		const { selectionStart, selectionEnd, selectionDirection } =
			event.target;
		selectionRef.current = {
			selectionStart,
			selectionEnd,
			selectionDirection,
		};
	};

	return (
		<>
			<VisuallyHidden
				// eslint-disable-next-line jsx-a11y/label-has-associated-control
				render={ <label htmlFor={ `post-content-${ instanceId }` } /> }
			>
				{ __( 'Type text or HTML' ) }
			</VisuallyHidden>
			<Textarea
				autoComplete="off"
				dir="auto"
				ref={ textareaRef }
				value={ value }
				onChange={ ( event ) => {
					updateSelection( event );
					previousValueRef.current = event.target.value;
					editEntityRecord( 'postType', type, id, {
						content: event.target.value,
						blocks: undefined,
						selection: undefined,
					} );
				} }
				onFocus={ updateSelection }
				// A click or arrow-key caret move does not fire `select` (only
				// range selections do), so track those moves via mouseup/keyup.
				onMouseUp={ updateSelection }
				onKeyUp={ updateSelection }
				className="editor-post-text-editor"
				id={ `post-content-${ instanceId }` }
				placeholder={ __( 'Start writing with text or HTML' ) }
			/>
		</>
	);
}
