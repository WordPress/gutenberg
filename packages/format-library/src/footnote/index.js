/**
 * External dependencies
 */
import uuid from 'uuid/v4';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import {
	removeFormat,
	isCollapsed,
	insertObject,
	applyFormat,
	getActiveObject,
	remove,
} from '@wordpress/rich-text';
import { Fill, IconButton } from '@wordpress/components';

const name = 'core/footnote';
const title = __( 'Footnote' );

const addFootnote = ( value ) => {
	// It does not matter what this is, as long as it is unique per page.
	const id = uuid();
	const format = {
		type: name,
		attributes: {
			href: `#${ id }`,
			id: `${ id }-anchor`,
			'data-core-footnotes-id': id,
		},
	};

	let newValue;

	if ( isCollapsed( value ) ) {
		const prevStart = value.start;
		newValue = insertObject( value, format );
		newValue.start = prevStart;
	} else {
		newValue = applyFormat( value, format );
	}

	return newValue;
};

const removeFootnote = ( value ) => {
	const activeObject = getActiveObject( value );

	if ( activeObject && activeObject.type === name ) {
		return remove( value );
	}

	return removeFormat( value, name );
};

function Edit( { value, onChange, isActive } ) {
	const blockType = useSelect( ( select ) =>
		select( 'core/blocks' ).getBlockType( 'core/footnotes' )
	);

	// Don't render any UI if the footnotes block is missing.
	if ( ! blockType ) {
		return null;
	}

	const add = () => {
		onChange( addFootnote( value ) );
	};
	const rm = () => {
		onChange( removeFootnote( value ) );
	};

	return (
		<>
			<RichTextToolbarButton
				icon="editor-ol"
				title={ title }
				onClick={ isActive ? rm : add }
				isActive={ isActive }
			/>
			<Fill name="__unstable-footnote-controls">
				<IconButton icon="trash" onClick={ rm }>
					Remove Footnote
				</IconButton>
			</Fill>
		</>
	);
}

export const footnote = {
	name,
	title,
	tagName: 'a',
	className: 'footnote-anchor',
	attributes: {
		href: 'href',
		id: 'id',
	},
	edit: Edit,
};
