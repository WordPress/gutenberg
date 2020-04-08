/**
 * External dependencies
 */
import classnames from 'classnames';
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { InnerBlocks, getColorClassName } from '@wordpress/block-editor';

const migrateAttributes = ( attributes ) => {
	if ( ! attributes.tagName ) {
		attributes = {
			...attributes,
			tagName: 'div',
		};
	}

	if (
		! attributes.textColor &&
		! attributes.backgroundColor &&
		! attributes.customTextColor &&
		! attributes.customBackgroundColor
	) {
		return attributes;
	}
	const style = { color: {} };
	if ( attributes.textColor ) {
		style.color.text = `var(--wp--colors--${ attributes.textColor })`;
	}
	if ( attributes.customTextColor ) {
		style.color.text = attributes.customTextColor;
	}
	if ( attributes.backgroundColor ) {
		style.color.background = `var(--wp--colors--${ attributes.backgroundColor })`;
	}
	if ( attributes.customBackgroundColor ) {
		style.color.background = attributes.customBackgroundColor;
	}
	return {
		...omit( attributes, [
			'textColor',
			'backgroundColor',
			'customTextColor',
			'customBackgroundColor',
		] ),
		style,
	};
};

const deprecated = [
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
		isEligible( attribute ) {
			return (
				attribute.textColor ||
				attribute.customTextColor ||
				attribute.backgroundColor ||
				attribute.customBackgroundColor
			);
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
