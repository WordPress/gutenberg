/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../selectors';

export function PageAttributesCheck( { postType, children } ) {
	const supportsPageAttributes = get( postType.data, [
		'supports',
		'page-attributes',
	], false );

	// Only render fields if post type supports page attributes
	if ( ! supportsPageAttributes ) {
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

const applyWithAPIData = withAPIData( ( props ) => {
	const { postTypeSlug } = props;

	return {
		postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PageAttributesCheck );
