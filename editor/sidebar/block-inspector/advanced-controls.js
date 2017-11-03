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
import { ClipboardButton, Tooltip, PanelBody } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import { updateBlockAttributes } from '../../actions';
import { getSelectedBlock, getCurrentPost } from '../../selectors';
import { filterURLForDisplay } from '../../utils/url';

/**
 * Internal constants
 */
const ANCHOR_REGEX = /[\s#]/g;

class BlockInspectorAdvancedControls extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
		};
		this.onCopy = this.onCopy.bind( this );
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

	componentWillUnmout() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );

		clearTimeout( this.dismissCopyConfirmation );
		this.dismissCopyConfirmation = setTimeout( () => {
			this.setState( {
				showCopyConfirmation: false,
			} );
		}, 4000 );
	}

	render() {
		const { selectedBlock, post } = this.props;
		const blockType = getBlockType( selectedBlock.name );
		if ( false === blockType.className && ! blockType.supportAnchor ) {
			return null;
		}

		return (
			<PanelBody className="editor-advanced-controls" title={ __( 'Advanced' ) }>
				{ false !== blockType.className &&
					<InspectorControls.TextControl
						label={ __( 'Additional CSS Class' ) }
						value={ selectedBlock.attributes.className || '' }
						onChange={ this.setClassName } />
				}
				{ blockType.supportAnchor &&
					<div>
						<InspectorControls.TextControl
							label={ __( 'HTML Anchor' ) }
							help={ __( 'Anchors lets you link directly to a section on a page.' ) }
							value={ selectedBlock.attributes.anchor || '' }
							onChange={ this.setAnchor } />
						{ !! post.link && !! selectedBlock.attributes.anchor &&
							<div className="editor-advanced-controls__anchor">
								<ClipboardButton className="button" text={ `${ post.link }#${ selectedBlock.attributes.anchor }` } onCopy={ this.onCopy }>
									<Tooltip text={ filterURLForDisplay( `${ post.link }#${ selectedBlock.attributes.anchor }` ) }>
										<div>{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy Link' ) }</div>
									</Tooltip>
								</ClipboardButton>
							</div>
						}
					</div>
				}
			</PanelBody>
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
