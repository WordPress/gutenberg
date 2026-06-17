/**
 * WordPress dependencies
 */
import { useParams } from '@wordpress/route';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import type { Post } from '@wordpress/core-data';
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from './editor';
import AddMenuItemsModal from './add-menu-items-modal';

const NAVIGATION_POST_TYPE = 'wp_navigation';

function NavigationEditStage() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigationId = parseInt( id );
	const [ isAddingItems, setIsAddingItems ] = useState( false );
	const [ editorVersion, setEditorVersion ] = useState( 0 );
	const { navigationMenu } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			return {
				navigationMenu: getEntityRecord(
					'postType',
					NAVIGATION_POST_TYPE,
					navigationId
				) as Post,
			};
		},
		[ navigationId ]
	);

	if ( ! navigationMenu ) {
		return;
	}

	const menuTitle =
		navigationMenu.title?.rendered || navigationMenu.title?.raw || '';

	return (
		<Page
			ariaLabel={ decodeEntities( menuTitle ) }
			headingLevel={ 2 }
			breadcrumbs={
				<Breadcrumbs
					items={ [
						{
							label: __( 'Navigation' ),
							to: '/navigation/list',
						},
						{
							label: decodeEntities( menuTitle ),
						},
					] }
				/>
			}
			hasPadding
			actions={
				<Button
					variant="secondary"
					onClick={ () => setIsAddingItems( true ) }
					__next40pxDefaultSize
				>
					{ __( 'Add menu items' ) }
				</Button>
			}
		>
			<NavigationMenuEditor
				key={ `${ navigationId }-${ editorVersion }` }
				id={ navigationId }
				onAddMenuItems={ () => setIsAddingItems( true ) }
			/>
			{ isAddingItems && (
				<AddMenuItemsModal
					navigationMenu={ navigationMenu }
					onClose={ () => setIsAddingItems( false ) }
					onSaved={ () =>
						setEditorVersion( ( version ) => version + 1 )
					}
				/>
			) }
		</Page>
	);
}

export const stage = NavigationEditStage;
