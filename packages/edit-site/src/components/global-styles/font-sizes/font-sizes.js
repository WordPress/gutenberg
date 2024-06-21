/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalParseQuantityAndUnitFromRawValue as parseQuantityAndUnitFromRawValue,
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
	Button,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import Subtitle from '../subtitle';
import { NavigationButtonAsItem } from '../navigation-button';
import { getNewIndexFromPresets } from '../utils';

/**
 * Coefficients to normalize font sizes to pixels.
 *
 * em/rm on units are bases the default font size of 16px.
 * Viewport units are based on a 1920x1080 screen.
 */
const NORMALIZED_FONT_SIZE_COEFFICIENT = {
	px: 1,
	em: 16,
	rem: 16,
	vw: 19.2,
	vh: 10.8,
};

/*
 * Normalize a font size value to a specific unit.
 *
 * @param {string} size The font size value to normalize.
 * @return {string} The normalized font size value.
 */
function normalizeFontSize( size ) {
	const [ quantity, unit ] = parseQuantityAndUnitFromRawValue( size );
	const normalizedSize =
		quantity * ( NORMALIZED_FONT_SIZE_COEFFICIENT[ unit ] ?? 1 );
	if ( isNaN( normalizedSize ) || isNaN( quantity ) ) {
		return 1;
	}
	return normalizedSize;
}

function FontSizes() {
	const [ fontSizes, setFontSizes ] = useGlobalSetting(
		'typography.fontSizes'
	);

	// Get the font sizes from the theme or use the default ones.
	const sizes = fontSizes.theme ?? fontSizes.default ?? [];
	const normalizedSizes = sizes
		.map( ( fontSize ) => ( {
			...fontSize,
			normalizedSize: normalizeFontSize( fontSize.size ),
		} ) )
		.sort( ( a, b ) => a.normalizedSize - b.normalizedSize );

	const handleAddFontSize = () => {
		const index = getNewIndexFromPresets( sizes, 'custom-' );
		const newFontSize = {
			/* translators: %d: font size index */
			name: sprintf( __( 'New Font Size %d' ), index ),
			size: '16px',
			slug: `custom-${ index }`,
		};

		setFontSizes( { ...fontSizes, theme: [ ...sizes, newFontSize ] } );
	};

	return (
		<VStack spacing={ 2 }>
			<HStack justify="space-between">
				<Subtitle level={ 3 }>{ __( 'Font Sizes' ) }</Subtitle>
				<Button
					label={ __( 'Add font size' ) }
					icon={ plus }
					size="small"
					onClick={ handleAddFontSize }
				/>
			</HStack>
			<ItemGroup isBordered isSeparated>
				{ normalizedSizes.map( ( size ) => (
					<NavigationButtonAsItem
						key={ size.slug }
						path={ '/typography/font-sizes/' + size.slug }
					>
						<HStack justify="space-between">
							<FlexItem className="edit-site-font-size__item">
								{ size.name }
							</FlexItem>
							<FlexItem className="edit-site-font-size__item edit-site-font-size__item-value">
								{ size.size }
							</FlexItem>
						</HStack>
					</NavigationButtonAsItem>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

export default FontSizes;
