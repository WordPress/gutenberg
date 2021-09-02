/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';

export default function SiteEditorBlockEditorProvider( {
	setIsInserterOpen,
	children,
} ) {
	const { settings, templateType } = useSelect(
		( select ) => {
			const { getSettings, getEditedPostType } = select( editSiteStore );
			return {
				settings: getSettings( setIsInserterOpen ),
				templateType: getEditedPostType(),
			};
		},
		[ setIsInserterOpen ]
	);
	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		templateType
	);
	return (
		<BlockEditorProvider
			settings={ settings }
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			useSubRegistry={ false }
		>
			{ children }
		</BlockEditorProvider>
	);
}
