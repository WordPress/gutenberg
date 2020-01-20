function GlobalStylesSave( { attributes } ) {
	const { cssString, rootCssString } = attributes;
	return (
		<>
			<style dangerouslySetInnerHTML={ { __html: rootCssString } } />
			<style dangerouslySetInnerHTML={ { __html: cssString } } />
		</>
	);
}

export default GlobalStylesSave;
