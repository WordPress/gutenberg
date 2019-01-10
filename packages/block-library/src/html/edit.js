/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { BlockControls, PlainText, transformStyles } from '@wordpress/editor';
import { Disabled, SandBox } from '@wordpress/components';
import { select } from '@wordpress/data';

/**
 * Parse editor styles.
 *
 * @return {Array} css rule set array.
 */
const getEditorStyles = () => {
	const { getEditorSettings } = select( 'core/editor' );
	const styles = getEditorSettings().styles;
	if ( styles && styles.length > 0 ) {
		return transformStyles( styles );
	}

	return [];
};

class HTMLEdit extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			styles: [],
			isPreview: false,
		};
	}

	componentDidMount() {
		if ( ! HTMLEdit.styles ) {
			HTMLEdit.styles = getEditorStyles();
		}
	}

	render() {
		const { attributes, setAttributes } = this.props;
		const { isPreview } = this.state;
		const styles = HTMLEdit.styles;
		return (
			<div className="wp-block-html">
				<BlockControls>
					<div className="components-toolbar">
						<button
							className={ `components-tab-button ${ ! isPreview ? 'is-active' : '' }` }
							onClick={ () => this.setState( { isPreview: false } ) }
						>
							<span>HTML</span>
						</button>
						<button
							className={ `components-tab-button ${ isPreview ? 'is-active' : '' }` }
							onClick={ () => this.setState( { isPreview: true } ) }
						>
							<span>{ __( 'Preview' ) }</span>
						</button>
					</div>
				</BlockControls>
				<Disabled.Consumer>
					{ ( isDisabled ) => (
						( isPreview || isDisabled ) ? (
							<SandBox html={ attributes.content } styles={ styles } />
						) : (
							<PlainText
								value={ attributes.content }
								onChange={ ( content ) => setAttributes( { content } ) }
								placeholder={ __( 'Write HTML…' ) }
								aria-label={ __( 'HTML' ) }
							/>
						)
					) }
				</Disabled.Consumer>
			</div>
		);
	}
}
export default HTMLEdit;
