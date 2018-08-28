/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Component,
	Fragment,
} from '@wordpress/element';
import {
	withFallbackStyles,
} from '@wordpress/components';
import {
	withColors,
	BlockControls,
	InspectorControls,
	PanelColorSettings,
	ContrastChecker,
	RichText,
} from '@wordpress/editor';
import { createBlock } from '@wordpress/blocks';
import { compose } from '@wordpress/compose';

const { getComputedStyle } = window;

class ListBlockEdit extends Component {
	constructor() {
		super( ...arguments );

		this.setupEditor = this.setupEditor.bind( this );
		this.getEditorSettings = this.getEditorSettings.bind( this );
		this.setNextValues = this.setNextValues.bind( this );

		this.state = {
			internalListType: null,
		};
	}

	findInternalListType( { parents } ) {
		const list = find( parents, ( node ) => node.nodeName === 'UL' || node.nodeName === 'OL' );
		return list ? list.nodeName : null;
	}

	setupEditor( editor ) {
		editor.on( 'nodeChange', ( nodeInfo ) => {
			this.setState( {
				internalListType: this.findInternalListType( nodeInfo ),
			} );
		} );

		// this checks for languages that do not typically have square brackets on their keyboards
		const lang = window.navigator.browserLanguage || window.navigator.language;
		const keyboardHasSqBracket = ! /^(?:fr|nl|sv|ru|de|es|it)/.test( lang );

		if ( keyboardHasSqBracket ) {
			// keycode 219 = '[' and keycode 221 = ']'
			editor.shortcuts.add( 'meta+219', 'Decrease indent', 'Outdent' );
			editor.shortcuts.add( 'meta+221', 'Increase indent', 'Indent' );
		} else {
			editor.shortcuts.add( 'meta+shift+m', 'Decrease indent', 'Outdent' );
			editor.shortcuts.add( 'meta+m', 'Increase indent', 'Indent' );
		}

		this.editor = editor;
	}

	createSetListType( type, command ) {
		return () => {
			const { setAttributes } = this.props;
			const { internalListType } = this.state;
			if ( internalListType ) {
				// only change list types, don't toggle off internal lists
				if ( internalListType !== type && this.editor ) {
					this.editor.execCommand( command );
				}
			} else {
				setAttributes( { ordered: type === 'OL' } );
			}
		};
	}

	createExecCommand( command ) {
		return () => {
			if ( this.editor ) {
				this.editor.execCommand( command );
			}
		};
	}

	getEditorSettings( editorSettings ) {
		return {
			...editorSettings,
			plugins: ( editorSettings.plugins || [] ).concat( 'lists' ),
			lists_indent_on_tab: false,
		};
	}

	setNextValues( nextValues ) {
		this.props.setAttributes( { values: nextValues } );
	}

	render() {
		const {
			attributes,
			insertBlocksAfter,
			setAttributes,
			mergeBlocks,
			onReplace,
			className,
			backgroundColor,
			textColor,
			setBackgroundColor,
			setTextColor,
			fallbackBackgroundColor,
			fallbackTextColor,
		} = this.props;
		const { ordered, values } = attributes;
		const tagName = ordered ? 'ol' : 'ul';

		return (
			<Fragment>
				<BlockControls
					controls={ [
						{
							icon: 'editor-ul',
							title: __( 'Convert to unordered list' ),
							isActive: ! ordered,
							onClick: this.createSetListType( 'UL', 'InsertUnorderedList' ),
						},
						{
							icon: 'editor-ol',
							title: __( 'Convert to ordered list' ),
							isActive: ordered,
							onClick: this.createSetListType( 'OL', 'InsertOrderedList' ),
						},
						{
							icon: 'editor-outdent',
							title: __( 'Outdent list item' ),
							onClick: this.createExecCommand( 'Outdent' ),
						},
						{
							icon: 'editor-indent',
							title: __( 'Indent list item' ),
							onClick: this.createExecCommand( 'Indent' ),
						},
					] }
				/>
				<InspectorControls>
					<PanelColorSettings
						title={ __( 'Color Settings' ) }
						initialOpen={ false }
						colorSettings={ [
							{
								value: backgroundColor.color,
								onChange: setBackgroundColor,
								label: __( 'Background Color' ),
							},
							{
								value: textColor.color,
								onChange: setTextColor,
								label: __( 'Text Color' ),
							},
						] }
					>
						<ContrastChecker
							{ ...{
								textColor: textColor.color,
								backgroundColor: backgroundColor.color,
								fallbackTextColor,
								fallbackBackgroundColor,
							} }
						/>
					</PanelColorSettings>
				</InspectorControls>
				<RichText
					multiline="li"
					tagName={ tagName }
					unstableGetSettings={ this.getEditorSettings }
					unstableOnSetup={ this.setupEditor }
					onChange={ this.setNextValues }
					value={ values }
					wrapperClassName="block-library-list"
					placeholder={ __( 'Write list…' ) }
					onMerge={ mergeBlocks }
					className={ classnames( className, {
						'has-background': backgroundColor.color,
						[ backgroundColor.class ]: backgroundColor.class,
						[ textColor.class ]: textColor.class,
					} ) }
					style={ {
						backgroundColor: backgroundColor.color,
						color: textColor.color,
					} }
					onSplit={
						insertBlocksAfter ?
							( before, after, ...blocks ) => {
								if ( ! blocks.length ) {
									blocks.push( createBlock( 'core/paragraph' ) );
								}

								if ( after.length ) {
									blocks.push( createBlock( 'core/list', {
										ordered,
										values: after,
									} ) );
								}

								setAttributes( { values: before } );
								insertBlocksAfter( blocks );
							} :
							undefined
					}
					onRemove={ () => onReplace( [] ) }
				/>
			</Fragment>
		);
	}
}

const withAppliedFallbackStyles = withFallbackStyles( ( node, ownProps ) => {
	const { textColor, backgroundColor, fontSize, customFontSize } = ownProps.attributes;
	const editableNode = node.querySelector( '[contenteditable="true"]' );
	//verify if editableNode is available, before using getComputedStyle.
	const computedStyles = editableNode ? getComputedStyle( editableNode ) : null;
	return {
		fallbackBackgroundColor: backgroundColor || ! computedStyles ? undefined : computedStyles.backgroundColor,
		fallbackTextColor: textColor || ! computedStyles ? undefined : computedStyles.color,
		fallbackFontSize: fontSize || customFontSize || ! computedStyles ? undefined : parseInt( computedStyles.fontSize ) || undefined,
	};
} );

const ListEdit = compose( [
	withColors( 'backgroundColor', { textColor: 'color' } ),
	withAppliedFallbackStyles,
] )( ListBlockEdit );

export default ListEdit;
