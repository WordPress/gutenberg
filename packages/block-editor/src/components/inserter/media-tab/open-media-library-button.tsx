import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import UntypedMediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';

// `media-upload` exports a placeholder behind `withFilters`, so its real
// props arrive from whatever replaces it and TypeScript infers none.
// TODO: drop this once the component declares its own props.
const MediaUpload = UntypedMediaUpload as unknown as React.ComponentType< {
	multiple?: boolean | string;
	onSelect?: ( media: unknown ) => void;
	allowedTypes?: string[];
	render: ( props: { open: () => void } ) => React.ReactElement;
} >;

const ALLOWED_MEDIA_TYPES = [ 'image', 'video', 'audio' ];

/**
 * Opens the Media Library to pick a single item to insert. Shown in the tab's
 * footer for every source except the one that owns the post's attachments,
 * which offers its own attach button in the same place.
 */
export default function OpenMediaLibraryButton( {
	onSelect,
}: {
	/**
	 * Called with the selected media item.
	 */
	onSelect: ( media: unknown ) => void;
} ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple={ false }
				onSelect={ onSelect }
				allowedTypes={ ALLOWED_MEDIA_TYPES }
				render={ ( { open }: { open: () => void } ) => (
					<Button
						__next40pxDefaultSize
						className="block-editor-inserter__media-library-button"
						data-unstable-ignore-focus-outside-for-relatedtarget=".media-modal"
						onClick={ (
							event: React.MouseEvent< HTMLElement >
						) => {
							// Safari doesn't emit a focus event on button elements when
							// clicked and we need to manually focus the button here.
							// The reason is that core's Media Library modal explicitly triggers a
							// focus event and therefore a `blur` event is triggered on a different
							// element, which doesn't contain the `data-unstable-ignore-focus-outside-for-relatedtarget`
							// attribute making the Inserter dialog to close.
							( event.target as HTMLElement ).focus();
							open();
						} }
						variant="secondary"
					>
						{ __( 'Open Media Library' ) }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
