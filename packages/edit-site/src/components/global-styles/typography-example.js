/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { __unstableMotion as motion } from '@wordpress/components';
import { _x } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import { getFontFamilies } from './utils';

const { useGlobalStyle, GlobalStylesContext } = unlock(
	blockEditorPrivateApis
);
const { mergeBaseAndUserConfigs } = unlock( editorPrivateApis );

export default function PreviewTypography( { fontSize, variation } ) {
	const { base } = useContext( GlobalStylesContext );
	let config = base;
	if ( variation ) {
		config = mergeBaseAndUserConfigs( base, variation );
	}

	const [ textColor ] = useGlobalStyle( 'color.text' );

	const [ bodyFontFamilies, headingFontFamilies ] = getFontFamilies( config );
	const bodyPreviewStyle = bodyFontFamilies
		? getFamilyPreviewStyle( bodyFontFamilies )
		: {};
	const headingPreviewStyle = headingFontFamilies
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
