/**
 * Internal dependencies
 */
import { getVariationStylesWithRefValues } from '../block-style-variation';

describe( 'getVariationStylesWithRefValues', () => {
	it( 'should resolve ref values correctly', () => {
		const globalStyles = {
			styles: {
				color: { background: 'red' },
				blocks: {
					'core/heading': {
						color: { text: 'blue' },
					},
					'core/group': {
						variations: {
							custom: {
								color: {
									text: { ref: 'styles.does-not-exist' },
									background: {
										ref: 'styles.color.background',
									},
								},
								blocks: {
									'core/heading': {
										color: {
											text: {
												ref: 'styles.blocks.core/heading.color.text',
											},
											background: { ref: '' },
										},
									},
								},
								elements: {
									link: {
										color: {
											text: {
												ref: 'styles.elements.link.color.text',
											},
											background: { ref: undefined },
										},
										':hover': {
											color: {
												text: {
													ref: 'styles.elements.link.:hover.color.text',
												},
											},
										},
									},
								},
							},
						},
					},
				},
				elements: {
					link: {
						color: { text: 'green' },
						':hover': {
							color: { text: 'yellow' },
						},
					},
				},
			},
		};

		expect(
			getVariationStylesWithRefValues(
				globalStyles,
				'core/group',
				'custom'
			)
		).toEqual( {
			color: { background: 'red' },
			blocks: {
				'core/heading': {
					color: { text: 'blue' },
				},
			},
			elements: {
				link: {
					color: {
						text: 'green',
					},
					':hover': {
						color: { text: 'yellow' },
					},
				},
			},
		} );
	} );
} );
