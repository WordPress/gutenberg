/**
 * WordPress dependencies
 */
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
	Button,
	Tooltip,
} from '@wordpress/components';
import { plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
const { useGlobalSetting } = unlock( blockEditorPrivateApis );
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';

function getAvailableIndex( sizes ) {
	// Filter the slug field that ends with custom-{number}.
	const indexes = sizes.map( ( size ) => {
		const match = size.slug.match( /custom-(\d+)$/ );
		return match ? parseInt( match[ 1 ], 10 ) : 0;
	} );
	return Math.max( ...indexes ) + 1;
}

function FontSizes() {
	const [ fontSizes, setFontSizes ] = useGlobalSetting(
		'typography.fontSizes'
	);

	// Get the font sizes from the theme or use the default ones.
	const sizes = fontSizes.theme ?? fontSizes.default;

	const handleAddFontSize = () => {
		const index = getAvailableIndex( sizes );
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
				<Tooltip text={ __( 'Manage font sizes' ) }>
					<Button
						aria-label={ __( 'Add font size ' ) }
						icon={ plus }
						size="small"
						onClick={ handleAddFontSize }
					/>
				</Tooltip>
			</HStack>
			<ItemGroup isBordered isSeparated>
				{ sizes.map( ( size ) => (
					<NavigationButtonAsItem
						key={ size.slug }
						path={ '/typography/font-sizes/' + size.slug }
					>
						<HStack justify="space-between">
							<FlexItem>{ size.name }</FlexItem>
							<FlexItem>{ size.size }</FlexItem>
						</HStack>
					</NavigationButtonAsItem>
				) ) }
			</ItemGroup>
		</VStack>
	);
}

export default FontSizes;
