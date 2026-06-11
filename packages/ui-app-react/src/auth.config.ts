// Authentication configuration for this application.
// This file is overwritten by create-davepi-ui when using --auth oauth

export type AuthMode = 'oauth-only' | 'combined' | 'email-only';
export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'discord';

export interface AuthConfig {
  mode: AuthMode;
  oauthProviders: OAuthProvider[];
}

/**
 * Default configuration: email/password only.
 *
 * When scaffolding with `create-davepi-ui --auth oauth`, this file
 * is regenerated with the selected auth mode and OAuth providers.
 */
export const authConfig: AuthConfig = {
  mode: 'email-only',
  oauthProviders: [],
};
