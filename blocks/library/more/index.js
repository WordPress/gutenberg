/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';

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

	edit( { attributes, setAttributes, isSelected } ) {
		const { customText, noTeaser } = attributes;

		const toggleNoTeaser = () => setAttributes( { noTeaser: ! noTeaser } );
		const defaultText = __( 'Read more' );
		const value = customText !== undefined ? customText : defaultText;
		const inputLength = value.length ? value.length + 1 : 1;

		return [
			isSelected && (
				<InspectorControls key="inspector">
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
					onChange={ ( event ) => setAttributes( { customText: event.target.value } ) }
				/>
			</div>,
		];
	},

	save() {
		return null;
	},
};
