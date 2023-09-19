/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

export default function TypographyPreview( { name, element, headingLevel } ) {
	let prefix = '';
	if ( element === 'heading' ) {
		prefix = `elements.${ headingLevel }.`;
	} else if ( element && element !== 'text' ) {
		prefix = `elements.${ element }.`;
	}

	const [ fontFamily ] = useGlobalStyle(
		prefix + 'typography.fontFamily',
		name
	);
	const [ gradientValue ] = useGlobalStyle( prefix + 'color.gradient', name );
	const [ backgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name
	);
	const [ color ] = useGlobalStyle( prefix + 'color.text', name );
	const [ fontSize ] = useGlobalStyle( prefix + 'typography.fontSize', name );
	const [ fontStyle ] = useGlobalStyle(
		prefix + 'typography.fontStyle',
		name
	);
	const [ fontWeight ] = useGlobalStyle(
		prefix + 'typography.fontWeight',
		name
	);
	const [ letterSpacing ] = useGlobalStyle(
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
			className="edit-site-typography-preview"
			style={ {
				fontFamily: fontFamily ?? 'serif',
				background: gradientValue ?? backgroundColor,
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
