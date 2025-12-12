/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	privateApis as mediaUtilsPrivateApis,
	MediaUpload,
} from '@wordpress/media-utils';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { MediaEditProps } from '../../types';

const { MediaUploadModal } = unlock( mediaUtilsPrivateApis );

/**
 * Conditional Media component that uses MediaUploadModal when experiment is enabled,
 * otherwise falls back to media-utils MediaUpload.
 *
 * @param {Object}   root0        Component props.
 * @param {Function} root0.render Render prop function that receives { open } object.
 * @param {Object}   root0.props  Other props passed to the media upload component.
 * @return {JSX.Element} The component.
 */
function ConditionalMediaUpload( { render, ...props }: any ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	if ( ( window as any ).__experimentalDataViewsMediaModal ) {
		return (
			<>
				{ render && render( { open: () => setIsModalOpen( true ) } ) }
				<MediaUploadModal
					{ ...props }
					isOpen={ isModalOpen }
					onClose={ () => {
						setIsModalOpen( false );
						props.onClose?.();
					} }
					onSelect={ ( media: any ) => {
						setIsModalOpen( false );
						props.onSelect?.( media );
					} }
				/>
			</>
		);
	}

	// Fallback to media-utils MediaUpload when experiment is disabled
	return <MediaUpload { ...props } render={ render } />;
}

/**
 * A reusable media edit control component that can be used to edit WordPress media (attachments).
 * Renders a media picker with upload functionality, supporting both the traditional WordPress
 * media library and the experimental DataViews media modal.
 *
 * @template Item - The type of the item being edited.
 *
 * @param {MediaEditProps<Item>} props                             - The component props.
 * @param {Item}                 props.data                        - The item being edited.
 * @param {Object}               props.field                       - The field configuration with getValue and setValue methods.
 * @param {Function}             props.onChange                    - Callback function when the media selection changes.
 * @param {string[]}             [props.allowedTypes=['image']]    - Array of allowed media types.
 * @param {string}               [props.placeholder='Choose file'] - Placeholder text when no media is selected.
 * @param {string}               [props.help]                      - Help text.
 *
 * @return {JSX.Element} The media edit control component.
 *
 * @example
 * ```tsx
 * import MediaEdit from '@wordpress/fields';
 * import type { MediaEditProps } from '@wordpress/fields';
 *
 * const featuredImageField = {
 *   id: 'featured_media',
 *   type: 'media',
 *   label: 'Featured Image',
 *   Edit: (props: MediaEditProps<MyPostType>) => (
 *     <MediaEdit
 *       {...props}
 *       allowedTypes={['image']}
 *       placeholder="Choose featured image…"
 *       help="Upload an image to represent this post"
 *     />
 *   ),
 * };
 * ```
 */
export default function MediaEdit< Item >( {
	data,
	field,
	onChange,
	allowedTypes = [ 'image' ],
	placeholder = __( 'Choose file' ),
	help,
}: MediaEditProps< Item > ) {
	const value = field.getValue( { item: data } );

	const attachment = useSelect(
		( select ) => {
			if ( ! value ) {
				return null;
			}
			const { getEntityRecord } = select( coreStore );
			return getEntityRecord( 'postType', 'attachment', value );
		},
		[ value ]
	);

	const onChangeControl = useCallback(
		( newValue: number ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);

	const url = attachment?.source_url;
	const attachmentTitle = attachment?.title?.rendered;
	const ref = useRef( null );

	return (
		<fieldset className="fields-controls__media">
			<ConditionalMediaUpload
				onSelect={ ( selectedMedia: any ) => {
					onChangeControl( selectedMedia.id );
				} }
				allowedTypes={ allowedTypes }
				value={ value }
				title={ field.label }
				render={ ( { open }: any ) => (
					<VStack>
						<HStack spacing={ 2 } justify="space-between">
							<HStack
								spacing={ 3 }
								justify="flex-start"
								alignment="center"
								className="fields-controls__media-picker-button-container"
								ref={ ref }
								role="button"
								tabIndex={ -1 }
								onClick={ open }
								onKeyDown={ ( event ) => {
									if (
										event.key === 'Enter' ||
										event.key === ' '
									) {
										event.preventDefault();
										open();
									}
								} }
							>
								{ url && (
									<>
										<img
											className="fields-controls__media-image"
											alt=""
											src={ url }
										/>
										<span className="fields-controls__media-title">
											{ attachmentTitle }
										</span>
									</>
								) }
								{ ! url && (
									<span className="fields-controls__media-placeholder">
										{ placeholder }
									</span>
								) }
							</HStack>
							{ url && (
								<>
									<Button
										__next40pxDefaultSize
										className="fields-controls__media-remove-button"
										text={ __( 'Remove' ) }
										variant="secondary"
										onClick={ (
											event: React.MouseEvent< HTMLButtonElement >
										) => {
											event.stopPropagation();
											onChangeControl( 0 );
										} }
									/>
								</>
							) }
						</HStack>
						{ help && (
							<Text className="fields-controls__media-help-text">
								{ help }
							</Text>
						) }
					</VStack>
				) }
			/>
		</fieldset>
	);
}
