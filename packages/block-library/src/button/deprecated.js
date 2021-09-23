/**
 * External dependencies
 */
import { isEmpty, isObject, identity, mapValues, omit, pickBy } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	getColorClassName,
	useBlockProps,
	__experimentalGetGradientClass,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';
import { compose } from '@wordpress/compose';

/**
 * Removed empty nodes from nested objects.
 *
 * @param {Object} object
 * @return {Object} Object cleaned from empty nodes.
 */
export const cleanEmptyObject = ( object ) => {
	if ( ! isObject( object ) || Array.isArray( object ) ) {
		return object;
	}
	const cleanedNestedObjects = pickBy(
		mapValues( object, cleanEmptyObject ),
		identity
	);
	return isEmpty( cleanedNestedObjects ) ? undefined : cleanedNestedObjects;
};

const migrateBorderRadius = ( attributes ) => {
	const { borderRadius, ...newAttributes } = attributes;
	// We have to check old property `borderRadius` and if
	// `styles.border.radius` is a `number`
	const oldBorderRadius = [
		borderRadius,
		newAttributes.style?.border?.radius,
	].find( ( possibleBorderRadius ) => {
		return (
			typeof possibleBorderRadius === 'number' &&
			possibleBorderRadius !== 0
		);
	} );
	if ( ! oldBorderRadius ) {
		return newAttributes;
	}

	return {
		...newAttributes,
		style: {
			...newAttributes.style,
			border: {
				...newAttributes.style?.border,
				radius: `${ oldBorderRadius }px`,
			},
		},
	};
};

const migrateCustomColorsAndGradients = ( attributes ) => {
	if (
		! attributes.customTextColor &&
		! attributes.customBackgroundColor &&
		! attributes.customGradient
	) {
		return attributes;
	}
	const style = { color: {} };
	if ( attributes.customTextColor ) {
		style.color.text = attributes.customTextColor;
	}
	if ( attributes.customBackgroundColor ) {
		style.color.background = attributes.customBackgroundColor;
	}
	if ( attributes.customGradient ) {
		style.color.gradient = attributes.customGradient;
	}
	return {
		...omit( attributes, [
			'customTextColor',
			'customBackgroundColor',
			'customGradient',
		] ),
		style,
	};
};

/**
 * Migrates the current style.typography.fontFamily attribute,
 * whose value was "var:preset|font-family|helvetica-arial",
 * to the style.fontFamily attribute, whose value will be "helvetica-arial".
 *
 * @param {Object} attributes The current attributes
 * @return {Object} The updated attributes.
 */
const oldFontFamilyMigration = ( attributes ) => {
	if ( ! attributes?.style?.typography?.fontFamily ) {
		return attributes;
	}

	const fontFamily = attributes.style.typography.fontFamily
		.split( '|' )
		.pop();
	delete attributes.style.typography.fontFamily;
	attributes.style = cleanEmptyObject( attributes.style );

	return {
		...attributes,
		fontFamily,
	};
};

const oldColorsMigration = ( attributes ) => {
	return migrateCustomColorsAndGradients(
		omit(
			{
				...attributes,
				customTextColor:
					attributes.textColor && '#' === attributes.textColor[ 0 ]
						? attributes.textColor
						: undefined,
				customBackgroundColor:
					attributes.color && '#' === attributes.color[ 0 ]
						? attributes.color
						: undefined,
			},
			[ 'color', 'textColor' ]
		)
	);
};

const blockAttributes = {
	url: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'href',
	},
	title: {
		type: 'string',
		source: 'attribute',
		selector: 'a',
		attribute: 'title',
	},
	text: {
		type: 'string',
		source: 'html',
		selector: 'a',
	},
};

