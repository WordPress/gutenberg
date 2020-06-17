/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { TextareaControl, ButtonGroup, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Comment( { content, setContent, cancelDraft } ) {
	const [ draft, setDraft ] = useState( content );
	const [ isEditing, setIsEditing ] = useState( Boolean( cancelDraft ) );
	const startEditing = () => setIsEditing( true );
	return (
		<div
			className="block-collab-add-block-comments-comment"
			onClick={ startEditing }
			onKeyPress={ startEditing }
			role="button"
			tabIndex="-1"
		>
			{ isEditing ? (
				<TextareaControl
					placeholder={ __( 'Enter your comment…' ) }
					value={ draft }
					onChange={ setDraft }
				/>
			) : (
				<div>{ draft }</div>
			) }
			{ isEditing && (
				<ButtonGroup className="block-collab-add-block-comments-comment__button-group">
					<Button
						isPrimary
						disabled={ ! draft?.length }
						onClick={ ( event ) => {
							event.stopPropagation();
							setIsEditing( false );
							setContent( draft );
							if ( cancelDraft ) cancelDraft();
						} }
					>
						{ __( 'Save' ) }
					</Button>
					<Button
						isTertiary
						onClick={ ( event ) => {
							event.stopPropagation();
							setIsEditing( false );
							if ( cancelDraft ) cancelDraft();
							else setDraft( content );
						} }
					>
						{ __( 'Cancel' ) }
					</Button>
				</ButtonGroup>
			) }
		</div>
	);
}
