const processingInstructions = `
	<div>
		<?xpacket ##1## ?>
		<div data-testid="it should keep this node between processing instructions">
			Processing instructions inner node
			<?xpacket ##2## ?>
		</div>
	</div>
	`;

const processingInstructionsElement = new DOMParser()
	.parseFromString( processingInstructions, 'text/xml' )
	.querySelector( 'div' );
document
	.getElementById( 'replace-with-processing-instructions' )
	.replaceWith( processingInstructionsElement );
