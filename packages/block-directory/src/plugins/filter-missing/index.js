/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import InstallButton from './install-button';

const filterMissing = ( OriginalComponent ) => ( props ) => {
	const { originalName, originalUndelimitedContent } = props.attributes;
	const { block, hasPermission } = useSelect(
		( select ) => {
			const { getDownloadableBlocks } = select( 'core/block-directory' );
			const blocks = getDownloadableBlocks(
				'block:' + originalName
			).filter( ( { name } ) => originalName === name );
			return {
				hasPermission: select( 'core' ).canUser(
					'read',
					'block-directory/search'
				),
				block: blocks.length && blocks[ 0 ],
			};
		},
		[ originalName ]
	);

	if ( ! hasPermission || ! block ) {
		return <OriginalComponent { ...props } />;
	}

	const actions = [
		<InstallButton
			key="install"
			block={ block }
			attributes={ props.attributes }
			clientId={ props.clientId }
		/>,
		<Button key="convert" onClick={ props.convertToHTML } isLink>
			{ __( 'Keep as HTML' ) }
		</Button>,
	];

	return (
		<>
			<Warning actions={ actions }>
				{ sprintf(
					/* translators: %s: block name */
					__(
						'Your site doesn’t include support for the %s block. You can try installing the block, convert it to a Custom HTML block, or remove it entirely.'
					),
					block.title || originalName
				) }
			</Warning>
			<RawHTML>{ originalUndelimitedContent }</RawHTML>
		</>
	);
};

export default filterMissing;
