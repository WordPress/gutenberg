import React from 'react';

const BlockQuote = ( props ) => {
	const children = React.Children.toArray( props.children );
	return (
		<>
			{
				React.cloneElement( children[ 0 ], { tagName: 'blockquote' } )
			}
			{ ( children.length > 1 && (
				React.cloneElement( children[ 1 ], { tagName: 'cite' } )
			) ) } 
		</>
	);
}
export default BlockQuote;
