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
  = WP_Block_Void
  / WP_Block_Balanced
  / WP_Block_Html

WP_Block_Void
  = "<!--" __ "wp:" blockName:WP_Block_Name attrs:HTML_Attribute_List _? "/-->"
  { return {
    blockName: blockName,
    attrs: attrs,
    rawContent: ''
  } }

WP_Block_Balanced
  = s:WP_Block_Start ts:(!WP_Block_End c:Any { return c })* e:WP_Block_End & { return s.blockName === e.blockName }
  { return {
    blockName: s.blockName,
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
  = "<!--" __ "wp:" blockName:WP_Block_Name attrs:HTML_Attribute_List _? "-->"
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
  = name:HTML_Attribute_Name _* "=" _* '"' value:$(("\\" '"' . / !'"' .)*) '"'
  { return keyValue( name, value ) }
  / name:HTML_Attribute_Name _* "=" _* "'" value:$(("\\" "'" . / !"'" .)*) "'"
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
