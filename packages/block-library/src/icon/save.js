/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue } from '@wordpress/components';
import {
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import getIcons from './icons';
import { flattenIconsArray, parseIcon } from './utils';

/**
 * The save function for the Icon Block.
 *
 * @param {Object} props All props passed to this function.
 */
export default function Save( props ) {
	const {
		customGradient,
		gradient,
		hasNoIconFill,
		icon,
		iconName,
		label,
		linkRel,
		linkTarget,
		linkUrl,
		title,
		width,
		height,
	} = props.attributes;

	// If there is no icon and no iconName, don't save anything.
	if ( ! icon && ! iconName ) {
		return null;
	}

	const iconsAll = flattenIconsArray( getIcons() );
	const namedIcon = iconsAll.filter( ( i ) => i.name === iconName );
	let printedIcon = '';

	// If there is an icon and the name is empty, then it's a custom icon.
	if ( icon && namedIcon.length === 0 ) {
		// Custom icons are strings and need to be parsed.
		printedIcon = parseIcon( icon );

		if (
			printedIcon.props &&
			Object.keys( printedIcon?.props ).length === 0
		) {
			printedIcon = '';
		}
	} else {
		// Icon chosen from library.
		if ( icon.length === 0 && namedIcon.length > 0 ) {
			printedIcon = namedIcon[ 0 ]?.icon;
		} else {
			printedIcon = icon;
		}

		// Icons provided by third-parties are generally strings.
		if ( typeof printedIcon === 'string' ) {
			printedIcon = parseIcon( printedIcon );
		}
	}

	// If there is no valid SVG icon, don't save anything.
	if ( ! printedIcon ) {
		return null;
	}

	// If a label is set, add as aria-label. Will overwite any aria-label in
	// custom icons.
	if ( label ) {
		printedIcon = {
			...printedIcon,
			props: { ...printedIcon.props, 'aria-label': label },
		};
	}

	const blockProps = useBlockProps.save();
	const borderProps = getBorderClassesAndStyles( props.attributes );

	const iconClasses = clsx( 'icon-container', borderProps?.className, {
		'has-no-icon-fill-color': hasNoIconFill,
		'has-icon-background-color': gradient || customGradient,
		[ `has-${ gradient }-gradient-background` ]: gradient,
	} );

	const [ widthQuantity, widthUnit ] =
		parseQuantityAndUnitFromRawValue( width );

	// Default icon width when there is no height set.
	let iconWidth = ! height ? '48px' : undefined;

	if ( widthQuantity ) {
		iconWidth = widthUnit
			? `${ widthQuantity }${ widthUnit }`
			: `${ widthQuantity }px`;
	}

	const iconStyles = {
		background: ! gradient ? customGradient : undefined,
		width: iconWidth,
		height: height || undefined,
		...blockProps.style,
		...borderProps.style,

		// Margin is applied to the wrapper container, so unset.
		marginBottom: undefined,
		marginLeft: undefined,
		marginRight: undefined,
		marginTop: undefined,
	};

	const blockStyles = useBlockProps.save()?.style;

	// And even though margin is set on the main block div, we need to handle it
	// manually since all other styles are applied to the inner div.
	const blockMargin = {
		marginBottom: blockStyles?.marginBottom,
		marginLeft: blockStyles?.marginLeft,
		marginRight: blockStyles?.marginRight,
		marginTop: blockStyles?.marginTop,
	};

	const rel = linkRel && linkRel.length === 0 ? undefined : linkRel;
	const target =
		linkTarget && linkTarget.length === 0 ? undefined : linkTarget;

	const iconMarkup = (
		<>
			{ linkUrl ? (
				<a
					className={ iconClasses }
					href={ linkUrl }
					target={ target }
					rel={ rel }
					style={ iconStyles }
					aria-label={ label ? label : null }
				>
					{ printedIcon }
				</a>
			) : (
				<div className={ iconClasses } style={ iconStyles }>
					{ printedIcon }
				</div>
			) }
		</>
	);

	return (
		<div
			{ ...useBlockProps.save() }
			// This is a bit of a hack. we only want the margin styles
			// applied to the main block div.
			style={ blockMargin }
			title={ title }
		>
			{ iconMarkup }
		</div>
	);
}
