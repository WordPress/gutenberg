/**
 * External dependencies
 */
import { View, Text, TextInput } from 'react-native';
import { parseDocument, ElementType } from 'htmlparser2';
import TextAncestor from 'react-native/Libraries/Text/TextAncestor';

/**
 * WordPress dependencies
 */
import {
	useRef,
	useCallback,
	useReducer,
	useEffect,
	Platform,
	useMemo,
} from '@wordpress/element';
import { BlockFormatControls } from '@wordpress/block-editor';
import { useRegistry } from '@wordpress/data';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import FormatEdit from './format-edit';
import ToolbarButtonWithOptions from './toolbar-button-with-options';
import { create } from '../create';
import { updateFormats } from '../update-formats';
import { toHTMLString } from '../to-html-string';
import { insert } from '../insert';
import { getActiveFormats } from '../get-active-formats';
import { useFormatTypes } from './use-format-types';
import { remove } from '../remove';
import { removeLineSeparator } from '../remove-line-separator';
import { isEmptyLine } from '../is-empty';
import { isCollapsed } from '../is-collapsed';
import styles from './style';

const EMPTY_ACTIVE_FORMATS = [];
const noop = () => {};
const DEFAULT_FONT_SIZE = 16;

function getTextStyles( textNode, nodeStyles, tagName ) {
	const currentTagName = [ textNode?.parent?.name, tagName ];

	const currentStyles = [
		currentTagName.includes( 'strong' ) && {
			fontWeight: 'bold',
		},
		currentTagName.includes( 'em' ) && {
			fontStyle: 'italic',
		},
		currentTagName.includes( 'a' ) && {
			color: 'blue',
			textDecorationLine: 'underline',
		},
		currentTagName.includes( 's' ) && {
			textDecorationLine: 'line-through',
			textDecorationStyle: 'solid',
		},
		currentTagName.includes( 'h1' ) && {
			fontSize: 26,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'h2' ) && {
			fontSize: 24,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'h3' ) && {
			fontSize: 22,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'h4' ) && {
			fontSize: 20,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'h5' ) && {
			fontSize: 18,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'h6' ) && {
			fontSize: 16,
			fontWeight: 'bold',
		},
		currentTagName.includes( 'sup' ) && {},
		currentTagName.includes( 'sup' ) && {},
		currentTagName.includes( 'text-decoration: underline;' ) && {
			textDecorationLine: 'underline',
		},
	];

	nodeStyles = [ ...nodeStyles, ...currentStyles ];

	if ( textNode?.parent ) {
		return getTextStyles( textNode.parent, nodeStyles, tagName );
	}

	return nodeStyles;
}

function renderElement( element, index, tagName, textValue ) {
	return element.children.map( ( c, i ) =>
		renderNode( c, i, tagName, textValue )
	);
}

function renderTextNode( textNode, index, tagName ) {
	const textStyles = getTextStyles( textNode, [], tagName ).filter(
		( elStyle ) => elStyle
	);

	return textStyles.length === 0 ? (
		textNode.data
	) : (
		<Text style={ textStyles } key={ index }>
			{ textNode.data }
		</Text>
	);
}

function renderNode( node, index, tagName, textValue ) {
	switch ( node.type ) {
		case ElementType.Text:
			return renderTextNode( node, index, tagName, textValue );
		case ElementType.Tag:
			return renderElement( node, index, tagName, textValue );
	}

	return null;
}

function getParsedContent( html, tagName ) {
	const document = parseDocument( html );

	// return document.children
	// 	.map( ( c, i ) => renderNode( c, i, tagName, html ) )
	// 	.flat( 1 );

	return document.children.map( ( c, i ) =>
		renderNode( c, i, tagName, html )
	);
}

