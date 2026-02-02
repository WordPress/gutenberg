/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import { bolt as icon } from './icons/bolt';

const { name } = metadata;
export { metadata, name };
export const settings = {
	icon,
	example: {
		attributes: {
			icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true"><path d="M5.12321216,13.5468785 L5.07370078,13.6336248 C4.83077383,14.1322066 5.21892027,14.7352155 5.79113692,14.6825876 L10.2624715,14.270549 L9.82933866,21.7227919 C9.78597021,22.4686759 10.7447862,22.7937669 11.1544448,22.1720753 L18.8767932,10.4527553 L18.9263046,10.3660059 C19.1692295,9.86740676 18.7810449,9.2643915 18.2088152,9.31705918 L13.736563,9.72847448 L14.1706611,2.27720814 C14.2140292,1.5313296 13.2552248,1.20623489 12.8455606,1.82791614 L5.12321216,13.5468785 Z M12.5675925,4.88951961 L12.2425725,10.4921196 L12.2429925,10.5865822 C12.2702521,10.9894968 12.6214196,11.3022396 13.0308862,11.2645525 L16.8312941,10.9140428 L11.431442,19.1095038 L11.7574272,13.5078804 L11.7570075,13.4134218 C11.729751,13.0105235 11.3786124,12.697785 10.9691611,12.7354431 L7.16774032,13.0849806 L12.5675925,4.88951961 Z"></path></svg>',
			iconColorValue: '#ffffff',
			iconBackgroundColorValue: '#0F172A',
			itemsJustification: 'center',
			width: '60px',
			style: {
				border: {
					radius: '50px',
				},
				spacing: {
					padding: {
						top: '10px',
						right: '10px',
						bottom: '10px',
						left: '10px',
					},
				},
			},
		},
	},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
