import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	// Vite's default resolves to IPv6 loopback only, which VS Code's port forwarder cannot reach.
	server: { host: '127.0.0.1' },
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		expect: { requireAssertions: true }
	}
});
