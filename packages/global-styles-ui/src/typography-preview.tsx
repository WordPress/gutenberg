/**
 * Internal dependencies
 */
import { useStyle } from './hooks';

interface TypographyPreviewProps {
	name?: string;
	element: string;
	headingLevel: string;
}

export default function TypographyPreview( {
	name,
	element,
	headingLevel,
}: TypographyPreviewProps ) {
	let prefix = '';
	if ( element === 'heading' ) {
		prefix = `elements.${ headingLevel }.`;
	} else if ( element && element !== 'text' ) {
		prefix = `elements.${ element }.`;
	}

	const [ fontFamily ] = useStyle( prefix + 'typography.fontFamily', name );
	const [ gradientValue ] = useStyle( prefix + 'color.gradient', name );
	const [ backgroundColor ] = useStyle( prefix + 'color.background', name );
	const [ fallbackBackgroundColor ] = useStyle( 'color.background' );
	const [ color ] = useStyle( prefix + 'color.text', name );
	const [ fontSize ] = useStyle( prefix + 'typography.fontSize', name );
	const [ fontStyle ] = useStyle( prefix + 'typography.fontStyle', name );
	const [ fontWeight ] = useStyle( prefix + 'typography.fontWeight', name );
	const [ letterSpacing ] = useStyle(
		prefix + 'typography.letterSpacing',
		name
	);
	const extraStyles =
		element === 'link'
			? {
					textDecoration: 'underline',
			  }
			: {};

	return (
		<div
			className="global-styles-ui-typography-preview"
			style={ {
				fontFamily: fontFamily ?? 'serif',
				background:
					gradientValue ?? backgroundColor ?? fallbackBackgroundColor,
				color,
				fontSize,
				fontStyle,
				fontWeight,
				letterSpacing,
				...extraStyles,
			} }
		>
			Aa
		</div>
	);
}
