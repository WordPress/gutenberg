/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

const v2 = {
	attributes: {
		tagName: {
			type: 'string',
			default: 'div',
		},
		legacy: {
			type: 'boolean',
			default: false,
		},
	},
	apiVersion: 3,
	supports: {
		anchor: true,
		align: [ 'wide', 'full' ],
		html: false,
		color: {
			gradients: true,
			heading: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
		spacing: {
			margin: true,
			padding: true,
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
		__experimentalBorder: {
			radius: true,
			color: true,
			width: true,
			style: true,
			__experimentalDefaultControls: {
				radius: true,
				color: true,
				width: true,
				style: true,
			},
		},
	},
	save( { attributes: { tagName: Tag, legacy } } ) {
		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );

		// The legacy version is dynamic (i.e. PHP rendered) and doesn't allow inner
		// blocks, so nothing is saved in that case.
		return legacy ? null : <Tag { ...innerBlocksProps } />;
	},
};

const v1 = {
	attributes: {
		tagName: {
			type: 'string',
			default: 'div',
		},
	},
	apiVersion: 3,
	supports: {
		align: [ 'wide', 'full' ],
		html: false,
		color: {
			gradients: true,
			link: true,
			__experimentalDefaultControls: {
				background: true,
				text: true,
				link: true,
			},
		},
	},
	save( { attributes: { tagName: Tag } } ) {
		const blockProps = useBlockProps.save();
		const { className } = blockProps;
		const classes = className?.split( ' ' ) || [];

		// The ID of the previous version of the block
		// didn't have the `wp-block-comments` class,
		// so we need to remove it here in order to mimic it.
		const newClasses = classes?.filter(
			( cls ) => cls !== 'wp-block-comments'
		);
		const newBlockProps = {
			...blockProps,
			className: newClasses.join( ' ' ),
		};

		return (
			<Tag { ...newBlockProps }>
				<InnerBlocks.Content />
			</Tag>
		);
	},
};

export default [ v2, v1 ];
