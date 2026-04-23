/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
	VisuallyHidden,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { sanitizeCommentString } from './utils';

function CommentForm( {
	onSubmit,
	onCancel,
	thread,
	submitButtonText,
	labelText,
} ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	const inputId = useInstanceId( CommentForm, 'comment-input' );
	const isDisabled =
		inputComment === thread?.content?.raw ||
		! sanitizeCommentString( inputComment ).length;

	return (
		<Stack
			className="editor-collab-sidebar-panel__comment-form"
			direction="column"
			gap="lg"
			render={ <form /> }
			onSubmit={ ( event ) => {
				event.preventDefault();
				onSubmit( inputComment );
				setInputComment( '' );
			} }
		>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ labelText ?? __( 'Note' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
				rows={ 1 }
				maxRows={ 20 }
				onKeyDown={ ( event ) => {
					if (
						isKeyboardEvent.primary( event, 'Enter' ) &&
						! isDisabled
					) {
						event.target.parentNode.requestSubmit();
					}

					if ( event.key === 'Escape' ) {
						event.preventDefault();
						// Passing event for reply forms.
						onCancel( event );
					}
				} }
			/>
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="sm"
				wrap="wrap"
			>
				<Button size="compact" variant="tertiary" onClick={ onCancel }>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					type="submit"
					disabled={ isDisabled }
				>
					<Truncate>{ submitButtonText }</Truncate>
				</Button>
			</Stack>
		</Stack>
	);
}

export default CommentForm;
