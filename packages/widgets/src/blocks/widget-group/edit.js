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
	const { innerBlocks } = useSelect( ( select ) =>
		select( blockEditorStore ).getBlock( clientId )
	);

	let content;
	if ( innerBlocks.length === 0 ) {
		content = <PlaceholderContent { ...props } />;
	} else if ( isSelected ) {
		content = <EditFormContent { ...props } innerBlocks={ innerBlocks } />;
	} else {
		content = <PreviewContent { ...props } innerBlocks={ innerBlocks } />;
	}

	return (
		<div { ...useBlockProps( { className: 'widget' } ) }>{ content }</div>
	);
}

function PlaceholderContent( { clientId } ) {
	return (
		<>
			<Placeholder
				className="wp-block-widget-group__placeholder"
				icon={ <BlockIcon icon={ groupIcon } /> }
				label={ __( 'Widget Group' ) }
			>
				<ButtonBlockAppender rootClientId={ clientId } />
			</Placeholder>
			<InnerBlocks renderAppender={ false } />
		</>
	);
}

function EditFormContent( { attributes, setAttributes, innerBlocks } ) {
	return (
		<div className="wp-block-widget-group__edit-form">
			<h2 className="wp-block-widget-group__edit-form-title">
				{ __( 'Widget Group' ) }
			</h2>
			<TextControl
				label={ __( 'Title' ) }
				placeholder={ getDefaultTitle( innerBlocks ) }
				value={ attributes.title ?? '' }
				onChange={ ( title ) => setAttributes( { title } ) }
			/>
		</div>
	);
}

function PreviewContent( { attributes, innerBlocks } ) {
	return (
		<>
			<h2 className="widget-title">
				{ attributes.title || getDefaultTitle( innerBlocks ) }
			</h2>
			<InnerBlocks />
		</>
	);
}

function getDefaultTitle( innerBlocks ) {
	if ( innerBlocks.length === 0 ) {
		return null;
	}
	return getBlockType( innerBlocks[ 0 ].name ).title;
}
