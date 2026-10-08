import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		expect: { requireAssertions: true },
		// First tests arrive with config.ts in task 3.
		passWithNoTests: true
	}
});
