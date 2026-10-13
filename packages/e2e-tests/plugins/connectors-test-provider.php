<?php
/**
 * Plugin Name: Gutenberg Test Connectors Provider
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Registers a naive AI provider with hardcoded API key validation
 * for E2E testing of the Connectors page setup flow.
 *
 * The valid API key is: test-api-key-123
 *
 * @package gutenberg-test-connectors-provider
 */

// phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
// phpcs:disable WordPress.Files.FileName
// phpcs:disable WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

use WordPress\AiClient\AiClient;
use WordPress\AiClient\Providers\AbstractProvider;
use WordPress\AiClient\Providers\Contracts\ModelMetadataDirectoryInterface;
use WordPress\AiClient\Providers\Contracts\ProviderAvailabilityInterface;
use WordPress\AiClient\Providers\DTO\ProviderMetadata;
use WordPress\AiClient\Providers\Enums\ProviderTypeEnum;
use WordPress\AiClient\Providers\Http\Contracts\RequestAuthenticationInterface;
use WordPress\AiClient\Providers\Http\Contracts\WithRequestAuthenticationInterface;
use WordPress\AiClient\Providers\Http\DTO\ApiKeyRequestAuthentication;
use WordPress\AiClient\Providers\Http\Enums\RequestAuthenticationMethod;
use WordPress\AiClient\Providers\Models\Contracts\ModelInterface;
use WordPress\AiClient\Providers\Models\DTO\ModelMetadata;

/**
 * Availability checker that validates against a hardcoded API key.
 */
class Gutenberg_Test_Provider_Availability implements ProviderAvailabilityInterface, WithRequestAuthenticationInterface {

	const VALID_API_KEY = 'test-api-key-123';

	/**
	 * @var RequestAuthenticationInterface|null
	 */
	private $authentication = null;

	public function isConfigured(): bool {
		if ( ! $this->authentication instanceof ApiKeyRequestAuthentication ) {
			return false;
		}
		return $this->authentication->getApiKey() === self::VALID_API_KEY;
	}

	public function setRequestAuthentication( RequestAuthenticationInterface $authentication ): void {
		$this->authentication = $authentication;
	}

	public function getRequestAuthentication(): RequestAuthenticationInterface {
		return $this->authentication;
	}
}

/**
 * Empty model metadata directory (no models needed for testing).
 */
class Gutenberg_Test_Provider_Model_Directory implements ModelMetadataDirectoryInterface {

	public function listModelMetadata(): array {
		return array();
	}

	public function hasModelMetadata( string $modelId ): bool {
		return false;
	}

	public function getModelMetadata( string $modelId ): ModelMetadata {
		throw new \WordPress\AiClient\Common\Exception\InvalidArgumentException(
			sprintf( 'Model not found: %s', $modelId )
		);
	}
}

/**
 * Minimal AI provider for E2E testing.
 */
class Gutenberg_Test_Provider extends AbstractProvider {

	protected static function createProviderMetadata(): ProviderMetadata {
		return new ProviderMetadata(
			'test_provider',
			'Test Provider',
			ProviderTypeEnum::from( ProviderTypeEnum::CLOUD ),
			null,
			RequestAuthenticationMethod::from( RequestAuthenticationMethod::API_KEY ),
			'A test AI provider for E2E testing.'
		);
	}

	protected static function createProviderAvailability(): ProviderAvailabilityInterface {
		return new Gutenberg_Test_Provider_Availability();
	}

	protected static function createModelMetadataDirectory(): ModelMetadataDirectoryInterface {
		return new Gutenberg_Test_Provider_Model_Directory();
	}

	protected static function createModel( ModelMetadata $modelMetadata, ProviderMetadata $providerMetadata ): ModelInterface {
		throw new \WordPress\AiClient\Common\Exception\InvalidArgumentException( 'Test provider does not support models.' );
	}
}

// Register the provider in the AiClient registry so it is auto-discovered by the WP_Connector_Registry.
add_action(
	'init',
	static function () {
		if ( ! class_exists( '\WordPress\AiClient\AiClient' ) ) {
			return;
		}
		AiClient::defaultRegistry()->registerProvider( Gutenberg_Test_Provider::class );
	}
);

register_deactivation_hook(
	__FILE__,
	static function () {
		delete_option( 'connectors_ai_test_provider_api_key' );
	}
);
