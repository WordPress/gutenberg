/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	CardBody,
	Card,
	CardDivider,
	CardMedia,
} from '@wordpress/components';
import { isRTL, __, _n, sprintf } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { IconWithCurrentColor } from './icon-with-current-color';
import { NavigationButtonAsItem } from './navigation-button';
import RootMenu from './root-menu';
import PreviewStyles from './preview-styles';
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useGlobalStylesRevisions from './screen-revisions/use-global-styles-revisions';

const { interfaceStore } = unlock( editorPrivateApis );
const { useLocation } = unlock( routerPrivateApis );

function ScreenRoot() {
	const { query } = useLocation();
	const { canvas = 'view' } = query;
	const {
		hasVariations,
		canEditCSS,
		shouldClearCanvasContainerView,
		isStyleBookOpened,
		isRevisionsOpened,
		isRevisionsStyleBookOpened,
	} = useSelect(
		( select ) => {
			const {
				getEntityRecord,
				__experimentalGetCurrentGlobalStylesId,
				__experimentalGetCurrentThemeGlobalStylesVariations,
			} = select( coreStore );

			const globalStylesId = __experimentalGetCurrentGlobalStylesId();
			const globalStyles = globalStylesId
				? getEntityRecord( 'root', 'globalStyles', globalStylesId )
				: undefined;

			const { getActiveComplementaryArea } = select( interfaceStore );
			const { getEditorCanvasContainerView } = unlock(
				select( editSiteStore )
			);
			const canvasContainerView = getEditorCanvasContainerView();
			const _isVisualEditorMode =
				'visual' === select( editorStore ).getEditorMode();
			const _isEditCanvasMode = 'edit' === canvas;

			return {
				hasVariations:
					!! __experimentalGetCurrentThemeGlobalStylesVariations()
						?.length,
				canEditCSS: !! globalStyles?._links?.[ 'wp:action-edit-css' ],
				isStyleBookOpened: 'style-book' === canvasContainerView,
				shouldClearCanvasContainerView:
					'edit-site/global-styles' !==
						getActiveComplementaryArea( 'core' ) ||
					! _isVisualEditorMode ||
					! _isEditCanvasMode,
				isRevisionsStyleBookOpened:
					'global-styles-revisions:style-book' ===
					canvasContainerView,
				isRevisionsOpened:
					'global-styles-revisions' === canvasContainerView,
			};
		},
		[ canvas ]
	);

	const { isLoading: isLoadingRevisions, revisionsCount } =
		useGlobalStylesRevisions();

	const shouldShowRevisionsItem = revisionsCount > 0 && ! isLoadingRevisions;

	const { setEditorCanvasContainerView } = unlock(
		useDispatch( editSiteStore )
	);
	const loadAdditionalCSSView = () => {
		setEditorCanvasContainerView( 'global-styles-css' );
	};

	useEffect( () => {
		if ( shouldClearCanvasContainerView ) {
			setEditorCanvasContainerView( undefined );
		}
	}, [ shouldClearCanvasContainerView, setEditorCanvasContainerView ] );

	const { setIsListViewOpened } = useDispatch( editorStore );

	const loadRevisionsView = () => {
		setIsListViewOpened( false );
		if ( isRevisionsStyleBookOpened ) {
			setEditorCanvasContainerView( 'style-book' );
			return;
		}
		if ( isRevisionsOpened ) {
			setEditorCanvasContainerView( undefined );
			return;
		}

		if ( isStyleBookOpened ) {
			setEditorCanvasContainerView(
				'global-styles-revisions:style-book'
			);
		} else {
			setEditorCanvasContainerView( 'global-styles-revisions' );
		}
	};

	return (
		<Card
			size="small"
			isBorderless
			className="edit-site-global-styles-screen-root"
			isRounded={ false }
		>
			<CardBody>
				<VStack spacing={ 4 }>
					<Card className="edit-site-global-styles-screen-root__active-style-tile">
						<CardMedia className="edit-site-global-styles-screen-root__active-style-tile-preview">
							<PreviewStyles />
						</CardMedia>
					</Card>
					{ hasVariations && (
						<ItemGroup>
							<NavigationButtonAsItem path="/variations">
								<HStack justify="space-between">
									<FlexItem>
										{ __( 'Browse styles' ) }
									</FlexItem>
									<IconWithCurrentColor
										icon={
											isRTL() ? chevronLeft : chevronRight
										}
									/>
								</HStack>
							</NavigationButtonAsItem>
						</ItemGroup>
					) }
					<RootMenu />
				</VStack>
			</CardBody>

			<CardDivider />

			<CardBody>
				<ItemGroup isSeparated>
					<NavigationButtonAsItem path="/blocks">
						<HStack justify="space-between">
							<FlexItem>{ __( 'Blocks' ) }</FlexItem>
							<IconWithCurrentColor
								icon={ isRTL() ? chevronLeft : chevronRight }
							/>
						</HStack>
					</NavigationButtonAsItem>
					{ canEditCSS && (
						<NavigationButtonAsItem
							path="/css"
							onClick={ loadAdditionalCSSView }
						>
							<HStack justify="space-between">
								<FlexItem>{ __( 'Additional CSS' ) }</FlexItem>
								<IconWithCurrentColor
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigationButtonAsItem>
					) }
					{ shouldShowRevisionsItem && (
						<NavigationButtonAsItem
							path="/revisions"
							onClick={ loadRevisionsView }
							data-testid="revisions-button"
						>
							<HStack justify="space-between">
								<FlexItem>
									{ sprintf(
										/* translators: %d: Number of Styles revisions. */
										_n(
											'%d Revision',
											'%d Revisions',
											revisionsCount
										),
										revisionsCount
									) }
								</FlexItem>
								<IconWithCurrentColor
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigationButtonAsItem>
					) }
				</ItemGroup>
			</CardBody>
		</Card>
	);
}

export default ScreenRoot;
