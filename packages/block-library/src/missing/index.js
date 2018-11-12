/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { RawHTML, Fragment } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { getBlockType, createBlock } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/editor';

function MissingBlockWarning( { attributes, convertToHTML } ) {
	const { originalName, originalUndelimitedContent } = attributes;
	const hasContent = !! originalUndelimitedContent;
	const hasHTMLBlock = getBlockType( 'core/html' );

	const actions = [];
	let messageHTML;
	if ( hasContent && hasHTMLBlock ) {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact, convert its content to a Custom HTML block, or remove it entirely.' ),
			originalName
		);
		actions.push(
			<Button key="convert" onClick={ convertToHTML } isLarge isPrimary>
				{ __( 'Keep as HTML' ) }
			</Button>
		);
	} else {
		messageHTML = sprintf(
			__( 'Your site doesn’t include support for the "%s" block. You can leave this block intact or remove it entirely.' ),
			originalName
		);
	}

	return (
		<Fragment>
			<Warning actions={ actions }>
				{ messageHTML }
			</Warning>
			<RawHTML>{ originalUndelimitedContent }</RawHTML>
		</Fragment>
	);
}

const edit = withDispatch( ( dispatch, { clientId, attributes } ) => {
	const { replaceBlock } = dispatch( 'core/editor' );
	return {
		convertToHTML() {
			replaceBlock( clientId, createBlock( 'core/html', {
				content: attributes.originalUndelimitedContent,
			} ) );
		},
	};
} )( MissingBlockWarning );

export const name = 'core/missing';

export const settings = {
	name,
	category: 'common',
	title: __( 'Unrecognized Block' ),
	description: __( 'Your site doesn’t include support for this block.' ),

	supports: {
		className: false,
		customClassName: false,
		inserter: false,
		html: false,
		reusable: false,
	},

	attributes: {
		originalName: {
			type: 'string',
		},
		originalUndelimitedContent: {
			type: 'string',
		},
		originalContent: {
			type: 'string',
			source: 'html',
		},
	},

	edit,
	save( { attributes } ) {
		// Preserve the missing block's content.
		return <RawHTML>{ attributes.originalContent }</RawHTML>;
	},
};
