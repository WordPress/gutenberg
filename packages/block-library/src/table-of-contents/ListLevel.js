/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/editor';

export default function ListLevel( props ) {
	const { edit, attributes, setAttributes } = props;
	let childnodes = null;

	if ( props.children ) {
		childnodes = props.children.map( function( childnode ) {
			const content = getContentElement( childnode, props );

			return (
				<li key={ childnode.block.anchor }>
					<a href={ childnode.block.anchor } data-level={ childnode.block.level }>
						{ content }
					</a>
					{ childnode.children ? <ListLevel
						edit={ edit }
						attributes={ attributes }
						setAttributes={ setAttributes }
					>
						{ childnode.children }
					</ListLevel> : null }
				</li>
			);
		} );

		return (
			<ul>
				{ childnodes }
			</ul>
		);
	}
}

function getContentElement( childnode, props ) {
	const { edit, attributes, setAttributes } = props;
	const { headings, autosync } = attributes;

	const updateHeading = ( content ) => {
		headings[ childnode.index ].content = content;
		setAttributes( { headings } );
	};

	if ( autosync ) {
		return <span>{ childnode.block.content }</span>;
	}

	if ( edit ) {
		return (
			<RichText
				tagName="span"
				onChange={ ( content ) => updateHeading( content ) }
				value={ childnode.block.content }
			/>
		);
	}

	return (
		<RichText.Content
			tagName="span"
			value={ childnode.block.content }
		/>
	);
}
