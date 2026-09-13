import clsx from 'clsx';
import {
	InnerBlocks,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

const deprecated = [
	// Version with string `width` attribute stored at the top level.
	{
		attributes: {
			verticalAlignment: {
				type: 'string',
			},
			width: {
				type: 'string',
			},
			templateLock: {
				type: [ 'string', 'boolean' ],
				enum: [ 'all', 'insert', 'contentOnly', false ],
			},
		},
		supports: {
			__experimentalOnEnter: true,
			anchor: true,
			reusable: false,
			html: false,
			color: {
				gradients: true,
				heading: true,
				button: true,
				link: true,
				__experimentalDefaultControls: {
					background: true,
					text: true,
				},
			},
			shadow: true,
			spacing: {
				blockGap: true,
				padding: true,
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
			layout: true,
			interactivity: {
				clientNavigation: true,
			},
			allowedBlocks: true,
		},
		isEligible( { width } ) {
			return typeof width === 'string';
		},
		migrate( attributes ) {
			const { width, ...restAttributes } = attributes;
			return {
				...restAttributes,
				style: {
					...attributes.style,
					dimensions: {
						...attributes.style?.dimensions,
						width,
					},
				},
			};
		},
		save( { attributes } ) {
			const { verticalAlignment, width } = attributes;

			const wrapperClasses = clsx( {
				[ `is-vertically-aligned-${ verticalAlignment }` ]:
					verticalAlignment,
			} );

			let style;

			if ( width && /\d/.test( width ) ) {
				// Numbers are handled for backward compatibility as they can be
				// still provided with templates.
				let flexBasis = Number.isFinite( width ) ? width + '%' : width;
				// In some cases we need to round the width to a shorter float.
				if ( ! Number.isFinite( width ) && width?.endsWith( '%' ) ) {
					const multiplier = 1000000000000;
					flexBasis =
						Math.round( Number.parseFloat( width ) * multiplier ) /
							multiplier +
						'%';
				}
				style = { flexBasis };
			}

			const blockProps = useBlockProps.save( {
				className: wrapperClasses,
				style,
			} );
			const innerBlocksProps = useInnerBlocksProps.save( blockProps );

			return <div { ...innerBlocksProps } />;
		},
	},
	// Version with numeric `width` attribute (oldest format).
	{
		attributes: {
			verticalAlignment: {
				type: 'string',
			},
			width: {
				type: 'number',
				min: 0,
				max: 100,
			},
		},
		isEligible( { width } ) {
			return isFinite( width );
		},
		migrate( attributes ) {
			const { width, ...restAttributes } = attributes;
			return {
				...restAttributes,
				style: {
					...attributes.style,
					dimensions: {
						...attributes.style?.dimensions,
						width: `${ width }%`,
					},
				},
			};
		},
		save( { attributes } ) {
			const { verticalAlignment, width } = attributes;

			const wrapperClasses = clsx( {
				[ `is-vertically-aligned-${ verticalAlignment }` ]:
					verticalAlignment,
			} );

			const style = { flexBasis: width + '%' };

			return (
				<div className={ wrapperClasses } style={ style }>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
];

export default deprecated;
