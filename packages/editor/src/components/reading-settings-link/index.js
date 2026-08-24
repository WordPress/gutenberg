import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Link } from '@wordpress/ui';
import { TEMPLATE_POST_TYPE } from '../../store/constants';
import { store as editorStore } from '../../store';

/**
 * Renders a link to the Reading settings screen when the Front Page template is
 * being edited. That template resolves to the site homepage regardless of
 * whether the homepage shows the latest posts or a static page, so it helps to
 * point at where that choice is actually made.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function ReadingSettingsLink() {
	const shouldRender = useSelect( ( select ) => {
		const { getCurrentPostType, getEditedPostAttribute } =
			select( editorStore );
		const { canUser } = select( coreStore );
		return (
			getCurrentPostType() === TEMPLATE_POST_TYPE &&
			getEditedPostAttribute( 'slug' ) === 'front-page' &&
			// The Reading settings screen requires the `manage_options`
			// capability, which maps onto updating the site settings.
			!! canUser( 'update', { kind: 'root', name: 'site' } )
		);
	}, [] );

	if ( ! shouldRender ) {
		return null;
	}

	// The link is wrapped so that it doesn't stretch to the width of the
	// surrounding flex column, which would make the whole row clickable.
	return (
		<div className="editor-reading-settings-link">
			<Link href="options-reading.php">{ __( 'Reading settings' ) }</Link>
		</div>
	);
}
