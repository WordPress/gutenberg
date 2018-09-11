import { PostPublishPanelToggle, PostPublishButton } from '@wordpress/editor';

const PublishButton = ( {
	isSidebarOpen,
	isSidebarEnabled,
	onToggle,
	forceIsDirty,
	forceIsSaving } ) => {
	if ( isSidebarEnabled ) {
		return (
			<PostPublishPanelToggle
				isSidebarOpen={ isSidebarOpen }
				onToggle={ onToggle }
				forceIsDirty={ forceIsDirty }
				forceIsSaving={ forceIsSaving }
			/>
		);
	}
	return <PostPublishButton
		forceIsDirty={ forceIsDirty }
		forceIsSaving={ forceIsSaving }
	/>;
};

export default PublishButton;
