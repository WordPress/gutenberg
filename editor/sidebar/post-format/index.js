/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelRow, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostFormatSelector from '../../post-format';
import { getCurrentPostType } from '../../selectors';

function PostFormat( { postType } ) {
	if ( ! get( postType.data, [ 'supports', 'post-formats' ] ) ) {
		return null;
	}

	return (
		<PanelRow>
			<PostFormatSelector />
		</PanelRow>
	);
}

export default flowRight( [
	connect(
		( state ) => {
			return {
				postTypeSlug: getCurrentPostType( state ),
			};
		},
	),
	withAPIData( ( props ) => {
		const { postTypeSlug } = props;

		return {
			postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
		};
	} ),
] )( PostFormat );
