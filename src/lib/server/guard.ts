export type GuardResult = 'allow' | 'login' | 'unauthorized' | 'forbidden';

const PUBLIC_PATHS = new Set(['/login']);
const SAFE_METHODS = new Set(['GET', 'HEAD']);

export type GuardRequest = {
	method: string;
	pathname: string;
	origin: string | null;
	appOrigin: string;
	hasSession: boolean;
};

// Origin is checked before the session, so a cross-site POST to /login is refused too.
// A missing Origin is refused: every browser we serve sends it on non-GET requests.
export function guard(req: GuardRequest): GuardResult {
	if (!SAFE_METHODS.has(req.method) && req.origin !== req.appOrigin) return 'forbidden';
	if (req.hasSession || PUBLIC_PATHS.has(req.pathname)) return 'allow';
	return req.pathname === '/api' || req.pathname.startsWith('/api/') ? 'unauthorized' : 'login';
}
