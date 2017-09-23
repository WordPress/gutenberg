/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import { registerBlockType } from '../../api';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';
import ToggleControl from '../../inspector-controls/toggle-control';

registerBlockType( 'core/more', {
	title: __( 'More' ),

	icon: 'editor-insertmore',

	category: 'layout',

	useOnce: true,

	className: false,

	attributes: {
		text: {
			type: 'string',
		},
		noTeaser: {
			type: 'boolean',
			default: false,
		},
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { text, noTeaser } = attributes;

		const toggleNoTeaser = () => setAttributes( { noTeaser: ! noTeaser } );
		const defaultText = __( 'Read more' );
		const value = text !== undefined ? text : defaultText;
		const inputLength = value.length ? value.length + 1 : 1;

		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( '"More" allows you to break your post into a part shown on index pages, and the subsequent after clicking a "Read More" link.' ) }</p>
					</BlockDescription>
					<ToggleControl
						label={ __( 'Hide the teaser before the "More" tag' ) }
						checked={ !! noTeaser }
						onChange={ toggleNoTeaser }
					/>
				</InspectorControls>
			),
			<div key="more-tag" className="wp-block-more">
				<input
					type="text"
					value={ value }
					size={ inputLength }
					onChange={ ( event ) => setAttributes( { text: event.target.value } ) }
					onFocus={ setFocus }
				/>
			</div>,
		];
	},

	save( { attributes } ) {
		const { text } = attributes;

		return text;
	},
} );
