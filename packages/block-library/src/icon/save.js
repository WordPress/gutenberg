/**
 * WordPress dependencies
 */
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
export default function save( props ) {
	const { icon, iconName, label, title } = props.attributes;

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

	// If a label is set, add as aria-label. Will overwrite any aria-label in
	// custom icons.
	if ( label ) {
		printedIcon = {
			...printedIcon,
			props: { ...printedIcon.props, 'aria-label': label },
		};
	}

	const borderProps = getBorderClassesAndStyles( props.attributes );

	return (
		<div
			{ ...useBlockProps.save( {
				className: borderProps?.className,
				style: { ...borderProps.style },
			} ) }
			title={ title }
		>
			{ printedIcon }
		</div>
	);
}
