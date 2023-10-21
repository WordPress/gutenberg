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
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { useLink } from '../components/routes/link';
import { unlock } from '../lock-unlock';
import { TEMPLATE_PART_POST_TYPE } from '../utils/constants';

const { useLocation } = unlock( routerPrivateApis );

function EditTemplatePartMenuItem( { attributes } ) {
	const { theme, slug } = attributes;
	const { params } = useLocation();
	const templatePart = useSelect(
		( select ) => {
			return select( coreStore ).getEntityRecord(
				'postType',
				TEMPLATE_PART_POST_TYPE,
				// Ideally this should be an official public API.
				`${ theme }//${ slug }`
			);
		},
		[ theme, slug ]
	);

	const linkProps = useLink(
		{
			postId: templatePart?.id,
			postType: templatePart?.type,
			canvas: 'edit',
		},
		{
			fromTemplateId: params.postId,
		}
	);

	if ( ! templatePart ) {
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
		const isDisplayed = name === 'core/template-part' && attributes.slug;

		return (
			<>
				<BlockEdit { ...props } />
				{ isDisplayed && (
					<EditTemplatePartMenuItem attributes={ attributes } />
				) }
			</>
		);
	},
	'withEditBlockControls'
);

addFilter(
	'editor.BlockEdit',
	'core/edit-site/template-part-edit-button',
	withEditBlockControls
);
