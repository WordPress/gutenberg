/**
 * External dependencies
 */
import { registerBlock, bindEditable } from 'wp-blocks';
import {
	EditorParagraphIcon,
	EditorAlignLeftIcon,
	EditorAlignCenterIcon,
	EditorAlignRightIcon
} from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'text', {
	title: 'Text',
	form: bindEditable( form ),
	icon: EditorParagraphIcon,
	controls: [
		{
			label: 'Align Left',
			icon: EditorAlignLeftIcon,
			isSelected: ( { attrs } ) => ! attrs.align || 'left' === attrs.align,
			onClick( state ) {
				state.setAttributes( {
					align: 'left'
				} );
			}
		},
		{
			label: 'Align Center',
			icon: EditorAlignCenterIcon,
			isSelected: ( { attrs } ) => 'center' === attrs.align,
			onClick( state ) {
				state.setAttributes( {
					align: 'center'
				} );
			}
		},
		{
			label: 'Align Right',
			icon: EditorAlignRightIcon,
			isSelected: ( { attrs } ) => 'right' === attrs.align,
			onClick( state ) {
				state.setAttributes( {
					align: 'right'
				} );
			}
		}
	]
} );
