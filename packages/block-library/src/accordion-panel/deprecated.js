import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { createElement } from '@wordpress/element';

const v1 = {
	attributes: {
		templateLock: {
			type: [ 'string', 'boolean' ],
			enum: [ 'all', 'insert', 'contentOnly', false ],
			default: false,
		},
	},
	supports: {
		__experimentalOnEnter: true,
		html: false,
		color: {
			background: true,
			gradients: true,
		},
		interactivity: true,
		spacing: {
			padding: true,
			blockGap: true,
			__experimentalDefaultControls: {
				padding: true,
				blockGap: true,
			},
		},
		__experimentalBorder: {
			color: true,
			radius: true,
			style: true,
			width: true,
			__experimentalDefaultControls: {
				color: true,
				radius: true,
				style: true,
				width: true,
			},
		},
		typography: {
			fontSize: true,
			lineHeight: true,
			__experimentalFontFamily: true,
			__experimentalFontWeight: true,
			__experimentalFontStyle: true,
			__experimentalTextTransform: true,
			__experimentalTextDecoration: true,
			__experimentalLetterSpacing: true,
			__experimentalDefaultControls: {
				fontSize: true,
			},
		},
		shadow: true,
		layout: {
			allowEditing: false,
		},
		visibility: false,
		contentRole: true,
		allowedBlocks: true,
		lock: false,
	},
	save() {
		const blockProps = useBlockProps.save( {
			role: 'region',
		} );
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return createElement( 'div', innerBlocksProps );
	},
};

export default [ v1 ];
