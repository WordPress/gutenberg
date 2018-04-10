/**
 * External dependencies
 */
import { compact } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { Component, RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import { createBlock } from '../../api';
import InspectorControls from '../../inspector-controls';

export const name = 'core/more';

export const settings = {
	title: __( 'More' ),

	description: __( '"More" allows you to break your post into a part shown on index pages, and the subsequent after clicking a "Read More" link.' ),

	icon: 'editor-insertmore',

	category: 'layout',

	useOnce: true,

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	attributes: {
		customText: {
			type: 'string',
		},
		noTeaser: {
			type: 'boolean',
			default: false,
		},
	},

	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.dataset && node.dataset.block === 'core/more',
				transform( node ) {
					const { customText, noTeaser } = node.dataset;
					const attrs = {};
					// Don't copy unless defined and not an empty string
					if ( customText ) {
						attrs.customText = customText;
					}
					// Special handling for boolean
					if ( noTeaser === '' ) {
						attrs.noTeaser = true;
					}
					return createBlock( 'core/more', attrs );
				},
			},
		],
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );
			this.onChangeInput = this.onChangeInput.bind( this );

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

		render() {
			const { customText, noTeaser } = this.props.attributes;
			const { setAttributes, isSelected } = this.props;

			const toggleNoTeaser = () => setAttributes( { noTeaser: ! noTeaser } );
			const { defaultText } = this.state;
			const value = customText !== undefined ? customText : defaultText;
			const inputLength = value.length + 1;

			return [
				isSelected && (
					<InspectorControls key="inspector">
						<PanelBody>
							<ToggleControl
								label={ __( 'Hide the teaser before the "More" tag' ) }
								checked={ !! noTeaser }
								onChange={ toggleNoTeaser }
							/>
						</PanelBody>
					</InspectorControls>
				),
				<div key="more-tag" className="wp-block-more">
					<input
						type="text"
						value={ value }
						size={ inputLength }
						onChange={ this.onChangeInput }
					/>
				</div>,
			];
		}
	},

	save( { attributes } ) {
		const { customText, noTeaser } = attributes;

		const moreTag = customText ?
			`<!--more ${ customText }-->` :
			'<!--more-->';

		const noTeaserTag = noTeaser ?
			'<!--noteaser-->' :
			'';

		return (
			<RawHTML>
				{ compact( [ moreTag, noTeaserTag ] ).join( '\n' ) }
			</RawHTML>
		);
	},
};
