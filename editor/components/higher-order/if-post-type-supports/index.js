/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { some, castArray, get, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../../store/selectors';

const ifPostTypeSupports = ( supports ) => ( WrappedComponent ) => {
	// Normalize supports as an array, while supporting passing singular key
	supports = castArray( supports );

	function PostTypeSupportsCheck( props ) {
		const { postType } = props;
		const isSupported = some( supports, ( support ) => (
			get( postType.data, [ 'supports', support ], false )
		) );

		if ( ! isSupported ) {
			return null;
		}

		return (
			<WrappedComponent
				{ ...omit( props, [
					'postType',
					'postTypeSlug',
				] ) }
			/>
		);
	}

	const applyConnect = connect( ( state ) => {
		return {
			postTypeSlug: getCurrentPostType( state ),
		};
	} );

	const applyWithAPIData = withAPIData( ( props ) => {
		const { postTypeSlug } = props;

		return {
			postType: `/wp/v2/types/${ postTypeSlug }?context=edit`,
		};
	} );

	return compose( [
		applyConnect,
		applyWithAPIData,
	] )( PostTypeSupportsCheck );
};

export default ifPostTypeSupports;
