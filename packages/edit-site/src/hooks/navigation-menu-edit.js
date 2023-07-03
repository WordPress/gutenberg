/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import {
	BlockControls,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { ToolbarButton } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useLink } from '../components/routes/link';
import { unlock } from '../lock-unlock';

const { useLocation } = unlock( routerPrivateApis );
const { useBlockEditingMode } = unlock( blockEditorPrivateApis );

function NavigationMenuEdit( { attributes } ) {
	const { ref } = attributes;
	const { params } = useLocation();
	const blockEditingMode = useBlockEditingMode();
	const navigationMenu = useSelect(
		( select ) => {
			return select( coreStore ).getEntityRecord(
				'postType',
				'wp_navigation',
				// Ideally this should be an official public API.
				ref
			);
		},
		[ ref ]
	);

	const linkProps = useLink(
		{
			postId: navigationMenu?.id,
			postType: navigationMenu?.type,
			canvas: 'edit',
		},
		{
			// this applies to Navigation Menus as well.
			fromTemplateId: params.postId,
		}
	);

	// A non-default setting for block editing mode indicates that the
	// editor should restrict "editing" actions. Therefore the `Edit` button
	// should not be displayed.
	if ( ! navigationMenu || blockEditingMode !== 'default' ) {
		return null;
	}

	return (
		<BlockControls group="other">
			<ToolbarButton
				{ ...linkProps }
				onClick={ ( event ) => {
					linkProps.onClick( event );
				} }
			>
				{ __( 'Edit' ) }
			</ToolbarButton>
		</BlockControls>
	);
}

export const withEditBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, name } = props;
		const isDisplayed = name === 'core/navigation' && attributes.ref;

		return (
			<>
				<BlockEdit { ...props } />
				{ isDisplayed && (
					<NavigationMenuEdit attributes={ attributes } />
				) }
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/navigation-edit-button',
	withEditBlockControls
);
