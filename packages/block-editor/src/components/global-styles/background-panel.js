/**
 * WordPress dependencies
 */
import {
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalUnitControl as UnitControl,
	__experimentalVStack as VStack,
	DropZone,
	FocalPointPicker,
	__experimentalHStack as HStack,
	Spinner,
	Button,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { useCallback, Platform, useRef, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { isBlobURL } from '@wordpress/blob';

/**
 * Internal dependencies
 */
import { TOOLSPANEL_DROPDOWNMENU_PROPS } from './utils';
import { setImmutably } from '../../utils/object';
import MediaUpload from '../media-upload';
import MediaUploadCheck from '../media-upload/check';
import { store as blockEditorStore } from '../../store';

const IMAGE_BACKGROUND_TYPE = 'image';
const ALLOWED_MEDIA_TYPES = [ IMAGE_BACKGROUND_TYPE ];
const DEFAULT_BACKGROUND_IMAGE_LABEL = __( 'Background image' );
const DEFAULT_SET_BACKGROUND_IMAGE_LABEL = __( 'Set background image' );

/**
 * Checks site settings to see if the background panel may be used.
 * `settings.background.backgroundSize` exists also,
 * but can only be used if settings?.background?.backgroundImage is `true`.
 *
 * @param {Object} settings Site settings
 * @return {boolean}        Whether site settings has activated background panel.
 */
export function useHasBackgroundPanel( settings ) {
	return Platform.OS === 'web' && settings?.background?.backgroundImage;
}

/**
 * Checks if there is a current value in the background size block support
 * attributes. Background size values include background size as well
 * as background position.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background size value set.
 */
export function hasBackgroundSizeValue( style ) {
	return (
		style?.background?.backgroundPosition !== undefined ||
		style?.background?.backgroundSize !== undefined
	);
}

/**
 * Checks if there is a current value in the background image block support
 * attributes.
 *
 * @param {Object} style Style attribute.
 * @return {boolean}     Whether the block has a background image value set.
 */
export function hasBackgroundImageValue( style ) {
	return (
		!! style?.background?.backgroundImage?.id ||
		!! style?.background?.backgroundImage?.url
	);
}

/**
 * Get the help text for the background size control.
 *
 * @param {string} value backgroundSize value.
 * @return {string}      Translated help text.
 */
function backgroundSizeHelpText( value ) {
	if ( value === 'cover' || value === undefined ) {
		return __( 'Image covers the space evenly.' );
	}
	if ( value === 'contain' ) {
		return __( 'Image is contained without distortion.' );
	}
	return __( 'Specify a fixed width.' );
}

/**
 * Converts decimal x and y coords from FocalPointPicker to percentage-based values
 * to use as backgroundPosition value.
 *
 * @param {{x?:number, y?:number}} value FocalPointPicker coords.
 * @return {string}      				 backgroundPosition value.
 */
export const coordsToBackgroundPosition = ( value ) => {
	if ( ! value || ( isNaN( value.x ) && isNaN( value.y ) ) ) {
		return undefined;
	}

	const x = isNaN( value.x ) ? 0.5 : value.x;
	const y = isNaN( value.y ) ? 0.5 : value.y;

	return `${ x * 100 }% ${ y * 100 }%`;
};

/**
 * Converts backgroundPosition value to x and y coords for FocalPointPicker.
 *
 * @param {string} value backgroundPosition value.
 * @return {{x?:number, y?:number}}       FocalPointPicker coords.
 */
export const backgroundPositionToCoords = ( value ) => {
	if ( ! value ) {
		return { x: undefined, y: undefined };
	}

	let [ x, y ] = value.split( ' ' ).map( ( v ) => parseFloat( v ) / 100 );
	x = isNaN( x ) ? undefined : x;
	y = isNaN( y ) ? x : y;

	return { x, y };
};

function BackgroundImageToolsPanelItem( {
	panelId,
	isShownByDefault,
	onChange,
	style,
	inheritedValue,
} ) {
	const [ isLoading, setIsLoading ] = useState( false );
	const mediaUpload = useSelect(
		( select ) => select( blockEditorStore ).getSettings().mediaUpload,
		[]
	);

	const { id, title, url } = style?.background?.backgroundImage || {
		...inheritedValue?.background?.backgroundImage,
	};

	const toggleRef = useRef();

	const { createErrorNotice } = useDispatch( noticesStore );
	const onUploadError = ( message ) => {
		createErrorNotice( message, { type: 'snackbar' } );
	};

	const resetBackgroundImage = () =>
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundImage' ],
				undefined
			)
		);

	const onSelectMedia = ( media ) => {
		if ( ! media || ! media.url ) {
			resetBackgroundImage();
			return;
		}

		if ( isBlobURL( media.url ) ) {
			return;
		}

		// For media selections originated from a file upload.
		if (
			( media.media_type &&
				media.media_type !== IMAGE_BACKGROUND_TYPE ) ||
			( ! media.media_type &&
				media.type &&
				media.type !== IMAGE_BACKGROUND_TYPE )
		) {
			onUploadError(
				__( 'Only images can be used as a background image.' )
			);
			return;
		}

		onChange(
			setImmutably( style, [ 'background', 'backgroundImage' ], {
				url: media.url,
				id: media.id,
				source: 'file',
				title: media.title || undefined,
			} )
		);
	};

	const onFilesDrop = ( filesList ) => {
		mediaUpload( {
			allowedTypes: ALLOWED_MEDIA_TYPES,
			filesList,
			onFileChange( [ image ] ) {
				if ( isBlobURL( image?.url ) ) {
					setIsLoading( true );
					return;
				}
				onSelectMedia( image );
				setIsLoading( false );
			},
			onError: onUploadError,
		} );
	};

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: undefined,
			},
		};
	}, [] );

	const hasValue =
		hasBackgroundImageValue( style ) ||
		hasBackgroundImageValue( inheritedValue );

	return (
		<ToolsPanelItem
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Background image' ) }
			onDeselect={ resetBackgroundImage }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ panelId }
		>
			<MediaUploadCheck
				fallback={
					<p>
						{ __(
							'To edit the background image, you need permission to upload media.'
						) }
					</p>
				}
			>
				<MediaUpload
					title={ title || DEFAULT_BACKGROUND_IMAGE_LABEL }
					onSelect={ onSelectMedia }
					allowedTypes={ ALLOWED_MEDIA_TYPES }
					modalClass="block-editor-global-styles-background-panel__media-modal"
					render={ ( { open } ) => (
						<div className="block-editor-global-styles-background-panel__container">
							<Button
								ref={ toggleRef }
								className={
									! id
										? 'block-editor-global-styles-background-panel__toggle'
										: 'block-editor-global-styles-background-panel__preview'
								}
								onClick={ open }
								aria-label={
									! id
										? null
										: __( 'Edit or replace the image' )
								}
							>
								{ !! id && url && (
									<img
										className="block-editor-global-styles-background-panel__preview-image"
										src={ url }
										alt=""
									/>
								) }
								{ isLoading && <Spinner /> }
								{ ! id &&
									! isLoading &&
									DEFAULT_SET_BACKGROUND_IMAGE_LABEL }
							</Button>

							<DropZone
								onFilesDrop={ onFilesDrop }
								label={ __( 'Drop to upload' ) }
							/>
							{ !! id && (
								<HStack className="block-editor-global-styles-background-panel__actions">
									<Button
										className="block-editor-global-styles-background-panel__action"
										onClick={ open }
									>
										{ __( 'Replace' ) }
									</Button>
									<Button
										className="block-editor-global-styles-background-panel__action"
										onClick={ () => {
											resetBackgroundImage();
											toggleRef.current.focus();
										} }
									>
										{ __( 'Remove' ) }
									</Button>
								</HStack>
							) }
						</div>
					) }
					value={ id }
				/>
			</MediaUploadCheck>
		</ToolsPanelItem>
	);
}

