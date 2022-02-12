/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown } from '@wordpress/icons';

import {
	Dropdown,
	Button,
	VisuallyHidden,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import EditPostTitle from './edit-post-title';

function PostTitle() {
	const { entityTitle, entityLabel, isLoaded } = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const postId = getEditedPostAttribute( 'id' );
		const _isLoaded = !! postId;

		return {
			entityTitle: getEditedPostAttribute( 'title' ),
			entityLabel: getEditedPostAttribute( 'type' ),
			isLoaded: _isLoaded,
		};
	}, [] );

	const titleRef = useRef();

	if ( ! isLoaded ) {
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
					size="body"
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
					size="body"
					className="edit-post-title-actions__title"
					as="h1"
				>
					{ ! entityTitle || entityTitle.length === 0
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
							label={ __( 'Edit Title' ) }
						/>
					) }
					contentClassName="edit-post-title-actions__info-dropdown"
					renderContent={ () => <EditPostTitle /> }
				/>
			</div>
		</div>
	);
}

export default PostTitle;
