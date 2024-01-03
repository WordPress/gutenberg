/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalVStack as VStack,
	ExternalLink,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';
import { decodeEntities } from '@wordpress/html-entities';
import { safeDecodeURIComponent, filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import SidebarButton from '../sidebar-button';

const ItemDetails = ( { item, onClose } ) => {
	const title = decodeEntities( item?.title?.rendered || __( '(no title)' ) );
	const icon = isRTL() ? chevronRight : chevronLeft;

	return (
		<VStack
			className={ classnames(
				'edit-site-sidebar-navigation-screen__main'
			) }
			spacing={ 0 }
			justify="flex-start"
		>
			<HStack
				spacing={ 4 }
				alignment="flex-start"
				className="edit-site-sidebar-navigation-screen__title-icon"
			>
				<SidebarButton
					onClick={ onClose }
					icon={ icon }
					label={ __( 'Back' ) }
					showTooltip={ false }
				/>
				<Heading
					className="edit-site-sidebar-navigation-screen__title"
					color={ '#e0e0e0' /* $gray-200 */ }
					level={ 1 }
					size={ 20 }
				>
					{ title }
				</Heading>
			</HStack>
			<div className="edit-site-sidebar-navigation-screen__meta">
				<ExternalLink
					className="edit-site-sidebar-navigation-screen__page-link"
					href={ item.link }
				>
					{ filterURLForDisplay(
						safeDecodeURIComponent( item.link )
					) }
				</ExternalLink>
			</div>

			<div className="edit-site-sidebar-navigation-screen__content">
				{ 'content goes here ' }
			</div>
		</VStack>
	);
};

export default ItemDetails;
