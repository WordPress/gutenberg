/**
 * WordPress dependencies
 */
import { Button, Modal, Spinner } from '@wordpress/components';
import { desktop, mobile, tablet } from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

const DEVICES = [
	{
		name: 'desktop',
		label: __( 'Desktop' ),
		icon: desktop,
	},
	{
		name: 'tablet',
		label: __( 'Tablet' ),
		icon: tablet,
	},
	{
		name: 'mobile',
		label: __( 'Mobile' ),
		icon: mobile,
	},
];

/**
 * Renders a button that opens the current post preview in a modal.
 *
 * @param {Object}  props                     The component props.
 * @param {string}  props.className           The class name for the button.
 * @param {boolean} props.forceIsAutosaveable Whether to force autosave.
 *
 * @return {React.ReactNode} The rendered button component.
 */
export default function PostPreviewModalButton( {
	className,
	forceIsAutosaveable,
} ) {
	const { currentPostLink, previewLink, isSaveable, isViewable } = useSelect(
		( select ) => {
			const editor = select( editorStore );
			const core = select( coreStore );

			const postType = core.getPostType( editor.getCurrentPostType() );
			const canView = postType?.viewable ?? false;
			if ( ! canView ) {
				return { isViewable: canView };
			}

			return {
				currentPostLink: editor.getCurrentPostAttribute( 'link' ),
				previewLink: editor.getEditedPostPreviewLink(),
				isSaveable: editor.isEditedPostSaveable(),
				isViewable: canView,
			};
		},
		[]
	);
	const { __unstableSaveForPreview } = useDispatch( editorStore );
	const [ isOpen, setIsOpen ] = useState( false );
	const [ isGeneratingPreview, setIsGeneratingPreview ] = useState( false );
	const [ previewUrl, setPreviewUrl ] = useState();
	const [ previewError, setPreviewError ] = useState();
	const [ device, setDevice ] = useState( 'desktop' );

	if ( ! isViewable ) {
		return null;
	}

	const openPreviewModal = async () => {
		setIsOpen( true );
		setIsGeneratingPreview( true );
		setPreviewError();
		setPreviewUrl();

		try {
			const link = await __unstableSaveForPreview( {
				forceIsAutosaveable,
			} );
			setPreviewUrl( link || previewLink || currentPostLink );
		} catch ( error ) {
			setPreviewError( error );
		} finally {
			setIsGeneratingPreview( false );
		}
	};

	const closePreviewModal = () => {
		setIsOpen( false );
	};

	return (
		<>
			<Button
				variant={ ! className ? 'tertiary' : undefined }
				className={ className || 'editor-post-preview' }
				accessibleWhenDisabled
				disabled={ ! isSaveable || isGeneratingPreview }
				onClick={ openPreviewModal }
				size="compact"
			>
				{ _x( 'Preview', 'imperative verb' ) }
				<VisuallyHidden render={ <span /> }>
					{ __( '(opens in a modal)' ) }
				</VisuallyHidden>
			</Button>
			{ isOpen && (
				<Modal
					title={ __( 'Preview' ) }
					onRequestClose={ closePreviewModal }
					isFullScreen
					className="editor-post-preview-modal"
					headerActions={
						<div
							className="editor-post-preview-modal__toolbar"
							role="toolbar"
							aria-label={ __( 'Preview size' ) }
						>
							{ DEVICES.map( ( { name, label, icon } ) => (
								<Button
									key={ name }
									icon={ icon }
									isPressed={ device === name }
									label={ label }
									onClick={ () => setDevice( name ) }
									showTooltip
									size="compact"
								/>
							) ) }
						</div>
					}
				>
					<div className="editor-post-preview-modal__frame-wrapper">
						{ isGeneratingPreview && (
							<div className="editor-post-preview-modal__loading">
								<Spinner />
								<p>{ __( 'Generating preview…' ) }</p>
							</div>
						) }
						{ ! isGeneratingPreview && previewError && (
							<div
								className="editor-post-preview-modal__error"
								role="alert"
							>
								{ __(
									'The preview could not be generated. Please try again.'
								) }
							</div>
						) }
						{ ! isGeneratingPreview && previewUrl && (
							<iframe
								className={ `editor-post-preview-modal__iframe is-${ device }-preview` }
								src={ previewUrl }
								title={ __( 'Post preview' ) }
							/>
						) }
					</div>
				</Modal>
			) }
		</>
	);
}
