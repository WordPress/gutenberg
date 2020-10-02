/**
 * WordPress dependencies
 */
import { BlockControls } from '@wordpress/block-editor';
import {
	ToolbarGroup,
	ToolbarButton,
	Modal,
	Button,
} from '@wordpress/components';
import { useEffect, useState, RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ConvertToBlocksButton from './convert-to-blocks-button';

const { wp } = window;

function ClassicEdit( props ) {
	const styles = useSelect(
		( select ) => select( 'core/block-editor' ).getSettings().styles
	);
	useEffect( () => {
		const { baseURL, suffix, settings } = window.wpEditorL10n.tinymce;

		window.tinymce.EditorManager.overrideDefaults( {
			base_url: baseURL,
			suffix,
		} );

		wp.oldEditor.initialize( props.id, {
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
			wp.oldEditor.remove( props.id );
		};
	}, [] );

	return <textarea { ...props } />;
}

export default function Edit( props ) {
	const {
		clientId,
		attributes: { content },
		setAttributes,
		onReplace,
	} = props;
	const [ isOpen, setOpen ] = useState( false );
	const id = `editor-${ clientId }`;
	const label = __( 'Classic Edit' );
	const title = (
		<>
			{ label }
			<div style={ { position: 'absolute', right: '30px', top: '12px' } }>
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
							content: wp.oldEditor.getContent( id ),
						} );
						setOpen( false );
					} }
				>
					{ __( 'Save' ) }
				</Button>
			</div>
		</>
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton onClick={ () => setOpen( true ) }>
						{ label }
					</ToolbarButton>
				</ToolbarGroup>
				<ToolbarGroup>
					<ConvertToBlocksButton clientId={ clientId } />
				</ToolbarGroup>
			</BlockControls>
			{ content && <RawHTML>{ content }</RawHTML> }
			{ ( isOpen || ! content ) && (
				<Modal title={ title } isDismissible={ false }>
					<ClassicEdit id={ id } defaultValue={ content } />
				</Modal>
			) }
		</>
	);
}
