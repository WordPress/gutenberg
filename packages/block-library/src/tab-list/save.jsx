import clsx from 'clsx';
import {
	RichText,
	useBlockProps,
	__experimentalGetBorderClassesAndStyles as getBorderClassesAndStyles,
	__experimentalGetColorClassesAndStyles as getColorClassesAndStyles,
	__experimentalGetShadowClassesAndStyles as getShadowClassesAndStyles,
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
	const shadowProps = getShadowClassesAndStyles( attributes );

	const buttonClassName = clsx( colorProps.className, borderProps.className );

	const buttonStyle = {
		...colorProps.style,
		...borderProps.style,
		...spacingProps.style,
		...shadowProps.style,
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
