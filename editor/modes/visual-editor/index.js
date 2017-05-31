/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import Inserter from '../../inserter';
import VisualEditorBlockList from './block-list';
import PostTitle from '../../post-title';

export default function VisualEditor() {
	return (
		<div
			role="region"
			aria-label={ __( 'Visual Editor' ) }
			className="editor-visual-editor"
		>
			<PostTitle />
			<VisualEditorBlockList />
			<Inserter position="top right" />
		</div>
	);
}
