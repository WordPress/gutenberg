/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, PanelRow, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { PageAttributesCheck, PageAttributesOrder, PageAttributesParent, PageTemplate } from '@wordpress/editor';
import { query } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { toggleSidebarPanel } from '../../../store/actions';
import { isEditorSidebarPanelOpened } from '../../../store/selectors';

/**
 * Module Constants
 */
const PANEL_NAME = 'page-attributes';

export function PageAttributes( { isOpened, onTogglePanel, postType } ) {
	if ( ! postType.data ) {
		return null;
	}
	return (
		<PageAttributesCheck>
			<PanelBody
				title={ get( postType, 'data.labels.attributes', __( 'Page Attributes' ) ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<PageTemplate />
				<PageAttributesParent />
				<PanelRow>
					<PageAttributesOrder />
				</PanelRow>
			</PanelBody>
		</PageAttributesCheck>
	);
}

const applyQuery = query( ( select ) => ( {
	postTypeSlug: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
} ) );

const applyConnect = connect(
	( state ) => {
		return {
			isOpened: isEditorSidebarPanelOpened( state, PANEL_NAME ),
		};
	},
	{
		onTogglePanel() {
			return toggleSidebarPanel( PANEL_NAME );
		},
	},
	undefined,
	{ storeKey: 'edit-post' }
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postTypeSlug } = props;
	return {
		postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
	};
} );

export default compose(
	applyQuery,
	applyConnect,
	applyWithAPIData,
)( PageAttributes );
