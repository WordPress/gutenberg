import clsx from 'clsx';
import {
	RichText,
	useBlockProps,
	getBackgroundClassesAndStyles,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetSpacingClassesAndStyles as getSpacingClassesAndStyles,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { tabs } = attributes;
	const blockProps = useBlockProps.save( {
		role: 'tablist',
	} );

	const backgroundProps = getBackgroundClassesAndStyles( attributes );
	const colorProps = getColorClassesAndStyles( attributes );
	const borderProps = getBorderClassesAndStyles( attributes );
	const spacingProps = getSpacingClassesAndStyles( attributes );

	const buttonClassName = clsx(
		backgroundProps.className,
		colorProps.className,
		borderProps.className
	);

	const buttonStyle = {
		...backgroundProps.style,
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
	};

	return (
		<div { ...blockProps }>
			{ tabs.map( ( tab, index ) => (
				<RichText.Content
					key={ index }
					className={ buttonClassName || undefined }
					style={ buttonStyle }
					tagName="button"
					value={ tab.label }
					type="button"
					role="tab"
				/>
			) ) }
		</div>
	);
}
