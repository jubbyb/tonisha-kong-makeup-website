
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response("Hello from the root worker! " + request.url);
  },
};
