/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	BlockControls,
	PlainText,
	transformStyles,
} from '@wordpress/block-editor';
import {
	ToolbarButton,
	Disabled,
	SandBox,
	ToolbarGroup,
} from '@wordpress/components';
import { withSelect } from '@wordpress/data';

class HTMLEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isPreview: false,
			styles: [],
		};
		this.switchToHTML = this.switchToHTML.bind( this );
		this.switchToPreview = this.switchToPreview.bind( this );
	}

	componentDidMount() {
		const { styles } = this.props;

		// Default styles used to unset some of the styles
		// that might be inherited from the editor style.
		const defaultStyles = `
			html,body,:root {
				margin: 0 !important;
				padding: 0 !important;
				overflow: visible !important;
				min-height: auto !important;
			}
		`;

		this.setState( {
			styles: [ defaultStyles, ...transformStyles( styles ) ],
		} );
	}

	switchToPreview() {
		this.setState( { isPreview: true } );
	}

	switchToHTML() {
		this.setState( { isPreview: false } );
	}

	render() {
		const { attributes, setAttributes } = this.props;
		const { isPreview, styles } = this.state;

		return (
			<div className="wp-block-html">
				<BlockControls>
					<ToolbarGroup>
						<ToolbarButton
							className="components-tab-button"
							isPressed={ ! isPreview }
							onClick={ this.switchToHTML }
						>
							<span>HTML</span>
						</ToolbarButton>
						<ToolbarButton
							className="components-tab-button"
							isPressed={ isPreview }
							onClick={ this.switchToPreview }
						>
							<span>{ __( 'Preview' ) }</span>
						</ToolbarButton>
					</ToolbarGroup>
				</BlockControls>
				<Disabled.Consumer>
					{ ( isDisabled ) =>
						isPreview || isDisabled ? (
							<>
								<SandBox
									html={ attributes.content }
									styles={ styles }
								/>
								{ /*	
									An overlay is added when the block is not selected in order to register click events. 
									Some browsers do not bubble up the clicks from the sandboxed iframe, which makes it 
									difficult to reselect the block. 
								*/ }
								{ ! this.props.isSelected && (
									<div className="block-library-html__preview-overlay"></div>
								) }
							</>
						) : (
							<PlainText
								value={ attributes.content }
								onChange={ ( content ) =>
									setAttributes( { content } )
								}
								placeholder={ __( 'Write HTML…' ) }
								aria-label={ __( 'HTML' ) }
							/>
						)
					}
				</Disabled.Consumer>
			</div>
		);
	}
}
export default withSelect( ( select ) => {
	const { getSettings } = select( 'core/block-editor' );
	return {
		styles: getSettings().styles,
	};
} )( HTMLEdit );
