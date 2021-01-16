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

const name = 'core/note';
const title = __( 'Footnote' );

function getFormatInstances( value, type ) {
	return value.formats.reduce( ( accumulator, formatsList ) => {
		formatsList.forEach( ( format ) => {
			if ( format.type === type ) {
				accumulator.add( format );
			}
		} );

		return accumulator;
	}, new Set() );
}

// function getReplacementInstances( value, type ) {
// 	return value.replacements.reduce( ( accumulator, replacement ) => {
// 		if ( replacement.type === type ) {
// 			accumulator.add( replacement );
// 		}

// 		return accumulator;
// 	}, new Set() );
// }

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
	const add = () => {
		onChange( addFootnote( value ) );
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
	const instances = getFormatInstances( value, name );

	// console.log( instances );

	if ( ! instances.size ) {
		return null;
	}

	// console.log( instances );

	return [ ...instances ].map( ( instance ) => {
		const rm = () => {
			onChange( removeFormat( value, instance ) );
		};

		const update = ( event ) => {
			const text = event.target.value;
			const { formats } = value;
			const newFormats = formats.slice();

			newFormats.forEach( ( f, i ) => {
				newFormats[ i ] = newFormats[ i ].map( ( format ) => {
					if ( format === instance ) {
						return {
							...instance,
							attributes: {
								...instance.attributes,
								'data-text': text,
							},
						};
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

		return (
			<Fill
				key={ instance.attributes.id }
				name="__unstable-footnote-controls"
			>
				<li data-active={ isActive }>
					<textarea
						value={ instance.attributes[ 'data-text' ] }
						onChange={ update }
					/>
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
		id: 'id',
		'data-text': 'data-text',
	},
	edit: Edit,
	alwaysEdit: AlwaysEdit,
};
