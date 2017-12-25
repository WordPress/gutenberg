/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, some, castArray } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../store/selectors';

function PostTypeSupportCheck( { postType, children, supportKeys } ) {
	const isSupported = some(
		castArray( supportKeys ), key => get( postType, [ 'data', 'supports', key ], false )
	);

	if ( ! isSupported ) {
		return null;
	}

	return children;
}

const applyConnect = connect(
	( state ) => {
		return {
			postTypeName: getCurrentPostType( state ),
		};
	}
);

const applyWithAPIData = withAPIData( ( { postTypeName } ) => {
	return {
		postType: postTypeName ? `/wp/v2/types/${ postTypeName }?context=edit` : undefined,
	};
} );

export default compose(
	applyConnect,
	applyWithAPIData,
)( PostTypeSupportCheck );
