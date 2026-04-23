/**
 * WordPress dependencies
 */
import {
	Button,
	Icon,
	__experimentalGrid as Grid,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { focus } from '@wordpress/dom';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	audio as audioIcon,
	image as imageIcon,
	media as mediaIcon,
	video as videoIcon,
	reset as resetIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import MediaReplaceFlow from '../../../components/media-replace-flow';
import MediaUploadCheck from '../../../components/media-upload/check';
import { useInspectorPopoverPlacement } from '../use-inspector-popover-placement';
import { getMediaSelectKey } from '../../../store/private-keys';
import { store as blockEditorStore } from '../../../store';

/**
 * Focuses the toggle button.
 *
 * @param {Object} containerRef - ref object containing current element
 */
const focusToggleButton = ( containerRef ) => {
	// Use requestAnimationFrame to ensure DOM updates are complete.
	window.requestAnimationFrame( () => {
		const [ toggleButton ] = focus.tabbable.find( containerRef?.current );
		if ( ! toggleButton ) {
			return;
		}

		toggleButton.focus();
	} );
};

function MediaThumbnail( { data, field, attachment, config } ) {
	const { allowedTypes = [], multiple = false } = config || {};

	if ( multiple ) {
		return 'todo multiple';
	}

	if ( attachment?.media_type === 'image' || attachment?.poster ) {
		return (
			<div className="block-editor-content-only-controls__media-thumbnail">
				<img
					alt=""
					width={ 20 }
					height={ 20 }
					src={
						attachment.media_type === 'image'
							? attachment.source_url
							: attachment.poster
					}
				/>
			</div>
		);
	}

	if ( allowedTypes.length === 1 ) {
		const value = field.getValue( { item: data } );
		const url = value?.url;

		if ( allowedTypes[ 0 ] === 'image' && url ) {
			return (
				<div className="block-editor-content-only-controls__media-thumbnail">
					<img alt="" width={ 20 } height={ 20 } src={ url } />
				</div>
			);
		}

		let icon;
		if ( allowedTypes[ 0 ] === 'image' ) {
			icon = imageIcon;
		} else if ( allowedTypes[ 0 ] === 'video' ) {
			icon = videoIcon;
		} else if ( allowedTypes[ 0 ] === 'audio' ) {
			icon = audioIcon;
		} else {
			icon = mediaIcon;
		}

		if ( icon ) {
			return <Icon icon={ icon } size={ 20 } />;
		}
	}

	return <Icon icon={ mediaIcon } size={ 20 } />;
}

export default function Media( { data, field, onChange, config = {} } ) {
	const { popoverProps } = useInspectorPopoverPlacement( {
		isControl: true,
	} );
	const value = field.getValue( { item: data } );
	const {
		allowedTypes = [],
		multiple = false,
		useFeaturedImage = false,
	} = config;

	const id = value?.id;
	const url = value?.url;

	const attachment = useSelect(
		( select ) => {
			if ( ! id ) {
				return;
			}

			const settings = select( blockEditorStore ).getSettings();
			const getMedia = settings[ getMediaSelectKey ];

			if ( ! getMedia ) {
				return;
			}

			return getMedia( select, id );
		},
		[ id ]
	);

	// TODO - pluralize when multiple.
	let chooseItemLabel;
	if ( allowedTypes.length === 1 ) {
		const allowedType = allowedTypes[ 0 ];
		if ( allowedType === 'image' ) {
			chooseItemLabel = __( 'Image' );
		} else if ( allowedType === 'video' ) {
			chooseItemLabel = __( 'Video' );
		} else if ( allowedType === 'application' ) {
			chooseItemLabel = __( 'File' );
		} else {
			chooseItemLabel = __( 'Media' );
		}
	} else {
		chooseItemLabel = __( 'Media' );
	}
	const containerRef = useRef();

	return (
		<MediaUploadCheck>
			<div
				ref={ containerRef }
				className="block-editor-content-only-controls"
			>
				<MediaReplaceFlow
					className="block-editor-content-only-controls__media-replace-flow"
					allowedTypes={ allowedTypes }
					mediaId={ id }
					mediaURL={ url }
					multiple={ multiple }
					popoverProps={ popoverProps }
					onReset={ () => {
						onChange(
							field.setValue( {
								item: data,
								value: {},
							} )
						);
					} }
					{ ...( useFeaturedImage && {
						useFeaturedImage: !! value?.featuredImage,
						onToggleFeaturedImage: () => {
							onChange(
								field.setValue( {
									item: data,
									value: {
										featuredImage: ! value?.featuredImage,
									},
								} )
							);
						},
					} ) }
					onSelect={ ( selectedMedia ) => {
						if ( selectedMedia.id && selectedMedia.url ) {
							const newValue = {
								...selectedMedia,
								mediaType: selectedMedia.media_type,
							};

							// Turn off featured image when manually selecting media
							if ( useFeaturedImage ) {
								newValue.featuredImage = false;
							}

							onChange(
								field.setValue( {
									item: data,
									value: newValue,
								} )
							);
						}
					} }
					renderToggle={ ( buttonProps ) => (
						<Button
							__next40pxDefaultSize
							className="block-editor-content-only-controls__media"
							{ ...buttonProps }
						>
							<Grid
								rowGap={ 0 }
								columnGap={ 8 }
								templateColumns="20px 1fr"
								className="block-editor-content-only-controls__media-row"
							>
								{ url && (
									<>
										<MediaThumbnail
											attachment={ attachment }
											field={ field }
											data={ data }
											config={ config }
										/>
										<span className="block-editor-content-only-controls__media-title">
											{
												// TODO - truncate long titles or url smartly (e.g. show filename).
												attachment?.title?.raw &&
												attachment?.title?.raw !== ''
													? attachment?.title?.raw
													: url
											}
										</span>
									</>
								) }
								{ ! url && (
									<>
										<span
											className="block-editor-content-only-controls__media-placeholder"
											style={ {
												width: '20px',
												height: '20px',
											} }
										/>
										<span className="block-editor-content-only-controls__media-title">
											{ chooseItemLabel }
										</span>
									</>
								) }
							</Grid>
						</Button>
					) }
				/>
				{ url && (
					<Button
						label={ __( 'Reset' ) }
						className="block-editor-content-only-controls__media-reset"
						size="small"
						icon={ resetIcon }
						onClick={ () => {
							onChange(
								field.setValue( {
									item: data,
									value: {},
								} )
							);

							focusToggleButton( containerRef );
						} }
					/>
				) }
			</div>
		</MediaUploadCheck>
	);
}
