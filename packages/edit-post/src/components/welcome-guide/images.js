/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const CanvasImage = ( props ) => (
	<>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-np"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-canvas.gif"
			width="312"
			height="240"
			{ ...props }
		/>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-r"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-canvas.svg"
			width="312"
			height="240"
			{ ...props }
		/>
	</>
);

export const EditorImage = ( props ) => (
	<>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-np"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-editor.gif"
			width="312"
			height="240"
			{ ...props }
		/>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-r"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-editor.svg"
			width="312"
			height="240"
			{ ...props }
		/>
	</>
);

export const BlockLibraryImage = ( props ) => (
	<>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-np"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-library.gif"
			width="312"
			height="240"
			{ ...props }
		/>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-r"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-library.svg"
			width="312"
			height="240"
			{ ...props }
		/>
	</>
);

export const DocumentationImage = ( props ) => (
	<>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-np"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-documentation.gif"
			width="312"
			height="240"
			{ ...props }
		/>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-r"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-documentation.svg"
			width="312"
			height="240"
			{ ...props }
		/>
	</>
);

export const TemplateEditorImage = ( props ) => (
	<>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-np"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-template-editor.gif"
			width="312"
			height="240"
			{ ...props }
		/>
		<img
			className="edit-post-welcome-guide__image edit-post-welcome-guide__image__prm-r"
			alt=""
			src="https://s.w.org/images/block-editor/welcome-template-editor.svg"
			width="312"
			height="240"
			{ ...props }
		/>
	</>
);

export const InserterIconImage = ( props ) => (
	<img
		alt={ __( 'inserter' ) }
		src="data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='18' height='18' rx='2' fill='%231E1E1E'/%3E%3Cpath d='M9.22727 4V14M4 8.77273H14' stroke='white' stroke-width='1.5'/%3E%3C/svg%3E%0A"
		{ ...props }
	/>
);
