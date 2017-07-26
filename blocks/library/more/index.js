/**
 * WordPress dependencies
 */
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import BlockDescription from '../../block-description';
import ToggleControl from '../../inspector-controls/toggle-control';

registerBlockType( 'core/more', {
	title: __( 'More' ),

	icon: 'editor-insertmore',

	category: 'layout',

	useOnce: true,

	className: false,

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { text, noTeaser } = attributes;

		const toggleNoTeaser = () => setAttributes( { noTeaser: ! noTeaser } );

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
				<Editable
					tagName="span"
					value={ text || __( 'Read more' ) }
					focus={ focus }
					onFocus={ setFocus }
					onChange={ ( value ) => setAttributes( { text: value } ) }
					inline
					formattingControls={ [] }
				/>
			</div>,
		];
	},

	save( { attributes } ) {
		const { text } = attributes;

		return text;
	},
} );
