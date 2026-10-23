import {
	insert,
	toHTMLString,
	privateApis as richTextPrivateApis,
} from '@wordpress/rich-text';
import { getBlockTransforms, findTransform } from '@wordpress/blocks';
import type {
	Block,
	BlockInputTransform,
	BlockPrefixTransform,
	NormalizedBlockTransform,
} from '@wordpress/blocks';
import { store as blockEditorStore } from '../../../store';
import { preventEventDiscovery } from '../prevent-event-discovery';
import {
	retrieveSelectedAttribute,
	START_OF_SELECTED_AREA,
} from '../../../utils/selection';
import { unlock } from '../../../lock-unlock';
import type { RichTextEventListener } from '../types';

const { subscribeOwnedListener } = unlock( richTextPrivateApis );

export function findSelection(
	blocks: Block[]
): [ string, string, number, number ] | [] {
	let i = blocks.length;

	while ( i-- ) {
		const attributeKey = retrieveSelectedAttribute(
			blocks[ i ].attributes
		);

		if ( attributeKey ) {
			// The selected attribute holds the marker character.
			blocks[ i ].attributes[ attributeKey ] = (
				blocks[ i ].attributes[ attributeKey ] as string
			 )
				// To do: refactor this to use rich text's selection instead, so
				// we no longer have to use on this hack inserting a special
				// character.
				.toString()
				.replace( START_OF_SELECTED_AREA, '' );
			return [ blocks[ i ].clientId, attributeKey, 0, 0 ];
		}

		const nestedSelection = findSelection( blocks[ i ].innerBlocks );

		if ( nestedSelection ) {
			return nestedSelection;
		}
	}

	return [];
}

const inputRules: RichTextEventListener = ( props ) => ( element ) => {
	function inputRule() {
		const { getValue, onReplace, selectionChange, registry } =
			props.current;

		if ( ! onReplace ) {
			return;
		}

		// We must use getValue() here because value may be update
		// asynchronously.
		const value = getValue();
		const { start, text } = value;
		// Input happens at a caret.
		const characterBefore = text.slice( start! - 1, start );

		// The character right before the caret must be a plain space.
		if ( characterBefore !== ' ' ) {
			return;
		}

		const trimmedTextBefore = text.slice( 0, start ).trim();
		const prefixTransforms = getBlockTransforms( 'from' ).filter(
			(
				transform
			): transform is NormalizedBlockTransform< BlockPrefixTransform > =>
				transform.type === 'prefix'
		);
		const transformation = findTransform(
			prefixTransforms,
			( { prefix } ) => {
				return trimmedTextBefore === prefix;
			}
		);

		if ( ! transformation ) {
			return;
		}

		const content = toHTMLString( {
			value: insert( value, START_OF_SELECTED_AREA, 0, start ),
		} );
		// Prefix transforms define `transform` and return one block.
		const block = transformation.transform!( content ) as Block;

		// Batch so the undo history records the pre-transform selection,
		// instead of the selection change here overwriting it first.
		registry.batch( () => {
			selectionChange( ...findSelection( [ block ] ) );
			onReplace( [ block ] );
		} );

		registry.dispatch( blockEditorStore ).__unstableMarkAutomaticChange();

		return true;
	}

	function onInput( event: InputEvent ) {
		const { inputType, type } = event;
		const {
			getValue,
			onChange,
			__unstableAllowPrefixTransformations,
			__unstableDisableFormatInputRules,
			formatTypes,
			registry,
			onReplace,
		} = props.current;

		// Only run input rules when inserting text.
		if ( inputType !== 'insertText' && type !== 'compositionend' ) {
			return;
		}

		if ( __unstableAllowPrefixTransformations && inputRule() ) {
			return;
		}

		const value = getValue();

		if ( onReplace ) {
			const transforms = getBlockTransforms( 'from' ).filter(
				(
					transform
				): transform is NormalizedBlockTransform< BlockInputTransform > =>
					transform.type === 'input'
			);
			const transformation = findTransform( transforms, ( item ) =>
				item.regExp.test( value.text )
			);

			if ( transformation ) {
				onReplace( transformation.transform() );
				registry
					.dispatch( blockEditorStore )
					.__unstableMarkAutomaticChange();
				return;
			}
		}

		const transformed = __unstableDisableFormatInputRules
			? preventEventDiscovery( value )
			: formatTypes.reduce(
					( accumulator, { __unstableInputRule } ) => {
						if ( __unstableInputRule ) {
							accumulator = __unstableInputRule( accumulator );
						}

						return accumulator;
					},
					preventEventDiscovery( value )
			  );

		const {
			__unstableMarkLastChangeAsPersistent,
			__unstableMarkAutomaticChange,
		} = registry.dispatch( blockEditorStore );

		if ( transformed !== value ) {
			__unstableMarkLastChangeAsPersistent();
			onChange( {
				...transformed,
				activeFormats: value.activeFormats,
			} );
			__unstableMarkAutomaticChange();
		}
	}

	// Capture phase so these run before ancestor (writing flow) bubble
	// handlers, matching the timing of the previous raw element listeners.
	const unsubscribeInput = subscribeOwnedListener(
		element,
		'input',
		onInput,
		true
	);
	const unsubscribeCompositionEnd = subscribeOwnedListener(
		element,
		'compositionend',
		onInput,
		true
	);
	return () => {
		unsubscribeInput();
		unsubscribeCompositionEnd();
	};
};

export default inputRules;
