/**
 * External dependencies
 */
import type { ComponentProps, InputHTMLAttributes, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import type Icon from '../icon';

// TODO: Replace `children` and `icon` types with props from Button once Button is typed.
export type FormFileUploadProps = {
	/**
	 * A string passed to `input` element that tells the browser which file types can be
	 * upload to the upload by the user use. e.g: `image/*,video/*`.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#Unique_file_type_specifiers.
	 */
	accept?: InputHTMLAttributes< HTMLInputElement >[ 'accept' ];
	/**
	 * Children are passed as children of `Button`.
	 */
	children?: ReactNode;
	/**
	 * The icon to render in the `Button`.
	 */
	icon?: ComponentProps< typeof Icon >[ 'icon' ];
	/**
	 * Whether to allow multiple selection of files or not.
	 */
	multiple?: InputHTMLAttributes< HTMLInputElement >[ 'multiple' ];
	/**
	 * Callback function passed directly to the `input` file element.
	 *
	 * Select files will be available in `event.currentTarget.files`.
	 */
	onChange: InputHTMLAttributes< HTMLInputElement >[ 'onChange' ];
	/**
	 * Callback function passed directly to the `input` file element.
	 *
	 * This can be useful when you want to force a `change` event to fire when
	 * the user chooses the same file again. To do this, set the target value to
	 * an empty string in the `onClick` function.
	 *
	 * ```jsx
	 * <FormFileUpload
	 * 	onClick={ ( event ) => ( event.target.value = '' ) }
	 * 	onChange={ onChange }
	 * >
	 * 	Upload
	 * </FormFileUpload>
	 * ```
	 */
	onClick?: InputHTMLAttributes< HTMLInputElement >[ 'onClick' ];
	/**
	 * Optional callback function used to render the UI.
	 *
	 * If passed, the component does not render the default UI (a button) and
	 * calls this function to render it. The function receives an object with
	 * property `openFileDialog`, a function that, when called, opens the browser
	 * native file upload modal window.
	 */
	render?: ( arg: { openFileDialog: () => void } ) => ReactNode;
};
