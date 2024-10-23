/**
 * WordPress dependencies
 */
import { SVG, Path } from '@wordpress/components';
/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import metadata from './block.json';
import initBlock from '../utils/init-block';

const icon = (
	<SVG
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M8.10417 6.00024H6.5C5.39543 6.00024 4.5 6.89567 4.5 8.00024V10.3336H6V8.00024C6 7.7241 6.22386 7.50024 6.5 7.50024H8.10417V6.00024ZM4.5 13.6669V16.0002C4.5 17.1048 5.39543 18.0002 6.5 18.0002H8.10417V16.5002H6.5C6.22386 16.5002 6 16.2764 6 16.0002V13.6669H4.5ZM10.3958 6.00024V7.50024H13.6042V6.00024H10.3958ZM15.8958 6.00024V7.50024H17.5C17.7761 7.50024 18 7.7241 18 8.00024V10.3336H19.5V8.00024C19.5 6.89567 18.6046 6.00024 17.5 6.00024H15.8958ZM19.5 13.6669H18V16.0002C18 16.2764 17.7761 16.5002 17.5 16.5002H15.8958V18.0002H17.5C18.6046 18.0002 19.5 17.1048 19.5 16.0002V13.6669ZM13.6042 18.0002V16.5002H10.3958V18.0002H13.6042Z"
			fill="currentColor"
		/>
	</SVG>
);

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
