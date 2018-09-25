/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { InspectorControls } from '@wordpress/editor';
import { ENTER } from '@wordpress/keycodes';
import { createBlock } from '@wordpress/blocks';

export default class MoreEdit extends Component {
	constructor() {
		super( ...arguments );
		this.onChangeInput = this.onChangeInput.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );

		this.state = {
			defaultText: __( 'Read more' ),
		};
	}

	onChangeInput( event ) {
		// Set defaultText to an empty string, allowing the user to clear/replace the input field's text
		this.setState( {
			defaultText: '',
		} );

		const value = event.target.value.length === 0 ? undefined : event.target.value;
		this.props.setAttributes( { customText: value } );
	}

	onKeyDown( event ) {
		const { keyCode } = event;
		const { insertBlocksAfter } = this.props;
		if ( keyCode === ENTER ) {
			insertBlocksAfter( [ createBlock( 'core/paragraph' ) ] );
		}
	}

	render() {
		const { customText, noTeaser } = this.props.attributes;
		const { setAttributes } = this.props;

		const toggleNoTeaser = () => setAttributes( { noTeaser: ! noTeaser } );
		const { defaultText } = this.state;
		const value = customText !== undefined ? customText : defaultText;
		const inputLength = value.length + 1;

		return (
			<Fragment>
				<InspectorControls>
					<PanelBody>
						<ToggleControl
							label={ __( 'Hide the teaser before the "More" tag' ) }
							checked={ !! noTeaser }
							onChange={ toggleNoTeaser }
						/>
					</PanelBody>
				</InspectorControls>
				<div className="wp-block-more">
					<input
						type="text"
						value={ value }
						size={ inputLength }
						onChange={ this.onChangeInput }
						onKeyDown={ this.onKeyDown }
					/>
				</div>
			</Fragment>
		);
	}
}
