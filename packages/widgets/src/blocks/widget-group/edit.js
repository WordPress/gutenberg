/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	BlockIcon,
	ButtonBlockAppender,
	InnerBlocks,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Placeholder, TextControl } from '@wordpress/components';
import { group as groupIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

export default function Edit( props ) {
	const { clientId, isSelected } = props;
	const { getBlock } = useSelect( blockEditorStore );
	const { innerBlocks } = getBlock( clientId );

	if ( innerBlocks.length === 0 ) {
		return <SetUp { ...props } />;
	} else if ( isSelected ) {
		return <EditTitle { ...props } />;
	}
	return <Preview { ...props } />;
}

function SetUp( { attributes, setAttributes, clientId } ) {
	return (
		<div { ...useBlockProps() }>
			<Placeholder
				icon={ <BlockIcon icon={ groupIcon } /> }
				label={ __( 'Widget Group' ) }
			>
				<TextControl
					label={ __( 'Title' ) }
					value={ attributes.title }
					onChange={ ( title ) => setAttributes( { title } ) }
				/>
				<ButtonBlockAppender rootClientId={ clientId } />
			</Placeholder>
			<InnerBlocks renderAppender={ false } />
		</div>
	);
}

function EditTitle( { attributes, setAttributes } ) {
	return (
		<div { ...useBlockProps() }>
			<h3>{ __( 'Widget Group' ) }</h3>
			<TextControl
				label={ __( 'Title' ) }
				value={ attributes.title }
				onChange={ ( title ) => setAttributes( { title } ) }
			/>
		</div>
	);
}

function Preview( { attributes } ) {
	return (
		<div { ...useBlockProps() }>
			<h2>{ attributes.title }</h2>
			<InnerBlocks />
		</div>
	);
}
