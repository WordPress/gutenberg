/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import { useSupportedStyles } from './hooks';
import BlockPreviewPanel from './block-preview-panel';

function ScreenFilters( { name } ) {
	const parentMenu =
		name === undefined ? '' : '/blocks/' + encodeURIComponent( name );
	return (
		<>
			<ScreenHeader
				title={ __( 'Filters' ) }
				description={ __(
					'Filter and effects work without replacing your original image'
				) }
			/>
			<BlockPreviewPanel name={ name } />

			<div className="edit-site-global-styles-screen-filters">
				<VStack spacing={ 10 }>
					<VStack spacing={ 3 }>
						<Subtitle level={ 3 }>{ __( 'Duotone' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<DuotoneItem
								name={ name }
								parentMenu={ parentMenu }
							/>
						</ItemGroup>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

function DuotoneItem( { name, parentMenu, variation = '' } ) {
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport = supports.includes( 'filter' );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/filters/duotone' }
			aria-label={ __( 'Duotone styles' ) }
		>
			<HStack justify="flex-start">
				<FlexItem className="edit-site-global-styles__color-label">
					{ __( 'Duotone' ) }
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

export default ScreenFilters;
