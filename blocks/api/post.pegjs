{

function untransformValue( value ) {
	return 'string' === typeof value
		? value.replace( /\\-/g, '-' )
		: value;
}

function keyValue( key, value ) {
  const o = {};
  o[ key ] = untransformValue( value );
  return o;
}

}

Document
  = WP_Block_List

WP_Block_List
  = blocks:(WP_Block / Whitespace / WP_Block_Freeform)*
  { return blocks.filter( function( block ) { return typeof block.blockName === 'string' } ) }

WP_Block
  = WP_Block_Void
  / WP_Block_Balanced
  / WP_Block_P_Text

WP_Block_Void
  = "<!--" __ "wp:" blockName:WP_Block_Name attrs:HTML_Attribute_List _? "/-->"
  { return {
    blockName: blockName,
    attrs: attrs,
    rawContent: ''
  } }

WP_Block_P_Text
  = p:HTML_Tag_Balanced
  & { return p.name === 'p' }
  { return {
    blockType: 'core/text',
    attrs: p.attrs,
    rawContent: p.rawContent
  } }

WP_Block_Balanced
  = s:WP_Block_Start ts:(!WP_Block_End c:. { return c })* e:WP_Block_End & { return s.blockName === e.blockName }
  { return {
    blockName: s.blockName,
    attrs: s.attrs,
    rawContent: ts.join( '' ),
  } }

WP_Block_Freeform
  = ts:$((!WP_Block c:. { return c })+)
  { return {
      blockType: 'core/freeform',
      attrs: {},
      rawContent: ts
  } }

WP_Block_Start
  = "<!--" __ "wp:" blockName:WP_Block_Name attrs:HTML_Attribute_List __ "-->"
  { return {
    blockName: blockName,
    attrs: attrs
  } }

WP_Block_End
  = "<!--" __ "/wp:" blockName:WP_Block_Name __ "-->"
  { return {
    blockName: blockName
  } }

WP_Block_Name
  = $(ASCII_Letter (ASCII_AlphaNumeric / "/" ASCII_AlphaNumeric)*)

HTML_Tag_Balanced
  = s:HTML_Tag_Open
    rawContent:$((!(ct:HTML_Tag_Close & { return s.name === ct.name } ) c:. { return c })*)
    e:HTML_Tag_Close
  & { return s.name === e.name }
  { return {
    type: 'HTML_Tag',
    name: s.name,
    attrs: s.attrs,
    rawContent
  } }

HTML_Tag_Open
  = "<" name:HTML_Tag_Name attrs:HTML_Attribute_List _* ">"
  { return {
    type: 'HTML_Tag_Open',
    name,
    attrs
  } }

HTML_Tag_Close
  = "</" name:HTML_Tag_Name _* ">"
  { return {
    type: 'HTML_Tag_Close',
    name
  } }
  
HTML_Tag_Name
  = $(ASCII_Letter ASCII_AlphaNumeric*)

HTML_Attribute_List
  = as:(_+ a:HTML_Attribute_Item { return a })*
  { return as.reduce( function( attrs, attr ) { return Object.assign( attrs, attr ) }, {} ) }

HTML_Attribute_Item
  = HTML_Attribute_Quoted
  / HTML_Attribute_Unquoted
  / HTML_Attribute_Empty

HTML_Attribute_Empty
  = name:HTML_Attribute_Name
  { return keyValue( name, true ) }

HTML_Attribute_Unquoted
  = name:HTML_Attribute_Name _* "=" _* value:$([a-zA-Z0-9]+)
  { return keyValue( name, value ) }

HTML_Attribute_Quoted
  = name:HTML_Attribute_Name _* "=" _* '"' value:$(('\\"' . / !'"' .)*) '"'
  { return keyValue( name, value ) }
  / name:HTML_Attribute_Name _* "=" _* "'" value:$(("\\'" . / !"'" .)*) "'"
  { return keyValue( name, value ) }

HTML_Attribute_Name
  = $([a-zA-Z0-9:.]+)

ASCII_AlphaNumeric
  = ASCII_Letter
  / ASCII_Digit
  / Special_Chars

ASCII_Letter
  = [a-zA-Z]

ASCII_Digit
  = [0-9]

Special_Chars
  = [\-\_]

Newline
  = [\r\n]

/**
 * Match JS `[\s]`
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp
 */
Whitespace
  = [ \f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+

_
  = [ \t]

__
  = _+
