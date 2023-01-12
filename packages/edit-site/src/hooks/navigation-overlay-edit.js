/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { BlockControls } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { ToolbarButton } from '@wordpress/components';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useLocation } from '../components/routes';
import { useLink } from '../components/routes/link';

function EditNavigationOverlay( { attributes } ) {
	const { overlayTemplatePart } = attributes;
	const { params } = useLocation();
	const templatePart = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecord(
			'postType',
			'wp_template_part',
			overlayTemplatePart
		);
	}, [] );

	const linkProps = useLink(
		{
			postId: overlayTemplatePart,
			postType: 'wp_template_part',
		},
		{
			fromTemplateId: params.postId,
		}
	);

	if ( ! templatePart ) {
		return null;
	}

	return (
		<>
			<BlockControls group="other">
				<ToolbarButton
					{ ...linkProps }
					onClick={ ( event ) => {
						linkProps.onClick( event );
					} }
				>
					{ __( 'Edit Overlay -Works in Site Editor only' ) }
				</ToolbarButton>
			</BlockControls>
		</>
	);
}

export const withEditBlockControls = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		const { attributes, name } = props;
		const isDisplayed =
			name === 'core/navigation' && attributes.overlayTemplatePart;

		return (
			<>
				<BlockEdit { ...props } />
				{ isDisplayed && (
					<EditNavigationOverlay attributes={ attributes } />
				) }
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/navigation-overlay-edit',
	withEditBlockControls
);
