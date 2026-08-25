import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { Link } from '@wordpress/ui';
import { store as editorStore } from '../../store';
import { TEMPLATE_POST_TYPE } from '../../store/constants';

/**
 * Links to the Reading settings screen from the Front Page template summary.
 * That template resolves to the site homepage whether the homepage shows the
 * latest posts or a static page, so it points at where that choice is made.
 *
 * @return {React.ReactNode} The rendered component.
 */
export default function ReadingSettingsLink() {
	const { isTemplate, postSlug, canUpdateSettings } = useSelect(
		( select ) => {
			const { getCurrentPostType, getEditedPostAttribute } =
				select( editorStore );
			const { canUser } = select( coreStore );
			return {
				isTemplate: getCurrentPostType() === TEMPLATE_POST_TYPE,
				postSlug: getEditedPostAttribute( 'slug' ),
				canUpdateSettings: !! canUser( 'update', {
					kind: 'root',
					name: 'site',
				} ),
			};
		},
		[]
	);

	if ( ! isTemplate || postSlug !== 'front-page' || ! canUpdateSettings ) {
		return null;
	}

	return (
		<div>
			<Link href="options-reading.php">{ __( 'Reading settings' ) }</Link>
		</div>
	);
}
