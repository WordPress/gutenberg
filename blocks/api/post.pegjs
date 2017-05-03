Document
  = WP_Block_List

WP_Block_List
  = WP_Block*

WP_Block
  = WP_Block_Balanced
  / WP_Block_Html

WP_Block_Balanced
  = s:WP_Block_Start ts:(!WP_Block_End c:Any { return c })+ e:WP_Block_End & { return s.blockType === e.blockType }
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
  = "<!--" __ "wp:" blockType:WP_Block_Type attrs:WP_Block_Attribute_List _? "-->"
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
  = $(ASCII_Letter WP_Block_Type_Char*)

WP_Block_Attribute_List
  = as:(_+ attr:WP_Block_Attribute { return attr })*
  { return as.reduce( function( attrs, pair ) {
    attrs[ pair.name ] = pair.value;
    return attrs;
  }, {} ) }

WP_Block_Attribute
  = name:WP_Block_Attribute_Name '="' value:WP_Block_Attribute_Value '"'
  { return { name: name, value: value }; }

WP_Block_Attribute_Name
  = $(ASCII_Letter ASCII_AlphaNumeric*)

WP_Block_Attribute_Value
  = $(ASCII_Letter WP_Block_Attribute_Value_Char*)

WP_Block_Type_Char
 = ASCII_AlphaNumeric
 / [\/]

ASCII_AlphaNumeric
  = ASCII_Letter
  / ASCII_Digit
  / Special_Chars

WP_Block_Attribute_Value_Char
  = [^"]

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