function BackgroundSizeToolsPanelItem( {
	panelId,
	isShownByDefault,
	onChange,
	style,
	inheritedValue,
	defaultValues,
} ) {
	const sizeValue =
		style?.background?.backgroundSize ||
		inheritedValue?.background?.backgroundSize;
	const repeatValue =
		style?.background?.backgroundRepeat ||
		inheritedValue?.background?.backgroundRepeat;
	const imageValue =
		style?.background?.backgroundImage?.url ||
		inheritedValue?.background?.backgroundImage?.url;
	const positionValue =
		style?.background?.backgroundPosition ||
		inheritedValue?.background?.backgroundPosition;

	/*
	 * An `undefined` value is replaced with any supplied
	 * default control value for the toggle group control.
	 * An empty string is treated as `auto` - this allows a user
	 * to select "Size" and then enter a custom value, with an
	 * empty value being treated as `auto`.
	 */
	const currentValueForToggle =
		( sizeValue !== undefined &&
			sizeValue !== 'cover' &&
			sizeValue !== 'contain' ) ||
		sizeValue === ''
			? 'auto'
			: sizeValue || defaultValues?.backgroundSize;

	/*
	 * If the current value is `cover` and the repeat value is `undefined`, then
	 * the toggle should be unchecked as the default state. Otherwise, the toggle
	 * should reflect the current repeat value.
	 */
	const repeatCheckedValue = ! (
		repeatValue === 'no-repeat' ||
		( currentValueForToggle === 'cover' && repeatValue === undefined )
	);

	const hasValue = hasBackgroundSizeValue( style );

	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			style: {
				...previousValue.style,
				background: {
					...previousValue.style?.background,
					backgroundRepeat: undefined,
					backgroundSize: undefined,
				},
			},
		};
	}, [] );

	const updateBackgroundSize = ( next ) => {
		// When switching to 'contain' toggle the repeat off.
		let nextRepeat = repeatValue;

		if ( next === 'contain' ) {
			nextRepeat = 'no-repeat';
		}

		if ( next === 'cover' ) {
			nextRepeat = undefined;
		}

		if (
			( currentValueForToggle === 'cover' ||
				currentValueForToggle === 'contain' ) &&
			next === 'auto'
		) {
			nextRepeat = undefined;
		}

		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
				backgroundRepeat: nextRepeat,
				backgroundSize: next,
			} )
		);
	};

	const updateBackgroundPosition = ( next ) => {
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundPosition' ],
				coordsToBackgroundPosition( next )
			)
		);
	};

	const toggleIsRepeated = () =>
		onChange(
			setImmutably(
				style,
				[ 'background', 'backgroundRepeat' ],
				repeatCheckedValue === true ? 'no-repeat' : undefined
			)
		);

	const resetBackgroundSize = () =>
		onChange(
			setImmutably( style, [ 'background' ], {
				...style?.background,
				backgroundPosition: undefined,
				backgroundRepeat: undefined,
				backgroundSize: undefined,
			} )
		);

	return (
		<VStack
			as={ ToolsPanelItem }
			spacing={ 2 }
			className="single-column"
			hasValue={ () => hasValue }
			label={ __( 'Size' ) }
			onDeselect={ resetBackgroundSize }
			isShownByDefault={ isShownByDefault }
			resetAllFilter={ resetAllFilter }
			panelId={ panelId }
		>
			<FocalPointPicker
				__next40pxDefaultSize
				label={ __( 'Position' ) }
				url={ imageValue }
				value={ backgroundPositionToCoords( positionValue ) }
				onChange={ updateBackgroundPosition }
			/>
			<ToggleGroupControl
				size={ '__unstable-large' }
				label={ __( 'Size' ) }
				value={ currentValueForToggle }
				onChange={ updateBackgroundSize }
				isBlock
				help={ backgroundSizeHelpText( sizeValue ) }
			>
				<ToggleGroupControlOption
					key={ 'cover' }
					value={ 'cover' }
					label={ __( 'Cover' ) }
				/>
				<ToggleGroupControlOption
					key={ 'contain' }
					value={ 'contain' }
					label={ __( 'Contain' ) }
				/>
				<ToggleGroupControlOption
					key={ 'fixed' }
					value={ 'auto' }
					label={ __( 'Fixed' ) }
				/>
			</ToggleGroupControl>
			{ currentValueForToggle !== undefined &&
			currentValueForToggle !== 'cover' &&
			currentValueForToggle !== 'contain' ? (
				<UnitControl
					size={ '__unstable-large' }
					onChange={ updateBackgroundSize }
					value={ sizeValue }
				/>
			) : null }
			{ currentValueForToggle !== 'cover' && (
				<ToggleControl
					label={ __( 'Repeat' ) }
					checked={ repeatCheckedValue }
					onChange={ toggleIsRepeated }
				/>
			) }
		</VStack>
	);
}

