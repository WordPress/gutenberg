/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getBlockType, InspectorControls } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import { updateBlockAttributes } from '../../actions';
import { getSelectedBlock } from '../../selectors';

/**
 * Internal constants
 */
const ANCHOR_REGEX = /[^\w:.-]/g;

class BlockInspectorGenericControls extends Component {
	constructor() {
		super( ...arguments );

		this.setClassName = this.setClassName.bind( this );
		this.setAnchor = this.setAnchor.bind( this );
	}

	setClassName( className ) {
		const { selectedBlock, setAttributes } = this.props;
		setAttributes( selectedBlock.uid, { className } );
	}

	setAnchor( anchor ) {
		const { selectedBlock, setAttributes } = this.props;
		setAttributes( selectedBlock.uid, { anchor: anchor.replace( ANCHOR_REGEX, '-' ) } );
	}

	render() {
		const { selectedBlock } = this.props;
		const blockType = getBlockType( selectedBlock.name );
		if ( false === blockType.className && ! blockType.supportAnchor ) {
			return null;
		}

		return (
			<div>
				<h3>{ __( 'Block Settings' ) }</h3>
				{ blockType.className &&
					<InspectorControls.TextControl
						label={ __( 'Additional CSS Class' ) }
						value={ selectedBlock.attributes.className || '' }
						onChange={ this.setClassName } />
				}
				{ blockType.supportAnchor &&
					<InspectorControls.TextControl
						label={ __( 'HTML Anchor' ) }
						help={ __( 'Anchors lets you link directly to a section on a page.' ) }
						value={ selectedBlock.attributes.anchor || '' }
						onChange={ this.setAnchor } />
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{
		setAttributes: updateBlockAttributes,
	}
)( BlockInspectorGenericControls );
