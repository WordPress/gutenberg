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
	__experimentalHStack as HStack,
	FlexBlock,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { MediaCategoryPanel } from './media-panel';
import MediaUploadCheck from '../../media-upload/check';
import MediaUpload from '../../media-upload';
import { useMediaCategories } from './hooks';
import { getBlockAndPreviewFromMedia } from './utils';
import MobileTabNavigation from '../mobile-tab-navigation';
import { unlock } from '../../../lock-unlock';

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

const { Tabs } = unlock( componentsPrivateApis );

function MediaTab( {
	rootClientId,
	selectedCategory,
	onSelectCategory,
	onInsert,
	children,
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
	const mobileMediaCategories = useMemo(
		() =>
			mediaCategories.map( ( mediaCategory ) => ( {
				...mediaCategory,
				label: mediaCategory.labels.name,
			} ) ),
		[ mediaCategories ]
	);

	return (
		<>
			{ ! isMobile && (
				<div className={ `${ baseCssClass }-container` }>
					<Tabs
						selectOnMove={ false }
						selectedTabId={
							selectedCategory ? selectedCategory.name : null
						}
						orientation={ 'vertical' }
						onSelect={ ( mediaCategoryId ) => {
							// Pass the full category object
							onSelectCategory(
								mediaCategories.find(
									( mediaCategory ) =>
										mediaCategory.name === mediaCategoryId
								)
							);
						} }
					>
						<Tabs.TabList className={ `${ baseCssClass }-tablist` }>
							{ mediaCategories.map( ( mediaCategory ) => (
								<Tabs.Tab
									key={ mediaCategory.name }
									tabId={ mediaCategory.name }
									className={ classNames(
										`${ baseCssClass }__media-category-tab`
									) }
									aria-label={ mediaCategory.name }
									aria-current={
										mediaCategory === selectedCategory
											? 'true'
											: undefined
									}
								>
									<HStack>
										<FlexBlock>
											{ mediaCategory.labels.name }
										</FlexBlock>
										<Icon
											icon={
												isRTL()
													? chevronLeft
													: chevronRight
											}
										/>
									</HStack>
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ mediaCategories.map( ( mediaCategory ) => (
							<Tabs.TabPanel
								key={ mediaCategory.name }
								tabId={ mediaCategory.name }
								focusable={ false }
								className={ `${ baseCssClass }__category-panel` }
							>
								{ children }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
					<MediaUploadCheck>
						<MediaUpload
							multiple={ false }
							onSelect={ onSelectMedia }
							allowedTypes={ ALLOWED_MEDIA_TYPES }
							render={ ( { open } ) => (
								<Button
									onClick={ ( event ) => {
										// Safari doesn't emit a focus event on button elements when
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
			) }
			{ isMobile && (
				<MobileTabNavigation categories={ mobileMediaCategories }>
					{ ( category ) => (
						<MediaCategoryPanel
							onInsert={ onInsert }
							rootClientId={ rootClientId }
							category={ category }
						/>
					) }
				</MobileTabNavigation>
			) }
		</>
	);
}

export default MediaTab;
