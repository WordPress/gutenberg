/**
 * WordPress dependencies
 */
import { Popover } from '@wordpress/components';
import { forwardRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __experimentalLinkControl as LinkControl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */

function SuggestionsPopover(
	{ url, inputValue, close, onSelect, anchorRef, label = '' },
	ref
) {
	const userCanCreatePages = useSelect( ( select ) =>
		select( 'core' ).canUser( 'create', 'pages' )
	);
	const { saveEntityRecord } = useDispatch( 'core' );
	const link = {
		url,
	};
	async function handleCreatePage( pageTitle ) {
		const type = 'page';
		const page = await saveEntityRecord( 'postType', type, {
			title: pageTitle,
			status: 'publish',
		} );

		return {
			id: page.id,
			type,
			title: page.title.rendered,
			url: page.link,
		};
	}
	return (
		<Popover
			position="bottom center"
			focusOnMount={ false }
			getAnchorRect={ () => anchorRef.current.getBoundingClientRect() }
		>
			<div ref={ ref }>
				<LinkControl
					className="wp-block-navigation-link__inline-link-input"
					value={ link }
					createSuggestion={
						userCanCreatePages ? handleCreatePage : undefined
					}
					inputValue={ inputValue }
					onlySuggestions
					showInitialSuggestions
					forceIsEditingLink
					onChange={ ( {
						title: newTitle = '',
						url: newURL = '',
						id,
					} = {} ) => {
						close();
						onSelect( {
							url: encodeURI( newURL ),
							label: ( () => {
								const normalizedTitle = newTitle.replace(
									/http(s?):\/\//gi,
									''
								);
								const normalizedURL = newURL.replace(
									/http(s?):\/\//gi,
									''
								);
								if (
									newTitle !== '' &&
									normalizedTitle !== normalizedURL &&
									label !== newTitle
								) {
									return newTitle;
								} else if ( label ) {
									return label;
								}
								// If there's no label, add the URL.
								return normalizedURL;
							} )(),
							id,
						} );
					} }
				/>
			</div>
		</Popover>
	);
}

export default forwardRef( SuggestionsPopover );
