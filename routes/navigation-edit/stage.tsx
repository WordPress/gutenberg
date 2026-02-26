/**
 * WordPress dependencies
 */
import { useParams, useNavigate } from '@wordpress/route';
import { Page } from '@wordpress/admin-ui';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { chevronLeft } from '@wordpress/icons';
import type { Post } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from './editor';

const NAVIGATION_POST_TYPE = 'wp_navigation';

function NavigationEditStage() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigate = useNavigate();
	const navigationId = parseInt( id );
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
			title={
				<HStack spacing={ 2 } alignment="center">
					<Button
						icon={ chevronLeft }
						label={ __( 'Back to Navigation' ) }
						size="compact"
						onClick={ () => navigate( { to: '/navigation/list' } ) }
					/>
					<span>{ decodeEntities( menuTitle ) }</span>
				</HStack>
			}
			subTitle={ __( 'Edit the navigation menu.' ) }
			hasPadding
		>
			<NavigationMenuEditor id={ navigationId } />
		</Page>
	);
}

export const stage = NavigationEditStage;
