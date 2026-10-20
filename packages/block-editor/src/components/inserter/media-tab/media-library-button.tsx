import { Button } from '@wordpress/components';
import UntypedMediaUpload from '../../media-upload';
import MediaUploadCheck from '../../media-upload/check';

// `media-upload` exports a placeholder behind `withFilters`, so its real
// props arrive from whatever replaces it and TypeScript infers none.
// TODO: drop this once the component declares its own props.
const MediaUpload = UntypedMediaUpload as unknown as React.ComponentType< {
	multiple?: boolean | string;
	onSelect?: ( media: unknown ) => void;
	allowedTypes?: string[];
	title?: string;
	render: ( props: { open: () => void } ) => React.ReactElement;
} >;

/**
 * The Media tab's footer action: a button that opens the Media Library.
 *
 * Both uses open the same modal and differ only in what they do with the
 * selection — inserting one item, or attaching several to the post — so they
 * share this button rather than each wrapping `MediaUpload` themselves.
 */
export default function MediaLibraryButton( {
	label,
	onSelect,
	multiple = false,
	allowedTypes,
	title,
}: {
	/**
	 * The button's text.
	 */
	label: string;
	onSelect: ( media: unknown ) => void;
	multiple?: boolean | string;
	allowedTypes?: string[];
	/**
	 * The modal's title, where the default ("Select or Upload Media") does not
	 * describe what the selection is for.
	 */
	title?: string;
} ) {
	return (
		<MediaUploadCheck>
			<MediaUpload
				multiple={ multiple }
				onSelect={ onSelect }
				allowedTypes={ allowedTypes }
				title={ title }
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
						{ label }
					</Button>
				) }
			/>
		</MediaUploadCheck>
	);
}
