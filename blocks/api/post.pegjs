{

/** <?php
// The `maybeJSON` function is not needed in PHP because its return semantics
// are the same as `json_decode`
?> **/

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
  = WP_Tag_More
  / WP_Block_Void
  / WP_Block_Balanced
  / WP_Block_Html

WP_Tag_More
  = "<!--" WS* "more" customText:(WS+ text:$((!(WS* "-->") .)+) { /** <?php return $text; ?> **/ return text })? WS* "-->" noTeaser:(WS* "<!--noteaser-->")?
  { /** <?php
    return array(
       'blockName' => 'core/more',
       'attrs' => array(
         'customText' => $customText,
         'noTeaser' => (bool) $noTeaser
       ),
       'rawContent' => ''
    );
    ?> **/
    return {
      blockName: 'core/more',
      attrs: {
        customText: customText,
        noTeaser: !! noTeaser
      },
      rawContent: ''
    }
  }

WP_Block_Void
  = "<!--" WS+ "wp:" blockName:WP_Block_Name WS+ attrs:(a:WP_Block_Attributes WS+ {
    /** <?php return $a; ?> **/
    return a;
  })? "/-->"
  {
    /** <?php
    return array(
      'blockName'  => $blockName,
      'attrs'      => $attrs,
      'rawContent' => '',
    );
    ?> **/

    return {
      blockName: blockName,
      attrs: attrs,
      rawContent: ''
    };
  }

WP_Block_Balanced
  = s:WP_Block_Start
    html:(ts:(!WP_Block_End t:HTML_Token {
      /** <?php return $t; ?> **/
      return t
    })* {
      /** <?php return array($ts, $this->text()); ?> **/
      return [ts, text()]
    })
    e:WP_Block_End & {
      /** <?php return $s['blockName'] === $e['blockName']; ?> **/
      return s.blockName === e.blockName;
    }
  {
    /** <?php
    return array(
      'blockName'  => $s['blockName'],
      'attrs'      => $s['attrs'],
      'children'   => $html[0],
      'rawContent' => $html[1],
    );
    ?> **/

    return {
      blockName: s.blockName,
      attrs: s.attrs,
      children: html[0],
      rawContent: html[1]
    };
  }

WP_Block_Html
  = html:(t:(!WP_Block_Start html:HTML_Token { /** <?php return $html; ?> **/ return html } ) {
      /** <?php return array( $t, $this->text() ); ?> **/
      return [ t, text() ]
    })
  {
    /** <?php
    return array(
      'attrs'      => array(),
      'children'   => $html[0],
      'rawContent' => $html[1],
    );
    ?> **/

    return {
      attrs: {},
      children: html[0],
      rawContent: html[1]
    }
  }

WP_Block_Start
  = "<!--" WS+ "wp:" blockName:WP_Block_Name WS+ attrs:(a:WP_Block_Attributes WS+ {
    /** <?php return $a; ?> **/
    return a;
  })? "-->"
  {
    /** <?php
    return array(
      'blockName' => $blockName,
      'attrs'     => $attrs,
    );
    ?> **/

    return {
      blockName: blockName,
      attrs: attrs
    };
  }

WP_Block_End
  = "<!--" WS+ "/wp:" blockName:WP_Block_Name WS+ "-->"
  {
    /** <?php
    return array(
      'blockName' => $blockName,
    );
    ?> **/

    return {
      blockName: blockName
    };
  }

WP_Block_Name
  = $(ASCII_Letter (ASCII_AlphaNumeric / "/" ASCII_AlphaNumeric)*)

WP_Block_Attributes
  = attrs:$("{" (!("}" WS+ """/"? "-->") .)* "}")
  {
    /** <?php return json_decode( $attrs, true ); ?> **/
    return maybeJSON( attrs );
  }
 
HTML_Token
  = HTML_Comment
  / HTML_Tag_Void
  / HTML_Tag_Balanced
  / $([^<]+)

HTML_Comment
  = "<!--" innerText:$((!"-->" .)*) "-->"
  { /**
    <?php return array(
      'type'      => 'HTML_Comment',
      'innerText' => $innerText,
    ); ?>
    **/
  
    return {
      type: "HTML_Comment",
      innerText
    }
  }

HTML_Tag_Void
  = t:HTML_Tag_Open
  & {
      /** <?php
        return in_array( strtolower( $t->name ), array(
          'br',
          'col',
          'embed',
          'hr',
          'img',
          'input',
        ) );
      ?> **/
      
      return undefined !== {
        'br': true,
        'col': true,
        'embed': true,
        'hr': true,
        'img': true,
        'input': true
      }[ t.name.toLowerCase() ]
    }
  {
    /** <?php
    return array(
      'type'  => 'HTML_Void_Tag',
      'name'  => $t->name,
      'attrs' => $t->attrs,
    );
    ?> **/
  
    return {
      type: 'HTML_Void_Tag',
      name: t.name,
      attrs: t.attrs,
    }
  }

HTML_Tag_Balanced
  = s:HTML_Tag_Open
    children:HTML_Token*
    e:HTML_Tag_Close & { /** <?php return $s->name === $e->name; ?> **/ return s.name === e.name }
  {
    /** <?php
    return array(
      'type'     => 'HTML_Tag',
      'name'     => $s->name,
      'attrs'    => $s->attrs,
      'children' => $children,
    );
    ?> **/
    
    return {
      type: 'HTML_Tag',
      name: s.name,
      attrs: s.attrs,
      children
    }
  }
  
HTML_Tag_Open
  = "<" name:HTML_Tag_Name attrs:HTML_Attribute_List _* isVoid:"/"? ">"
  { /** <?php
    return array(
      'type'   => 'HTML_Tag_Open',
      'isVoid' => (bool) $isVoid,
      'name'   => $name,
      'attrs'  => $attrs,
    );
    ?> **/
  
    return {
      type: 'HTML_Tag_Open',
      isVoid,
      name,
      attrs
    }
  }

HTML_Tag_Close
  = "</" name:HTML_Tag_Name _* ">"
  { /** <?php
    return array(
      'type' => 'HTML_Tag_Close',
      'name' => $name,
    );
    ?> **/
    
    return {
      type: 'HTML_Tag_Close',
      name
    }
  }
  
HTML_Tag_Name
  = $(ASCII_Letter ASCII_AlphaNumeric*)
  
HTML_Attribute_List
  = as:(_+ a:HTML_Attribute_Item { /** <?php return $a; ?> **/ return a })*
  { /** <?php
    $attrs = array();
    foreach ( $as as $attr ) {
      $attrs[ $attr[0] ] = $attr[1];
    }
    return $attrs;
    ?> **/
  
    return as.reduce( ( attrs, [ name, value ] ) => Object.assign(
      attrs,
      { [ name ]: value }
    ), {} )
  }
  
HTML_Attribute_Item
  = HTML_Attribute_Quoted
  / HTML_Attribute_Unquoted
  / HTML_Attribute_Empty
  
HTML_Attribute_Empty
  = name:HTML_Attribute_Name
  { /** <?php return array( $name, true ); ?> **/ return [ name, true ] }
  
HTML_Attribute_Unquoted
  = name:HTML_Attribute_Name _* "=" _* value:$([a-zA-Z0-9]+)
  { /** <?php return array( $name, $value ); ?> **/ return [ name, value ] }
  
HTML_Attribute_Quoted
  = name:HTML_Attribute_Name _* "=" _* '"' value:$((!'"' .)*) '"'
  { /** <?php return array( $name, $value ); ?> **/ return [ name, value ] }
  / name:HTML_Attribute_Name _* "=" _* "'" value:$((!"'" .)*) "'"
  { /** <?php return array( $name, $value ); ?> **/ return [ name, value ] }
  
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
