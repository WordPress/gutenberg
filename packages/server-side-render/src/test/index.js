/**
 * Internal dependencies
 */
import {
	rendererPath,
	removeBlockSupportAttributes,
} from '../server-side-render';

describe( 'rendererPath', () => {
	test( 'should return an base path for empty input', () => {
		expect( rendererPath( 'core/test-block', null ) ).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit'
		);
		expect( rendererPath( 'core/test-block' ) ).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit'
		);
	} );

	test( 'should format basic url params', () => {
		expect(
			rendererPath( 'core/test-block', {
				stringArg: 'test',
				nullArg: null,
				emptyArg: '',
				numberArg: 123,
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BstringArg%5D=test&attributes%5BnullArg%5D=&attributes%5BemptyArg%5D=&attributes%5BnumberArg%5D=123'
		);
	} );

	test( 'should format object params', () => {
		expect(
			rendererPath( 'core/test-block', {
				objectArg: {
					stringProp: 'test',
					numberProp: 123,
				},
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BobjectArg%5D%5BstringProp%5D=test&attributes%5BobjectArg%5D%5BnumberProp%5D=123'
		);
	} );

	test( 'should format an array of objects', () => {
		expect(
			rendererPath( 'core/test-block', {
				children: [
					{
						name: 'bobby',
						age: 12,
						sex: 'M',
					},
					{
						name: 'sally',
						age: 8,
						sex: 'F',
					},
				],
			} )
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5Bchildren%5D%5B0%5D%5Bname%5D=bobby&attributes%5Bchildren%5D%5B0%5D%5Bage%5D=12&attributes%5Bchildren%5D%5B0%5D%5Bsex%5D=M&attributes%5Bchildren%5D%5B1%5D%5Bname%5D=sally&attributes%5Bchildren%5D%5B1%5D%5Bage%5D=8&attributes%5Bchildren%5D%5B1%5D%5Bsex%5D=F'
		);
	} );

	test( 'should include urlQueryArgs', () => {
		expect(
			rendererPath(
				'core/test-block',
				{
					stringArg: 'test',
				},
				{
					id: 1234,
				}
			)
		).toBe(
			'/wp/v2/block-renderer/core/test-block?context=edit&attributes%5BstringArg%5D=test&id=1234'
		);
	} );

	test( 'Should remove attributes and style properties applied by the block supports', () => {
		expect(
			removeBlockSupportAttributes( {
				backgroundColor: 'foreground',
				borderColor: 'foreground',
				fontFamily: 'system-font',
				fontSize: 'small',
				gradient: 'vivid-cyan-blue-to-vivid-purple',
				textColor: 'foreground',
				customAttribute: 'customAttribute',
				className: 'custom-class',
				style: {
					border: {
						radius: '10px',
						style: 'solid',
						width: '10px',
					},
					color: {
						background: '#000000',
						text: '#000000',
					},
					elements: {
						link: {
							color: {
								text: '#000000',
							},
						},
					},
					spacing: {
						margin: {
							top: '10px',
							right: '10px',
							bottom: '10px',
							left: '10px',
						},
						padding: {
							top: '10px',
							right: '10px',
							bottom: '10px',
							left: '10px',
						},
					},
					typography: {
						fontSize: '10px',
						fontStyle: 'normal',
						fontWeight: '500',
						letterSpacing: '10px',
						lineHeight: '1',
						textDecoration: 'line-through',
						textTransform: 'uppercase',
					},
					customStyle: 'customStyle',
				},
			} )
		).toEqual( {
			customAttribute: 'customAttribute',
			style: {
				customStyle: 'customStyle',
			},
		} );
	} );
} );
