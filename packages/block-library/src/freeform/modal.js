/**
 * WordPress dependencies
 */
import { BlockControls, store } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Modal,
	Button,
	Flex,
	FlexItem,
} from '@wordpress/components';
import { useEffect, useState, RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

function ClassicEdit( props ) {
	const styles = useSelect(
		( select ) => select( store ).getSettings().styles
	);
	useEffect( () => {
		const { baseURL, suffix, settings } = window.wpEditorL10n.tinymce;

		window.tinymce.EditorManager.overrideDefaults( {
			base_url: baseURL,
			suffix,
		} );

		window.wp.oldEditor.initialize( props.id, {
			tinymce: {
				...settings,
				setup( editor ) {
					editor.on( 'init', () => {
						const doc = editor.getDoc();
						styles.forEach( ( { css } ) => {
							const styleEl = doc.createElement( 'style' );
							styleEl.innerHTML = css;
							doc.head.appendChild( styleEl );
						} );
					} );
				},
			},
		} );

		return () => {
			window.wp.oldEditor.remove( props.id );
		};
	}, [] );

	return <textarea { ...props } />;
}

export default function ModalEdit( props ) {
	const {
		clientId,
		attributes: { content },
		setAttributes,
		onReplace,
	} = props;
	const [ isOpen, setOpen ] = useState( false );
	const id = `editor-${ clientId }`;

	const onClose = () => ( content ? setOpen( false ) : onReplace( [] ) );

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => setOpen( true ) }>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ content && <RawHTML>{ content }</RawHTML> }
			{ ( isOpen || ! content ) && (
				<Modal
					title={ __( 'Classic Editor' ) }
					onRequestClose={ onClose }
					shouldCloseOnClickOutside={ false }
					overlayClassName="block-editor-freeform-modal"
				>
					<ClassicEdit id={ id } defaultValue={ content } />
					<Flex
						className="block-editor-freeform-modal__actions"
						justify="flex-end"
						expanded={ false }
					>
						<FlexItem>
							<Button variant="tertiary" onClick={ onClose }>
								{ __( 'Cancel' ) }
							</Button>
						</FlexItem>
						<FlexItem>
							<Button
								variant="primary"
								onClick={ () => {
									setAttributes( {
										content:
											window.wp.oldEditor.getContent(
												id
											),
									} );
									setOpen( false );
								} }
							>
								{ __( 'Save' ) }
							</Button>
						</FlexItem>
					</Flex>
				</Modal>
			) }
		</>
	);
}
