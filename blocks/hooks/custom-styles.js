/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Component, getWrapperDisplayName } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getBlockRandomAnchor, hasBlockSupport, getBlockType } from '../api';

const CUSTOM_STYLE_ATTRIBUTES = [ 'backgroundColor', 'textColor' ];

const hasCustomStyles = ( attributes ) => (
	CUSTOM_STYLE_ATTRIBUTES.some( attr => attributes[ attr ] )
);

class AddAnchorWhenNeeded extends Component {
	componentWillReceiveProps( nextProps ) {
		if ( ! nextProps.attributes.anchor && hasCustomStyles( nextProps.attributes ) ) {
			nextProps.setAttributes( {
				anchor: getBlockRandomAnchor( nextProps.name ),
			} );
		}
	}

	render() {
		return null;
	}
}

export function addAnchorWhenStylesNeed( BlockEdit ) {
	const WrappedBlockEdit = ( props ) => {
		let hasAnchor = false;
		if ( hasBlockSupport( props.name, 'anchor' ) ) {
			const blockType = getBlockType( props.name );
			if ( blockType && hasCustomStyles( blockType.attributes ) ) {
				hasAnchor = true;
			}
		}

		return [
			<BlockEdit key="block-edit-add-anchor" { ...props } />,
			hasAnchor && <AddAnchorWhenNeeded key="add-anchor" { ...props } />,
		];
	};

	WrappedBlockEdit.displayName = getWrapperDisplayName( BlockEdit, 'add-anchor' );

	return WrappedBlockEdit;
}

export function addCustomStylesClass( extraProps, blockType, attributes ) {
	if ( hasCustomStyles( attributes ) ) {
		extraProps.className = classnames( extraProps.className, 'has-custom-styles' );
	}

	return extraProps;
}

export default function customAnchorStyles() {
	addFilter( 'blocks.BlockEdit', 'core/custom-styles/inspector-control', addAnchorWhenStylesNeed );
	addFilter( 'blocks.getSaveContent.extraProps', 'core/custom-styles/save-props', addCustomStylesClass );
}
