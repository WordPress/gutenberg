/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { getBlockType, InspectorControls } from 'blocks';
import { __ } from 'i18n';

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
		const { selectedBlock } = this.props;
		const blockType = getBlockType( selectedBlock.name );
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

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{
		setAttributes: updateBlockAttributes,
	}
)( BlockInspectorClassName );
