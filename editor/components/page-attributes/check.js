/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData, withContext } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../store/selectors';

export function PageAttributesCheck( { availableTemplates, postType, children } ) {
	const supportsPageAttributes = get( postType, 'data.supports.page-attributes', false );

	// Only render fields if post type supports page attributes or available templates exist.
	if ( ! supportsPageAttributes && isEmpty( availableTemplates ) ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			postTypeSlug: getCurrentPostType( state ),
		};
	}
);

const applyWithContext = withContext( 'editor' )(
	( settings ) => ( {
		availableTemplates: settings.availableTemplates,
	} )
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postTypeSlug } = props;

	return {
		postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
	applyWithContext,
] )( PageAttributesCheck );
