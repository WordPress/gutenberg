/**
 * Internal dependencies
 */
import './style.scss';
import { createBlock, getBlockTypes } from '../api';
import BlockIcon from '../block-icon';

export function blockAutocompleter( { onReplace } ) {
	const options = getBlockTypes().map( ( blockType ) => {
		const { name, title, icon, keywords = [] } = blockType;
		return {
			value: name,
			label: [
				<BlockIcon key="icon" icon={ icon } />,
				title,
			],
			keywords: [ ...keywords, title ],
		};
	} );

	const getOptions = () => Promise.resolve( options );

	const allowContext = ( before, range, after ) => {
		return ! ( /\S/.test( before.toString() ) || /\S/.test( after.toString() ) );
	};

	const onSelect = ( option ) => {
		const { value: blockName } = option;

		onReplace( createBlock( blockName ) );
	};

	return {
		className: 'blocks-block-autocomplete',
		triggerPrefix: '/',
		getOptions,
		allowContext,
		onSelect,
	};
}

export function userAutocompleter() {
	const getOptions = () => {
		return ( new wp.api.collections.Users() ).fetch().then( ( users ) => {
			return users.map( ( user ) => {
				return {
					user: user,
					label: [
						<img key="avatar" alt="" src={ user.avatar_urls[ 24 ] } />,
						<span key="name" className="name">{ user.name }</span>,
						<span key="slug" className="slug">{ user.slug }</span>,
					],
					keywords: [ user.slug, user.name ],
				};
			} );
		} );
	};

	const allowNode = ( textNode ) => {
		return textNode.parentElement.closest( 'a' ) === null;
	};

	const onSelect = ( option, range ) => {
		const { user } = option;
		const mention = document.createElement( 'a' );
		mention.href = user.link;
		mention.textContent = '@' + user.name;
		range.insertNode( mention );
		range.setStartAfter( mention );
		range.deleteContents();
	};

	return {
		className: 'blocks-user-autocomplete',
		triggerPrefix: '@',
		getOptions,
		allowNode,
		onSelect,
	};
}
