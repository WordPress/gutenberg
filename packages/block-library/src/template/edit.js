/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	useInnerBlocksProps,
	useBlockEditingMode,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useEntityBlockEditor } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

export default function TemplateEdit( { clientId, attributes: { ref } } ) {
	useBlockEditingMode( 'default' );

	const innerBlockClientIds = useSelect( ( select ) =>
		select( blockEditorStore ).getBlockOrder( clientId )
	);
	const { setBlockEditingMode, unsetBlockEditingMode } =
		useDispatch( blockEditorStore );
	useEffect( () => {
		innerBlockClientIds.forEach( ( id ) => {
			setBlockEditingMode( id, 'disabled' );
		} );
		return () => innerBlockClientIds.forEach( unsetBlockEditingMode );
	}, [
		clientId,
		innerBlockClientIds,
		setBlockEditingMode,
		unsetBlockEditingMode,
	] );

	const blockProps = useBlockProps();
	const [ value, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		'wp_template',
		{ id: ref }
	);
	const innerBlockProps = useInnerBlocksProps( blockProps, {
		value,
		onInput,
		onChange,
		allowedBlocks: [], // Prevent appender from showing.
	} );

	return <div { ...blockProps } { ...innerBlockProps } />;
}
