/**
 * WordPress dependencies
 */
import { useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		latex,
		mathML,
		fontSize,
		textColor,
		backgroundColor,
		border,
		borderRadius,
		padding,
	} = attributes;

	if ( ! latex ) {
		return null;
	}

	// Build inline styles for the math element
	const mathStyle = {};

	if ( fontSize ) {
		mathStyle.fontSize = `${ fontSize }px`;
	}
	if ( textColor ) {
		mathStyle.color = textColor;
	}
	if ( backgroundColor ) {
		mathStyle.backgroundColor = backgroundColor;
	}
	if ( border?.width ) {
		mathStyle.borderWidth = border.width;
		mathStyle.borderStyle = border.style || 'solid';
		if ( border.color ) {
			mathStyle.borderColor = border.color;
		}
	}
	if ( borderRadius ) {
		mathStyle.borderRadius = borderRadius;
	}
	// Apply padding if explicitly set, or if there's a background/border
	if ( padding ) {
		mathStyle.padding = padding;
	} else if ( backgroundColor || border?.width ) {
		mathStyle.padding = '16px';
	}

	// Only apply styles if there are any to apply
	const hasStyling = Object.keys( mathStyle ).length > 0;

	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<math
				display="block"
				style={ hasStyling ? mathStyle : undefined }
				dangerouslySetInnerHTML={ { __html: mathML } }
			/>
		</div>
	);
}
