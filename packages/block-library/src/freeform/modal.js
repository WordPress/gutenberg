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
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { useEffect, useState, RawHTML } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';

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
				height: 500,
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
	const label = _x( 'Classic Edit', 'Classic block' );
	const instanceId = useInstanceId(
		ModalEdit,
		'wp-block-freeform-modal-header'
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => setOpen( true ) }>
						{ label }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ content && <RawHTML>{ content }</RawHTML> }
			{ ( isOpen || ! content ) && (
				<Modal
					__experimentalHideHeader={ true }
					aria={ { labelledby: instanceId } }
				>
					<Flex
						justify="space-between"
						expanded={ true }
						style={ { marginBottom: 8 } }
					>
						<FlexItem>
							<Heading level={ 1 } size="16" id={ instanceId }>
								{ label }
							</Heading>
						</FlexItem>
						<Flex justify="flex-end" expanded={ false }>
							<FlexItem>
								<Button
									onClick={ () =>
										content
											? setOpen( false )
											: onReplace( [] )
									}
								>
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
					</Flex>
					<ClassicEdit id={ id } defaultValue={ content } />
				</Modal>
			) }
		</>
	);
}
