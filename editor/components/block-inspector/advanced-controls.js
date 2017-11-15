/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getBlockType, InspectorControls } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { PanelBody, Slot } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { updateBlockAttributes } from '../../actions';
import { getSelectedBlock, getCurrentPost } from '../../selectors';

class BlockInspectorAdvancedControls extends Component {
	constructor() {
		super( ...arguments );

		this.setClassName = this.setClassName.bind( this );
	}

	setClassName( className ) {
		const { selectedBlock, setAttributes } = this.props;
		setAttributes( selectedBlock.uid, { className } );
	}

	render() {
		return (
			<Slot
				name="Inspector.AdvancedControls"
				renderFills={ ( fills ) => {
					const { selectedBlock } = this.props;
					const blockType = getBlockType( selectedBlock.name );
					if ( false === blockType.className && isEmpty( fills ) ) {
						return null;
					}

					return (
						<PanelBody
							className="editor-advanced-controls"
							initialOpen={ false }
							title={ __( 'Advanced' ) }
						>
							{ false !== blockType.className &&
							<InspectorControls.TextControl
								label={ __( 'Additional CSS Class' ) }
								value={ selectedBlock.attributes.className || '' }
								onChange={ this.setClassName } />
							}
							{ fills }
						</PanelBody>
					);
				} } />
		);
	}
}

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
			post: getCurrentPost( state ),
		};
	},
	{
		setAttributes: updateBlockAttributes,
	}
)( BlockInspectorAdvancedControls );
