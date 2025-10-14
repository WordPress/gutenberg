/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	Modal,
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Menu } = unlock( componentsPrivateApis );

interface MediaUploadModalProps {
	/**
	 * Renders the media modal.
	 *
	 * Consumers define a `render` callback prop that generally renders the button that
	 * opens the media library.
	 *
	 * It receives an `open` param, which is a function that opens the modal.
	 *
	 * @param {Object}   props      - The props object.
	 * @param {Function} props.open - The function to open the modal.
	 *
	 * @return {ReactNode} The rendered media modal.
	 */
	render: ( { open }: { open: () => void } ) => ReactNode;

	/**
	 * Array of allowed media types.
	 * @default ['image']
	 */
	allowedTypes?: string[];

	/**
	 * Title for the modal.
	 * @default 'Select Media'
	 */
	title?: string;

	/**
	 * Whether the modal can be closed by clicking outside or pressing escape.
	 * @default true
	 */
	isDismissible?: boolean;

	/**
	 * Additional CSS class for the modal.
	 */
	modalClass?: string;

	/**
	 * Function called when the media type filter changes.
	 * Receives the selected media type string.
	 */
	onMediaTypeChange?: ( mediaType: string ) => void;
}

/**
 * MediaUploadModal component that uses Modal and Menu for media type selection.
 *
 * This is a modern functional component alternative to the legacy MediaUpload class component.
 * It provides a cleaner API and better integration with the WordPress block editor.
 *
 * @param props                   Component props
 * @param props.render            Function that renders the trigger element
 * @param props.allowedTypes      Array of allowed media types
 * @param props.title             Title for the modal
 * @param props.isDismissible     Whether modal can be dismissed
 * @param props.modalClass        Additional CSS class for modal
 * @param props.onMediaTypeChange Function called when media type filter changes
 * @return JSX element
 */
export function MediaUploadModal( {
	render,
	allowedTypes = [ 'image' ],
	title = __( 'Select Media' ),
	isDismissible = true,
	modalClass,
	onMediaTypeChange,
}: MediaUploadModalProps ): ReactNode {
	const [ isOpen, setIsOpen ] = useState( false );

	// State for currently selected media type filter
	const [ selectedMediaType, setSelectedMediaType ] =
		useState< string >( 'all' );

	const handleModalClose = useCallback( () => {
		setIsOpen( false );
	}, [] );

	// Create media type options based on allowedTypes
	const mediaTypeOptions: Array< { value: string; label: string } > = [
		{ value: 'all', label: __( 'All Media' ) },
		...allowedTypes.map( ( type ) => {
			const labels: Record< string, string > = {
				image: __( 'Images' ),
				video: __( 'Videos' ),
				audio: __( 'Audio' ),
				application: __( 'Documents' ),
			};
			return {
				value: type,
				label:
					labels[ type ] ||
					type.charAt( 0 ).toUpperCase() + type.slice( 1 ),
			};
		} ),
	];

	const handleMediaTypeChange = useCallback(
		( mediaType: string ) => {
			setSelectedMediaType( mediaType );
			onMediaTypeChange?.( mediaType );
		},
		[ onMediaTypeChange ]
	);

	const getCurrentMediaTypeLabel = (): string => {
		const option = mediaTypeOptions.find(
			( opt ) => opt.value === selectedMediaType
		);
		return option?.label || __( 'All Media' );
	};

	return (
		<>
			{ render( { open: () => setIsOpen( true ) } ) }
			{ isOpen && (
				<Modal
					title={ title }
					onRequestClose={ handleModalClose }
					isDismissible={ isDismissible }
					className={ modalClass }
					size="fill"
				>
					<div style={ { marginBottom: '16px' } }>
						<Menu>
							<Menu.TriggerButton
								render={
									<Button
										variant="tertiary"
										__next40pxDefaultSize
									/>
								}
							>
								{ getCurrentMediaTypeLabel() }
							</Menu.TriggerButton>
							<Menu.Popover placement="bottom-start">
								{ mediaTypeOptions.map( ( option ) => (
									<Menu.Item
										key={ option.value }
										onClick={ () =>
											handleMediaTypeChange(
												option.value
											)
										}
									>
										<Menu.ItemLabel>
											{ option.label }
										</Menu.ItemLabel>
									</Menu.Item>
								) ) }
							</Menu.Popover>
						</Menu>
					</div>
					<p>I am modalll</p>
				</Modal>
			) }
		</>
	);
}

export default MediaUploadModal;
