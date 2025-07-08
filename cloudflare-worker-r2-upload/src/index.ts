/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

interface Env {
	MY_BUCKET: R2Bucket;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === 'POST' && url.pathname === '/upload') {
			try {
				const formData = await request.formData();
				const file = formData.get('file') as File;

				if (!file) {
					return new Response('No file uploaded', { status: 400 });
				}

				const objectName = `uploads/${crypto.randomUUID()}-${file.name}`;
				await env.MY_BUCKET.put(objectName, file.stream());

				return new Response(`File ${objectName} uploaded successfully!`, { status: 200 });
			} catch (error) {
				console.error('Error uploading file:', error);
				return new Response('Error uploading file', { status: 500 });
			}
		}

		return new Response('Not Found', { status: 404 });
	},
};
