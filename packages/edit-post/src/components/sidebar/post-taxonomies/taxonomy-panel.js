/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

function TaxonomyPanel( { taxonomy, children } ) {
	const slug = taxonomy?.slug;
	const panelName = slug ? `taxonomy-panel-${ slug }` : '';
	const { isEnabled, isOpened } = useSelect(
		( select ) => {
			const { isEditorPanelEnabled, isEditorPanelOpened } =
				select( editorStore );
			return {
				isEnabled: slug ? isEditorPanelEnabled( panelName ) : false,
				isOpened: slug ? isEditorPanelOpened( panelName ) : false,
			};
		},
		[ panelName, slug ]
	);
	const { toggleEditorPanelOpened } = useDispatch( editorStore );

	if ( ! isEnabled ) {
		return null;
	}

	const taxonomyMenuName = taxonomy?.labels?.menu_name;
	if ( ! taxonomyMenuName ) {
		return null;
	}

	return (
		<PanelBody
			title={ taxonomyMenuName }
			opened={ isOpened }
			onToggle={ () => toggleEditorPanelOpened( panelName ) }
		>
			{ children }
		</PanelBody>
	);
}

export default TaxonomyPanel;
