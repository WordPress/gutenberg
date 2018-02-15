/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { withInstanceId, Dashicon } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ShortcodePreview from './preview';
import BlockControls from '../../block-controls';
import { getCurrentPostId } from '../../../editor/store/selectors';
import PlainText from '../../plain-text';

export class Shortcode extends Component {
	constructor() {
		super();
		this.state = {
			preview: false,
		};
	}

	render() {
		const { preview } = this.state;
		const { instanceId, postId, setAttributes, attributes, focus, setFocus } = this.props;
		const inputId = `blocks-shortcode-input-${ instanceId }`;
		const shortcodeContent = ( attributes.text || '' ).trim();

		const controls = focus && (
			<BlockControls key="controls">
				<div className="components-toolbar">
					<button
						className={ `components-tab-button ${ ! preview ? 'is-active' : '' }` }
						onClick={ () => this.setState( { preview: false } ) }>
						<span>{ __( 'Shortcode' ) }</span>
					</button>
					<button
						className={ `components-tab-button ${ preview ? 'is-active' : '' }` }
						onClick={ () => { shortcodeContent.length && this.setState( { preview: true } ) } }>
						<span>{ __( 'Preview' ) }</span>
					</button>
				</div>
			</BlockControls>
		);
		
		if ( preview ) {
			return [
				controls,
				<ShortcodePreview key="preview"
					shortcode={ shortcodeContent }
					postId={ postId }
					setFocus={ setFocus }
				/>,
			];
		}

		return [
			controls,
			<div className="wp-block-shortcode" key="placeholder">
				<label htmlFor={ inputId }>
					<Dashicon icon="editor-code" />
					{ __( 'Shortcode' ) }
				</label>
				<PlainText
					id={ inputId }
					value={ attributes.text }
					placeholder={ __( 'Write shortcode here…' ) }
					onChange={ ( text ) => setAttributes( { text } ) }
				/>
			</div>,
		];
	}
}

const applyConnect = connect(
	( state ) => {
		return {
			postId: getCurrentPostId( state ),
		};
	},
);

export default compose( [
	applyConnect,
	withInstanceId,
] )( Shortcode );
