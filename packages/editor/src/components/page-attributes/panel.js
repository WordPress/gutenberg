/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PageAttributesCheck from './check';
import { ParentRow } from './parent';

const PANEL_NAME = 'page-attributes';

function AttributesPanel() {
	const { isEnabled, postType } = useSelect( ( select ) => {
		const { getEditedPostAttribute, isEditorPanelEnabled } =
			select( editorStore );
		const { getPostType } = select( coreStore );
		return {
			isEnabled: isEditorPanelEnabled( PANEL_NAME ),
			postType: getPostType( getEditedPostAttribute( 'type' ) ),
		};
	}, [] );

	if ( ! isEnabled || ! postType ) {
		return null;
	}

	return <ParentRow />;
}

/**
 * Renders the Page Attributes Panel component.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function PageAttributesPanel() {
	return (
		<PageAttributesCheck>
			<AttributesPanel />
		</PageAttributesCheck>
	);
}