const deprecated = [
	{
		supports: {
			anchor: true,
			align: true,
			alignWide: false,
			color: {
				__experimentalSkipSerialization: true,
				gradients: true,
			},
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
			reusable: false,
			__experimentalSelector: '.wp-block-button__link',
		},
		attributes: {
			...blockAttributes,
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
			width: {
				type: 'number',
			},
		},
		isEligible( { style } ) {
			return typeof style?.border?.radius === 'number';
		},
		save( { attributes, className } ) {
			const {
				fontSize,
				linkTarget,
				rel,
				style,
				text,
				title,
				url,
				width,
			} = attributes;

			if ( ! text ) {
				return null;
			}

			const borderRadius = style?.border?.radius;
			const colorProps = getColorClassesAndStyles( attributes );
			const buttonClasses = classnames(
				'wp-block-button__link',
				colorProps.className,
				{
					'no-border-radius': style?.border?.radius === 0,
				}
			);
			const buttonStyle = {
				borderRadius: borderRadius ? borderRadius : undefined,
				...colorProps.style,
			};

			// The use of a `title` attribute here is soft-deprecated, but still applied
			// if it had already been assigned, for the sake of backward-compatibility.
			// A title will no longer be assigned for new or updated button block links.

			const wrapperClasses = classnames( className, {
				[ `has-custom-width wp-block-button__width-${ width }` ]: width,
				[ `has-custom-font-size` ]:
					fontSize || style?.typography?.fontSize,
			} );

			return (
				<div { ...useBlockProps.save( { className: wrapperClasses } ) }>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
		migrate: migrateBorderRadius,
	},
	{
		supports: {
			anchor: true,
			align: true,
			alignWide: false,
			color: {
				__experimentalSkipSerialization: true,
			},
			reusable: false,
			__experimentalSelector: '.wp-block-button__link',
		},
		attributes: {
			...blockAttributes,
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			borderRadius: {
				type: 'number',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
			style: {
				type: 'object',
			},
			width: {
				type: 'number',
			},
		},
		save( { attributes, className } ) {
			const {
				borderRadius,
				linkTarget,
				rel,
				text,
				title,
				url,
				width,
			} = attributes;
			const colorProps = getColorClassesAndStyles( attributes );
			const buttonClasses = classnames(
				'wp-block-button__link',
				colorProps.className,
				{
					'no-border-radius': borderRadius === 0,
				}
			);
			const buttonStyle = {
				borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				...colorProps.style,
			};

			// The use of a `title` attribute here is soft-deprecated, but still applied
			// if it had already been assigned, for the sake of backward-compatibility.
			// A title will no longer be assigned for new or updated button block links.

			const wrapperClasses = classnames( className, {
				[ `has-custom-width wp-block-button__width-${ width }` ]: width,
			} );

			return (
				<div { ...useBlockProps.save( { className: wrapperClasses } ) }>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
		migrate: migrateBorderRadius,
	},
	{
		supports: {
			anchor: true,
			align: true,
			alignWide: false,
			color: {
				__experimentalSkipSerialization: true,
			},
			reusable: false,
			__experimentalSelector: '.wp-block-button__link',
		},
		attributes: {
			...blockAttributes,
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			borderRadius: {
				type: 'number',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
			style: {
				type: 'object',
			},
			width: {
				type: 'number',
			},
		},
		save( { attributes, className } ) {
			const {
				borderRadius,
				linkTarget,
				rel,
				text,
				title,
				url,
				width,
			} = attributes;
			const colorProps = getColorClassesAndStyles( attributes );
			const buttonClasses = classnames(
				'wp-block-button__link',
				colorProps.className,
				{
					'no-border-radius': borderRadius === 0,
				}
			);
			const buttonStyle = {
				borderRadius: borderRadius ? borderRadius + 'px' : undefined,
				...colorProps.style,
			};

			// The use of a `title` attribute here is soft-deprecated, but still applied
			// if it had already been assigned, for the sake of backward-compatibility.
			// A title will no longer be assigned for new or updated button block links.

			const wrapperClasses = classnames( className, {
				[ `has-custom-width wp-block-button__width-${ width }` ]: width,
			} );

			return (
				<div { ...useBlockProps.save( { className: wrapperClasses } ) }>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
		migrate: migrateBorderRadius,
	},
	{
		supports: {
			align: true,
			alignWide: false,
			color: { gradients: true },
		},
		attributes: {
			...blockAttributes,
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			borderRadius: {
				type: 'number',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
			style: {
				type: 'object',
			},
		},
		save( { attributes } ) {
			const {
				borderRadius,
				linkTarget,
				rel,
				text,
				title,
				url,
			} = attributes;
			const buttonClasses = classnames( 'wp-block-button__link', {
				'no-border-radius': borderRadius === 0,
			} );
			const buttonStyle = {
				borderRadius: borderRadius ? borderRadius + 'px' : undefined,
			};

			return (
				<RichText.Content
					tagName="a"
					className={ buttonClasses }
					href={ url }
					title={ title }
					style={ buttonStyle }
					value={ text }
					target={ linkTarget }
					rel={ rel }
				/>
			);
		},
		migrate: migrateBorderRadius,
	},
	{
		supports: {
			align: true,
			alignWide: false,
		},
		attributes: {
			...blockAttributes,
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			borderRadius: {
				type: 'number',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
			customGradient: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
		},

		isEligible: ( attributes ) =>
			!! attributes.customTextColor ||
			!! attributes.customBackgroundColor ||
			!! attributes.customGradient,
		migrate: compose(
			migrateBorderRadius,
			migrateCustomColorsAndGradients
		),
		save( { attributes } ) {
			const {
				backgroundColor,
				borderRadius,
				customBackgroundColor,
				customTextColor,
				customGradient,
				linkTarget,
				gradient,
				rel,
				text,
				textColor,
				title,
				url,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass =
				! customGradient &&
				getColorClassName( 'background-color', backgroundColor );
			const gradientClass = __experimentalGetGradientClass( gradient );

			const buttonClasses = classnames( 'wp-block-button__link', {
				'has-text-color': textColor || customTextColor,
				[ textClass ]: textClass,
				'has-background':
					backgroundColor ||
					customBackgroundColor ||
					customGradient ||
					gradient,
				[ backgroundClass ]: backgroundClass,
				'no-border-radius': borderRadius === 0,
				[ gradientClass ]: gradientClass,
			} );

			const buttonStyle = {
				background: customGradient ? customGradient : undefined,
				backgroundColor:
					backgroundClass || customGradient || gradient
						? undefined
						: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
				borderRadius: borderRadius ? borderRadius + 'px' : undefined,
			};

			// The use of a `title` attribute here is soft-deprecated, but still applied
			// if it had already been assigned, for the sake of backward-compatibility.
			// A title will no longer be assigned for new or updated button block links.

			return (
				<div>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			align: {
				type: 'string',
				default: 'none',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
		},
		isEligible( attribute ) {
			return (
				attribute.className &&
				attribute.className.includes( 'is-style-squared' )
			);
		},
		migrate( attributes ) {
			let newClassName = attributes.className;
			if ( newClassName ) {
				newClassName = newClassName
					.replace( /is-style-squared[\s]?/, '' )
					.trim();
			}
			return migrateBorderRadius(
				migrateCustomColorsAndGradients( {
					...attributes,
					className: newClassName ? newClassName : undefined,
					borderRadius: 0,
				} )
			);
		},
		save( { attributes } ) {
			const {
				backgroundColor,
				customBackgroundColor,
				customTextColor,
				linkTarget,
				rel,
				text,
				textColor,
				title,
				url,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const buttonClasses = classnames( 'wp-block-button__link', {
				'has-text-color': textColor || customTextColor,
				[ textClass ]: textClass,
				'has-background': backgroundColor || customBackgroundColor,
				[ backgroundClass ]: backgroundClass,
			} );

			const buttonStyle = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			align: {
				type: 'string',
				default: 'none',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			customBackgroundColor: {
				type: 'string',
			},
			customTextColor: {
				type: 'string',
			},
		},
		migrate: oldColorsMigration,
		save( { attributes } ) {
			const {
				url,
				text,
				title,
				backgroundColor,
				textColor,
				customBackgroundColor,
				customTextColor,
			} = attributes;

			const textClass = getColorClassName( 'color', textColor );
			const backgroundClass = getColorClassName(
				'background-color',
				backgroundColor
			);

			const buttonClasses = classnames( 'wp-block-button__link', {
				'has-text-color': textColor || customTextColor,
				[ textClass ]: textClass,
				'has-background': backgroundColor || customBackgroundColor,
				[ backgroundClass ]: backgroundClass,
			} );

			const buttonStyle = {
				backgroundColor: backgroundClass
					? undefined
					: customBackgroundColor,
				color: textClass ? undefined : customTextColor,
			};

			return (
				<div>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
					/>
				</div>
			);
		},
	},
	{
		attributes: {
			...blockAttributes,
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},
		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			const buttonStyle = {
				backgroundColor: color,
				color: textColor,
			};

			const linkClass = 'wp-block-button__link';

			return (
				<div className={ `align${ align }` }>
					<RichText.Content
						tagName="a"
						className={ linkClass }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
					/>
				</div>
			);
		},
		migrate: oldColorsMigration,
	},
	{
		attributes: {
			...blockAttributes,
			color: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			align: {
				type: 'string',
				default: 'none',
			},
		},
		save( { attributes } ) {
			const { url, text, title, align, color, textColor } = attributes;

			return (
				<div
					className={ `align${ align }` }
					style={ { backgroundColor: color } }
				>
					<RichText.Content
						tagName="a"
						href={ url }
						title={ title }
						style={ { color: textColor } }
						value={ text }
					/>
				</div>
			);
		},
		migrate: oldColorsMigration,
	},
	{
		attributes: {
			url: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'href',
			},
			title: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'title',
			},
			text: {
				type: 'string',
				source: 'html',
				selector: 'a',
			},
			linkTarget: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'target',
			},
			rel: {
				type: 'string',
				source: 'attribute',
				selector: 'a',
				attribute: 'rel',
			},
			placeholder: {
				type: 'string',
			},
			backgroundColor: {
				type: 'string',
			},
			textColor: {
				type: 'string',
			},
			gradient: {
				type: 'string',
			},
			width: {
				type: 'number',
			},
		},
		supports: {
			anchor: true,
			align: true,
			alignWide: false,
			color: {
				__experimentalSkipSerialization: true,
				gradients: true,
			},
			typography: {
				fontSize: true,
				__experimentalFontFamily: true,
			},
			reusable: false,
			spacing: {
				__experimentalSkipSerialization: true,
				padding: [ 'horizontal', 'vertical' ],
				__experimentalDefaultControls: {
					padding: true,
				},
			},
			__experimentalBorder: {
				radius: true,
				__experimentalSkipSerialization: true,
			},
			__experimentalSelector: '.wp-block-button__link',
		},
		save( { attributes, className } ) {
			const {
				fontSize,
				linkTarget,
				rel,
				style,
				text,
				title,
				url,
				width,
			} = attributes;

			if ( ! text ) {
				return null;
			}

			const borderProps = getBorderClassesAndStyles( attributes );
			const colorProps = getColorClassesAndStyles( attributes );
			const spacingProps = getSpacingClassesAndStyles( attributes );
			const buttonClasses = classnames(
				'wp-block-button__link',
				colorProps.className,
				borderProps.className,
				{
					// For backwards compatibility add style that isn't provided via
					// block support.
					'no-border-radius': style?.border?.radius === 0,
				}
			);
			const buttonStyle = {
				...borderProps.style,
				...colorProps.style,
				...spacingProps.style,
			};

			// The use of a `title` attribute here is soft-deprecated, but still applied
			// if it had already been assigned, for the sake of backward-compatibility.
			// A title will no longer be assigned for new or updated button block links.

			const wrapperClasses = classnames( className, {
				[ `has-custom-width wp-block-button__width-${ width }` ]: width,
				[ `has-custom-font-size` ]:
					fontSize || style?.typography?.fontSize,
			} );

			return (
				<div { ...useBlockProps.save( { className: wrapperClasses } ) }>
					<RichText.Content
						tagName="a"
						className={ buttonClasses }
						href={ url }
						title={ title }
						style={ buttonStyle }
						value={ text }
						target={ linkTarget }
						rel={ rel }
					/>
				</div>
			);
		},
		migrate: oldFontFamilyMigration,
		isEligible( { style } ) {
			return style?.typography?.fontFamily;
		},
	},
];

export default deprecated;
