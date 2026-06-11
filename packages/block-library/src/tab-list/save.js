/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tabs } = attributes;
	const blockProps = useBlockProps.save( {
		role: 'tablist',
	} );

	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const buttonClassName = clsx( colorProps.className, borderProps.className );

	const buttonStyle = {
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
	};

	return (
		<div { ...blockProps }>
			{ tabs.map( ( tab, index ) => (
				<button
					key={ index }
					className={ buttonClassName || undefined }
					style={ buttonStyle }
					type="button"
					role="tab"
				>
					{ tab.label }
				</button>
			) ) }
		</div>
	);
}
