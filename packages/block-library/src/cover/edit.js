/**
 * WordPress dependencies
 */
// import { compose, withInstanceId } from '@wordpress/compose';
import {
	InnerBlocks,
	__experimentalWithBackgroundControls,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import icon from './icon';

/**
 * Module Constants
 */
const INNER_BLOCKS_TEMPLATE = [
	[ 'core/paragraph', {
		align: 'center',
		fontSize: 'large',
		placeholder: __( 'Write title…' ),
	} ],
];

export default ( props ) => __experimentalWithBackgroundControls( {
	showDefaultPicker: true,
	blockIcon: icon,
	blockLabel: __( 'Cover' ),
	children: <InnerBlocks template={ INNER_BLOCKS_TEMPLATE } />,
	...props,
} );
