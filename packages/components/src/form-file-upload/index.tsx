/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Button from '../button';
import type { WordPressComponentProps } from '../context';
import type { FormFileUploadProps } from './types';

/**
 * FormFileUpload allows users to select files from their local device.
 *
 * ```jsx
 * import { FormFileUpload } from '@wordpress/components';
 *
 * const MyFormFileUpload = () => (
 *   <FormFileUpload
 *     accept="image/*"
 *     onChange={ ( event ) => console.log( event.currentTarget.files ) }
 *   >
 *     Upload
 *   </FormFileUpload>
 * );
 * ```
 */
export function FormFileUpload( {
	accept,
	children,
	multiple = false,
	onChange,
	onClick,
	render,
	__next40pxDefaultSize: _next40pxDefaultSize,
	...props
}: WordPressComponentProps< FormFileUploadProps, 'button', false > ) {
	const ref = useRef< HTMLInputElement >( null );
	const openFileDialog = () => {
		ref.current?.click();
	};

	const ui = render ? (
		render( { openFileDialog } )
	) : (
		<Button onClick={ openFileDialog } __next40pxDefaultSize { ...props }>
			{ children }
		</Button>
	);

	// iOS browsers may not reliably handle 'audio/*' in the accept attribute.
	// Adding explicit audio MIME types improves compatibility across all devices.
	const compatAccept = accept?.includes( 'audio/*' )
		? `${ accept }, audio/mp3, audio/x-m4a, audio/x-m4b, audio/x-m4p, audio/x-wav, audio/webm`
		: accept;

	return (
		<div className="components-form-file-upload">
			{ ui }
			<input
				type="file"
				ref={ ref }
				multiple={ multiple }
				style={ { display: 'none' } }
				accept={ compatAccept }
				onChange={ onChange }
				onClick={ onClick }
				data-testid="form-file-upload-input"
			/>
		</div>
	);
}

export default FormFileUpload;
