/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import {
	__experimentalHStack as HStack,
	Icon,
	Flex,
	Button,
	FlexItem,
	__experimentalSpacer as Spacer,
} from '@wordpress/components';
import {
	page as pageIcon,
	chevronRight as chevronRightIcon,
	sidebar as sidebarIcon,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useEntityRecord } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';

export default function PageContentBreadcrumbs() {
	const { hasPageContentLock, context } = useSelect(
		( select ) => ( {
			hasPageContentLock: select( editSiteStore ).hasPageContentLock(),
			context: select( editSiteStore ).getEditedPostContext(),
		} ),
		[]
	);

	const { hasResolved: hasPageResolved, editedRecord: page } =
		useEntityRecord( 'postType', context.postType, context.postId );

	const { togglePageContentLock } = useDispatch( editSiteStore );

	if ( ! hasPageResolved ) {
		return null;
	}

	return hasPageContentLock ? (
		<HStack
			className="edit-site-page-content-breadcrumbs"
			expanded={ false }
			spacing={ 2 }
		>
			<Icon icon={ pageIcon } />
			<div>{ page.title }</div>
		</HStack>
	) : (
		<Flex
			className="edit-site-page-content-breadcrumbs"
			expanded={ false }
			gap={ 1 }
		>
			<Button
				className="edit-site-page-content-breadcrumbs__page-crumb"
				icon={ pageIcon }
				onClick={ () => togglePageContentLock() }
			>
				{ page.title }
			</Button>
			<Icon
				className="edit-site-page-content-breadcrumbs__chevron"
				icon={ chevronRightIcon }
				size={ 16 }
			/>
			<FlexItem className="edit-site-page-content-breadcrumbs__template-crumb">
				<Spacer padding={ 2 } marginBottom={ 0 }>
					<HStack expanded={ false } spacing={ 2 }>
						<Icon icon={ sidebarIcon } />
						<div>{ __( 'Template' ) }</div>
					</HStack>
				</Spacer>
			</FlexItem>
		</Flex>
	);
}
