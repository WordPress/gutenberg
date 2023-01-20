/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore, useEntityProp } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import useNavigationEntities from '../use-navigation-entities';

function OverlayTemplatePartSelector( { currentMenuId } ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const menuSlug = 'navigation-overlay-' + currentMenuId;
	const { theme } = useNavigationEntities();
	const activeTheme = theme[ 0 ].stylesheet;
	const templatePartId = activeTheme + '//' + menuSlug;

	// Find a template part that matches the menu.
	const { hasTemplatePart } = useSelect( ( select ) => {
		const { getEntityRecord } = select( coreStore );
		const part = getEntityRecord(
			'postType',
			'wp_template_part',
			templatePartId
		);
		return {
			hasTemplatePart: part ? true : false,
		};
	}, [] );

	const menuName = useEntityProp(
		'postType',
		'wp_navigation',
		'title',
		currentMenuId
	);

	const overlayName = sprintf(
		// translators: %s: The name of the menu.
		__( 'Navigation Overlay for %s' ),
		menuName[ 0 ]
	);

	async function createOverlayTemplatePart() {
		const newTemplatePart = await saveEntityRecord(
			'postType',
			'wp_template_part',
			{
				slug: 'navigation-overlay-' + currentMenuId,
				title: overlayName,
				content:
					'<!-- wp:group {"align":"full","layout":{"type":"constrained"}} --><div class="wp-block-group alignfull"><!-- wp:navigation {"overlayMenu":"never"} /--></div><!-- /wp:group -->',
			}
		);
		return newTemplatePart;
	}

	return (
		<>
			{ ! hasTemplatePart && (
				<Button
					variant="link"
					onClick={ () => {
						createOverlayTemplatePart();
					} }
				>
					{ __( 'Create Overlay' ) }
				</Button>
			) }
			{ hasTemplatePart && (
				<Button
					variant="link"
					href={ addQueryArgs( 'site-editor.php', {
						postType: 'wp_template_part',
						postId: templatePartId,
						canvas: 'edit',
					} ) }
				>
					{ __( 'Edit Overlay' ) }
				</Button>
			) }
		</>
	);
}

export default OverlayTemplatePartSelector;
