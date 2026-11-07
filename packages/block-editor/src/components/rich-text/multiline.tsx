import { forwardRef, useInsertionEffect, useRef } from '@wordpress/element';
import deprecated from '@wordpress/deprecated';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
import { ENTER } from '@wordpress/keycodes';
import {
	create,
	split,
	toHTMLString,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { useRefEffect } from '@wordpress/compose';
import type { ForwardedRef, RefObject } from 'react';
import { RichTextWrapper } from './';
import { store as blockEditorStore } from '../../store';
import { useBlockEditContext } from '../block-edit';
import { getMultilineTag } from './utils';
import { unlock } from '../../lock-unlock';
import type {
	RichTextMultilineLineProps,
	RichTextMultilineLineState,
	RichTextMultilineProps,
} from './types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

function useEnterRef(
	props: RefObject< RichTextMultilineLineState | undefined >
) {
	const registry = useRegistry();
	const { getSelectionStart, getSelectionEnd } =
		useSelect( blockEditorStore );
	const { selectionChange } = useDispatch( blockEditorStore );
	return useRefEffect( ( element ) => {
		function onKeyDown( event: KeyboardEvent ) {
			if ( event.keyCode !== ENTER ) {
				return;
			}

			event.preventDefault();

			// Set before any event.
			const { value, values, onChange, index, identifier, clientId } =
				props.current!;
			const { offset: start } = getSelectionStart();
			const { offset: end } = getSelectionEnd();

			// Cannot split if there is no selection.
			if ( typeof start !== 'number' || typeof end !== 'number' ) {
				return;
			}

			const richTextValue = create( { html: value } );
			richTextValue.start = start;
			richTextValue.end = end;

			// Splitting at a selection returns both parts.
			const array = split( richTextValue )!.map( ( v ) =>
				toHTMLString( { value: v } )
			);

			const newValues = values.slice();
			newValues.splice( index, 1, ...array );
			registry.batch( () => {
				onChange( newValues );
				selectionChange(
					// Multiline fields are in blocks.
					clientId!,
					`${ identifier }-${ index + 1 }`,
					0,
					0
				);
			} );
		}
		// Capture phase so this runs before the generic rich text enter
		// listener, which skips events that already had their default
		// prevented.
		return subscribeOwnedListener( element, 'keydown', onKeyDown, true );
	}, [] );
}

function Line( lineProps: RichTextMultilineLineProps ) {
	const {
		value,
		values,
		onChange,
		index,
		identifier,
		multilineTagName,
		...props
	} = lineProps;
	const { clientId } = useBlockEditContext();
	const { selectionChange } = useDispatch( blockEditorStore );
	const latestRef = useRef< RichTextMultilineLineState >( undefined );
	useInsertionEffect( () => {
		latestRef.current = { ...lineProps, clientId };
	} );
	const ref = useEnterRef( latestRef );
	return (
		<RichTextWrapper
			key={ index }
			identifier={ `${ identifier }-${ index }` }
			tagName={ multilineTagName }
			value={ value }
			onChange={ ( newValue ) => {
				const newValues = values.slice();
				// A string value changes to a string.
				newValues[ index ] = newValue as string;
				onChange( newValues );
			} }
			isSelected={ undefined }
			ref={ ref }
			onMerge={ ( forward: boolean ) => {
				const newValues = values.slice();
				let offset = 0;
				if ( forward ) {
					if ( ! newValues[ index + 1 ] ) {
						return;
					}
					newValues.splice(
						index,
						2,
						newValues[ index ] + newValues[ index + 1 ]
					);
					offset = newValues[ index ].length - 1;
				} else {
					if ( ! newValues[ index - 1 ] ) {
						return;
					}
					newValues.splice(
						index - 1,
						2,
						newValues[ index - 1 ] + newValues[ index ]
					);
					offset = newValues[ index - 1 ].length - 1;
				}
				onChange( newValues );
				selectionChange(
					// Multiline fields are in blocks.
					clientId!,
					`${ identifier }-${ index - ( forward ? 0 : 1 ) }`,
					offset,
					offset
				);
			} }
			{ ...props }
		/>
	);
}

function RichTextMultiline(
	{
		children,
		identifier,
		tagName: TagName = 'div',
		value = '',
		onChange,
		multiline,
		...props
	}: RichTextMultilineProps,
	forwardedRef: ForwardedRef< HTMLElement >
) {
	deprecated( 'wp.blockEditor.RichText multiline prop', {
		since: '6.1',
		version: '6.3',
		alternative: 'nested blocks (InnerBlocks)',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/',
	} );

	const multilineTagName = getMultilineTag( multiline );
	value = value || `<${ multilineTagName }></${ multilineTagName }>`;
	const padded = `</${ multilineTagName }>${ value }<${ multilineTagName }>`;
	const values = padded.split(
		`</${ multilineTagName }><${ multilineTagName }>`
	);

	values.shift();
	values.pop();

	function _onChange( newValues: string[] ) {
		onChange(
			`<${ multilineTagName }>${ newValues.join(
				`</${ multilineTagName }><${ multilineTagName }>`
			) }</${ multilineTagName }>`
		);
	}

	return (
		<TagName ref={ forwardedRef }>
			{ values.map( ( _value, index ) => {
				return (
					<Line
						key={ index }
						values={ values }
						value={ _value }
						onChange={ _onChange }
						index={ index }
						identifier={ identifier }
						multilineTagName={ multilineTagName }
						{ ...props }
					/>
				);
			} ) }
		</TagName>
	);
}

export default forwardRef( RichTextMultiline );
