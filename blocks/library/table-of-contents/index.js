/**
 * WordPress
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import { registerBlockType } from '../../api';
import Editable from '../../editable';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';

registerBlockType( 'core/table-of-contents', {
	title: __( 'Table of Contents' ),

	icon: 'list-view',

	category: 'widgets',

	attributes: {
		title: {
			type: 'string',
			default: __( 'Table of Contents' ),
		},
		numbered: {
			type: 'bool',
			default: true,
		},
	},

	edit( { attributes, setAttributes, focus, setFocus } ) {
		const { title, numbered } = attributes;
		return [
			focus && (
				<InspectorControls key="inspector">
					<BlockDescription>
						<p>{ __( 'This is a table of contents, y\'all' ) }</p>
					</BlockDescription>

					<h3>{ __( 'Table of Contents Settings' ) }</h3>

					<ToggleControl
						label={ __( 'Display chapter numbering' ) }
						checked={ numbered }
						onChange={
							() => setAttributes( {
								numbered: ! numbered,
							} )
						}
					/>
				</InspectorControls>
			),
			<Editable
				key="editable"
				tagName="h2"
				value={ [ title ] }
				focus={ focus }
				onFocus={ setFocus }
				onChange={ ( value ) => setAttributes( { title: value[ 0 ] } ) }
				formattingControls={ false }
				multiline={ false }
			/>,
			__( 'Here shall render ye table of contents' ),
		];
	},

	save() {
		return null;
	},
} );
