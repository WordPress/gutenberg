/**
 * WordPress Dependencies
 */
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { DotTip } from '@wordpress/nux';

export function PostPublishPanelToggle( {
	isSaving,
	isPublishable,
	isSaveable,
	isPublished,
	isBeingScheduled,
	onToggle,
	isOpen,
	forceIsSaving,
	forceIsDirty,
} ) {
	const isButtonDisabled = isPublished ||
		! isSaveable ||
		isSaving || forceIsSaving ||
		( ! isPublishable && ! forceIsDirty );

	return (
		<Button
			className="editor-post-publish-panel__toggle"
			isPrimary
			onClick={ onToggle }
			aria-expanded={ isOpen }
			disabled={ isButtonDisabled }
			isBusy={ isSaving && isPublished }
		>
			{ isBeingScheduled ? __( 'Schedule…' ) : __( 'Publish…' ) }
			<DotTip tipId="core/editor.publish">
				{ __( 'Finished writing? That’s great, let’s get this published right now. Just click “Publish” and you’re good to go.' ) }
			</DotTip>
		</Button>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isEditedPostSaveable,
			isEditedPostPublishable,
			isCurrentPostPublished,
			isEditedPostBeingScheduled,
		} = select( 'core/editor' );
		return {
			isSaving: isSavingPost(),
			isSaveable: isEditedPostSaveable(),
			isPublishable: isEditedPostPublishable(),
			isPublished: isCurrentPostPublished(),
			isBeingScheduled: isEditedPostBeingScheduled(),
		};
	} ),
] )( PostPublishPanelToggle );
