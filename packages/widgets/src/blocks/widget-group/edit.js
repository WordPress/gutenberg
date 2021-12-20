/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	BlockIcon,
	ButtonBlockAppender,
	InnerBlocks,
	store as blockEditorStore,
	RichText,
} from '@wordpress/block-editor';
import { Placeholder } from '@wordpress/components';
import { group as groupIcon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';

export default function Edit( props ) {
	const { clientId } = props;
	const { innerBlocks } = useSelect(
		( select ) => select( blockEditorStore ).getBlock( clientId ),
		[ clientId ]
	);

	return (
		<div { ...useBlockProps( { className: 'widget' } ) }>
			{ innerBlocks.length === 0 ? (
				<PlaceholderContent { ...props } />
			) : (
				<PreviewContent { ...props } />
			) }
		</div>
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

function PreviewContent( { attributes, setAttributes } ) {
	return (
		<>
			<RichText
				tagName="h2"
				className="widget-title"
				allowedFormats={ [] }
				placeholder={ __( 'Title' ) }
				value={ attributes.title ?? '' }
				onChange={ ( title ) => setAttributes( { title } ) }
			/>
			<InnerBlocks />
		</>
	);
}
