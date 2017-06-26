{

function maybeJSON( s ) {
	try {
		return JSON.parse( s );
	} catch (e) {
		return null;
	}
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
  = "<!--" WS+ "wp:" blockName:WP_Block_Name WS+ attrs:(a:WP_Block_Attributes WS+ { return a })? "/-->"
  { return {
    blockName: blockName,
    attrs: attrs,
    rawContent: ''
  } }

WP_Block_Balanced
  = s:WP_Block_Start ts:(!WP_Block_End c:Any { return c })* e:WP_Block_End
  & { return s.blockName === e.blockName }
  { return {
    blockName: s.blockName,
    attrs: s.attrs,
    rawContent: ts.join( '' ),
  } }

WP_Block_Html
  = ts:(!WP_Block_Balanced !WP_Block_Void c:Any { return c })+
  {
    return {
      attrs: {},
      rawContent: ts.join( '' )
    }
  }

WP_Block_Start
  = "<!--" WS+ "wp:" blockName:WP_Block_Name WS+ attrs:(a:WP_Block_Attributes WS+ { return a })? "-->"
  { return {
    blockName: blockName,
    attrs: attrs
  } }

WP_Block_End
  = "<!--" WS+ "/wp:" blockName:WP_Block_Name WS+ "-->"
  { return {
    blockName: blockName
  } }

WP_Block_Name
  = $(ASCII_Letter (ASCII_AlphaNumeric / "/" ASCII_AlphaNumeric)*)

WP_Block_Attributes
  = attrs:$("{" (!("}" WS+ """/"? "-->") .)* "}")
  { return maybeJSON( attrs ) }

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

WS
  = [ \t\r\n]

Newline
  = [\r\n]

_
  = [ \t]

__
  = _+

Any
  = .
