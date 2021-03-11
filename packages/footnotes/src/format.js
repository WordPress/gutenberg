/**
 * External dependencies
 */
import { v4 as uuid } from 'uuid';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	removeFormat,
	isCollapsed,
	insertObject,
	applyFormat,
	getActiveObject,
	remove,
	normaliseFormats,
} from '@wordpress/rich-text';
import { Fill, IconButton } from '@wordpress/components';
import { formatListNumbered } from '@wordpress/icons';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { slotName, SlotRemount } from './';

const name = 'core/footnote';
const title = __( 'Footnote' );

function getInstances( value, type ) {
	const instances = [];
	const unique = [];

	value.formats.forEach( ( formatsList, index ) => {
		formatsList.forEach( ( format ) => {
			if ( format.type === type ) {
				instances[ index ] = format;
			}
		} );
	} );

	value.replacements.forEach( ( replacement, index ) => {
		if ( replacement.type === type ) {
			instances[ index ] = replacement;
		}
	} );

	instances.forEach( ( instance ) => {
		if ( unique.indexOf( instance ) === -1 ) {
			unique.push( instance );
		}
	} );

	return unique;
}

function addFootnote( value ) {
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
}

function removeFootnote( value ) {
	const activeObject = getActiveObject( value );

	if ( activeObject && activeObject.type === name ) {
		return remove( value );
	}

	return removeFormat( value, name );
}

function Edit( { value, onChange, isActive } ) {
	const remountSlot = useContext( SlotRemount );
	const add = () => {
		onChange( addFootnote( value ) );
		remountSlot();
	};
	const rm = () => {
		onChange( removeFootnote( value ) );
	};

	return (
		<RichTextToolbarButton
			icon={ formatListNumbered }
			title={ title }
			onClick={ isActive ? rm : add }
			isActive={ isActive }
		/>
	);
}

function AlwaysEdit( { value, onChange, isActive } ) {
	return getInstances( value, name ).map( ( instance ) => {
		const rm = () => {
			const replacementIndex = value.replacements.indexOf( instance );
			if ( replacementIndex !== -1 ) {
				onChange(
					remove( value, replacementIndex, replacementIndex + 1 )
				);
			} else {
				onChange( removeFormat( value, instance ) );
			}
		};

		const update = ( event ) => {
			const text = event.target.value;
			const { formats, replacements } = value;
			const replacementIndex = replacements.indexOf( instance );
			const newInstance = {
				...instance,
				attributes: {
					...instance.attributes,
					text,
				},
			};

			if ( replacementIndex !== -1 ) {
				const newReplacements = replacements.slice();
				newReplacements[ replacementIndex ] = newInstance;
				return onChange( {
					...value,
					replacements: newReplacements,
				} );
			}

			const newFormats = formats.slice();

			newFormats.forEach( ( f, i ) => {
				newFormats[ i ] = newFormats[ i ].map( ( format ) => {
					if ( format === instance ) {
						return newInstance;
					}

					return format;
				} );
			} );

			return onChange(
				normaliseFormats( {
					...value,
					formats: newFormats,
				} )
			);
		};

		const { id, text } = instance.attributes;

		function onClick( { target } ) {
			const { ownerDocument } = target;
			// This is a hack to get the target to focus.
			// The attribute will later be removed when selection is set.
			ownerDocument.getElementById( `${ id }-anchor` ).contentEditable =
				'false';
		}

		return (
			<Fill key={ id } name={ slotName }>
				<li data-active={ isActive }>
					<a
						id={ id }
						href={ `#${ id }-anchor` }
						aria-label={ __( 'Back to content' ) }
						onClick={ onClick }
					>
						↑
					</a>
					<textarea value={ text } onChange={ update } />
					<IconButton icon="trash" onClick={ rm }>
						{ __( 'Remove Footnote' ) }
					</IconButton>
				</li>
			</Fill>
		);
	} );
}

export default {
	name,
	title,
	tagName: 'a',
	className: 'note-anchor',
	attributes: {
		href: 'href',
		id: 'data-core-footnotes-id',
		text: 'data-text',
	},
	edit: Edit,
	alwaysEdit: AlwaysEdit,
};
