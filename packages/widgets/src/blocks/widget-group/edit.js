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
import { getBlockType } from '@wordpress/blocks';

export default function Edit( props ) {
	const { clientId, isSelected } = props;
	const { getBlock } = useSelect( blockEditorStore );
	const { innerBlocks } = getBlock( clientId );

	if ( innerBlocks.length === 0 ) {
		return <SetUp { ...props } />;
	} else if ( isSelected ) {
		return <EditTitle { ...props } innerBlocks={ innerBlocks } />;
	}
	return <Preview { ...props } innerBlocks={ innerBlocks } />;
}

function SetUp( { clientId } ) {
	return (
		<div { ...useBlockProps() }>
			<Placeholder
				icon={ <BlockIcon icon={ groupIcon } /> }
				label={ __( 'Widget Group' ) }
			>
				<ButtonBlockAppender rootClientId={ clientId } />
			</Placeholder>
			<InnerBlocks renderAppender={ false } />
		</div>
	);
}

function EditTitle( { attributes, setAttributes, innerBlocks } ) {
	const defaultTitle = getDefaultTitle( innerBlocks );
	return (
		<div { ...useBlockProps() }>
			<h3>{ attributes.title || defaultTitle }</h3>
			<TextControl
				label={ __( 'Title' ) }
				placeholder={ defaultTitle }
				value={ attributes.title }
				onChange={ ( title ) => setAttributes( { title } ) }
			/>
		</div>
	);
}

function Preview( { attributes, innerBlocks } ) {
	return (
		<div { ...useBlockProps() }>
			<h3>{ attributes.title || getDefaultTitle( innerBlocks ) }</h3>
			<InnerBlocks />
		</div>
	);
}

function getDefaultTitle( innerBlocks ) {
	if ( innerBlocks.length === 0 ) {
		return null;
	}
	return getBlockType( innerBlocks[ 0 ].name ).title;
}
