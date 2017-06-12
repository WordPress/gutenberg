{

function keyValue( key, value ) {
  const o = {};
  o[ key ] = value;
  return o;
}

}

Document
  = WP_Block_List

WP_Block_List
  = WP_Block*

WP_Block
  = WP_Block_Balanced
  / WP_Block_Html

WP_Block_Balanced
  = s:WP_Block_Start ts:(!WP_Block_End c:Any { return c })* e:WP_Block_End & { return s.blockType === e.blockType }
  { return {
    blockType: s.blockType,
    attrs: s.attrs,
    rawContent: ts.join( '' ),
  } }

WP_Block_Html
  = ts:(!WP_Block_Balanced c:Any { return c })+
  {
    return {
      attrs: {},
      rawContent: ts.join( '' )
    }
  }

WP_Block_Start
  = "<!--" __ "wp:" blockType:WP_Block_Type attrs:HTML_Attribute_List _? "-->"
  { return {
    blockType: blockType,
    attrs: attrs
  } }

WP_Block_End
  = "<!--" __ "/wp:" blockType:WP_Block_Type __ "-->"
  { return {
    blockType: blockType
  } }

WP_Block_Type
  = $(ASCII_Letter (ASCII_AlphaNumeric / "/" ASCII_AlphaNumeric)*)

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

_
  = [ \t]

__
  = _+

Any
  = .
