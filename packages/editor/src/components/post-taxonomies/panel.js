import { PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as editorStore } from '../../store';
import PostTaxonomiesForm from './index';
import PostTaxonomiesCheck from './check';

/**
 * Renders a panel for a specific taxonomy.
 *
 * @param {Object}          props          The component props.
 * @param {Object}          props.taxonomy The taxonomy object.
 * @param {React.ReactNode} props.children The child components.
 *
 * @return {React.ReactNode} The rendered taxonomy panel.
 */
function TaxonomyPanel( { taxonomy, children } ) {
	const slug = taxonomy?.slug;
	const panelName = slug ? `taxonomy-panel-${ slug }` : '';
	const { isEnabled, isOpened, hasAssignAction } = useSelect(
		( select ) => {
			const {
				getCurrentPost,
				isEditorPanelEnabled,
				isEditorPanelOpened,
			} = select( editorStore );
			const post = getCurrentPost();
			const restBase = taxonomy?.rest_base;
			return {
				isEnabled: slug ? isEditorPanelEnabled( panelName ) : false,
				isOpened: slug ? isEditorPanelOpened( panelName ) : false,
				hasAssignAction: restBase
					? post?._links?.[ 'wp:action-assign-' + restBase ] ?? false
					: false,
			};
		},
		[ panelName, slug, taxonomy?.rest_base ]
	);
	const { toggleEditorPanelOpened } = useDispatch( editorStore );

	if ( ! isEnabled || ! hasAssignAction ) {
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

/**
 * Component that renders the post taxonomies panel.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function PostTaxonomies() {
	return (
		<PostTaxonomiesCheck>
			<PostTaxonomiesForm
				taxonomyWrapper={ ( content, taxonomy ) => {
					return (
						<TaxonomyPanel taxonomy={ taxonomy }>
							{ content }
						</TaxonomyPanel>
					);
				} }
			/>
		</PostTaxonomiesCheck>
	);
}
