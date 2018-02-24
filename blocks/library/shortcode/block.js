/**
 * WordPress dependencies
 */
import { withInstanceId, Dashicon } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ShortcodePreview from './preview';
import PlainText from '../../plain-text';

export class Shortcode extends Component {
	constructor() {
		super( ...arguments );
		this.state = {};
	}

	render() {
		const { instanceId, setAttributes, attributes, isSelected } = this.props;
		const inputId = `blocks-shortcode-input-${ instanceId }`;
		const shortcodeContent = ( attributes.text || '' ).trim();

		if ( ! isSelected ) {
			return [
				<div className="wp-block" key="preview">
					<ShortcodePreview
						shortcode={ shortcodeContent }
					/>
				</div>,
			];
		}

		return [
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

export default withInstanceId( Shortcode );
