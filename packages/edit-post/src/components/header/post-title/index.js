/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';

import {
	Dropdown,
	Button,
	VisuallyHidden,
	TextControl,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * External dependencies
 */
import { noop } from 'lodash';

const EditPostTitlePanel = ( { entityTitle, onChange = noop } ) => {
	return (
		<div className="edit-post-title-panel">
			<TextControl
				className=""
				label={ __( 'Title' ) }
				value={ entityTitle ?? '' }
				min={ 1 }
				onChange={ onChange }
			/>
		</div>
	);
};

function PostTitle() {
	const { editPost } = useDispatch( editorStore );

	const { entityTitle, entityLabel } = useSelect(
		( select ) => ( {
			entityTitle: select( editorStore ).getEditedPostAttribute(
				'title'
			),
			entityLabel: select( editorStore ).getEditedPostAttribute( 'type' ),
		} ),
		[]
	);

	const titleRef = useRef();

	if ( ! entityTitle ) {
		return (
			<div className="edit-post-title-actions">{ __( 'Loading…' ) }</div>
		);
	}

	return (
		<div className="edit-post-title-actions">
			<div
				ref={ titleRef }
				className="edit-post-title-actions__title-wrapper"
			>
				<Text
					variant="body.small"
					className="edit-post-title-actions__title-prefix"
				>
					<VisuallyHidden as="span">
						{ sprintf(
							/* translators: %s: the entity being edited, like "post"*/
							__( 'Editing %s:' ),
							entityLabel
						) }
					</VisuallyHidden>
				</Text>

				<Text
					variant="body.small"
					className="edit-post-title-actions__title"
					as="h1"
				>
					{ entityTitle.length === 0
						? __( 'No Title' )
						: entityTitle }
				</Text>

				<Dropdown
					popoverProps={ {
						anchorRef: titleRef.current,
					} }
					position="bottom center"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<Button
							className="edit-post-title-actions__get-info"
							icon={ chevronDown }
							aria-expanded={ isOpen }
							aria-haspopup="true"
							onClick={ onToggle }
							label={ sprintf(
								/* translators: %s: the entity to see details about, like "template"*/
								__( 'Show %s details' ),
								entityLabel
							) }
						/>
					) }
					contentClassName="edit-post-title-actions__info-dropdown"
					renderContent={ () => (
						<EditPostTitlePanel
							entityTitle={ entityTitle }
							onChange={ ( value ) =>
								editPost( { title: value } )
							}
						/>
					) }
				/>
			</div>
		</div>
	);
}

export default PostTitle;
