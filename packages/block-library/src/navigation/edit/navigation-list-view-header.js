/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import NavigationMenuSelector from './navigation-menu-selector';
import useCreateNavigationMenu from './use-create-navigation-menu';
import useConvertClassicToBlockMenu from './use-convert-classic-menu-to-block-menu';
import { unlock } from '../../lock-unlock';

const { useBlockDisplayTitle } = unlock( blockEditorPrivateApis );

const actionLabel =
	/* translators: %s: The name of a menu. */ __( "Switch to '%s'" );

/**
 * Header component for the navigation list view panel.
 * Renders the block title and menu selector with menu management capabilities.
 *
 * @param {Object} props          Component props.
 * @param {string} props.clientId Block client ID.
 * @return {Element} The header component.
 */
export default function NavigationListViewHeader( { clientId } ) {
	const { updateBlockAttributes, selectBlock } =
		useDispatch( blockEditorStore );

	const {
		create: createNavigationMenu,
		isSuccess: createNavigationMenuIsSuccess,
		isError: createNavigationMenuIsError,
		value: createNavigationMenuPost,
	} = useCreateNavigationMenu( clientId );

	const { convert: convertClassicMenu } =
		useConvertClassicToBlockMenu( createNavigationMenu );

	const handleUpdateMenu = useCallback(
		( menuId, options = { focusNavigationBlock: false } ) => {
			const { focusNavigationBlock } = options;
			updateBlockAttributes( clientId, { ref: menuId } );
			if ( focusNavigationBlock ) {
				selectBlock( clientId );
			}
		},
		[ updateBlockAttributes, selectBlock, clientId ]
	);

	useEffect( () => {
		if ( createNavigationMenuIsSuccess && createNavigationMenuPost?.id ) {
			handleUpdateMenu( createNavigationMenuPost.id, {
				focusNavigationBlock: true,
			} );
		}
	}, [
		createNavigationMenuIsSuccess,
		createNavigationMenuPost?.id,
		handleUpdateMenu,
	] );

	const createUntitledEmptyNavigationMenu = useCallback( async () => {
		await createNavigationMenu( '' );
	}, [ createNavigationMenu ] );

	const { currentMenuId, blockEditingMode } = useSelect(
		( select ) => {
			const { getBlockAttributes, getBlockEditingMode } =
				select( blockEditorStore );
			const attributes = getBlockAttributes( clientId );

			return {
				currentMenuId: attributes?.ref,
				blockEditingMode: getBlockEditingMode( clientId ),
			};
		},
		[ clientId ]
	);

	const blockTitle = useBlockDisplayTitle( {
		clientId,
		context: 'list-view',
	} );

	return (
		<HStack className="wp-block-navigation-off-canvas-editor__header">
			<Heading
				className="wp-block-navigation-off-canvas-editor__title"
				level={ 2 }
			>
				{ blockTitle }
			</Heading>
			{ blockEditingMode === 'default' && (
				<NavigationMenuSelector
					currentMenuId={ currentMenuId }
					onSelectClassicMenu={ convertClassicMenu }
					onSelectNavigationMenu={ handleUpdateMenu }
					onCreateNew={ createUntitledEmptyNavigationMenu }
					createNavigationMenuIsSuccess={
						createNavigationMenuIsSuccess
					}
					createNavigationMenuIsError={ createNavigationMenuIsError }
					actionLabel={ actionLabel }
				/>
			) }
		</HStack>
	);
}
