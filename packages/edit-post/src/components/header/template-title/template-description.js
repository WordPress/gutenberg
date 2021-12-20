/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	__experimentalHeading as Heading,
	__experimentalText as Text,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';

export default function TemplateDescription() {
	const { description, title } = useSelect( ( select ) => {
		const { getEditedPostTemplate } = select( editPostStore );
		return {
			title: getEditedPostTemplate().title,
			description: getEditedPostTemplate().description,
		};
	}, [] );
	if ( ! description ) {
		return null;
	}
	return (
		<>
			<Heading level={ 4 } weight={ 600 }>
				{ title }
			</Heading>
			<Text
				className="edit-post-template-details__description"
				size="body"
				as="p"
				style={ { marginTop: '12px' } }
			>
				{ description }
			</Text>
		</>
	);
}
