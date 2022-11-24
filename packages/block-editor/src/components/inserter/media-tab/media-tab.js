/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	__experimentalNavigatorBackButton as NavigatorBackButton,
	FlexBlock,
	Button,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from './media-panel';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

function MediaTab( {
	rootClientId,
	selectedCategory,
	onSelectCategory,
	onInsert,
} ) {
	const mediaCategories = useMediaCategories( rootClientId );
	const isMobile = useViewportMatch( 'medium', '<' );
	const baseCssClass = 'block-editor-inserter__media-tabs';
	const onSelectMedia = useCallback(
		( media ) => {
			if ( ! media?.url ) {
				return;
			}
			const [ block ] = getBlockAndPreviewFromMedia( media, media.type );
			onInsert( block );
		},
		[ onInsert ]
	);
	return (
		<>
			{ ! isMobile && (
				<div className={ `${ baseCssClass }-container` }>
					<nav aria-label={ __( 'Media categories' ) }>
						<ItemGroup role="list" className={ baseCssClass }>
							{ mediaCategories.map( ( mediaCategory ) => (
								<Item
									role="listitem"
									key={ mediaCategory.name }
									onClick={ () =>
										onSelectCategory( mediaCategory )
									}
									className={ classNames(
										`${ baseCssClass }__media-category`,
										{
											'is-selected':
												selectedCategory ===
												mediaCategory,
										}
									) }
									aria-label={ mediaCategory.label }
									aria-current={
										mediaCategory === selectedCategory
											? 'true'
											: undefined
									}
								>
									<HStack>
										<FlexBlock>
											{ mediaCategory.label }
										</FlexBlock>
										<Icon icon={ chevronRight } />
									</HStack>
								</Item>
							) ) }
							<div role="listitem">
								<MediaUploadCheck>
									<MediaUpload
										multiple={ false }
										onSelect={ onSelectMedia }
										allowedTypes={ ALLOWED_MEDIA_TYPES }
										render={ ( { open } ) => (
											<Button
												onClick={ ( event ) => {
													// Safari doesn't not emit a focus event on button elements when
													// clicked and we need to manually focus the button here.
													// The reason is that core's Media Library modal explicitly triggers a
													// focus event and therefore a `blur` event is triggered on a different
													// element, which doesn't contain the `data-unstable-ignore-focus-outside-for-relatedtarget`
													// attribute making the Inserter dialog to close.
													event.target.focus();
													open();
												} }
												className="block-editor-inserter__media-library-button"
												variant="secondary"
												data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
											>
												{ __( 'Open Media Library' ) }
											</Button>
										) }
									/>
								</MediaUploadCheck>
							</div>
						</ItemGroup>
					</nav>
				</div>
			) }
			{ isMobile && (
				<MediaTabNavigation
					onInsert={ onInsert }
					rootClientId={ rootClientId }
					mediaCategories={ mediaCategories }
				/>
			) }
		</>
	);
}

function MediaTabNavigation( { onInsert, rootClientId, mediaCategories } ) {
	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<ItemGroup>
					{ mediaCategories.map( ( category ) => (
						<NavigatorButton
							key={ category.name }
							path={ `/category/${ category.name }` }
							as={ Item }
							isAction
						>
							<HStack>
								<FlexBlock>{ category.label }</FlexBlock>
								<Icon
									icon={
										isRTL() ? chevronLeft : chevronRight
									}
								/>
							</HStack>
						</NavigatorButton>
					) ) }
				</ItemGroup>
			</NavigatorScreen>
			{ mediaCategories.map( ( category ) => (
				<NavigatorScreen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					<NavigatorBackButton
						className="rigatonious"
						icon={ isRTL() ? chevronRight : chevronLeft }
						isSmall
						aria-label={ __( 'Navigate to the categories list' ) }
					>
						{ __( 'Back' ) }
					</NavigatorBackButton>
					<MediaCategoryPanel
						rootClientId={ rootClientId }
						onInsert={ onInsert }
						category={ category }
					/>
				</NavigatorScreen>
			) ) }
		</NavigatorProvider>
	);
}

export default MediaTab;
