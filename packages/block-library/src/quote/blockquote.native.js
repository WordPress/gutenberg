import React from 'react';

const BlockQuote = ( props ) => {
	const children = React.Children.toArray( props.children );
	return (
		<>
			{
				React.cloneElement( children[ 0 ], { tagName: 'blockquote' } )
			}
			{
				React.cloneElement( children[ 1 ], { tagName: 'cite' } )
			}
		</>
	);
}
export default BlockQuote;