function BackgroundToolsPanel( {
	resetAllFilter,
	onChange,
	value,
	panelId,
	children,
} ) {
	const resetAll = () => {
		const updatedValue = resetAllFilter( value );
		onChange( updatedValue );
	};

	return (
		<VStack
			as={ ToolsPanel }
			spacing={ 6 }
			label={ __( 'Background' ) }
			resetAll={ resetAll }
			panelId={ panelId }
			dropdownMenuProps={ TOOLSPANEL_DROPDOWNMENU_PROPS }
		>
			{ children }
		</VStack>
	);
}

const DEFAULT_CONTROLS = {
	backgroundImage: true,
	backgroundSize: true,
};

export default function BackgroundPanel( {
	as: Wrapper = BackgroundToolsPanel,
	value,
	onChange,
	inheritedValue = value,
	settings,
	panelId,
	defaultControls = DEFAULT_CONTROLS,
	defaultValues = {},
} ) {
	const resetAllFilter = useCallback( ( previousValue ) => {
		return {
			...previousValue,
			background: {},
		};
	}, [] );
	const shouldShowBackgroundSizeControls =
		settings?.background?.backgroundSize;

	return (
		<Wrapper
			resetAllFilter={ resetAllFilter }
			value={ value }
			onChange={ onChange }
			panelId={ panelId }
		>
			<BackgroundImageToolsPanelItem
				onChange={ onChange }
				panelId={ panelId }
				isShownByDefault={ defaultControls.backgroundImage }
				style={ value }
				inheritedValue={ inheritedValue }
			/>
			{ shouldShowBackgroundSizeControls && (
				<BackgroundSizeToolsPanelItem
					onChange={ onChange }
					panelId={ panelId }
					isShownByDefault={ defaultControls.backgroundSize }
					style={ value }
					inheritedValue={ inheritedValue }
					defaultValues={ defaultValues }
				/>
			) }
		</Wrapper>
	);
}
