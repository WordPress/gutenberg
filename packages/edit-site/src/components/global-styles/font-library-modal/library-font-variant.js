/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import {
	CheckboxControl,
	Flex,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getFontFaceVariantName, setUIValuesNeeded } from './utils';
import { getAvailableFontsOutline } from './utils/fonts-outline';
import { FontLibraryContext } from './context';
import FontDemo from './font-demo';
import { unlock } from '../../../lock-unlock';

const { kebabCase } = unlock( componentsPrivateApis );
const { useGlobalSetting } = unlock( blockEditorPrivateApis );

function LibraryFontVariant( { face, font } ) {
	const { toggleActivateFont } = useContext( FontLibraryContext );
	const [ fontFamilies ] = useGlobalSetting( 'typography.fontFamilies' );
	const themeFonts = fontFamilies?.theme
		? fontFamilies.theme
				.map( ( f ) => setUIValuesNeeded( f, { source: 'theme' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];
	const customFonts = fontFamilies?.custom
		? fontFamilies.custom
				.map( ( f ) => setUIValuesNeeded( f, { source: 'custom' } ) )
				.sort( ( a, b ) => a.name.localeCompare( b.name ) )
		: [];

	const isFontActivated = ( slug, style, weight, source ) => {
		const sourceFonts = source === 'theme' ? themeFonts : customFonts;
		if ( ! style && ! weight ) {
			return !! getAvailableFontsOutline( sourceFonts )[ slug ];
		}
		return !! getAvailableFontsOutline( sourceFonts )[ slug ]?.includes(
			style + weight
		);
	};

	const isInstalled =
		font?.fontFace?.length > 0
			? isFontActivated(
					font.slug,
					face.fontStyle,
					face.fontWeight,
					font.source
			  )
			: isFontActivated( font.slug, null, null, font.source );

	const handleToggleActivation = () => {
		if ( font?.fontFace?.length > 0 ) {
			toggleActivateFont( font, face );
			return;
		}
		toggleActivateFont( font );
	};

	const displayName = font.name + ' ' + getFontFaceVariantName( face );
	const checkboxId = kebabCase(
		`${ font.slug }-${ getFontFaceVariantName( face ) }`
	);

	return (
		<div className="font-library-modal__font-card">
			<Flex justify="flex-start" align="center" gap="1rem">
				<CheckboxControl
					checked={ isInstalled }
					onChange={ handleToggleActivation }
					__nextHasNoMarginBottom
					id={ checkboxId }
				/>
				<label htmlFor={ checkboxId }>
					<FontDemo
						font={ face }
						text={ displayName }
						onClick={ handleToggleActivation }
					/>
				</label>
			</Flex>
		</div>
	);
}

export default LibraryFontVariant;
