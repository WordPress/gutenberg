/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Button,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useInstanceId, useDebounce } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { sanitizeCommentString, noop } from './utils';

function CommentForm( {
	onSubmit,
	onCancel,
	thread,
	submitButtonText,
	labelText,
	reflowComments = noop,
} ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	// Regularly trigger a reflow as the user types since the textarea may grow or shrink.
	const debouncedCommentUpdated = useDebounce( reflowComments, 100 );

	const updateComment = ( value ) => {
		setInputComment( value );
	};

	const inputId = useInstanceId( CommentForm, 'comment-input' );
	const isDisabled =
		inputComment === thread?.content?.raw ||
		! sanitizeCommentString( inputComment ).length;

	const handleSubmit = () => {
		if ( ! isDisabled ) {
			onSubmit( inputComment );
			setInputComment( '' );
		}
	};

	const handleKeyDown = ( event ) => {
		// Submit on ⌘ + Enter (Mac) or Ctrl + Enter (Windows/Linux)
		if ( event.key === 'Enter' && ( event.metaKey || event.ctrlKey ) ) {
			event.preventDefault();
			handleSubmit();
		}
	};

	return (
		<VStack
			className="editor-collab-sidebar-panel__comment-form"
			spacing="4"
		>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ labelText ?? __( 'Note' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) => {
					updateComment( comment.target.value );
					debouncedCommentUpdated();
				} }
				onKeyDown={ handleKeyDown }
				rows={ 1 }
				maxRows={ 20 }
			/>
			<HStack spacing="2" justify="flex-end" wrap>
				<Button size="compact" variant="tertiary" onClick={ onCancel }>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					onClick={ handleSubmit }
					disabled={ isDisabled }
				>
					<Truncate>{ submitButtonText }</Truncate>
				</Button>
			</HStack>
		</VStack>
	);
}

export default CommentForm;
