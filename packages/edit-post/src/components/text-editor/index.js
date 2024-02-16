/**
 * WordPress dependencies
 */
import {
	PostTextEditor,
	PostTitleRaw,
	store as editorStore,
} from '@wordpress/editor';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { displayShortcut } from '@wordpress/keycodes';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function TextEditor() {
	const isRichEditingEnabled = useSelect( ( select ) => {
		return select( editorStore ).getEditorSettings().richEditingEnabled;
	}, [] );
	const { switchEditorMode } = useDispatch( editorStore );

	const { isWelcomeGuideVisible } = useSelect( ( select ) => {
		const { isFeatureActive } = select( editPostStore );

		return {
			isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
		};
	}, [] );

	const titleRef = useRef();

	useEffect( () => {
		if ( isWelcomeGuideVisible ) {
			return;
		}
		titleRef?.current?.focus();
	}, [ isWelcomeGuideVisible ] );

	return (
		<div className="edit-post-text-editor">
			{ isRichEditingEnabled && (
				<div className="edit-post-text-editor__toolbar">
					<h2>{ __( 'Editing code' ) }</h2>
					<Button
						variant="tertiary"
						onClick={ () => switchEditorMode( 'visual' ) }
						shortcut={ displayShortcut.secondary( 'm' ) }
					>
						{ __( 'Exit code editor' ) }
					</Button>
				</div>
			) }
			<div className="edit-post-text-editor__body">
				<PostTitleRaw ref={ titleRef } />
				<PostTextEditor />
			</div>
		</div>
	);
}
