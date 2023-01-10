/**
 * WordPress dependencies
 */
import { BlockControls, store } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Modal,
	Button,
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
	const label = __( 'Classic Edit' );

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
				<Modal title={ label } __experimentalHideHeader={ true }>
					<h2
						style={ {
							display: 'flex',
							justifyContent: 'space-between',
						} }
					>
						<div>{ label }</div>
						<div>
							<Button
								onClick={ () =>
									content ? setOpen( false ) : onReplace( [] )
								}
							>
								{ __( 'Cancel' ) }
							</Button>
							<Button
								isPrimary
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
						</div>
					</h2>
					<ClassicEdit id={ id } defaultValue={ content } />
				</Modal>
			) }
		</>
	);
}
