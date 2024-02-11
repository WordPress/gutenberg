/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	getColorClassName,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

const migrateAttributes = ( attributes ) => {
	if ( ! attributes.tagName ) {
		attributes = {
			...attributes,
			tagName: 'div',
		};
	}

	if ( ! attributes.customTextColor && ! attributes.customBackgroundColor ) {
		return attributes;
	}
	const style = { color: {} };
	if ( attributes.customTextColor ) {
		style.color.text = attributes.customTextColor;
	}
	if ( attributes.customBackgroundColor ) {
		style.color.background = attributes.customBackgroundColor;
	}

	const { customTextColor, customBackgroundColor, ...restAttributes } =
		attributes;

	return {
		...restAttributes,
		style,
	};
};

const deprecated = [
	// Version with default layout.
	{
		attributes: {
			tagName: {
				type: 'string',
				default: 'div',
			},
			templateLock: {
				type: [ 'string', 'boolean' ],
				enum: [ 'all', 'insert', false ],
			},
		},
		supports: {
			__experimentalOnEnter: true,
			__experimentalSettings: true,
			align: [ 'wide', 'full' ],
			anchor: true,
			ariaLabel: true,
			html: false,
			color: {
				gradients: true,
				link: true,
				__experimentalDefaultControls: {
					background: true,
					text: true,
				},
			},
			spacing: {
				margin: [ 'top', 'bottom' ],
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
				__experimentalFontStyle: true,
				__experimentalFontWeight: true,
				__experimentalLetterSpacing: true,
				__experimentalTextTransform: true,
				__experimentalDefaultControls: {
					fontSize: true,
				},
			},
			layout: true,
		},
		save( { attributes: { tagName: Tag } } ) {
			return (
				<Tag { ...useInnerBlocksProps.save( useBlockProps.save() ) } />
			);
		},
		isEligible: ( { layout } ) =>
			! layout ||
			layout.inherit ||
			( layout.contentSize && layout.type !== 'constrained' ),
		migrate: ( attributes ) => {
			const { layout = null } = attributes;
			if ( ! layout ) {
				return attributes;
			}
			if ( layout.inherit || layout.contentSize ) {
				return {
					...attributes,
					layout: {
						...layout,
						type: 'constrained',
					},
				};
			}
		},
	},
	// Version of the block with the double div.
	{
		attributes: {
			tagName: {
				type: 'string',
				default: 'div',
			},
			templateLock: {
				type: [ 'string', 'boolean' ],
				enum: [ 'all', 'insert', false ],
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			color: {
				gradients: true,
				link: true,
			},
			spacing: {
				padding: true,
			},
			__experimentalBorder: {
				radius: true,
			},
		},
		save( { attributes } ) {
			const { tagName: Tag } = attributes;

			return (
				<Tag { ...useBlockProps.save() }>
					<div className="wp-block-group__inner-container">
						<InnerBlocks.Content />
					</div>
				</Tag>
			);
		},
	},
	// Version of the block without global styles support
	{
		attributes: {
			backgroundColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		migrate: migrateAttributes,
		save( { attributes } ) {
			const {
				backgroundColor,
				customBackgroundColor,
				textColor,
				customTextColor,
			} = attributes;

			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const textClass = getColorClassName( 'color', textColor );
			const className = classnames( backgroundClass, textClass, {
				'has-text-color': textColor || customTextColor,
				'has-background': backgroundColor || customBackgroundColor,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div className={ className } style={ styles }>
					<div className="wp-block-group__inner-container">
						<InnerBlocks.Content />
					</div>
				</div>
			);
		},
	},
	// Version of the group block with a bug that made text color class not applied.
	{
		attributes: {
			backgroundColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
		},
		migrate: migrateAttributes,
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		save( { attributes } ) {
			const {
				backgroundColor,
				customBackgroundColor,
				textColor,
				customTextColor,
			} = attributes;

			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const textClass = getColorClassName( 'color', textColor );
			const className = classnames( backgroundClass, {
				'has-text-color': textColor || customTextColor,
				'has-background': backgroundColor || customBackgroundColor,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div className={ className } style={ styles }>
					<div className="wp-block-group__inner-container">
						<InnerBlocks.Content />
					</div>
				</div>
			);
		},
	},
	// v1 of group block. Deprecated to add an inner-container div around `InnerBlocks.Content`.
	{
		attributes: {
			backgroundColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
		},
		supports: {
			align: [ 'wide', 'full' ],
			anchor: true,
			html: false,
		},
		migrate: migrateAttributes,
		save( { attributes } ) {
			const { backgroundColor, customBackgroundColor } = attributes;

			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);
			const className = classnames( backgroundClass, {
				'has-background': backgroundColor || customBackgroundColor,
			} );

			const styles = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
			};

			return (
				<div className={ className } style={ styles }>
					<InnerBlocks.Content />
				</div>
			);
		},
	},
];

export default deprecated;
