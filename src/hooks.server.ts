import { building } from '$app/environment';
import type { ServerInit } from '@sveltejs/kit';
import { checkServer } from '$lib/server/immich';

// Fail fast: a bad env, wrong Immich version or disabled trash stops the server.
export const init: ServerInit = async () => {
	if (building) return;
	await checkServer();
};
