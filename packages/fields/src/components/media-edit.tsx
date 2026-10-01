import { privateApis as mediaUtilsPrivateApis } from '@wordpress/media-utils';
import { unlock } from '../lock-unlock';
import type { MediaEditProps } from '../types';

const { MediaEdit: PrivateMediaEdit, MediaEditControl } = unlock(
	mediaUtilsPrivateApis
);

export { MediaEditControl };

/**
 * A media edit control component that provides a media picker UI with upload functionality
 * for selecting WordPress media attachments. Supports both the traditional WordPress media
 * library and the experimental DataViews media modal.
 *
 * This component is intended to be used as the `Edit` property of a field definition when
 * registering fields with `registerEntityField` from `@wordpress/editor`.
 *
 * @template Item - The type of the item being edited.
 *
 * @param {MediaEditProps<Item>} props                       - The component props.
 * @param {Item}                 props.data                  - The item being edited.
 * @param {Object}               props.field                 - The field configuration with getValue and setValue methods.
 * @param {Function}             props.onChange              - Callback function when the media selection changes.
 * @param {string[]}             [props.allowedTypes]        - Array of allowed media types. Use `['*']` to allow all file types. Default `['image']`.
 * @param {boolean}              [props.multiple]            - Whether to allow multiple media selections. Default `false`.
 * @param {boolean}              [props.hideLabelFromVision] - Whether the label should be hidden from vision.
 * @param {boolean}              [props.isExpanded]          - Whether to render in an expanded form. Default `false`.
 *
 * @return {React.JSX.Element} The media edit control component.
 *
 * @example
 * ```tsx
 * import { MediaEdit } from '@wordpress/fields';
 * import type { DataFormControlProps } from '@wordpress/dataviews';
 *
 * const featuredImageField = {
 *   id: 'featured_media',
 *   type: 'media',
 *   label: 'Featured Image',
 *   Edit: (props: DataFormControlProps<MyPostType>) => (
 *     <MediaEdit
 *       {...props}
 *       allowedTypes={['image']}
 *     />
 *   ),
 * };
 * ```
 */
export default function MediaEdit< Item >( props: MediaEditProps< Item > ) {
	return <PrivateMediaEdit { ...props } />;
}
