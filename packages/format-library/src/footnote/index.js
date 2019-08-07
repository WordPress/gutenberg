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
} from '@wordpress/rich-text';

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
	const remove = () => {
		onChange( removeFormat( value, name ) );
	};

	return (
		<RichTextToolbarButton
			icon="editor-ol"
			title={ title }
			onClick={ isActive ? remove : add }
			isActive={ isActive }
		/>
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
