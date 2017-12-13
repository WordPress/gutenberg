/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getBlockRandomAnchor, hasBlockSupport } from '../api';

const CUSTOM_STYLE_ATTRIBUTES = [ 'backgroundColor', 'textColor' ];

const hasCustomStyleAttributes = ( attributes ) => (
	CUSTOM_STYLE_ATTRIBUTES.some( attr => attributes[ attr ] )
);

function withCustomStylesAnchor( BlockEdit ) {
	return class CustomStylesAnchor extends Component {
		componentWillReceiveProps( nextProps ) {
			if ( hasBlockSupport( nextProps.name, 'anchor' ) &&
				hasBlockSupport( nextProps.name, 'customStyles' ) &&
				! nextProps.attributes.anchor &&
				hasCustomStyleAttributes( nextProps.attributes )
			) {
				nextProps.setAttributes( {
					anchor: getBlockRandomAnchor( nextProps.name ),
				} );
			}
		}

		render() {
			return (
				<BlockEdit { ...this.props } />
			);
		}
	};
}

export function addCustomStylesClass( extraProps, blockType, attributes ) {
	if ( hasBlockSupport( blockType.name, 'customStyles' ) && hasCustomStyleAttributes( attributes ) ) {
		extraProps.className = classnames( extraProps.className, 'has-custom-styles' );
	}

	return extraProps;
}

export default function customAnchorStyles() {
	addFilter( 'blocks.BlockEdit', 'core/custom-styles/inspector-control', withCustomStylesAnchor );
	addFilter( 'blocks.getSaveContent.extraProps', 'core/custom-styles/save-props', addCustomStylesClass );
}
