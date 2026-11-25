import { useParams } from '@wordpress/route';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { Stack } from '@wordpress/ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { useEditorAssets } from '@wordpress/lazy-editor';
import { unlock } from '@wordpress/routes-lock-unlock';
import NavigationMenuEditor from './editor';
import styles from './style.module.scss';

const NAVIGATION_POST_TYPE = 'wp_navigation';

/**
 * The Navigation block's "Auto add new pages" setting, as the screen's footer.
 * It renders nothing, so no footer either, while the setting does not apply.
 *
 * @param props
 * @param props.menuId The `wp_navigation` post ID.
 */
function AutoAddPagesFooter( { menuId }: { menuId: number } ) {
	const { isReady } = useEditorAssets();
	if ( ! isReady ) {
		return null;
	}

	// Read from the global, not imported: `@wordpress/block-library` only
	// loads with the editor assets. See `editor/content.tsx`.
	const { AutoAddPagesControl } = unlock(
		( window as any ).wp.blockLibrary.privateApis
	);
	return (
		<AutoAddPagesControl menuId={ menuId } className={ styles.footer } />
	);
}

function NavigationEditStage() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigationId = parseInt( id );
	const { navigationMenu } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			return {
				navigationMenu: getEntityRecord(
					'postType',
					NAVIGATION_POST_TYPE,
					navigationId
				),
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
		>
			<div className={ styles.content }>
				{ /*
				 * The setting sits at the bottom of the screen, and below the
				 * list once the list is taller than the screen.
				 */ }
				<Stack
					direction="column"
					justify="space-between"
					align="stretch"
					className={ styles.layout }
				>
					<div className={ styles.menu }>
						<NavigationMenuEditor id={ navigationId } />
					</div>
					<AutoAddPagesFooter menuId={ navigationId } />
				</Stack>
			</div>
		</Page>
	);
}

export const stage = NavigationEditStage;
