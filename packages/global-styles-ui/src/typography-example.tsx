/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
import { _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { GlobalStylesContext } from './context';
import { getFamilyPreviewStyle } from './font-library/utils/preview-styles';
import { getFontFamilies } from './utils';
import { useStyle } from './hooks';

interface TypographyExampleProps {
	fontSize?: number;
	variation?: any;
}

export default function PreviewTypography( {
	fontSize,
	variation,
}: TypographyExampleProps ) {
	const { base } = useContext( GlobalStylesContext );
	let config = base;
	if ( variation ) {
		config = { ...base, ...variation };
	}

	const [ textColor ] = useStyle( 'color.text' );

	const [ bodyFontFamilies, headingFontFamilies ] = getFontFamilies( config );
	const bodyPreviewStyle: React.CSSProperties = bodyFontFamilies
		? getFamilyPreviewStyle( bodyFontFamilies )
		: {};
	const headingPreviewStyle: React.CSSProperties = headingFontFamilies
		? getFamilyPreviewStyle( headingFontFamilies )
		: {};

	if ( textColor ) {
		bodyPreviewStyle.color = textColor;
		headingPreviewStyle.color = textColor;
	}

	if ( fontSize ) {
		bodyPreviewStyle.fontSize = fontSize;
		headingPreviewStyle.fontSize = fontSize;
	}

	return (
		<motion.div
			animate={ {
				scale: 1,
				opacity: 1,
			} }
			initial={ {
				scale: 0.1,
				opacity: 0,
			} }
			transition={ {
				delay: 0.3,
				type: 'tween',
			} }
			style={ {
				textAlign: 'center',
				lineHeight: 1,
			} }
		>
			<span style={ headingPreviewStyle }>
				{ _x( 'A', 'Uppercase letter A' ) }
			</span>
			<span style={ bodyPreviewStyle }>
				{ _x( 'a', 'Lowercase letter A' ) }
			</span>
		</motion.div>
	);
}
