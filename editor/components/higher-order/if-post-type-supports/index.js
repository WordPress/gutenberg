/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { castArray, get, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { ifPropsVerify, withAPIData } from '@wordpress/components';
import { compose, getWrapperDisplayName } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getCurrentPostType } from '../../../store/selectors';

export function checkIfPostTypeSupports( postType, supportKeys ) {
	return !! some(
		castArray( supportKeys ), key => get( postType, [ 'data', 'supports', key ], false )
	);
}

const applyConnect = connect( ( state ) => {
	return {
		postTypeSlug: getCurrentPostType( state ),
	};
} );

const applyWithAPIData = withAPIData( ( { postTypeSlug } ) => {
	return {
		postType: postTypeSlug ? `/wp/v2/types/${ postTypeSlug }?context=edit` : undefined,
	};
} );

const applyIfPropsVerify = ( supportKeys ) => ifPropsVerify( ( { postType } ) => checkIfPostTypeSupports( postType, supportKeys ) );

/**
 * A Higher Order Component that provides a way to render a component or not
 * depending on post type supports of the current post being edited.
 *
 * @param   {string|Array} supportKeys An array or string. The component is rendered
 *                                     if post type supports at least one of the support keys passed.
 * @returns {Component}                Wrapped component.
 */
export default function ifPostTypeSupports( supportKeys ) {
	return ( OriginalComponent ) => {
		const ComponentWithApply = compose(
			applyConnect,
			applyWithAPIData,
			applyIfPropsVerify( supportKeys ),
		)( OriginalComponent );
		const WrappedComponent = ( props ) => <ComponentWithApply { ...props } />;
		WrappedComponent.displayName = getWrapperDisplayName( WrappedComponent, 'ifPostTypeSupports' );
		return WrappedComponent;
	};
}
