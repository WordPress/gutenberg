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
	FlexBlock,
	Button,
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
									aria-label={ mediaCategory.labels.name }
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
						</ItemGroup>
					</nav>
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
