/**
 * External dependencies
 */
import { registerBlock } from 'wp-blocks';
import {
	EditorHeadingIcon,
	EditorHeading1Icon,
	EditorHeading2Icon,
	EditorHeading3Icon
} from 'dashicons';

/**
 * Internal dependencies
 */
import form from './form';

registerBlock( 'heading', {
	title: 'Heading',
	form: form,
	icon: EditorHeadingIcon,
	controls: [
		{
			label: 'H1',
			icon: EditorHeading1Icon,
			isSelected: ( { attrs } ) => 'h1' === attrs.size,
			onClick( { setAttributes } ) {
				setAttributes( {
					size: 'h1'
				} );
			}
		},
		{
			label: 'H2',
			icon: EditorHeading2Icon,
			isSelected: ( { attrs } ) => ! attrs.size || 'h2' === attrs.size,
			onClick( { setAttributes } ) {
				setAttributes( {
					size: 'h2'
				} );
			}
		},
		{
			label: 'H3',
			icon: EditorHeading3Icon,
			isSelected: ( { attrs } ) => 'h3' === attrs.size,
			onClick( { setAttributes } ) {
				setAttributes( {
					size: 'h3'
				} );
			}
		}
	]
} );
