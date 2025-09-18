/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import {
	useBlockProps,
	store as blockEditorStore,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import TermsQueryInspectorControls from './inspector-controls';

const TEMPLATE = [ [ 'core/term-template' ] ];

export default function TermsQueryContent( {
	attributes,
	setAttributes,
	clientId,
	name,
} ) {
	const {
		termQueryId,
		termQuery = {},
		tagName: TagName = 'div',
	} = attributes;

	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );
	const instanceId = useInstanceId( TermsQueryContent );
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );

	const setQuery = ( newQuery ) => {
		setAttributes( {
			termQuery: {
				...termQuery,
				...newQuery,
			},
		} );
	};

	useEffect( () => {
		if ( ! termQueryId ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { termQueryId: instanceId } );
		}
	}, [
		termQueryId,
		instanceId,
		setAttributes,
		__unstableMarkNextChangeAsNotPersistent,
	] );

	return (
		<>
			<TermsQueryInspectorControls
				name={ name }
				attributes={ attributes }
				setQuery={ setQuery }
				setAttributes={ setAttributes }
				clientId={ clientId }
				tagName={ TagName }
			/>
			<TagName { ...innerBlocksProps } />
		</>
	);
}
