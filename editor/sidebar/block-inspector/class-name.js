/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getBlockType } from '@wordpress/block-api';
import { InspectorControls, withEditorSettings } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import { updateBlockAttributes } from '../../actions';
import { getSelectedBlock } from '../../selectors';

class BlockInspectorClassName extends Component {
	constructor() {
		super( ...arguments );

		this.setClassName = this.setClassName.bind( this );
	}

	setClassName( className ) {
		const { selectedBlock, setAttributes } = this.props;
		setAttributes( selectedBlock.uid, { className } );
	}

	render() {
		const { selectedBlock, blockType } = this.props;
		if ( false === blockType.className ) {
			return null;
		}

		return (
			<div>
				<h3>{ __( 'Block Settings' ) }</h3>
				<InspectorControls.TextControl
					label={ __( 'Additional CSS Class' ) }
					value={ selectedBlock.attributes.className }
					onChange={ this.setClassName } />
			</div>
		);
	}
}

const connectComponent = connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{
		setAttributes: updateBlockAttributes,
	}
);

const getEditorSettings = withEditorSettings( ( settings, ownProps ) => {
	return {
		blockType: getBlockType( ownProps.selectedBlock.name, settings ),
	};
} );

export default connectComponent( getEditorSettings( BlockInspectorClassName ) );
