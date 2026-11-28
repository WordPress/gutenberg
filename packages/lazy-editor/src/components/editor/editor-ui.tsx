import type { ReactNode } from 'react';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { unlock } from '../../lock-unlock';

const {
	Editor: PrivateEditor,
	BackButton,
	PreferencesModal,
	ToolsMoreMenuGroup,
	SiteExport,
	UploadProgressSnackbar,
} = unlock( editorPrivateApis );

interface EditorUIProps {
	postType?: string;
	postId?: string;
	templateId?: string;
	settings: Record< string, any >;
	backButton?: ReactNode;
	onActionPerformed?: ( actionId: string, items: any[] ) => void;
	initialViewport?: string;
	renderingMode?: string;
}

export default function EditorUI( {
	postType,
	postId,
	templateId,
	settings,
	backButton,
	onActionPerformed,
	initialViewport,
	renderingMode,
}: EditorUIProps ) {
	return (
		<>
			<PrivateEditor
				postType={ postType }
				postId={ postId }
				templateId={ templateId }
				settings={ settings }
				styles={ settings.styles }
				onActionPerformed={ onActionPerformed }
				initialViewport={ initialViewport }
				renderingMode={ renderingMode }
			>
				{ backButton && <BackButton>{ backButton }</BackButton> }
				{ /*
				   Opened from the editor's own menu and from the command the editor
				   registers, both of which exist only while it is mounted. Renders
				   nothing until one of them opens it.
				 */ }
				<PreferencesModal />
				{ /*
				   Self-gated: renders only while editing a template or template
				   part, the entities the exported theme is made of.
				 */ }
				<ToolsMoreMenuGroup>
					<SiteExport />
				</ToolsMoreMenuGroup>
			</PrivateEditor>
			{ /*
			   Renders nothing: it manages a notice that the host's snackbar
			   list displays. Mounted here rather than in boot so that pages
			   without an editor don't load it. A sibling of the editor so it
			   stays mounted while switching between entities.
			 */ }
			<UploadProgressSnackbar />
		</>
	);
}