function RichText( {
	__unstableAfterParse,
	__unstableDisableFormats: disableFormats,
	__unstableIsSelected: isSelected,
	__unstableMobileNoFocusOnMount,
	__unstableMultilineTag: multilineTag,
	baseGlobalStyles,
	blockIsSelected,
	children,
	clientId,
	colorPalette,
	containerWidth,
	disableSuggestions,
	fontSize,
	fontWeight,
	identifier,
	onBlur,
	onChange,
	onDelete,
	onEnter,
	onSelectionChange,
	placeholder,
	placeholderTextColor,
	preserveWhiteSpace,
	selectionEnd,
	selectionStart,
	setRef,
	style,
	tagName,
	textAlign,
	unstableOnFocus,
	value,
	withoutInteractiveFormatting,
} ) {
	const ref = useRef();
	const currentSelectionStart = useRef( 0 );
	const currentSelectionEnd = useRef( 0 );
	const registry = useRegistry();
	const [ , forceRender ] = useReducer( () => ( {} ) );

	// Internal values are updated synchronously, unlike props and state.
	const _value = useRef( value );
	const record = useRef();
	const lastTextUpdate = useRef( { end: 0, text: '' } );

	useEffect( () => {
		if ( blockIsSelected && ! __unstableMobileNoFocusOnMount ) {
			ref.current?.focus();
		} else {
			ref.current?.blur();
		}
	}, [ ref, blockIsSelected, __unstableMobileNoFocusOnMount ] );

	function setRecordFromProps() {
		_value.current = value;
		record.current = create( {
			html: value,
			multilineTag,
			multilineWrapperTags:
				multilineTag === 'li' ? [ 'ul', 'ol' ] : undefined,
			preserveWhiteSpace,
		} );
		if ( disableFormats ) {
			record.current.formats = Array( value.length );
			record.current.replacements = Array( value.length );
		}
		if ( __unstableAfterParse ) {
			record.current.formats = __unstableAfterParse( record.current );
		}
		record.current.start = selectionStart;
		record.current.end = selectionEnd;
	}

	if ( ! record.current ) {
		setRecordFromProps();
	} else if (
		selectionStart !== record.current.start ||
		selectionEnd !== record.current.end
	) {
		record.current = {
			...record.current,
			start: selectionStart,
			end: selectionEnd,
		};
	}

	/**
	 * Sync the value to global state. The node tree and selection will also be
	 * updated if differences are found.
	 *
	 * @param {Object} newRecord The record to sync and apply.
	 */
	function handleChange( newRecord ) {
		record.current = newRecord;

		_value.current = toHTMLString( {
			value: newRecord,
			multilineTag,
			preserveWhiteSpace,
		} );

		const { start, end, formats, text } = newRecord;
		// Selection must be updated first, so it is recorded in history when
		// the content change happens.
		// We batch both calls to only attempt to rerender once.
		registry.batch( () => {
			onSelectionChange( start, end );
			onChange( _value.current, {
				__unstableFormats: formats,
				__unstableText: text,
			} );
		} );
		forceRender();
	}

	const onTextInputSelectionChange = useCallback(
		( { nativeEvent } ) => {
			const { start: textInputStart, end: textInputEnd } =
				nativeEvent.selection;

			currentSelectionStart.current = textInputStart;
			currentSelectionEnd.current = textInputEnd;

			if ( ! ref.current?.isFocused() ) {
				return;
			}

			const oldRecord = record.current;

			if (
				textInputStart === oldRecord.start &&
				textInputEnd === oldRecord.end
			) {
				return;
			}

			const newValue = {
				...oldRecord,
				start: textInputStart,
				end: textInputEnd,
				activeFormats: oldRecord._newActiveFormats,
				_newActiveFormats: undefined,
			};

			const newActiveFormats = getActiveFormats(
				newValue,
				EMPTY_ACTIVE_FORMATS
			);

			// Update the value with the new active formats.
			newValue.activeFormats = newActiveFormats;

			// It is important that the internal value is updated first,
			// otherwise the value will be wrong on render!
			record.current = newValue;
			onSelectionChange( textInputStart, textInputEnd );
		},
		[ currentSelectionStart, currentSelectionEnd ]
	);

	function onTextInputChangeText( { nativeEvent: { text, range } } ) {
		// Avoid duplicated key entries
		if (
			lastTextUpdate.current?.end === range.end &&
			lastTextUpdate.current?.text === text
		) {
			return;
		}

		lastTextUpdate.current = { end: range.end, text };

		const newRecord = insert(
			record.current,
			text,
			range.start,
			range.end
		);
		const { start, activeFormats: oldActiveFormats = [] } = record.current;

		// Update the formats between the last and new caret position.
		const change = updateFormats( {
			value: newRecord,
			start,
			end: newRecord.start,
			formats: oldActiveFormats,
		} );
		handleChange( change );
	}

	function onFormatChange( formatRecord ) {
		const updatedFormat = {
			...formatRecord,
			start: formatRecord.end,
			...( formatRecord.start !== formatRecord.end && {
				activeFormats: EMPTY_ACTIVE_FORMATS,
			} ),
		};
		handleChange( updatedFormat );
		ref.current?.setSelection( updatedFormat.end, updatedFormat.end );
	}

	function onTextInputFocus() {
		if ( unstableOnFocus ) {
			unstableOnFocus();
		}

		onSelectionChange(
			currentSelectionStart.current,
			currentSelectionEnd.current
		);
	}

	function onTextInputBlur( event ) {
		if ( onBlur ) {
			onBlur( event );
		}
	}

	function handleEnter( event ) {
		if ( event.key !== 'Enter' ) {
			return;
		}

		if ( ! onEnter ) {
			return;
		}

		onEnter( {
			value: record.current,
			onChange: onFormatChange,
		} );
	}

	function handleDelete( event ) {
		if ( event.key !== 'Backspace' ) {
			return;
		}

		const currentValue = record.current;
		const { start, end, text } = currentValue;
		const isReverse = event.key === 'Backspace';

		// Always handle full content deletion ourselves.
		if ( start === 0 && end !== 0 && end === text.length ) {
			handleChange( remove( currentValue ) );
			return;
		}

		if ( multilineTag ) {
			let newValue;

			// Check to see if we should remove the first item if empty.
			if (
				isReverse &&
				currentValue.start === 0 &&
				currentValue.end === 0 &&
				isEmptyLine( currentValue )
			) {
				newValue = removeLineSeparator( currentValue, ! isReverse );
			} else {
				newValue = removeLineSeparator( currentValue, isReverse );
			}

			if ( newValue ) {
				handleChange( newValue );
			}
		}

		// Only process delete if the key press occurs at an uncollapsed edge.
		if (
			! onDelete ||
			! isCollapsed( currentValue ) ||
			( isReverse && start !== 0 ) ||
			( ! isReverse && end !== text.length )
		) {
			return;
		}

		if ( onDelete ) {
			onDelete( { isReverse, value: currentValue } );
		}
	}

	function onTextInputKeyPress( { nativeEvent } ) {
		handleDelete( nativeEvent );
		handleEnter( nativeEvent );
	}

	function onRef( r ) {
		ref.current = r;

		if ( setRef ) {
			setRef( r );
		}
	}

	const { formatTypes } = useFormatTypes( {
		clientId,
		identifier,
		withoutInteractiveFormatting,
	} );

	const getEditableProps = useCallback( () => {
		return {
			// Overridable props.
			style: {},
			className: 'rich-text',
			onKeyDown: noop,
		};
	}, [] );

	const editableProps = getEditableProps();

	const EditableView = useCallback( ( props ) => {
		// this.customEditableOnKeyDown = props?.onKeyDown;

		return <></>;
	}, [] );

	const containerStyles = [
		style?.padding &&
			style?.backgroundColor && {
				padding: style.padding,
				backgroundColor: style.backgroundColor,
			},
		containerWidth && {
			width: containerWidth,
		},
	];

	const { lineHeight, ...inheritStyles } = style || {};

	const inputStyles = [
		{ backgroundColor: styles.richText.backgroundColor },
		inheritStyles,
		{
			fontSize: fontSize || DEFAULT_FONT_SIZE,
			fontFamily: Platform.select( {
				ios: 'NotoSerif',
				android: 'serif',
			} ),
			...( fontWeight && { fontWeight } ),
			padding: 0,
		},
	];

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.richTextPlaceholder,
		styles.richTextPlaceholderDark
	);

	const { color: defaultPlaceholderTextColor } = placeholderStyle;

	const inputPlaceholderTextColor =
		style?.placeholderColor ||
		placeholderTextColor ||
		( baseGlobalStyles && baseGlobalStyles?.color?.text ) ||
		defaultPlaceholderTextColor;

	// const textContent = useMemo( () => {
	// 	return getParsedContent( _value.current, tagName );
	// }, [ _value.current, tagName ] );

	return (
		<View style={ containerStyles }>
			{ children &&
				children( {
					isSelected,
					value: record.current,
					onChange: handleChange,
					onFocus: noop,
					editableProps,
					editableTagName: EditableView,
				} ) }
			<TextInput
				style={ inputStyles }
				ref={ onRef }
				multiline={ true }
				onBlur={ onTextInputBlur }
				onTextInput={ onTextInputChangeText }
				onFocus={ onTextInputFocus }
				onSelectionChange={ onTextInputSelectionChange }
				placeholder={ placeholder }
				placeholderTextColor={ inputPlaceholderTextColor }
				textAlign={ textAlign }
				scrollEnabled={ false }
				onKeyPress={ onTextInputKeyPress }
				value=""
				// value={ Platform.select( { ios: '', android: textContent } ) }
			>
				{ getParsedContent( _value.current, tagName ) }
			</TextInput>
			{ isSelected && (
				<>
					<FormatEdit
						forwardedRef={ ref }
						formatTypes={ formatTypes }
						value={ record.current }
						onChange={ onFormatChange }
						onFocus={ noop }
					/>
					{ ! disableSuggestions && (
						<BlockFormatControls>
							<ToolbarButtonWithOptions
							// options={ this.suggestionOptions() }
							/>
						</BlockFormatControls>
					) }
				</>
			) }
		</View>
	);
}

export default RichText;
